import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchUpstream, SourceError } from '../lib/http.js';

const ok = (body, init = {}) => new Response(body, init);

test('json bodies parse', async () => {
	const value = await fetchUpstream('https://example.invalid/x', {
		as: 'json',
		fetchImpl: async () => ok(JSON.stringify({ hello: 'world' }), { headers: { 'content-type': 'application/json' } }),
	});
	assert.deepEqual(value, { hello: 'world' });
});

test('non-2xx becomes a SourceError with the URL', async () => {
	await assert.rejects(
		fetchUpstream('https://example.invalid/x', { fetchImpl: async () => ok('nope', { status: 503 }) }),
		(error) => error instanceof SourceError && error.code === 'HTTP_STATUS',
	);
});

test('charset=gbk bodies decode through TextDecoder', async () => {
	// "贵州茅台" in GBK bytes.
	const gbk = new Uint8Array([0xb9, 0xf3, 0xd6, 0xdd, 0xc3, 0xa9, 0xcc, 0xa8]);
	const text = await fetchUpstream('https://example.invalid/q', {
		fetchImpl: async () => ok(gbk, { headers: { 'content-type': 'text/plain; charset=GBK' } }),
	});
	assert.equal(text, '贵州茅台');
});

test('network failure maps to NETWORK', async () => {
	await assert.rejects(
		fetchUpstream('https://example.invalid/x', {
			fetchImpl: async () => {
				throw new Error('socket hang up');
			},
		}),
		(error) => error instanceof SourceError && error.code === 'NETWORK',
	);
});
