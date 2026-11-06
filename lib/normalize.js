/**
 * Symbol normalization: every accepted spelling collapses onto one canonical
 * form before any cache key or upstream request is built, so `600519`,
 * `SH600519`, `sh600519` and `sh.600519` address the same instrument.
 *
 * Canonical forms (market-prefixed, the same vocabulary the Tencent public
 * endpoints use, which keeps adapters boring):
 *   A-share   sh600519  sz000001  bj830799   (SH / SZ / BJ)
 *   HK        hk00700   hkHSI               (5-digit code, or index alias)
 *   US        usAAPL    usDJI               (upper ticker, or index alias)
 */

/** @typedef {'cn' | 'hk' | 'us'} Market */
/**
 * @typedef {object} Instrument
 * @property {string} symbol canonical symbol
 * @property {Market} market
 * @property {'stock' | 'index'} kind
 * @property {string} code exchange-local code or index alias
 * @property {string} [name] display name when statically known
 */

/** Index aliases with fixed identity, keyed by canonical symbol. */
export const INDEX_CATALOG = [
	{ symbol: 'sh000001', market: 'cn', kind: 'index', code: '000001', name: '上证指数', emSecid: '1.000001' },
	{ symbol: 'sz399001', market: 'cn', kind: 'index', code: '399001', name: '深证成指', emSecid: '0.399001' },
	{ symbol: 'sz399006', market: 'cn', kind: 'index', code: '399006', name: '创业板指', emSecid: '0.399006' },
	{ symbol: 'sh000688', market: 'cn', kind: 'index', code: '000688', name: '科创50', emSecid: '1.000688' },
	{ symbol: 'sh000300', market: 'cn', kind: 'index', code: '000300', name: '沪深300', emSecid: '1.000300' },
	{ symbol: 'hkHSI', market: 'hk', kind: 'index', code: 'HSI', name: '恒生指数', emSecid: '100.HSI', txCode: 'hkHSI', ySymbol: '^HSI' },
	{ symbol: 'hkHSTECH', market: 'hk', kind: 'index', code: 'HSTECH', name: '恒生科技', emSecid: '124.HSTECH', txCode: 'hkHSTECH' },
	{ symbol: 'usDJI', market: 'us', kind: 'index', code: 'DJI', name: '道琼斯', emSecid: '100.DJIA', txCode: 'usDJI', ySymbol: '^DJI' },
	{ symbol: 'usIXIC', market: 'us', kind: 'index', code: 'IXIC', name: '纳斯达克', emSecid: '100.NDX', txCode: 'usIXIC', ySymbol: '^IXIC' },
	{ symbol: 'usINX', market: 'us', kind: 'index', code: 'INX', name: '标普500', emSecid: '100.SPX', txCode: 'usINX', ySymbol: '^GSPC' },
];

/** @type {Map<string, Instrument>} */
const byCanonical = new Map();
for (const row of INDEX_CATALOG) byCanonical.set(row.symbol.toLowerCase(), { ...row });

/** EastMoney secid per canonical symbol for the index catalog. */
export function emSecidOf(symbol) {
	const instrument = byCanonical.get(symbol.toLowerCase());
	if (instrument?.emSecid !== void 0) return instrument.emSecid;
	const market = symbol.slice(0, 2).toLowerCase();
	const code = symbol.slice(2);
	switch (market) {
		case 'sh': return `1.${code}`;
		case 'sz': return `0.${code}`;
		case 'bj': return `0.${code}`;
		case 'hk': return `116.${code}`;
		default: return void 0;
	}
}

/** Bare A-share code → exchange guess. Documented heuristics, not a rule book. */
function inferCnPrefix(code) {
	if (/^[569]\d{5}$/.test(code)) return 'sh';
	if (/^[03]\d{5}$/.test(code)) return 'sz';
	if (/^[1248]/.test(code) && code.length === 6) return code.startsWith('4') || code.startsWith('8') ? 'bj' : 'sz';
	return void 0;
}

/**
 * Normalize one free-form symbol.
 * @param input - `600519`, `SH600519`, `sh600519`, `00700`, `hk00700`, `AAPL`, `usAAPL`, `US.AAPL`.
 * @returns the instrument, or undefined when nothing parses.
 */
export function normalizeSymbol(input) {
	if (typeof input !== 'string') return void 0;
	const raw = input.trim();
	if (raw.length === 0 || raw.length > 32) return void 0;
	const lowered = raw.toLowerCase();
	const known = byCanonical.get(lowered);
	if (known !== void 0) return { ...known };
	const prefixed = /^(sh|sz|bj|hk)\.?([a-z0-9]+)$|^(?:us)\.?(.+)$/.exec(lowered);
	if (prefixed !== null) {
		if (prefixed[1] === void 0) {
			const code = String(prefixed[3]).toUpperCase();
			return { symbol: `us${code}`, market: 'us', kind: 'stock', code };
		}
		const prefix = prefixed[1];
		const code = String(prefixed[2]);
		if (prefix === 'hk') {
			if (/^[0-9]{1,5}$/.test(code)) {
				const normalizedCode = code.padStart(5, '0');
				return { symbol: `hk${normalizedCode}`, market: 'hk', kind: 'stock', code: normalizedCode };
			}
			return void 0;
		}
		if (/^[0-9]{6}$/.test(code) === false) return void 0;
		return { symbol: `${prefix}${code}`, market: 'cn', kind: 'stock', code };
	}
	if (/^[0-9]{6}$/.test(raw)) {
		const prefix = inferCnPrefix(raw);
		if (prefix === void 0) return void 0;
		return { symbol: `${prefix}${raw}`, market: 'cn', kind: 'stock', code: raw };
	}
	if (/^[0-9]{1,5}$/.test(raw)) return { symbol: `hk${raw.padStart(5, '0')}`, market: 'hk', kind: 'stock', code: raw.padStart(5, '0') };
	if (/^[A-Za-z][A-Za-z0-9.\-]{0,10}$/.test(raw)) return { symbol: `us${raw.toUpperCase()}`, market: 'us', kind: 'stock', code: raw.toUpperCase() };
	return void 0;
}

/**
 * Normalize a comma-separated or array symbol list, dropping invalid entries.
 * @param input - array or comma/space separated string.
 * @param max - hard bound on accepted symbols.
 * @returns {{ symbols: Instrument[], rejected: string[] }}
 */
export function normalizeSymbols(input, max = 200) {
	const items = Array.isArray(input) ? input : String(input).split(/[,\s]+/);
	/** @type {Instrument[]} */
	const symbols = [];
	/** @type {string[]} */
	const rejected = [];
	const seen = new Set();
	for (const item of items) {
		if (item === void 0 || item === null || item === '') continue;
		const instrument = normalizeSymbol(String(item));
		if (instrument === void 0 || seen.has(instrument.symbol)) {
			if (instrument === void 0) rejected.push(String(item));
			continue;
		}
		seen.add(instrument.symbol);
		symbols.push(instrument);
		if (symbols.length >= max) break;
	}
	return { symbols, rejected };
}

/** Case-insensitive name/code matching for local filtering of search results. */
export function matchText(query, candidate) {
	const q = query.toLowerCase();
	return candidate.toLowerCase().includes(q);
}
