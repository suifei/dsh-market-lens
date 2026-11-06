/**
 * Alert manager for 寰镜 MarketLens. Rules are evaluated host-side so alerts
 * fire even while no panel is open; the client only reads the event feed.
 * Storage: <dir>/alerts.json (same directory as the diag log).
 */
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';

export const ALERT_TYPES = ['priceUp', 'priceDown', 'pctUp', 'pctDown', 'maUp', 'maDown', 'volSpike'];
const MAX_EVENTS = 200;

export function ruleText(alert, fmt) {
	switch (alert.type) {
		case 'priceUp': return `${fmt('alert.type.priceUp')} ${String(alert.value)}`;
		case 'priceDown': return `${fmt('alert.type.priceDown')} ${String(alert.value)}`;
		case 'pctUp': return `${fmt('alert.type.pctUp')} ${String(alert.value)}%`;
		case 'pctDown': return `${fmt('alert.type.pctDown')} ${String(alert.value)}%`;
		case 'maUp': return `${fmt('alert.type.maUp')} MA${String(alert.span ?? 5)}`;
		case 'maDown': return `${fmt('alert.type.maDown')} MA${String(alert.span ?? 5)}`;
		default: return `${fmt('alert.type.volSpike')} ${String(alert.value)}`;
	}
}

/** Pure evaluator: one alert against the latest quote (and optional kline MA pair). */
export function evaluate(alert, quote, ma, now) {
	if (quote === void 0 || quote === null) return false;
	switch (alert.type) {
		case 'priceUp': return quote.price !== null && quote.price >= alert.value;
		case 'priceDown': return quote.price !== null && quote.price <= alert.value;
		case 'pctUp': return quote.changePct !== null && quote.changePct >= alert.value;
		case 'pctDown': return quote.changePct !== null && quote.changePct <= -alert.value;
		case 'volSpike': return quote.volRatio !== null && quote.volRatio !== void 0 && quote.volRatio >= alert.value;
		case 'maUp': {
			if (ma === void 0 || ma.prev === null || ma.last === null || quote.price === null || quote.prevClose === null) return false;
			// crossed above: yesterday's close under yesterday's MA, price now over today's MA
			return quote.prevClose < ma.prev && quote.price >= ma.last;
		}
		case 'maDown': {
			if (ma === void 0 || ma.prev === null || ma.last === null || quote.price === null || quote.prevClose === null) return false;
			return quote.prevClose > ma.prev && quote.price <= ma.last;
		}
		default: return false;
	}
}

export function validateAlert(input) {
	if (input === void 0 || typeof input !== 'object') throw badInput('alert must be an object');
	const symbol = typeof input.symbol === 'string' ? input.symbol.trim().toLowerCase() : '';
	if (!/^(sh|sz|bj|hk|us)[\w.]{1,14}$/.test(symbol)) throw badInput(`bad symbol: ${symbol}`);
	if (!ALERT_TYPES.includes(input.type)) throw badInput(`bad type: ${String(input.type)}`);
	const value = Number(input.value);
	if (!Number.isFinite(value) || value <= 0) throw badInput('value must be a positive number');
	const span = input.span === void 0 ? 5 : Number(input.span);
	if (![5, 10, 20, 60].includes(span)) throw badInput('span must be one of 5/10/20/60');
	const cooldownMin = input.cooldownMin === void 0 ? 30 : Number(input.cooldownMin);
	if (!Number.isFinite(cooldownMin) || cooldownMin < 0 || cooldownMin > 1440) throw badInput('cooldownMin 0..1440');
	return {
		symbol,
		type: input.type,
		value,
		span,
		cooldownMin,
		lastFired: 0,
		createdAt: new Date().toISOString(),
	};
}

function badInput(message) {
	const error = new Error(message);
	error.code = 'BAD_INPUT';
	throw error;
}

