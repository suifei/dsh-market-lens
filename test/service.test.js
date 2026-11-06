import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMarketService, MarketError } from '../lib/service.js';

/** Mutable fake clock shared with the service cache. */
function clock(start = 0) {
	let now = start;
	return { now: () => now, advance: (ms) => {
		now += ms;
	} };
}

const CONFIG = {
	pollIntervalMs: 5000,
	quoteTtlMs: 5000,
	klineTtlMs: 60000,
	searchTtlMs: 300000,
	newsTtlMs: 60000,
	finTtlMs: 21600000,
	upstreamTimeoutMs: 500,
	maxQuoteSymbols: 200,
	maxKlineCount: 320,
	routePath: '/market-lens',
};

const json = (value, init) => new Response(JSON.stringify(value), { headers: { 'content-type': 'application/json' }, ...init });

function emQuoteRows() {
	return json({
		data: {
			diff: [{
				f2: 1680.5, f3: -0.52, f4: -8.8, f5: 25000, f6: 4200000000, f8: 0.2, f9: 22.5,
				f12: '600519', f13: 1, f14: '贵州茅台', f15: 1699, f16: 1670, f17: 1685, f18: 1689.3,
				f20: 2109000000000, f21: 2109000000000, f24: '-', f25: '-', f26: 20010827, f124: 1730851200,
			}],
		},
	});
}

/** One gtimg row with the documented field positions. */
function txQuoteRow(code, name, values) {
	const fields = new Array(60).fill('');
	fields[0] = '1';
	fields[1] = name;
	fields[2] = code.replace(/^[a-z]{2}/, '');
	Object.assign(fields, values);
	return `v_${code}="${fields.join('~')}";\n`;
}

function txQuoteText(rows) {
	return new Response(rows.join(''), { headers: { 'content-type': 'text/plain; charset=GBK' } });
}

function tencentQuoteBody() {
	return txQuoteText([txQuoteRow('sh600519', 'Kweichow Moutai', {
		3: '1680.5', 4: '1689.3', 5: '1685.0', 30: '20241106150000', 31: '-8.80', 32: '-0.52',
		33: '1699.00', 34: '1670.00', 36: '25000', 37: '420000.00', 38: '0.20', 39: '22.50',
		44: '21090.00', 45: '21090.00',
	})]);
}

function makeService(responder, options = {}) {
	const calls = [];
	const time = options.clock ?? clock();
	const fetchImpl = async (url, init) => {
		calls.push(String(url));
		return await responder(String(url), init);
	};
	const service = createMarketService({ ...CONFIG, ...options.config }, { fetchImpl, now: time.now });
	return { service, calls, time };
}

test('A-share quotes go to eastmoney first', async () => {
	const { service } = makeService(async (url) => {
		if (url.startsWith('https://push2.eastmoney.com/')) return emQuoteRows();
		throw new Error(`unexpected ${url}`);
	});
	const result = await service.quotes(['600519']);
	assert.equal(result.quotes.length, 1);
	const quote = result.quotes[0];
	assert.equal(quote.symbol, 'sh600519');
	assert.equal(quote.name, '贵州茅台');
	assert.equal(quote.price, 1680.5);
	assert.equal(quote.changePct, -0.52);
	assert.equal(quote.volume, 2500000);
	assert.equal(quote.source, 'eastmoney');
	assert.equal(quote.marketCap, 2109000000000);
});

test('eastmoney failure degrades to tencent rows', async () => {
	const seen = [];
	const { service } = makeService(async (url) => {
		seen.push(url.split('/')[2]);
		if (url.startsWith('https://push2.eastmoney.com/')) return new Response('down', { status: 500 });
		if (url.startsWith('https://qt.gtimg.cn/')) return tencentQuoteBody();
		throw new Error(`unexpected ${url}`);
	});
	const result = await service.quotes(['600519']);
	assert.deepEqual(seen, ['push2.eastmoney.com', 'qt.gtimg.cn']);
	const quote = result.quotes[0];
	assert.equal(quote.source, 'tencent');
	assert.equal(quote.price, 1680.5);
	assert.equal(quote.amount, 4200000000);
	assert.equal(quote.marketCap, 2109000000000);
	assert.equal(quote.updatedAt, '2024-11-06 15:00:00');
});

