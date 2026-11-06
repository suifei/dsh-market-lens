/**
 * Market service: the single owner of symbol routing, short-TTL caching,
 * in-flight deduplication, multi-source degradation, and every defensive
 * bound the spec demands (200 quotes, K-line 20–320, search key 1–50).
 * Both callers — the agent tools and the Web panel routes — go through this
 * module, so one operation has one implementation.
 */
import { TtlCache } from './cache.js';
import { normalizeSymbol, normalizeSymbols, INDEX_CATALOG } from './normalize.js';
import { eastmoney } from './sources/eastmoney.js';
import { tencent } from './sources/tencent.js';
import { yahoo } from './sources/yahoo.js';
import { SourceError } from './http.js';

/** Rejection with a stable code for both HTTP responses and tool results. */
export class MarketError extends Error {
	constructor(code, message) {
		super(message);
		this.name = 'MarketError';
		this.code = code;
	}
}

const SOURCES = new Map([[eastmoney.id, eastmoney], [tencent.id, tencent], [yahoo.id, yahoo]]);
/** Primary → backup, per market. US indices ride Yahoo (stable symbols). */
const CHAINS = {
	cn: ['eastmoney', 'tencent'],
	hk: ['eastmoney', 'tencent'],
	us: ['yahoo', 'tencent'],
};

const PERIODS = new Set(['day', 'week', 'month']);

export const DEFAULT_WATCHLIST = ['sh600519', 'sz000001', 'hk00700', 'usAAPL', 'usNVDA', 'bj830799'];
export const INDEX_BAR = INDEX_CATALOG.map((row) => row.symbol);

/**
 * @param config - resolved plugin config (ttl/timeout/bound knobs).
 * @param env - { fetchImpl, now } test seams.
 */
