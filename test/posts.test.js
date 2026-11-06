/**
 * /market-lens/posts — the per-stock context feeds (filings, Guba comments,
 * stock-scoped news). Fake fetch dispatches by URL; one failing source must
 * not sink the aggregate, and an all-empty answer must surface as 502.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRoutes } from '../lib/routes.js';
import { createMarketService } from '../lib/service.js';

const CONFIG = {
	pollIntervalMs: 5000, quoteTtlMs: 5000, klineTtlMs: 60000, searchTtlMs: 300000,
	newsTtlMs: 120000, finTtlMs: 600000, upstreamTimeoutMs: 5000,
	maxQuoteSymbols: 200, maxKlineCount: 320, routePath: '/market-lens', version: 'test',
};

async function mount(fetchImpl) {
	const dir = await mkdtemp(join(tmpdir(), 'ml-posts-'));
	const service = createMarketService(CONFIG, { fetchImpl, now: () => 1793967899000 });
	const routes = createRoutes({ service, config: { ...CONFIG, diagLogDir: dir }, diag: { append: () => void 0, tail: async () => ({ file: 'x', rows: [] }) } });
	return { dir, routeResource: routes.routeResource };
}

const get = (path) => new Request(`http://127.0.0.1:36413${path}`, { headers: { host: '127.0.0.1:36413', referer: 'http://127.0.0.1:36413/' } });

const res = (body, type = 'application/json') => ({
	status: 200, ok: true,
	headers: { get: () => type },
	text: async () => body,
	json: async () => JSON.parse(body),
	arrayBuffer: async () => new TextEncoder().encode(body).buffer,
});

const ANN = JSON.stringify({ data: { list: [{ art_code: 'AN9', title: '关于召开业绩说明会的公告', display_time: '2026-11-02 16:59:12:242' }] } });
const GUBA = 'x'.repeat(200) + 'var article_list=' + JSON.stringify({
	re: [{ post_title: '明天能反弹吗', post_id: 555, post_comment_count: 7, post_click_count: 900, post_publish_time: '2026-11-06 20:50:09', post_type: 0 }],
}) + ';';
const NEWS = 'cb(' + JSON.stringify({ result: { cmsArticleWebOld: [{ title: '白酒股普涨', date: '2026-11-05 18:07:32', url: 'https://em/1', MediaName: '证券时报' }] } }) + ')';

test('posts aggregates filings, comments and news per symbol', async () => {
	const calls = [];
	const { dir, routeResource } = await mount(async (url) => {
		calls.push(String(url));
		if (String(url).includes('np-anotice-stock')) return res(ANN);
		if (String(url).includes('guba.eastmoney.com/list')) return res(GUBA, 'text/html');
		if (String(url).includes('search-api-web')) return res(NEWS);
		throw new Error(`unexpected url ${String(url)}`);
	});
	const handled = await routeResource(get('/market-lens/posts?symbol=sh600519&name=%E8%B4%B5%E5%B7%9E%E8%8C%85%E5%8F%B0'));
	assert.ok(handled, 'route must answer posts');
	const body = await handled.json();
	assert.equal(body.symbol, 'sh600519');
	assert.equal(body.notice[0].title, '关于召开业绩说明会的公告');
	assert.match(String(body.notice[0].time), /^2026-11-0/, 'trailing ms segment still parses');
	assert.equal(body.posts[0].comments, 7);
	assert.match(body.posts[0].url, /news,600519,555/);
	assert.equal(body.news[0].source, '证券时报');
	assert.equal(calls.length, 3);
	await rm(dir, { recursive: true, force: true });
});

test('one dead source degrades to an empty bucket instead of failing the route', async () => {
	const { dir, routeResource } = await mount(async (url) => {
		if (String(url).includes('np-anotice-stock')) throw new Error('conn reset');
		if (String(url).includes('guba.eastmoney.com/list')) return res(GUBA, 'text/html');
		if (String(url).includes('search-api-web')) return res(NEWS);
		throw new Error('unexpected');
	});
	const handled = await routeResource(get('/market-lens/posts?symbol=sh600519&name=x'));
	assert.equal(handled.status, 200);
	const body = await handled.json();
	assert.deepEqual(body.notice, []);
	assert.equal(body.posts.length, 1);
	await rm(dir, { recursive: true, force: true });
});

test('updates batch-checks filings per symbol and marks non-A-shares unsupported', async () => {
	const { dir, routeResource } = await mount(async (url) => {
		if (String(url).includes('np-anotice-stock')) return res(ANN);
		throw new Error('unexpected');
	});
	const handled = await routeResource(get('/market-lens/updates?symbols=sh600519,hk00700'));
	assert.equal(handled.status, 200);
	const body = await handled.json();
	const cn = body.items.find((item) => item.symbol === 'sh600519');
	const hk = body.items.find((item) => item.symbol === 'hk00700');
	assert.equal(cn.notice.length, 1);
	assert.equal(cn.latest, cn.notice[0].time);
	assert.equal(hk.unsupported, true);
	await rm(dir, { recursive: true, force: true });
});

test('the pixel webfont is served with a font content-type', async () => {
	const { dir, routeResource } = await mount(async () => res('{}'));
	const handled = await routeResource(get('/market-lens/font'));
	assert.equal(handled.status, 200);
	assert.equal(handled.headers.get('content-type'), 'font/woff2');
	const bytes = await handled.arrayBuffer();
	assert.ok(bytes.byteLength > 100_000, 'real font, not a stub');
	assert.deepEqual([...new Uint8Array(bytes.slice(0, 4))], [0x77, 0x4F, 0x46, 0x32], 'wOF2 magic');
	const lamp = await routeResource(get('/market-lens/lampfont'));
	assert.equal(lamp.status, 200);
	const lb = new Uint8Array(await lamp.arrayBuffer());
	assert.deepEqual([...lb.slice(0, 4)], [0x4d, 0x4c, 0x4c, 0x50], 'MLLP magic');
	assert.equal(new DataView(lb.buffer).getUint32(8, true), 261_696, 'full HZK16 body');
	await rm(dir, { recursive: true, force: true });
});

test('posts route rejects a missing symbol with 400', async () => {
	const { dir, routeResource } = await mount(async () => res('{}'));
	const handled = await routeResource(get('/market-lens/posts'));
	assert.equal(handled.status, 400);
	await rm(dir, { recursive: true, force: true });
});
