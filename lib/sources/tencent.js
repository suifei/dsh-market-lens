/**
 * Tencent public quote/kline/search adapter (A-share, HK, US, indices).
 * The quote endpoint answers GB2312/GBK text; decoding is charset-driven in
 * http.js. Field layout: `v_<code>="0~name~code~price~prevClose~open~..."`,
 * positions follow the long-standing qt.gtimg.cn contract; anything missing
 * stays null.
 */
import { fetchUpstream, SourceError } from '../http.js';

const PERIOD = { day: 'day', week: 'week', month: 'month' };

function num(value) {
	if (typeof value === 'number') return Number.isFinite(value) ? value : null;
	if (typeof value !== 'string' || value === '') return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

/** tencent time cell `20240102150000` → ISO-ish stamp, null when absent. */
function stamp(value) {
	const text = String(value ?? '');
	if (!/^\d{14}$/.test(text)) return null;
	return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)} ${text.slice(8, 10)}:${text.slice(10, 12)}:${text.slice(12, 14)}`;
}

/** Split `v_sh600519="1~贵...~";` lines into code → field array. */
export function parseGtimg(text) {
	/** @type {Map<string, string[]>} */
	const rows = new Map();
	for (const line of String(text).split(';')) {
		const match = /^v_([a-zA-Z0-9.]+)="([^"]*)"$/.exec(line.trim());
		if (match === null) continue;
		const fields = match[2].split('~');
		if (fields.length > 3) rows.set(match[1], fields);
	}
	return rows;
}

function currencyOf(code) {
	if (code.startsWith('sh') || code.startsWith('sz') || code.startsWith('bj')) return 'CNY';
	if (code.startsWith('hk')) return 'HKD';
	return 'USD';
}

/**
 * US K-line needs the exchange-suffixed code (`usAAPL.OQ`); the bare form
 * answers a single live bar. The quote row carries the suffix, so one
 * cheap quote GET resolves it for any ticker.
 */
async function usSuffixedCode(instrument, ctx) {
	if (instrument.symbol.slice(2).includes('.')) return instrument.symbol;
	try {
		const text = await fetchUpstream(`https://qt.gtimg.cn/q=${instrument.symbol}`, { fetchImpl: ctx.fetchImpl, timeoutMs: ctx.timeoutMs, signal: ctx.signal, decodeGbk: true });
		for (const fields of parseGtimg(text).values()) {
			const candidate = String(fields[2] ?? '');
			if (/^[A-Z0-9.\-]+\.[A-Z]{2}$/.test(candidate)) return `us${candidate}`;
		}
	} catch { /* fall back to the bare code and accept fewer bars */ }
	return instrument.symbol;
}

export const tencent = {
	id: 'tencent',
	markets: ['cn', 'hk', 'us'],

	async quotes(instruments, ctx) {
		const codes = instruments.map((instrument) => instrument.symbol);
		const url = `https://qt.gtimg.cn/q=${codes.join(',')}`;
		const text = await fetchUpstream(url, { fetchImpl: ctx.fetchImpl, timeoutMs: ctx.timeoutMs, signal: ctx.signal, decodeGbk: true });
		const rows = parseGtimg(text);
		if (rows.size === 0) throw new SourceError('tencent', 'EMPTY', 'no quote rows');
		const quotes = new Map();
		for (const code of codes) {
			const f = rows.get(code);
			if (f === void 0) continue;
			// A-share rows report 手/万元; HK and US rows report raw shares and currency units.
			const isCn = code.startsWith('sh') || code.startsWith('sz') || code.startsWith('bj');
			const price = num(f[3]);
			const prevClose = num(f[4]);
			const change = num(f[31]) ?? (price !== null && prevClose !== null ? Math.round((price - prevClose) * 1e4) / 1e4 : null);
			quotes.set(code, {
				symbol: code,
				name: f[1] || code,
				price,
				prevClose,
				open: num(f[5]),
				high: num(f[33]),
				low: num(f[34]),
				change,
				changePct: num(f[32]),
				volume: numScale(f[36], isCn ? 100 : 1),
				amount: numScale(f[37], isCn ? 1e4 : 1),
				turnoverRate: num(f[38]),
				pe: num(f[39]),
				volRatio: null,
				amplitude: null,
				pb: null,
				marketCap: numScale(f[45], 1e8),
				floatMarketCap: numScale(f[44], 1e8),
				currency: currencyOf(code),
				updatedAt: stamp(f[30]),
				source: 'tencent',
			});
		}
		if (quotes.size === 0) throw new SourceError('tencent', 'EMPTY', 'no matching quote rows');
		return quotes;
	},

	async kline(instrument, period, count, ctx) {
		const kind = PERIOD[period];
		if (kind === void 0) throw new SourceError('tencent', 'UNSUPPORTED', `period ${period}`);
		const code = instrument.market === 'us' ? await usSuffixedCode(instrument, ctx) : instrument.symbol;
		const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${encodeURIComponent(`${code},${kind},,,${String(count)},qfq`)}`;
		const body = await fetchUpstream(url, { as: 'json', fetchImpl: ctx.fetchImpl, timeoutMs: ctx.timeoutMs, signal: ctx.signal });
		const node = body?.data?.[code] ?? body?.data?.[instrument.symbol];
		const lines = node?.[`qfq${kind}`] ?? node?.[kind];
		if (!Array.isArray(lines) || lines.length === 0) throw new SourceError('tencent', 'EMPTY', `no klines for ${instrument.symbol}`);
		const bars = lines.slice(-count).map((cells) => ({
			t: String(cells[0]),
			o: num(cells[1]),
			c: num(cells[2]),
			h: num(cells[3]),
			l: num(cells[4]),
			v: numScale(cells[5], instrument.market === 'cn' ? 100 : 1),
			a: null,
		}));
		return { symbol: instrument.symbol, period, adjust: instrument.kind === 'index' ? 'none' : 'qfq', bars, source: 'tencent' };
	},

	async search(query, limit, ctx) {
		const url = `https://smartbox.gtimg.cn/s3/?v=2&q=${encodeURIComponent(query)}&t=all`;
		const raw = await fetchUpstream(url, { fetchImpl: ctx.fetchImpl, timeoutMs: ctx.timeoutMs, signal: ctx.signal, decodeGbk: true });
		// Smartbox escapes every non-ASCII name as literal \uXXXX even though the
		// envelope is GBK text; expand them back before parsing rows.
		const text = raw.replace(/\\u([\dA-Fa-f]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
		const match = /v_hint="([^"]*)"/.exec(text);
		if (match === null || match[1] === '' || match[1] === 'N') return [];
		/** @type {Array<{symbol: string, name: string, market: string, kind: string}>} */
		const items = [];
		for (const entry of match[1].split('^')) {
			const cells = entry.split('~');
			if (cells.length < 3) continue;
			const market = cells[0];
			const code = cells[1];
			const name = cells[2];
			if (!['sh', 'sz', 'bj', 'hk', 'us'].includes(market) || code === '') continue;
			const symbol = market === 'hk' && /^\d+$/.test(code) ? `hk${code.padStart(5, '0')}` : `${market}${code}`;
			items.push({ symbol, name, market, kind: cells[4] === 'zs' ? 'index' : 'stock' });
			if (items.length >= limit) break;
		}
		return items;
	},
};

function numScale(value, scale) {
	const parsed = num(value);
	return parsed === null ? null : parsed * scale;
}