export function createMarketService(config, env = {}) {
	const cache = new TtlCache(env.now);
	const fetchCtx = { fetchImpl: env.fetchImpl, timeoutMs: config.upstreamTimeoutMs };

	/**
	 * Batch quotes. Each market tries its chain as a whole; per-symbol
	 * fallback happens by merging chain results, and a symbol no source
	 * served degrades to its stale cached value, flagged stale: true.
	 */
	async function quotes(input) {
		const { symbols, rejected } = normalizeSymbols(input, config.maxQuoteSymbols);
		if (symbols.length === 0) throw new MarketError('BAD_INPUT', `no usable symbols (rejected: ${rejected.slice(0, 5).join(', ') || 'none'})`);
		const byMarket = new Map();
		for (const instrument of symbols) {
			const group = byMarket.get(instrument.market) ?? [];
			group.push(instrument);
			byMarket.set(instrument.market, group);
		}
		const quoteMap = new Map();
		/** @type {Array<{symbol: string, reason: string}>} */
		const failed = [];
		await Promise.all([...byMarket.entries()].map(async ([market, group]) => {
			const chunk = group.filter((instrument) => SOURCES.get(CHAINS[market][0]) !== void 0);
			const symbolsOf = chunk.map((instrument) => instrument.symbol);
			const key = `quotes:${market}:${[...symbolsOf].sort().join(',')}`;
			try {
				const batch = await cache.get(key, config.quoteTtlMs, async () => {
					const merged = new Map();
					/** @type {string[]} */
					const chainFailures = [];
					for (const id of CHAINS[market]) {
						const missing = chunk.filter((instrument) => !merged.has(instrument.symbol));
						if (missing.length === 0) break;
						const source = SOURCES.get(id);
						if (source === void 0 || !source.markets.includes(market)) continue;
						try {
							const part = await source.quotes(missing, { ...fetchCtx, symbols: missing });
							for (const [symbol, quote] of part) merged.set(symbol, quote);
						} catch (error) {
							chainFailures.push(`${id}:${error instanceof SourceError ? error.code : 'FAIL'}`);
						}
					}
					if (merged.size === 0) throw new MarketError('UPSTREAM_ALL_FAILED', `all sources failed (${chainFailures.join(', ') || 'no source'})`);
					return { merged, partial: chainFailures };
				});
				for (const instrument of chunk) {
					const quote = batch.merged.get(instrument.symbol);
					if (quote !== void 0) quoteMap.set(instrument.symbol, quote);
					else {
						const stale = cache.peekStale(key)?.merged?.get(instrument.symbol);
						if (stale !== void 0) quoteMap.set(instrument.symbol, { ...stale, stale: true });
						else failed.push({ symbol: instrument.symbol, reason: 'no-source-row' });
					}
				}
			} catch (error) {
				for (const instrument of chunk) {
					const stale = cache.peekStale(key)?.merged?.get(instrument.symbol);
					if (stale !== void 0) quoteMap.set(instrument.symbol, { ...stale, stale: true });
					else failed.push({ symbol: instrument.symbol, reason: error instanceof MarketError ? error.message : 'fetch-failed' });
				}
			}
		}));
		return {
			quotes: symbols.map((instrument) => quoteMap.get(instrument.symbol)).filter((quote) => quote !== void 0),
			failed: [...failed, ...rejected.map((symbol) => ({ symbol, reason: 'invalid-symbol' }))],
		};
	}

	async function kline(inputSymbol, period, count) {
		const instrument = normalizeSymbol(inputSymbol);
		if (instrument === void 0) throw new MarketError('BAD_INPUT', `cannot parse symbol ${JSON.stringify(String(inputSymbol))}`);
		if (!PERIODS.has(period)) throw new MarketError('BAD_INPUT', `period must be day, week or month`);
		if (!Number.isInteger(count) || count < 20 || count > config.maxKlineCount) throw new MarketError('BAD_INPUT', `count must be an integer within 20–${String(config.maxKlineCount)}`);
		const key = `kline:${instrument.symbol}:${period}:${String(count)}`;
		const result = await cache.get(key, config.klineTtlMs, async () => {
			const chain = CHAINS[instrument.market];
			const run = async (source) => await source.kline(instrument, period, count, fetchCtx);
			for (const id of chain) {
				const source = SOURCES.get(id);
				if (source === void 0 || !source.markets.includes(instrument.market)) continue;
				try {
					return await run(source);
				} catch { /* try next source */ }
			}
			throw new MarketError('UPSTREAM_ALL_FAILED', `no kline source answered ${instrument.symbol}`);
		});
		const bars = result.bars.slice(-count);
		return { ...result, bars, count: bars.length, stale: false, requested: count };
	}

	async function search(inputQuery, limit = 20) {
		const query = String(inputQuery ?? '').trim();
		if (query.length < 1 || query.length > 50) throw new MarketError('BAD_INPUT', 'search key length must be 1–50');
		const size = Math.max(1, Math.min(Number.isInteger(limit) ? limit : 20, 30));
		const key = `search:${query.toLowerCase()}:${String(size)}`;
		const items = await cache.get(key, config.searchTtlMs, async () => {
			/** @type {Map<string, {symbol: string, name: string, market: string, kind: string}>} */
			const merged = new Map();
			// Only code-shaped queries seed a direct row; "gzmt" must not invent a US ticker.
			const codeish = /^(sh|sz|bj|hk|us)[.]?[0-9a-zA-Z]{1,12}$|^[0-9]{1,6}$/i.test(query);
			const direct = codeish ? normalizeSymbol(query) : void 0;
			if (direct !== void 0) merged.set(direct.symbol, { symbol: direct.symbol, name: direct.name ?? direct.symbol, market: direct.market, kind: direct.kind });
			let anySourceAnswered = false;
			for (const id of ['tencent', 'eastmoney', 'yahoo']) {
				const source = SOURCES.get(id);
				if (source === void 0) continue;
				try {
					const part = await source.search(query, size, fetchCtx);
					anySourceAnswered = true;
					for (const item of part) {
						const instrument = normalizeSymbol(item.symbol);
						if (instrument === void 0 || merged.has(instrument.symbol)) continue;
						merged.set(instrument.symbol, { symbol: instrument.symbol, name: item.name || instrument.symbol, market: instrument.market, kind: item.kind ?? instrument.kind });
					}
					if (merged.size >= size) break;
				} catch { /* one suggest source down must not empty the box */ }
			}
			if (merged.size === 0 && !anySourceAnswered) throw new MarketError('UPSTREAM_ALL_FAILED', 'no search source answered');
			return [...merged.values()].slice(0, size);
		});
		return { items };
	}

	function meta() {
		return {
			pollIntervalMs: config.pollIntervalMs,
			defaultWatchlist: DEFAULT_WATCHLIST,
			indexBar: INDEX_BAR,
			limits: { maxQuoteSymbols: config.maxQuoteSymbols, minKlineCount: 20, maxKlineCount: config.maxKlineCount },
			disclaimer: 'delayed public data · not Level-2 · read-only, no trading',
		};
	}

	return { quotes, kline, search, meta, cache };
}
