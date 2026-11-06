/**
 * EastMoney public quote/kline/search adapter (A-share, HK, CN indices).
 * Delayed public data, not Level-2. Missing numeric fields arrive as "-"
 * and stay null so the UI can render an em dash instead of a fake zero.
 */
import { fetchUpstream, SourceError } from '../http.js';
import { emSecidOf } from '../normalize.js';

const QUOTE_FIELDS = 'f2,f3,f4,f5,f6,f8,f9,f10,f12,f13,f14,f15,f16,f17,f18,f20,f21,f22,f23,f24,f25,f26,f124';
const KLINE_FIELDS2 = 'f51,f52,f53,f54,f55,f56,f57,f59,f61';
const KLT = { day: '101', week: '102', month: '103' };
const UT = 'fa5fd1943c7b386f172d6893dbfba10b';
const SUGGEST_TOKEN = 'D43BF722C8E33BDC906FB84D85E326E8';

/** Parse "-"-padded numbers without inventing zeros. */
function num(value) {
	if (typeof value === 'number') return Number.isFinite(value) ? value : null;
	if (typeof value !== 'string' || value === '' || value === '-') return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

function numScale(value, scale) {
	const parsed = num(value);
	return parsed === null ? null : parsed * scale;
}

function emMarketPrefix(marketCode, secid) {
	if (secid.startsWith('1.')) return 'sh';
	if (secid.startsWith('0.')) return marketCode.startsWith('4') || marketCode.startsWith('8') ? 'bj' : 'sz';
	if (secid.startsWith('116.')) return 'hk';
	return void 0;
}

/** @param ctx {{ fetchImpl?: typeof fetch, timeoutMs: number, signal?: AbortSignal }} */
async function getJson(url, ctx) {
	return await fetchUpstream(url, { as: 'json', fetchImpl: ctx.fetchImpl, timeoutMs: ctx.timeoutMs, signal: ctx.signal, insecureFallback: true });
}

export const eastmoney = {
	id: 'eastmoney',
	markets: ['cn', 'hk'],

	/**
	 * Batch quotes for the given instruments (≤ 200 secids per call).
	 * @returns quote rows in canonical-symbol map form.
	 */
	async quotes(instruments, ctx) {
		const secidBySymbol = new Map();
		for (const instrument of instruments) {
			const secid = emSecidOf(instrument.symbol);
			if (secid !== void 0) secidBySymbol.set(instrument.symbol, secid);
		}
		if (secidBySymbol.size === 0) return new Map();
		const secids = [...secidBySymbol.values()].join(',');
		const url = `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&invt=2&fields=${QUOTE_FIELDS}&ut=${UT}&secids=${encodeURIComponent(secids)}`;
		const body = await getJson(url, { ...ctx, timeoutMs: ctx.timeoutMs });
		const diff = body?.data?.diff;
		const rows = Array.isArray(diff) ? diff : Object.values(diff ?? {});
		if (rows.length === 0) throw new SourceError('eastmoney', 'EMPTY', 'quote list came back empty');
		const bySecid = new Map();
		for (const row of rows) {
			if (row?.f12 === void 0 || row?.f13 === void 0) continue;
			bySecid.set(`${String(row.f13)}.${String(row.f12)}`, row);
		}
		const quotes = new Map();
		for (const [symbol, secid] of secidBySymbol) {
			const row = bySecid.get(secid);
			if (row === void 0) continue;
			const prefix = emMarketPrefix(String(row.f12), secid);
			const price = num(row.f2);
			const prevClose = num(row.f18);
			quotes.set(symbol, {
				symbol: prefix === void 0 ? symbol : `${prefix}${String(row.f12)}`,
				name: typeof row.f14 === 'string' ? row.f14 : symbol,
				price,
				prevClose,
				open: num(row.f17),
				high: num(row.f15),
				low: num(row.f16),
				change: num(row.f4),
				changePct: num(row.f3),
				volume: numScale(row.f5, 100),
				amount: num(row.f6),
				turnoverRate: num(row.f8),
				pe: num(row.f9),
				volRatio: num(row.f10),
				amplitude: num(row.f22),
				pb: num(row.f23),
				marketCap: num(row.f20),
				floatMarketCap: num(row.f21),
				updatedAt: typeof row.f124 === 'number' ? new Date(row.f124 * 1000).toISOString() : null,
				source: 'eastmoney',
			});
		}
		if (quotes.size === 0) throw new SourceError('eastmoney', 'EMPTY', 'no matching quote rows');
		return quotes;
	},

	/**
	 * QFQ-adjusted K-line bars.
	 * @returns bars oldest → newest.
	 */
	async kline(instrument, period, count, ctx) {
		const klt = KLT[period];
		const secid = emSecidOf(instrument.symbol);
		if (secid === void 0 || klt === void 0) throw new SourceError('eastmoney', 'UNSUPPORTED', `${instrument.symbol} ${period}`);
		const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?ut=${UT}&fields1=f1,f2,f3,f4,f5,f6&fields2=${KLINE_FIELDS2}&secid=${encodeURIComponent(secid)}&klt=${klt}&fqt=1&lmt=${String(count)}&end=20500101`;
		const body = await getJson(url, ctx);
		const lines = body?.data?.klines;
		if (!Array.isArray(lines) || lines.length === 0) throw new SourceError('eastmoney', 'EMPTY', `no klines for ${instrument.symbol}`);
		const bars = [];
		for (const line of lines.slice(-count)) {
			const cells = String(line).split(',');
			bars.push({
				t: cells[0],
				o: num(cells[1]),
				c: num(cells[2]),
				h: num(cells[3]),
				l: num(cells[4]),
				// EastMoney reports K-line volume in 手 like the quote list; share units everywhere.
				v: numScale(cells[5], 100),
				a: num(cells[6]),
			});
		}
		return { symbol: instrument.symbol, period, adjust: 'qfq', bars, source: 'eastmoney' };
	},

	/**
	 * Code/name/pinyin suggest. Market assignment reads SecurityTypeName;
	 * unknown shapes are dropped rather than guessed.
	 */
	async search(query, limit, ctx) {
		const url = `https://searchapi.eastmoney.com/api/suggest/get?input=${encodeURIComponent(query)}&type=14&token=${SUGGEST_TOKEN}&count=${String(limit)}`;
		const body = await getJson(url, ctx);
		const rows = body?.QuotationCodeTable?.Data;
		if (!Array.isArray(rows)) return [];
		/** @type {Array<{symbol: string, name: string, market: string, kind: string}>} */
		const items = [];
		for (const row of rows) {
			const code = String(row?.Code ?? '');
			const name = String(row?.Name ?? '');
			const typeName = String(row?.SecurityTypeName ?? '') + String(row?.JYS ?? '');
			let market;
			if (/沪|SH|上海/.test(typeName) || row?.MType === '1') market = 'sh';
			else if (/深|SZ/.test(typeName) || row?.MType === '2') market = 'sz';
			else if (/京|BJ/.test(typeName)) market = 'bj';
			else if (/港|HK/.test(typeName) || row?.MType === '11') market = 'hk';
			else if (/美|NASDAQ|NYSE|US/.test(typeName) || row?.MType === '12') market = 'us';
			if (market === void 0 || code === '') continue;
			const kind = /指数|板块/.test(String(row?.SecurityTypeName ?? '')) ? 'index' : 'stock';
			if (market === 'us') items.push({ symbol: `us${code.toUpperCase()}`, name, market: 'us', kind });
			else if (market === 'hk') items.push({ symbol: `hk${/^\d+$/.test(code) ? code.padStart(5, '0') : code.toUpperCase()}`, name, market: 'hk', kind });
			else items.push({ symbol: `${market}${code}`, name, market, kind });
		}
		return items.slice(0, limit);
	},
};
