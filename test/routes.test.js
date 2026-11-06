import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRoutes } from '../lib/routes.js';
import { createMarketService } from '../lib/service.js';

const CONFIG = {
	pollIntervalMs: 5000,
	quoteTtlMs: 5000,
	klineTtlMs: 60000,
	searchTtlMs: 300000,
	newsTtlMs: 60000,
	finTtlMs: 21600000,
	upstreamTimeoutMs: 300,
	maxQuoteSymbols: 200,
	maxKlineCount: 320,
	routePath: '/market-lens',
	version: 'test',
};

async function mount(fetchImpl) {
	const dir = await mkdtemp(join(tmpdir(), 'ml-diag-'));
	const rows = [];
	const diag = {
		append: (row) => rows.push(row),
		tail: async () => ({ file: 'x', rows: [] }),
	};
	const service = createMarketService(CONFIG, { fetchImpl, now: () => 1793967899000 });
	const routes = createRoutes({ service, diag, config: CONFIG });
	return { ...routes, rows, cleanup: () => rm(dir, { recursive: true, force: true }) };
}

function request(path, headers = {}) {
	return new Request(`http://127.0.0.1:36413${path}`, { headers: { host: '127.0.0.1:36413', ...headers } });
}

const jsonFetch = async () => new Response(JSON.stringify({ data: null }), { headers: { 'content-type': 'application/json' } });

test('every endpoint hands the carrier a JSON Response, never a bare object', async () => {
	const { routeResource, cleanup } = await mount(jsonFetch);
	try {
		for (const path of ['/market-lens/meta', '/market-lens/quotes?symbols=sh600519', '/market-lens/kline?symbol=sh600519', '/market-lens/news', '/market-lens/financials?symbol=sh600519', '/market-lens/nowhere']) {
			const response = await routeResource(request(path, { referer: 'http://127.0.0.1:36413/' }));
			assert.ok(response instanceof Response, `${path} returned a non-Response`);
			assert.match(String(response.headers.get('content-type')), /application\/json/, path);
			if (path === '/market-lens/meta') assert.equal(response.status, 200);
			if (path.includes('nowhere')) assert.equal(response.status, 404);
		}
	} finally {
		await cleanup();
	}
});

test('the quotes endpoint answers 200 with rows when a source succeeds', async () => {
	const em = { rc: 0, data: { diff: [{ f12: '600519', f13: 1, f14: '贵州茅台', f2: 1453.0, f3: 1.2, f4: 17.2, f5: 30000, f6: 4361000000, f8: 0, f9: 0, f15: 0, f16: 0, f17: 0, f18: 0, f20: 0, f21: 0, f24: 0, f25: 0, f26: 0, f124: 1793967899 }] } };
	const { routeResource, cleanup } = await mount(async (url) => new Response(JSON.stringify(url.includes('push2.eastmoney.com') ? em : { data: null }), { headers: { 'content-type': 'application/json' } }));
	try {
		const response = await routeResource(request('/market-lens/quotes?symbols=sh600519', { referer: 'http://127.0.0.1:36413/' }));
		assert.equal(response.status, 200);
		const body = await response.json();
		assert.equal(body.quotes[0].name, '贵州茅台');
	} finally {
		await cleanup();
	}
});

test('cross-site and wrong-host requests are rejected with a JSON 403 and logged facts', async () => {
	const { routeResource, rows, cleanup } = await mount(jsonFetch);
	try {
		const a = await routeResource(request('/market-lens/meta', { 'sec-fetch-site': 'cross-site' }));
		assert.equal(a.status, 403);
		const b = await routeResource(request('/market-lens/meta', { origin: 'http://evil.example', referer: 'http://evil.example/' }));
		assert.equal(b.status, 403);
		assert.equal((await b.json()).error.code, 'ORIGIN');
		assert.equal(rows.filter((row) => row.ev === 'route.reject').length, 2);
		assert.equal(rows.find((row) => row.origin === 'http://evil.example').referer, 'http://evil.example/');
	} finally {
		await cleanup();
	}
});

test('diag route ingests client rows and reads the tail back', async () => {
	const { diagRoute, cleanup } = await mount(jsonFetch);
	try {
		let status = 0;
		let body = null;
		const res = {
			headersSent: false,
			writeHead: (code) => {
				status = code;
			},
			end: (text) => {
				body = JSON.parse(text);
			},
		};
		const req = {
			method: 'POST',
			url: '/market-lens/diag',
			headers: { host: '127.0.0.1:36413' },
			async *[Symbol.asyncIterator]() {
				yield Buffer.from(JSON.stringify({ rows: [{ ev: 'panel.test' }] }));
			},
		};
		await diagRoute(req, res);
		assert.equal(status, 200);
		assert.equal(body.stored, 1);
	} finally {
		await cleanup();
	}
});