test('all-source failure raises a stable MarketError and later serves stale rows', async () => {
	const time = clock();
	let mode = 'ok';
	const { service } = makeService(async (url) => {
		if (mode === 'ok' && url.startsWith('https://push2.eastmoney.com/')) return emQuoteRows();
		if (mode === 'ok' && url.startsWith('https://qt.gtimg.cn/')) return tencentQuoteBody();
		throw new Error('all down');
	}, { clock: time });
	const first = await service.quotes(['600519']);
	assert.equal(first.quotes[0].stale, void 0);
	mode = 'down';
	time.advance(10000);
	const stale = await service.quotes(['600519']);
	assert.equal(stale.quotes.length, 1);
	assert.equal(stale.quotes[0].stale, true);
});

test('kline validates period and count bounds', async () => {
	const { service } = makeService(async () => json({ data: { klines: [] } }));
	await assert.rejects(service.kline('sh600519', 'hour', 100), (error) => error.code === 'BAD_INPUT');
	await assert.rejects(service.kline('sh600519', 'day', 10), (error) => error.code === 'BAD_INPUT');
	await assert.rejects(service.kline('sh600519', 'day', 400), (error) => error.code === 'BAD_INPUT');
	await assert.rejects(service.kline('!!!!', 'day', 100), (error) => error.code === 'BAD_INPUT');
});

test('kline parses eastmoney bars oldest to newest, capped to count', async () => {
	const lines = Array.from({ length: 260 }, (_, index) => `2024-01-${String(index % 28 + 1).padStart(2, '0')},10,11,12,9,1000,9000,-1,-0.1,0.5`);
	const { service } = makeService(async (url) => {
		if (url.startsWith('https://push2his.eastmoney.com/')) return json({ data: { klines: lines } });
		throw new Error(`unexpected ${url}`);
	});
	const result = await service.kline('sh600519', 'day', 30);
	assert.equal(result.bars.length, 30);
	assert.equal(result.bars[0].o, 10);
	assert.equal(result.bars[0].c, 11);
	assert.equal(result.source, 'eastmoney');
	assert.equal(result.adjust, 'qfq');
});

test('search merges the direct symbol, smartbox, and eastmoney results without duplicates', async () => {
	// Smartbox escapes non-ASCII names as literal \uXXXX even inside a GBK body.
	const smartbox = new Response('v_hint="sh~600519~\\u8d35\\u5dde\\u8305\\u53f0~gzmt~GP-A^hk~00700~\\u817e\\u8baf\\u63a7\\u80a1~TX~HKG";', { headers: { 'content-type': 'text/plain; charset=GBK' } });
	const { service } = makeService(async (url) => {
		if (url.startsWith('https://smartbox.gtimg.cn/')) return smartbox;
		if (url.includes('push2.eastmoney') || url.startsWith('https://searchapi.eastmoney.com/')) return json({
			QuotationCodeTable: { Data: [{ Code: '600519', Name: '贵州茅台', SecurityTypeName: '沪A', MType: '1' }, { Code: '00700', Name: '腾讯控股', SecurityTypeName: '港股', MType: '11' }] },
		});
		throw new Error(`unexpected ${url}`);
	});
	const result = await service.search('gzmt', 20);
	const symbols = result.items.map((item) => item.symbol);
	assert.ok(symbols.includes('hk00700'));
	assert.equal(new Set(symbols).size, symbols.length, 'no duplicate rows');
	assert.equal(symbols.includes('usGZMT'), false, 'pinyin must not seed a phantom US ticker');
	const moutai = result.items.find((item) => item.symbol === 'sh600519');
	assert.equal(moutai.name, '贵州茅台', 'unicode escapes are decoded');
	assert.equal(moutai.market, 'cn', 'market uses the enum, not the exchange prefix');
});

