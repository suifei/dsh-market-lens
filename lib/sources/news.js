/**
 * 快讯 (news flash) sources. Delayed public feeds, read like every other
 * upstream: Host-side only, short TTL, one primary + one backup.
 *   primary — Sina finance roll feed (supports a keyword filter `k=`)
 *   backup  — EastMoney 7×24 fastNewsList (needs a req_trace nonce; TLS to
 *             eastmoney is reset on some networks, so http fallback is on)
 */
import { fetchUpstream, SourceError } from '../http.js';

const iso = (seconds) => {
	const n = Number(seconds);
	return Number.isFinite(n) && n > 0 ? new Date(n * 1000).toISOString() : null;
};

export const newsSources = [
	{
		id: 'sina-roll',
		async fetch(query, limit, ctx) {
			// Pull a deeper page because the k= parameter is advisory and the
			// local narrowing below drops everything it does not match.
			const url = `https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2516&k=${encodeURIComponent(query ?? '')}&num=${String(Math.min(100, limit * 5))}`;
			const body = await fetchUpstream(url, { as: 'json', fetchImpl: ctx.fetchImpl, timeoutMs: ctx.timeoutMs, signal: ctx.signal });
			const rows = body?.result?.data;
			if (!Array.isArray(rows) || rows.length === 0) throw new SourceError('sina-roll', 'EMPTY', 'no roll rows');
			// The k= parameter is advisory; the roll can answer with unrelated
			// items, so narrow locally the same way the em feed does.
			const needle = String(query ?? '').trim();
			return rows
				.filter((row) => needle === '' || String(row.title ?? '').includes(needle))
				.slice(0, limit)
				.map((row) => ({
					title: String(row.title ?? '').trim(),
					url: String(row.intlurl ?? row.url ?? ''),
					time: iso(row.intime ?? row.ctime),
					source: 'sina-roll',
				})).filter((item) => item.title !== '');
		},
	},
	{
		id: 'em-724',
		async fetch(query, limit, ctx) {
			const url = `https://np-listapi.eastmoney.com/comm/web/getFastNewsList?client=web&biz=web_724&fastColumn=102&sortEnd=&pageSize=${String(limit)}&req_trace=${String(Date.now())}`;
			const body = await fetchUpstream(url, { as: 'json', fetchImpl: ctx.fetchImpl, timeoutMs: ctx.timeoutMs, signal: ctx.signal, insecureFallback: true });
			const rows = body?.data?.fastNewsList;
			if (!Array.isArray(rows) || rows.length === 0) throw new SourceError('em-724', 'EMPTY', 'no fast news rows');
			const needle = String(query ?? '').trim();
			return rows
				.filter((row) => needle === '' || `${String(row.title ?? '')}${String(row.summary ?? '')}`.includes(needle))
				.slice(0, limit)
				.map((row) => ({
					title: String(row.title ?? '').trim(),
					url: row.code === void 0 ? '' : `https://finance.eastmoney.com/a/${String(row.code)}.html`,
					time: typeof row.showTime === 'string' ? row.showTime : null,
					source: 'em-724',
				}));
		},
	},
];

/**
 * News items from the first source that answers; query narrows to items
 * whose title/summary mention it (Sina filters server-side, em client-side).
 */
export async function fetchNews(query, limit, ctx) {
	/** @type {string[]} */
	const failures = [];
	for (const source of newsSources) {
		try {
			const items = await source.fetch(query, limit, ctx);
			if (items.length > 0) return { items, source: source.id };
		} catch (error) {
			failures.push(`${source.id}:${error instanceof SourceError ? error.code : 'FAIL'}`);
		}
	}
	if (failures.length === newsSources.length) throw new SourceError('news', 'EMPTY', `no news source answered (${failures.join(', ')})`);
	return { items: [], source: 'none' };
}
