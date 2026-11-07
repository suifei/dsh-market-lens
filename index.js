/**
 * 寰镜股票看板 MarketLens — Host half.
 * Owns every upstream fetch (symbol normalization, short-TTL cache, in-flight
 * dedup, multi-source degradation) and republishes the same service to two
 * callers: the Web panel over same-origin HTTP routes, and the DSH session
 * over read-only model tools. Nothing here writes; there is no trading verb.
 */
import z from '@deepseek-ai/schemastery';
import { defineTool } from '@deepseek-ai/dsh-tools';
import { join } from 'node:path';
import { createMarketService } from './lib/service.js';
import { createDiagLogger, defaultDiagDir } from './lib/diaglog.js';
import { createRoutes } from './lib/routes.js';
import { createAlertManager } from './lib/alerts.js';

/** Stable Loader identity. */
export const name = 'market-lens';

/** Services this plugin needs; without both (a non-Web profile) it stays inactive. */
export const inject = ['tools', 'webServer'];

/**
 * Tunable values live in the plugin Config so users edit their patch layer.
 * Integer fields use `.step(1)`: the bundled schemastery zod face has no
 * `.int()`.
 */
export const Config = z.object({
	// suggested client poll interval for quotes and the index bar
	pollIntervalMs: z.number().step(1).min(2000).max(120000).default(5000),
	// freshness window for quote batches (in-flight requests dedup within it)
	quoteTtlMs: z.number().step(1).min(1000).max(600000).default(5000),
	// freshness window for K-line payloads
	klineTtlMs: z.number().step(1).min(5000).max(3600000).default(60000),
	// freshness window for search results
	searchTtlMs: z.number().step(1).min(5000).max(86400000).default(300000),
	// freshness window for the news flash feed
	newsTtlMs: z.number().step(1).min(15000).max(3600000).default(60000),
	// freshness window for A-share financial reports
	finTtlMs: z.number().step(1).min(60000).max(86400000).default(21600000),
	// per-request timeout for every upstream fetch
	upstreamTimeoutMs: z.number().step(1).min(1000).max(30000).default(6000),
	// hard cap on symbols per quote batch
	maxQuoteSymbols: z.number().step(1).min(1).max(200).default(200),
	// hard cap on K-line bars per request
	maxKlineCount: z.number().step(1).min(20).max(320).default(320),
	// same-origin prefix this plugin answers under
	routePath: z.string().default('/market-lens'),
	// directory of the diagnostic JSONL log (one file per day, rotated at diagLogMaxBytes)
	diagLogDir: z.string().default(defaultDiagDir()),
	// rotation cap for one diagnostic log file
	diagLogMaxBytes: z.number().step(1).min(65536).max(16777216).default(1048576),
	// global log switch: 'off' silent, 'errors' crash/fail rows only (shipped default), 'full' everything (development)
	diagLevel: z.string().default('errors'),
});

const READ_ONLY_NOTE = ' Read-only delayed market data (not Level-2); never trades.';

function textRenderLine(quote) {
	const pct = quote.changePct === null ? '—' : `${quote.changePct > 0 ? '+' : ''}${String(quote.changePct)}%`;
	const price = quote.price === null ? '—' : String(quote.price);
	return `${quote.name} ${quote.symbol}: ${price} ${pct}${quote.stale === true ? ' (stale)' : ''}`;
}

function asText(value) {
	return [{ type: 'text', text: JSON.stringify(value) }];
}

/**
 * @param ctx - host context with tools and the web carrier.
 * @param config - resolved config.
 */
