/**
 * 寰镜 MarketLens — Host half.
 * Owns every upstream fetch (symbol normalization, short-TTL cache, in-flight
 * dedup, multi-source degradation) and republishes the same service to two
 * callers: the Web panel over same-origin HTTP routes, and the DSH session
 * over read-only model tools. Nothing here writes; there is no trading verb.
 */
import z from '@deepseek-ai/schemastery';
import { defineTool } from '@deepseek-ai/dsh-tools';
import { createMarketService, MarketError } from './lib/service.js';

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
	// per-request timeout for every upstream fetch
	upstreamTimeoutMs: z.number().step(1).min(1000).max(30000).default(6000),
	// hard cap on symbols per quote batch
	maxQuoteSymbols: z.number().step(1).min(1).max(200).default(200),
	// hard cap on K-line bars per request
	maxKlineCount: z.number().step(1).min(20).max(320).default(320),
	// same-origin prefix this plugin answers under
	routePath: z.string().default('/market-lens'),
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

	const json = (body, status = 200) => new Response(JSON.stringify(body), {
		status,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store',
		},
	});

	/** Same-origin guardrail: a cross-site page must not ride this route. */
	function trusted(request, url) {
		if (request.headers.get('sec-fetch-site') === 'cross-site') return false;
		const origin = request.headers.get('origin');
		if (origin !== null) {
			try {
				if (new URL(origin).host !== url.host) return false;
			} catch {
				return false;
			}
		}
		const referer = request.headers.get('referer');
		if (referer !== null) {
			try {
				if (new URL(referer).host !== url.host) return false;
			} catch {
				return false;
			}
		}
		return true;
	}

	const prefix = `${config.routePath.replace(/\/+$/, '')}/`;

	async function routeResource(request) {
		const url = new URL(request.url, 'http://local');
		if (!trusted(request, url)) return json({ error: { code: 'ORIGIN', message: 'same-origin requests only' } }, 403);
		const tail = url.pathname.slice(prefix.length);
		const params = url.searchParams;
		try {
			if (tail === 'meta') return json({ ...service.meta(), service: 'market-lens', version: '0.1.0' });
			if (tail === 'quotes') return json(await service.quotes(params.get('symbols') ?? ''));
			if (tail === 'kline') {
				const count = Number(params.get('count') ?? '120');
				return json(await service.kline(params.get('symbol') ?? '', params.get('period') ?? 'day', count));
			}
			if (tail === 'search') return json(await service.search(params.get('q') ?? '', params.get('limit') === null ? void 0 : Number(params.get('limit'))));
			return json({ error: { code: 'NOT_FOUND', message: `unknown endpoint ${tail}` } }, 404);
		} catch (error) {
			if (error instanceof MarketError) return json({ error: { code: error.code, message: error.message } }, error.code === 'BAD_INPUT' ? 400 : 502);
			return json({ error: { code: 'INTERNAL', message: String(error) } }, 500);
		}
	}

	ctx.effect(() => ctx.get('webServer')?.register({
		kind: 'prefix',
		path: config.routePath.replace(/\/+$/, ''),
		resource: async (request) => await routeResource(request),
	}) ?? (() => {}), 'market-lens: routes');
}