test('us quotes use yahoo and expose currency', async () => {
	const { service } = makeService(async (url) => {
		if (url.startsWith('https://query1.finance.yahoo.com/')) return json({
			chart: { result: [{ meta: { regularMarketPrice: 228.1, chartPreviousClose: 225.0, currency: 'USD', longName: 'Apple Inc.', regularMarketTime: 1730851200 }, timestamp: [1730764800], indicators: { quote: [{ open: [226.0], high: [229.0], low: [225.4], close: [228.1], volume: [52000000] }] } }] },
		});
		throw new Error(`unexpected ${url}`);
	});
	const result = await service.quotes(['AAPL']);
	const quote = result.quotes[0];
	assert.equal(quote.symbol, 'usAAPL');
	assert.equal(quote.price, 228.1);
	assert.equal(quote.change, 3.1);
	assert.equal(quote.currency, 'USD');
	assert.equal(quote.source, 'yahoo');
});

test('invalid symbols are reported, not silently dropped', async () => {
	const { service } = makeService(async (url) => {
		if (url.startsWith('https://push2.eastmoney.com/')) return emQuoteRows();
		if (url.startsWith('https://qt.gtimg.cn/')) return tencentQuoteBody();
		throw new Error(`unexpected ${url}`);
	});
	const result = await service.quotes(['600519', 'not-a-symbol!!']);
	assert.equal(result.quotes.length, 1);
	assert.deepEqual(result.failed.map((row) => row.reason), ['invalid-symbol']);
});

test('meta exposes the board defaults', async () => {
	const { service } = makeService(async () => {
		throw new Error('no network');
	});
	const value = service.meta();
	assert.equal(value.pollIntervalMs, 5000);
	assert.ok(value.indexBar.includes('sh000001'));
	assert.ok(value.defaultWatchlist.includes('hk00700'));
	assert.equal(value.defaultWatchlist.length, 12, 'seeded star watchlist for a contentful first open');
	assert.equal(value.limits.maxQuoteSymbols, 200);
});

test('news uses the sina roll and degrades to eastmoney 724', async () => {
	const roll = json({ result: { data: [{ title: '央行公告', url: 'https://sina/1', intime: '1793967899' }, { title: '市场波动', intlurl: 'https://sina/2', intime: '1793967800' }] } });
	let sinaOk = true;
	const { service } = makeService(async (url) => {
		if (url.startsWith('https://feed.mix.sina.com.cn/') && sinaOk) return roll;
		if (url.includes('np-listapi.eastmoney.com')) return json({ code: '1', data: { fastNewsList: [{ title: '美银观点', code: '2026110639', showTime: '2026-11-06 20:21:33', summary: '' }] } });
		throw new Error(`unexpected ${url}`);
	});
	const first = await service.news('', 10);
	assert.equal(first.source, 'sina-roll');
	assert.equal(first.items[0].title, '央行公告');
	assert.ok(first.items[0].time.startsWith('2026-'), 'unix seconds become an ISO stamp');
	sinaOk = false;
	service.cache.clear();
	const second = await service.news('', 10);
	assert.equal(second.source, 'em-724');
	assert.equal(second.items[0].url, 'https://finance.eastmoney.com/a/2026110639.html');
});

test('financials serve A-shares and mark HK/US unsupported', async () => {
	const f10 = json({ result: { data: [{ SECUCODE: '600519.SH', REPORT_DATE: '2026-09-30 00:00:00', REPORT_DATE_NAME: '2026三季报', NOTICE_DATE: '2026-10-31 00:00:00', EPSJB: 51.53, TOTALOPERATEREVE: 133283652508.95, TOTALOPERATEREVETZ: 1.82, PARENTNETPROFIT: 64467425981.95, PARENTNETPROFITTZ: -0.25, BPS: 216.95, CURRENCY: 'CNY' }] } });
	const { service } = makeService(async (url) => {
		if (url.includes('datacenter.eastmoney.com')) return f10;
		throw new Error(`unexpected ${url}`);
	});
	const cn = await service.financials('sh600519');
	assert.equal(cn.unsupported, false);
	assert.equal(cn.rows[0].report, '2026三季报');
	assert.equal(cn.rows[0].eps, 51.53);
	const hk = await service.financials('hk00700');
	assert.equal(hk.unsupported, true);
	assert.deepEqual(hk.rows, []);
});
