import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDiagLogger, diagFileName } from '../lib/diaglog.js';

test('rows append as jsonl, tail reads the newest ones back', async () => {
	const dir = await mkdtemp(join(tmpdir(), 'ml-diag-'));
	try {
		let now = new Date('2026-11-06T12:00:00Z');
		const log = createDiagLogger({ dir, now: () => now });
		log.append({ ev: 'a', n: 1 });
		log.append({ ev: 'b', n: 2 });
		await log.append({ ev: 'c', n: 3 });
		const { file, rows } = await log.tail(2);
		assert.equal(file, join(dir, diagFileName(now)));
		assert.deepEqual(rows.map((row) => row.ev), ['b', 'c']);
		const raw = await readFile(file, 'utf8');
		assert.equal(raw.trim().split('\n').length, 3);
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
});

test('tail of a missing file is empty, not an error', async () => {
	const dir = await mkdtemp(join(tmpdir(), 'ml-diag-'));
	try {
		const log = createDiagLogger({ dir });
		const { rows } = await log.tail(10);
		assert.deepEqual(rows, []);
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
});

test('rotation moves an oversized file aside', async () => {
	const dir = await mkdtemp(join(tmpdir(), 'ml-diag-'));
	try {
		const log = createDiagLogger({
			dir,
			maxBytes: 64,
		});
		// 20 appends trip the periodic size check at least once.
		for (let index = 0; index < 21; index++) log.append({ ev: 'fill', pad: 'x'.repeat(40) });
		await log.append({ ev: 'done' });
		const afterRotation = await log.tail(1);
		assert.equal(afterRotation.rows[0].ev, 'done');
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
});