export function createAlertManager({ service, path, diag, now = () => Date.now(), intervalMs = 30000, alertIntervalMs = 60000 }) {
	let state = { seq: 0, alerts: [], events: [], cursor: 0 };
	let loaded = false;
	let loading = null;
	let timer = 0;
	let stopped = false;
	let slowTicks = 0;

	const load = async () => {
		if (loading !== null) return loading;
		loading = (async () => {
			try {
				const raw = JSON.parse(await readFile(path, 'utf8'));
				if (Array.isArray(raw?.alerts) && Array.isArray(raw?.events)) {
					state = {
						seq: typeof raw.seq === 'number' ? raw.seq : raw.events.length,
						alerts: raw.alerts.filter((a) => a !== void 0 && typeof a.id === 'number'),
						events: raw.events.slice(-MAX_EVENTS),
						cursor: typeof raw.cursor === 'number' ? raw.cursor : 0,
					};
				}
			} catch { /* first run: no file yet */ }
			loaded = true;
			loading = null;
		})();
		return loading;
	};

	let saving = Promise.resolve();
	const save = () => {
		saving = saving.then(async () => {
			await mkdir(dirname(path), { recursive: true });
			const tmp = `${path}.tmp`;
			await writeFile(tmp, JSON.stringify(state), 'utf8');
			await rename(tmp, path);
		}).catch(async (error) => {
			diag?.({ ev: 'alert.save-error', message: String(error?.message ?? error) });
		});
		return saving;
	};

	const add = async (input) => {
		await load();
		const rule = validateAlert(input);
		rule.id = ++state.seq;
		// Same symbol+type+value already armed: re-arm instead of duplicating.
		const twin = state.alerts.find((a) => a.symbol === rule.symbol && a.type === rule.type && a.value === rule.value && a.span === rule.span);
		if (twin !== void 0) {
			Object.assign(twin, rule, { id: twin.id, lastFired: 0 });
		} else state.alerts.push(rule);
		await save();
		schedule(0);
		return twin ?? rule;
	};

	const remove = async (id) => {
		await load();
		const before = state.alerts.length;
		state.alerts = state.alerts.filter((a) => a.id !== Number(id));
		if (state.alerts.length !== before) await save();
		return state.alerts.length !== before;
	};

	const snapshot = async (since) => {
		await load();
		const floor = Math.max(Number(since) || 0, state.cursor);
		return {
			alerts: state.alerts,
			events: state.events.filter((e) => e.id > floor).slice(-80),
			cursor: state.cursor,
		};
	};

	const dismiss = async () => {
		await load();
		state.cursor = state.seq;
		await save();
	};

	/** MA helper for cross rules: previous and latest MA value from daily kline. */
	const maPair = async (symbol, span) => {
		const kline = await service.kline(symbol, 'day', Math.max(20, Math.min(120, span * 2 + 2)));
		const closes = (kline?.bars ?? []).slice(-Math.max(2, span + 1)).map((bar) => bar.c).filter((c) => c !== null);
		if (closes.length < span + 1) return { prev: null, last: null };
		const last = closes.slice(-span).reduce((a, b) => a + b, 0) / span;
		const prev = closes.slice(-span - 1, -1).reduce((a, b) => a + b, 0) / span;
		return { prev, last };
	};

	const runCycle = async () => {
		try {
			if (!loaded) await load();
			slowTicks++;
			const fast = state.alerts.filter((a) => !['maUp', 'maDown', 'volSpike'].includes(a.type));
			const slow = state.alerts.filter((a) => ['maUp', 'maDown', 'volSpike'].includes(a.type));
			// Slow rules are re-checked every other cycle to spare the upstream.
			const due = slowTicks % 2 === 0 ? state.alerts : fast;
			if (due.length === 0) return;
			const symbols = [...new Set(due.map((a) => a.symbol))];
			const body = await service.quotes(symbols.join(','));
			const bySymbol = body.quotes ?? [];
			const quotes = new Map(bySymbol.map((q) => [q.symbol, q]));
			for (const alert of due) {
				const ageOk = (alert.lastFired ?? 0) + alert.cooldownMin * 60000 <= now();
				if (!ageOk) continue;
				const quote = quotes.get(alert.symbol);
				let ma;
				if (alert.type === 'maUp' || alert.type === 'maDown') {
					try { ma = await maPair(alert.symbol, alert.span); } catch { continue; }
				}
				if (!evaluate(alert, quote, ma, now())) continue;
				alert.lastFired = now();
				const event = {
					id: ++state.seq,
					alertId: alert.id,
					symbol: alert.symbol,
					name: quote?.name ?? alert.symbol,
					type: alert.type,
					value: alert.value,
					span: alert.span,
					price: quote?.price ?? null,
					changePct: quote?.changePct ?? null,
					at: new Date(now()).toISOString(),
				};
				state.events.push(event);
				if (state.events.length > MAX_EVENTS) state.events.splice(0, state.events.length - MAX_EVENTS);
				diag?.({ ev: 'alert.fired', symbol: alert.symbol, type: alert.type, value: alert.value });
			}
			await save();
		} catch (error) {
			diag?.({ ev: 'alert.tick-error', message: String(error?.message ?? error) });
		}
	};

	const tick = async () => {
		if (stopped) return;
		await runCycle();
		schedule(intervalMs);
	};

	const schedule = (delay) => {
		windowClear();
		timer = setTimeout(() => { void tick(); }, delay);
		timer.unref?.();
	};
	const windowClear = () => { if (timer !== 0) clearTimeout(timer); timer = 0; };

	const start = () => { schedule(100); };
	const stop = () => { stopped = true; windowClear(); };

	return { add, remove, snapshot, dismiss, start, stop, save, runOnce: () => runCycle(), alertIntervalMs };
}
