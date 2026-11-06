/**
 * Yahoo Finance chart adapter — US stocks and US indices. The v8 chart
 * endpoint answers without a crumb as long as a browser-like UA is sent.
 * A-share / HK markets are out of scope here; the service routes US first
 * through this adapter.
 */
import { fetchUpstream, SourceError } from '../http.js';

const PERIODS = { day: '1d', week: '1wk', month: '1mo' };
const RANGES = [['1mo', 30], ['3mo', 90], ['6mo', 180], ['1y', 365], ['2y', 730], ['5y', 1825], ['10y', 3650]];
const DAY_SPAN = { day: 1.6, week: 8, month: 33 };

/** Range parameter wide enough for `count` bars, snapped to Yahoo's ladder. */
function rangeFor(period, count) {
	const days = count * DAY_SPAN[period];
	for (const [name, span] of RANGES) if (span >= days) return name;
	return 'max';
}

function yahooSymbol(instrument) {
	if (instrument.kind === 'index') return instrument.ySymbol ?? instrument.symbol.slice(2);
	return instrument.symbol.slice(2);
}

function chartUrl(instrument, period, count) {
	const interval = PERIODS[period];
	return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol(instrument))}?interval=${interval}&range=${rangeFor(period, count)}&includePrePost=false`;
}

async function chart(instrument, period, count, ctx) {
	const body = await fetchUpstream(chartUrl(instrument, period, count), { as: 'json', fetchImpl: ctx.fetchImpl, timeoutMs: ctx.timeoutMs, signal: ctx.signal, headers: { referer: 'https://finance.yahoo.com/' } });
	const result = body?.chart?.result?.[0] ?? body?.results?.[0];
	if (result === void 0) throw new SourceError('yahoo', 'PARSE', `no chart result for ${instrument.symbol}`);
	return result;
}

export const yahoo = {
	id: 'yahoo',
	markets: ['us'],

	async quotes(instruments, ctx) {
		const quotes = new Map();
		const us = instruments.filter((instrument) => instrument.market === 'us');
		for (const instrument of us) {
			const result = await chart(instrument, 'day', 2, ctx);
			const meta = result?.meta ?? {};
			const quote = result?.indicators?.quote?.[0] ?? {};
			const closes = quote.close ?? [];
			const price = num(meta.regularMarketPrice) ?? last(closes);
			const prevClose = num(meta.chartPreviousClose) ?? num(meta.previousClose);
			const bars = (result?.timestamp ?? []).length;
			quotes.set(instrument.symbol, {
				symbol: instrument.symbol,
				name: meta.longName ?? meta.shortName ?? instrument.symbol.slice(2),
				price,
				prevClose,
				open: first(quote.open),
				high: first(quote.high),
				low: first(quote.low),
				change: price !== null && prevClose !== null ? Math.round((price - prevClose) * 1e4) / 1e4 : null,
				changePct: price !== null && prevClose !== null && prevClose !== 0 ? Math.round(((price - prevClose) / prevClose) * 1e6) / 1e4 : null,
				volume: first(quote.volume),
				amount: null,
				turnoverRate: null,
				pe: null,
				marketCap: null,
				floatMarketCap: null,
				currency: meta.currency ?? 'USD',
				updatedAt: typeof meta.regularMarketTime === 'number' ? new Date(meta.regularMarketTime * 1000).toISOString() : null,
				bars,
				source: 'yahoo',
			});
		}
		if (quotes.size === 0) throw new SourceError('yahoo', 'EMPTY', 'no us instruments requested');
		return quotes;
	},

	async kline(instrument, period, count, ctx) {
		const result = await chart(instrument, period, count, ctx);
		const stamp = result?.timestamp ?? [];
		const quote = result?.indicators?.quote?.[0] ?? {};
		const rows = [];
		for (let index = 0; index < stamp.length; index++) {
			const open = quote.open?.[index];
			const high = quote.high?.[index];
			const low = quote.low?.[index];
			const close = quote.close?.[index];
			if (close === null || close === void 0) continue;
			rows.push({
				t: new Date(stamp[index] * 1000).toISOString().slice(0, 10),
				o: num(open),
				c: num(close),
				h: num(high),
				l: num(low),
				v: num(quote.volume?.[index]),
				a: null,
			});
		}
		const bars = rows.slice(-count);
		if (bars.length === 0) throw new SourceError('yahoo', 'EMPTY', `no usable bars for ${instrument.symbol}`);
		return { symbol: instrument.symbol, period, adjust: instrument.kind === 'index' ? 'none' : 'close', bars, source: 'yahoo' };
	},

	async search(query, limit, ctx) {
		const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=${String(limit)}&newsCount=0`;
		const body = await fetchUpstream(url, { as: 'json', fetchImpl: ctx.fetchImpl, timeoutMs: ctx.timeoutMs, signal: ctx.signal });
		const quotes = body?.quotes;
		if (!Array.isArray(quotes)) return [];
		return quotes
			.filter((row) => typeof row?.symbol === 'string' && (row.exch === 'NMS' || row.exch === 'NYQ' || row.exch === 'NGM' || row.exch === 'ASE' || row.quoteType === 'EQUITY' || row.quoteType === 'INDEX'))
			.slice(0, limit)
			.map((row) => ({
				symbol: `us${row.symbol}`,
				name: row.shortname ?? row.longname ?? row.symbol,
				market: 'us',
				kind: row.quoteType === 'INDEX' ? 'index' : 'stock',
			}));
	},
};

function num(value) {
	return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function last(values) {
	for (let index = values.length - 1; index >= 0; index--) if (values[index] !== null && values[index] !== void 0) return num(values[index]);
	return null;
}

function first(values) {
	const value = values?.[values.length - 1];
	return value === null || value === void 0 ? null : num(value);
}
