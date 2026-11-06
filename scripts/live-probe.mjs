/**
 * Live probe against the real public endpoints (needs network).
 * Run: node test/live.mjs — not part of `npm test`, so CI/offline runs stay green.
 */
import { createMarketService } from '../lib/service.js';

const config = {
	pollIntervalMs: 5000,
	quoteTtlMs: 5000,
	klineTtlMs: 60000,
	searchTtlMs: 300000,
	newsTtlMs: 60000,
	finTtlMs: 21600000,
	upstreamTimeoutMs: 8000,
	maxQuoteSymbols: 200,
	maxKlineCount: 320,
	routePath: '/market-lens',
};

const service = createMarketService(config);

function show(label, value) {
	console.log(`\n== ${label} ==\n`, JSON.stringify(value, null, 1).slice(0, 1600));
}

try {
	show('quotes cn/hk/us mixed', await service.quotes(['600519', '00700', 'AAPL', 'hkHSI', 'sh000001', '830799']));
} catch (error) {
	show('quotes FAILED', String(error));
}
try {
	show('kline sh600519 day x60', await service.kline('sh600519', 'day', 60));
} catch (error) {
	show('kline FAILED', String(error));
}
try {
	show('kline usAAPL week x40', await service.kline('usAAPL', 'week', 40));
} catch (error) {
	show('kline us FAILED', String(error));
}
try {
	show('search gzmt', await service.search('gzmt', 5));
} catch (error) {
	show('search pinyin FAILED', String(error));
}
try {
	show('search 腾讯', await service.search('腾讯', 5));
} catch (error) {
	show('search name FAILED', String(error));
}
try {
	show('news global', await service.news('', 6));
} catch (error) {
	show('news FAILED', String(error));
}
try {
	show('news 茅台', await service.news('茅台', 6));
} catch (error) {
	show('news keyword FAILED', String(error));
}
try {
	show('financials sh600519', await service.financials('sh600519'));
} catch (error) {
	show('financials FAILED', String(error));
}
try {
	show('seeded watchlist quotes', await service.quotes(['sh600519', 'sz300750', 'sz002594', 'sh600036', 'sh601318', 'hk00700', 'hk09988', 'hk03690', 'usAAPL', 'usMSFT', 'usNVDA', 'usTSLA']).then((r) => ({ got: r.quotes.map((q) => `${q.symbol}=${String(q.price)}`), failed: r.failed })));
} catch (error) {
	show('seed quotes FAILED', String(error));
}