export function apply(ctx, config) {
	const service = createMarketService(config);
	const diag = createDiagLogger({
		dir: config.diagLogDir,
		maxBytes: config.diagLogMaxBytes,
		level: config.diagLevel,
	});
	diag.append({
		ev: 'host.activate',
		route: config.routePath,
		ttl: {
			quote: config.quoteTtlMs,
			kline: config.klineTtlMs,
			news: config.newsTtlMs,
		},
	});

	const alerts = createAlertManager({
		service,
		path: join(config.diagLogDir, 'alerts.json'),
		diag: (row) => diag.append(row),
		intervalMs: Math.max(10000, config.pollIntervalMs * 2),
	});

	const marketSearch = defineTool({
		name: 'market_search',
		description: `Search instruments by code, Chinese name, full pinyin or pinyin initials (gzmt → 贵州茅台). Returns symbol, name, market, kind. Markers: A-share sh/sz/bj+6 digits, hk+5 digits, us+TICKER.${READ_ONLY_NOTE}`,
		parameters: {
			query: { type: 'string', required: true, description: 'search key, 1–50 characters' },
			limit: { type: 'integer', description: 'max results, 1–30, default 20' },
		},
		output: {
			schema: { type: 'json' },
			render: (_args, value) => [{ type: 'text', text: value.items.map((item) => `${item.symbol}  ${item.name}  ${item.market}/${item.kind}`).join('\n') || 'no matches' }],
		},
		timeoutMs: 15000,
		async execute(args) {
			return await service.search(args.query, args.limit);
		},
	});

	const marketQuotes = defineTool({
		name: 'market_quotes',
		description: `Batch delayed quotes for up to ${String(config.maxQuoteSymbols)} symbols across A-shares (sh/sz/bj), HK (hk) and US (us). Missing fields come back null; each row names its source.${READ_ONLY_NOTE}`,
		parameters: {
			symbols: {
				type: 'array',
				required: true,
				description: 'canonical or loosely spelled symbols, e.g. ["600519","HK00700","AAPL"]',
				items: { type: 'string' },
			},
		},
		output: {
			schema: { type: 'json' },
			render: (_args, value) => [{
				type: 'text',
				text: [
					...value.quotes.map(textRenderLine),
					...value.failed.map((item) => `${item.symbol}: unavailable (${item.reason})`),
				].join('\n') || 'no quotes',
			}],
		},
		timeoutMs: 15000,
		isConcurrencySafe: () => true,
		async execute(args) {
			return await service.quotes(args.symbols);
		},
	});

	const marketKline = defineTool({
		name: 'market_kline',
		description: `OHLCV bars for one symbol. period: day|week|month; count 20–${String(config.maxKlineCount)}. Forward adjustment (qfq) is fixed host-side and not a parameter.${READ_ONLY_NOTE}`,
		parameters: {
			symbol: { type: 'string', required: true, description: 'one instrument, e.g. "sh600519", "hk00700", "usAAPL"' },
			period: { type: 'string', required: true, enum: ['day', 'week', 'month'] },
			count: { type: 'integer', required: true, description: `bars to return, 20–${String(config.maxKlineCount)}` },
		},
		output: {
			schema: { type: 'json' },
			render: (_args, value) => [{ type: 'text', text: `${value.symbol} ${value.period} ${value.adjust} × ${String(value.bars.length)} (${value.source})\n` + value.bars.slice(-10).map((bar) => `${bar.t} o${String(bar.o)} h${String(bar.h)} l${String(bar.l)} c${String(bar.c)} v${String(bar.v)}`).join('\n') }],
		},
		timeoutMs: 20000,
		async execute(args) {
			return await service.kline(args.symbol, args.period, args.count);
		},
	});

	ctx.effect(() => {
		const disposers = [marketSearch, marketQuotes, marketKline].map((tool) => ctx.tools.register(tool));
		return () => {
			for (const dispose of disposers) dispose();
		};
	}, 'market-lens: tools');

	const { routeResource, diagRoute, alertsRoute } = createRoutes({
		service,
		diag,
		alerts,
		config: { ...config, version: '0.30.0' },
	});

	ctx.effect(() => {
		const webServer = ctx.get('webServer');
		if (webServer === void 0) return () => {};
		const disposeResource = webServer.register({
			kind: 'prefix',
			path: config.routePath.replace(/\/+$/, ''),
			resource: async (request) => await routeResource(request),
		});
		const disposeDiag = webServer.register({
			kind: 'exact',
			path: `${config.routePath.replace(/\/+$/, '')}/diag`,
			handler: async (req, res) => {
				try {
					await diagRoute(req, res);
				} catch (error) {
					diag.append({
						ev: 'host.diag-error',
						message: String(error),
					});
					if (!res.headersSent) {
						try {
							res.writeHead(500, { 'content-type': 'application/json' });
							res.end('{"error":{"code":"INTERNAL"}}');
						} catch { /* socket already gone */ }
					}
				}
			},
		});
		const disposeAlerts = webServer.register({
			kind: 'exact',
			path: `${config.routePath.replace(/\/+$/, '')}/alerts`,
			handler: async (req, res) => {
				try {
					await alertsRoute(req, res);
				} catch (error) {
					diag.append({
						ev: 'host.alerts-error',
						message: String(error),
					});
					if (!res.headersSent) {
						try {
							res.writeHead(500, { 'content-type': 'application/json' });
							res.end('{"error":{"code":"INTERNAL"}}');
						} catch { /* socket already gone */ }
					}
				}
			},
		});
		alerts.start();
		return () => {
			alerts.stop();
			disposeAlerts();
			disposeDiag();
			disposeResource();
		};
	}, 'market-lens: routes');
}
