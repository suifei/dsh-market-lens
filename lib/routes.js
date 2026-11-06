/**
 * HTTP surface of the board: the prefix resource (data endpoints) and the
 * exact /diag route (log ingest + tail). Split out of index.js so both are
 * testable without the app-bundled peer deps.
 */
import { readFile } from 'node:fs/promises';

/**
 * @param deps - { service, diag, config }.
 */
export function createRoutes({ service, diag, config, alerts }) {
	/** pixel webfont bytes, lazily read and kept in memory (single 550KB asset) */
	let fontBytes = null;
	const json = (body, status = 200) => new Response(JSON.stringify(body), {
		status,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store',
		},
	});

	/**
	 * Same-origin guardrail: a cross-site page must not ride this route.
	 * The web carrier hands resources a placeholder URL origin, so the real
	 * host is read from the request's `Host` header, not from the parsed URL.
	 */
	function sameHostFacts(host, origin, referer) {
		const sameHost = (value) => {
			try {
				return new URL(String(value)).host === host;
			} catch {
				return false;
			}
		};
		if (origin !== null && origin !== void 0 && origin !== '' && !sameHost(origin)) return false;
		if (referer !== null && referer !== void 0 && referer !== '' && !sameHost(referer)) return false;
		return true;
	}

	function rejectFacts(facts, method) {
		return {
			ev: 'route.reject',
			method,
			...facts,
			ua: String(facts.ua ?? '').slice(0, 120),
		};
	}

	const prefix = `${config.routePath.replace(/\/+$/, '')}/`;

	async function routeResource(request) {
		const url = new URL(request.url, 'http://local');
		const facts = {
			path: url.pathname,
			host: request.headers.get('host'),
			origin: request.headers.get('origin'),
			referer: request.headers.get('referer'),
			secFetchSite: request.headers.get('sec-fetch-site'),
			ua: request.headers.get('user-agent'),
		};
		if (facts.secFetchSite === 'cross-site' || !sameHostFacts(String(facts.host ?? ''), facts.origin, facts.referer)) {
			diag.append(rejectFacts(facts, 'GET(resource)'));
			return json({ error: { code: 'ORIGIN', message: 'same-origin requests only' } }, 403);
		}
		const tail = url.pathname.slice(prefix.length);
		const params = url.searchParams;
		/** Every branch must hand the carrier a Response; a bare object 400s silently. */
		const done = (response) => {
			if (!(response instanceof Response)) throw new Error(`endpoint ${tail} returned a non-Response`);
			if (response.status !== 200) diag.append({
				ev: 'route.status',
				path: tail,
				status: response.status,
			});
			return response;
		};
		try {
			if (tail === 'meta') return done(json({ ...service.meta(), service: 'market-lens', version: config.version }));
			if (tail === 'quotes') return done(json(await service.quotes(params.get('symbols') ?? '')));
			if (tail === 'kline') {
				const count = Number(params.get('count') ?? '120');
				return done(json(await service.kline(params.get('symbol') ?? '', params.get('period') ?? 'day', count)));
			}
			if (tail === 'search') return done(json(await service.search(params.get('q') ?? '', params.get('limit') === null ? void 0 : Number(params.get('limit')))));
			if (tail === 'news') return done(json(await service.news(params.get('q') ?? '', params.get('limit') === null ? void 0 : Number(params.get('limit')))));
			if (tail === 'posts') return done(json(await service.posts(params.get('symbol') ?? '', params.get('name') ?? '')));
			if (tail === 'updates') return done(json(await service.updates(params.get('symbols') ?? '')));
			if (tail === 'financials') return done(json(await service.financials(params.get('symbol') ?? '')));
			if (tail === 'font') {
				// pixel webfont, read once and kept warm; the versioned query busts the client cache
				fontBytes ??= await readFile(new URL('../assets/ark-pixel-12px-zh_hans.woff2', import.meta.url));
				return done(new Response(fontBytes, { headers: { 'content-type': 'font/woff2', 'content-length': String(fontBytes.byteLength), 'cache-control': 'public, max-age=86400' } }));
			}
			return done(json({ error: { code: 'NOT_FOUND', message: `unknown endpoint ${tail}` } }, 404));
		} catch (error) {
			const code = error?.code === 'BAD_INPUT' ? 'BAD_INPUT' : 'INTERNAL';
			const status = code === 'BAD_INPUT' ? 400 : 502;
			diag.append({
				ev: 'route.status',
				path: tail,
				status,
				message: String(error?.message ?? error),
			});
			return json({ error: { code, message: String(error?.message ?? error) } }, status);
		}
	}

	/**
	 * Diagnostic relay, exact route so it wins over the prefix resource:
	 * POST ingests client rows, GET reads the tail back. Node-style headers
	 * arrive as a plain object here.
	 */
	async function readJson(req) {
		const chunks = [];
		let size = 0;
		for await (const chunk of req) {
			size += chunk.length;
			if (size > 262144) {
				const error = new Error('body exceeds 256 KiB');
				error.code = 'BODY_TOO_LARGE';
				throw error;
			}
			chunks.push(chunk);
		}
		return JSON.parse(Buffer.concat(chunks).toString('utf8'));
	}

	async function diagRoute(req, res) {
		const headers = req.headers;
		const write = (status, body) => {
			res.writeHead(status, {
				'content-type': 'application/json; charset=utf-8',
				'cache-control': 'no-store',
			});
			res.end(JSON.stringify(body));
		};
		const facts = {
			path: String(req.url ?? '/diag'),
			host: String(headers.host ?? ''),
			origin: headers.origin ?? null,
			referer: headers.referer ?? null,
			secFetchSite: headers['sec-fetch-site'] ?? null,
			ua: String(headers['user-agent'] ?? ''),
		};
		if (facts.secFetchSite === 'cross-site' || !sameHostFacts(facts.host, facts.origin, facts.referer)) {
			diag.append(rejectFacts(facts, String(req.method ?? '?')));
			write(403, { error: { code: 'ORIGIN', message: 'same-origin requests only' } });
			return;
		}
		if (req.method === 'POST') {
			try {
				const body = await readJson(req);
				const rows = Array.isArray(body?.rows) ? body.rows.slice(0, 200) : [];
				for (const row of rows) diag.append({ ...row, src: 'client' });
				write(200, { ok: true, stored: rows.length });
			} catch (error) {
				write(String(error?.message ?? '').includes('256') ? 413 : 400, { error: { code: 'BAD_JSON', message: String(error) } });
			}
			return;
		}
		if (req.method === 'GET' || req.method === 'HEAD') {
			const query = new URL(String(req.url ?? '/'), 'http://local').searchParams;
			const count = Number(query.get('tail') ?? '50');
			const { file, rows } = await diag.tail(Number.isFinite(count) ? count : 50);
			write(200, { file, rows });
			return;
		}
		write(405, { error: { code: 'METHOD', message: 'GET or POST only' } });
	}

	/**
	 * Alerts: GET feed, POST add (or dismiss via {action:'dismiss'}), DELETE by ?id.
	 * The manager owns evaluation timing; this surface only reads and mutates rules.
	 */
	async function alertsRoute(req, res) {
		const write = (status, body) => {
			res.writeHead(status, {
				'content-type': 'application/json; charset=utf-8',
				'cache-control': 'no-store',
			});
			res.end(JSON.stringify(body));
		};
		const headers = req.headers;
		const facts = {
			path: String(req.url ?? '/alerts'),
			host: String(headers.host ?? ''),
			origin: headers.origin ?? null,
			referer: headers.referer ?? null,
			secFetchSite: headers['sec-fetch-site'] ?? null,
			ua: String(headers['user-agent'] ?? ''),
		};
		if (alerts === void 0) {
			write(503, { error: { code: 'DISABLED', message: 'alerts unavailable' } });
			return;
		}
		if (facts.secFetchSite === 'cross-site' || !sameHostFacts(facts.host, facts.origin, facts.referer)) {
			diag.append(rejectFacts(facts, String(req.method ?? '?')));
			write(403, { error: { code: 'ORIGIN', message: 'same-origin requests only' } });
			return;
		}
		const query = new URL(String(req.url ?? '/'), 'http://local').searchParams;
		try {
			if (req.method === 'GET' || req.method === 'HEAD') {
				const since = Number(query.get('since') ?? '0');
				write(200, await alerts.snapshot(Number.isFinite(since) ? since : 0));
				return;
			}
			if (req.method === 'POST') {
				const body = await readJson(req);
				if (body?.action === 'dismiss') {
					await alerts.dismiss();
					write(200, { ok: true });
					return;
				}
				const alert = await alerts.add(body);
				diag.append({
					ev: 'alert.created',
					symbol: alert.symbol,
					type: alert.type,
					value: alert.value,
				});
				write(200, { alert });
				return;
			}
			if (req.method === 'DELETE') {
				const removed = await alerts.remove(query.get('id'));
				write(200, { removed });
				return;
			}
			write(405, { error: { code: 'METHOD', message: 'GET, POST or DELETE' } });
		} catch (error) {
			const code = error?.code === 'BAD_INPUT' ? 'BAD_INPUT' : 'INTERNAL';
			diag.append({
				ev: 'route.status',
				path: 'alerts',
				status: code === 'BAD_INPUT' ? 400 : 502,
				message: String(error?.message ?? error),
			});
			write(code === 'BAD_INPUT' ? 400 : 502, { error: { code, message: String(error?.message ?? error) } });
		}
	}

	return { routeResource, diagRoute, alertsRoute };
}
