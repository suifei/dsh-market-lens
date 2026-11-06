import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TtlCache } from '../lib/cache.js';

test('fresh entries are served from cache and dedup concurrent fetches', async () => {
	let now = 1000;
	let calls = 0;
	const cache = new TtlCache(() => now);
	const fetcher = async () => {
		calls++;
		await new Promise((resolve) => setTimeout(resolve, 5));
		return 'v1';
	};
	const [a, b] = await Promise.all([cache.get('k', 5000, fetcher), cache.get('k', 5000, fetcher)]);
	assert.equal(a, 'v1');
	assert.equal(b, 'v1');
	assert.equal(calls, 1);
	now = 3000;
	assert.equal(await cache.get('k', 5000, fetcher), 'v1');
	assert.equal(calls, 1);
	now = 7000;
	assert.equal(await cache.get('k', 5000, fetcher), 'v1');
	assert.equal(calls, 2);
});

test('failed fetches are not cached and stale values remain peekable', async () => {
	let now = 0;
	const cache = new TtlCache(() => now);
	assert.equal(await cache.get('k', 10, async () => 'first'), 'first');
	now = 100;
	await assert.rejects(cache.get('k', 10, async () => {
		throw new Error('boom');
	}));
	assert.equal(cache.peekStale('k'), 'first');
	await assert.rejects(cache.get('k', 10, async () => {
		throw new Error('boom again');
	}));
	assert.equal(await cache.get('k', 10, async () => 'second'), 'second');
});
