import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createDiagLogger, isErrorEvent } from '../lib/diaglog.js';

const NOW = () => new Date('2026-01-01T00:00:00Z');

async function mount(level) {
	const dir = await mkdtemp(join(tmpdir(), 'ml-diag-'));
	const log = createDiagLogger({ dir, level, now: NOW });
	const feed = async () => {
		await log.append({ ev: 'panel.meta.ok', rev: 'x' });
		await log.append({ ev: 'panel.quotes.ok', n: 3 });
		await log.append({ ev: 'panel.crash', message: 'boom' });
		await log.append({ ev: 'route.status', status: 502, path: 'news' });
		await log.tail(10); // drains the write queue behind the appends
	};
	return { dir: join(dir, '..'), log, feed: () => feed(), tail: () => log.tail(10) };
}

test('errors mode keeps only crash and failure rows', async () => {
	const { log, feed, tail } = await mount('errors');
	await feed();
	const rows = (await tail()).rows;
	assert.deepEqual(rows.map((row) => row.ev), ['panel.crash', 'route.status']);
	await rm(log.dir, { recursive: true, force: true });
});

test('off mode writes nothing at all', async () => {
	const { log, feed, tail } = await mount('off');
	await feed();
	assert.deepEqual((await tail()).rows, []);
	await rm(log.dir, { recursive: true, force: true });
});

test('full mode keeps everything, and the default is errors', async () => {
	const { log, feed, tail } = await mount('full');
	await feed();
	assert.equal((await tail()).rows.length, 4);
	await rm(log.dir, { recursive: true, force: true });
	const bareDir = await mkdtemp(join(tmpdir(), 'ml-diag-'));
	const bare = createDiagLogger({ dir: bareDir, now: NOW });
	assert.equal(isErrorEvent('panel.kline.fail'), true);
	assert.equal(isErrorEvent('panel.kline.ok'), false);
	await bare.append({ ev: 'panel.meta.ok' });
	assert.deepEqual((await bare.tail(10)).rows, [], 'an unconfigured logger must not write info rows');
	await rm(bareDir, { recursive: true, force: true });
});
