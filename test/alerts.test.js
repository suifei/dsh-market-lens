/**
 * Alerts: pure rules (evaluate/validate) and the manager loop with a stub
 * service, in-process clock and a temp file. No peer deps.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { evaluate, validateAlert, createAlertManager, ruleText } from '../lib/alerts.js';

const quote = (over) => ({
	symbol: 'sh600519',
	name: '贵州茅台',
	price: 1453,
	prevClose: 1436,
	changePct: 1.2,
	volRatio: null,
	...over,
});

test('evaluate: price and percent rules', () => {
	assert.equal(evaluate({ type: 'priceUp', value: 1450 }, quote({}), null, 0), true);
	assert.equal(evaluate({ type: 'priceUp', value: 1500 }, quote({}), null, 0), false);
	assert.equal(evaluate({ type: 'priceDown', value: 1460 }, quote({}), null, 0), true);
	assert.equal(evaluate({ type: 'pctUp', value: 1 }, quote({ changePct: 1.2 }), null, 0), true);
	assert.equal(evaluate({ type: 'pctDown', value: 1 }, quote({ changePct: 1.2 }), null, 0), false);
	assert.equal(evaluate({ type: 'pctDown', value: 1 }, quote({ changePct: -2.5 }), null, 0), true);
	assert.equal(evaluate({ type: 'volSpike', value: 3 }, quote({ volRatio: null }), null, 0), false);
	assert.equal(evaluate({ type: 'volSpike', value: 3 }, quote({ volRatio: 5 }), null, 0), true);
	assert.equal(evaluate({ type: 'priceUp', value: 1 }, null, null, 0), false);
});

test('evaluate: MA cross rules use prev/last mean', () => {
	// crossed above: yesterday's close under yesterday's MA, price over today's MA
	assert.equal(evaluate({ type: 'maUp', value: 1, span: 5 }, quote({ prevClose: 1400, price: 1453 }), { prev: 1420, last: 1440 }, 0), true);
	assert.equal(evaluate({ type: 'maUp', value: 1, span: 5 }, quote({ prevClose: 1500, price: 1453 }), { prev: 1420, last: 1440 }, 0), false);
	assert.equal(evaluate({ type: 'maDown', value: 1, span: 5 }, quote({ prevClose: 1470, price: 1400 }), { prev: 1450, last: 1430 }, 0), true);
	assert.equal(evaluate({ type: 'maDown', value: 1, span: 5 }, quote({}), undefined, 0), false);
});

test('validateAlert: normalizes and rejects junk', () => {
	const rule = validateAlert({ symbol: 'SH600519', type: 'priceUp', value: '1500' });
	assert.equal(rule.symbol, 'sh600519');
	assert.equal(rule.value, 1500);
	assert.equal(rule.cooldownMin, 30);
	assert.throws(() => validateAlert({ symbol: '??', type: 'priceUp', value: 1 }), /bad symbol/);
	assert.throws(() => validateAlert({ symbol: 'usAAPL', type: 'vibes', value: 1 }), /bad type/);
	assert.throws(() => validateAlert({ symbol: 'hk00700', type: 'priceUp', value: 0 }), /positive/);
	assert.throws(() => validateAlert({ symbol: 'sz300750', type: 'maUp', value: 1, span: 7 }), /span/);
});

test('manager: fires once per cooldown, persists, and dismiss moves the cursor', async () => {
	const dir = await mkdtemp(join(tmpdir(), 'ml-alerts-'));
	const path = join(dir, 'alerts.json');
	const rows = [];
	let clock = 1_790_000_000_000;
	const service = {
		quotes: async () => ({ quotes: [quote({})], failed: [] }),
		kline: async () => ({ bars: Array.from({ length: 30 }, (_, i) => ({ t: `d${i}`, o: 1, h: 1, l: 1, c: 1400 + i, v: 1 })) }),
	};
	const manager = createAlertManager({ service, path, diag: (row) => rows.push(row), now: () => clock, intervalMs: 60_000 });
	const alert = await manager.add({ symbol: 'sh600519', type: 'priceUp', value: 1450, cooldownMin: 30 });
	assert.equal(alert.id, 1);
	await manager.runOnce();
	let snap = await manager.snapshot(0);
	assert.equal(snap.events.length, 1);
	assert.equal(snap.events[0].symbol, 'sh600519');
	assert.equal(ruleText({ type: 'priceUp', value: 1450 }, (key) => key), 'alert.type.priceUp 1450');
	// same window: cooldown blocks a second event
	clock += 60_000;
	await manager.runOnce();
	snap = await manager.snapshot(0);
	assert.equal(snap.events.length, 1, 'cooldown must suppress refiring');
	// after the cooldown the rule refires
	clock += 30 * 60_000;
	await manager.runOnce();
	snap = await manager.snapshot(0);
	assert.equal(snap.events.length, 2);
	// since-cursor semantics
	assert.equal((await manager.snapshot(snap.events[1].id)).events.length, 0);
	await manager.dismiss();
	assert.equal((await manager.snapshot(1)).events.length, 0, 'dismiss raises the read cursor');
	// persistence round-trip
	const saved = JSON.parse(await readFile(path, 'utf8'));
	assert.equal(saved.alerts.length, 1);
	assert.equal(saved.events.length, 2);
	manager.stop();
});

test('manager: delete removes and save survives', async () => {
	const dir = await mkdtemp(join(tmpdir(), 'ml-alerts-'));
	const service = { quotes: async () => ({ quotes: [], failed: [] }), kline: async () => ({ bars: [] }) };
	const manager = createAlertManager({ service, path: join(dir, 'alerts.json'), diag: () => {} });
	const a = await manager.add({ symbol: 'usAAPL', type: 'pctDown', value: 5 });
	assert.equal((await manager.snapshot(0)).alerts.length, 1);
	assert.equal(await manager.remove(a.id), true);
	assert.equal((await manager.snapshot(0)).alerts.length, 0);
	assert.equal(await manager.remove(a.id), false);
});
