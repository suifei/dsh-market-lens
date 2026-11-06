/**
 * A-share 财报 (key financial indicators) through the EastMoney datacenter
 * F10 table. HK/US datasets are not wired yet; callers get an explicit
 * unsupported marker so the UI shows a note instead of an empty grid.
 */
import { fetchUpstream, SourceError } from '../http.js';

const SUFFIX = { sh: 'SH', sz: 'SZ', bj: 'BJ' };

/**
 * @param instrument - normalized CN instrument.
 * @returns {{ symbol: string, market: 'cn', rows: object[] }} the latest four
 * reporting periods, newest first.
 */
export async function emFinancials(instrument, ctx) {
	const suffix = SUFFIX[instrument.symbol.slice(0, 2)];
	if (instrument.market !== 'cn' || suffix === void 0) return { symbol: instrument.symbol, market: instrument.market, rows: [], unsupported: true };
	const secucode = `${instrument.code}.${suffix}`;
	const url = `https://datacenter.eastmoney.com/securities/api/data/get?type=RPT_F10_FINANCE_MAINFINADATA&sty=APP_F10_MAINFINADATA&filter=${encodeURIComponent(`(SECUCODE="${secucode}")`)}&p=1&ps=4&sr=-1&st=REPORT_DATE&source=HSF10&client=PC`;
	const body = await fetchUpstream(url, { as: 'json', fetchImpl: ctx.fetchImpl, timeoutMs: ctx.timeoutMs, signal: ctx.signal, insecureFallback: true });
	const rows = body?.result?.data;
	if (!Array.isArray(rows) || rows.length === 0) throw new SourceError('em-financials', 'EMPTY', `no F10 rows for ${secucode}`);
	return {
		symbol: instrument.symbol,
		market: 'cn',
		unsupported: false,
		rows: rows.map((row) => ({
			report: String(row.REPORT_DATE_NAME ?? String(row.REPORT_DATE ?? '').slice(0, 10)),
			noticeDate: String(row.NOTICE_DATE ?? '').slice(0, 10),
			eps: numOrNull(row.EPSJB),
			revenue: numOrNull(row.TOTALOPERATEREVE),
			revenueYoY: numOrNull(row.TOTALOPERATEREVETZ),
			netProfit: numOrNull(row.PARENTNETPROFIT),
			netProfitYoY: numOrNull(row.PARENTNETPROFITTZ),
			bps: numOrNull(row.BPS),
			currency: row.CURRENCY ?? 'CNY',
		})),
		source: 'eastmoney-f10',
	};
}

function numOrNull(value) {
	const parsed = Number(value);
	return value === null || value === void 0 || value === '' || !Number.isFinite(parsed) ? null : parsed;
}
