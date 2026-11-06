/**
 * Per-stock context feeds behind /market-lens/posts. All three are read-only
 * public pages/APIs, fetched host-side like every other upstream:
 *   notice — EastMoney announcement list (A-shares), stable JSON
 *   posts  — the stock's Guba bar; the list page embeds `var article_list={...}`
 *            (the standalone gbapi endpoint needs a signed device id, so we
 *            read the embed instead)
 *   news   — EastMoney unified search restricted to articles, keyword = name
 * Each source fails soft to an empty array; the route only 502s when all are
 * empty, matching the news route's contract.
 */
import { fetchUpstream } from '../http.js';

const iso = (value) => {
	if (typeof value !== 'string' || value === '') return null;
	// em stamps sometimes carry a trailing `:ms` segment (16:59:12:242) that Date cannot parse
	const date = new Date(value.replace(' ', 'T').replace(/:\d{1,3}$/, ''));
	return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const clean = (value) => String(value ?? '').replace(/<[^>]*>/g, '').trim();

export async function fetchNotice(code6, limit, ctx) {
	const url = `https://np-anotice-stock.eastmoney.com/api/security/ann?sr=-1&page_size=${String(Math.min(20, limit))}&page_index=1&ann_type=A&client_source=web&stock_list=${code6}`;
	const body = await fetchUpstream(url, { as: 'json', fetchImpl: ctx.fetchImpl, timeoutMs: ctx.timeoutMs, signal: ctx.signal, insecureFallback: true });
	const rows = body?.data?.list;
	if (!Array.isArray(rows)) return [];
	return rows.slice(0, limit).map((row) => ({
		title: clean(row.title),
		url: `https://data.eastmoney.com/notices/detail/${encodeURIComponent(String(row.art_code ?? ''))}.html`,
		time: iso(row.showTime ?? row.display_time ?? row.eiTime ?? row.notice_date),
		source: 'em-notice',
	})).filter((item) => item.title !== '');
}

export async function fetchGubaPosts(barCode, limit, ctx) {
	const url = `https://guba.eastmoney.com/list,${barCode}.html`;
	const html = await fetchUpstream(url, {
		as: 'text', fetchImpl: ctx.fetchImpl, timeoutMs: ctx.timeoutMs, signal: ctx.signal, insecureFallback: true,
		headers: { referer: 'https://guba.eastmoney.com/' },
	});
	const at = html.indexOf('article_list=');
	if (at < 0) return [];
	// the embed is one JSON object followed by `;` inside an inline script
	const brace = html.indexOf('{', at);
	let depth = 0;
	let end = brace;
	for (; end < html.length; end++) {
		if (html[end] === '{') depth++;
		else if (html[end] === '}' && --depth === 0) { end++; break; }
	}
	let payload;
	try {
		payload = JSON.parse(html.slice(brace, end));
	} catch {
		return [];
	}
	const rows = payload?.re;
	if (!Array.isArray(rows)) return [];
	return rows.filter((row) => row?.post_type !== 2 && row?.post_type !== 1).slice(0, limit).map((row) => ({
		title: clean(row.post_title),
		url: `https://guba.eastmoney.com/news,${barCode},${String(row.post_id ?? '')}.html`,
		time: iso(row.post_publish_time),
		comments: Number(row.post_comment_count) || 0,
		reads: Number(row.post_click_count) || null,
		source: 'guba',
	})).filter((item) => item.title !== '');
}

export async function fetchStockNews(keyword, limit, ctx) {
	const param = JSON.stringify({
		uid: '', keyword, type: ['cmsArticleWebOld'], client: 'web', clientVersion: 'curr', clientType: 'web',
		param: { cmsArticleWebOld: { searchScope: 'default', sort: 'default', pageIndex: 1, pageSize: limit, preTag: '', postTag: '' } },
	});
	const url = `https://search-api-web.eastmoney.com/search/jsonp?cb=cb&param=${encodeURIComponent(param)}`;
	const text = await fetchUpstream(url, { as: 'text', fetchImpl: ctx.fetchImpl, timeoutMs: ctx.timeoutMs, signal: ctx.signal, insecureFallback: true });
	let body;
	try {
		body = JSON.parse(text.replace(/^[^(]*\(/, '').replace(/\)\s*$/, ''));
	} catch {
		return [];
	}
	const rows = body?.result?.cmsArticleWebOld;
	if (!Array.isArray(rows)) return [];
	return rows.slice(0, limit).map((row) => ({
		title: clean(row.title),
		url: String(row.url ?? row.MediaUrl ?? ''),
		time: iso(row.date),
		source: String(row.MediaName ?? 'em-search'),
	})).filter((item) => item.title !== '');
}
