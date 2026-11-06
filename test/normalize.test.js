import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSymbol, normalizeSymbols, emSecidOf, INDEX_CATALOG } from '../lib/normalize.js';

test('canonical spellings collapse onto one symbol', () => {
	for (const input of ['600519', 'SH600519', 'sh600519', 'sh.600519']) {
		assert.equal(normalizeSymbol(input).symbol, 'sh600519');
	}
	assert.equal(normalizeSymbol('00700').symbol, 'hk00700');
	assert.equal(normalizeSymbol('700').symbol, 'hk00700');
	assert.equal(normalizeSymbol('AAPL').symbol, 'usAAPL');
	assert.equal(normalizeSymbol('us.aapl').symbol, 'usAAPL');
	assert.equal(normalizeSymbol('300750').symbol, 'sz300750');
	assert.equal(normalizeSymbol('830799').symbol, 'bj830799');
});

test('index catalog round-trips', () => {
	for (const row of INDEX_CATALOG) assert.equal(normalizeSymbol(row.symbol).symbol, row.symbol);
	assert.equal(normalizeSymbol('hkhsi').name, '恒生指数');
});

test('junk is rejected, not guessed', () => {
	for (const input of ['', '  ', '1234567', '..', 'a'.repeat(40)]) assert.equal(normalizeSymbol(input), void 0, input);
});

test('emSecidOf covers every market', () => {
	assert.equal(emSecidOf('sh600519'), '1.600519');
	assert.equal(emSecidOf('sz000001'), '0.000001');
	assert.equal(emSecidOf('hk00700'), '116.00700');
	assert.equal(emSecidOf('sh000001'), '1.000001');
});

test('symbol list dedups, caps at max, and reports rejects', () => {
	const { symbols, rejected } = normalizeSymbols(['600519', 'sh600519', 'AAPL', '??', '000001'], 200);
	assert.deepEqual(symbols.map((row) => row.symbol), ['sh600519', 'usAAPL', 'sz000001']);
	assert.deepEqual(rejected, ['??']);
	const capped = normalizeSymbols(Array.from({ length: 250 }, (_, i) => `6${String(i).padStart(5, '0')}`), 200);
	assert.equal(capped.symbols.length, 200);
});
