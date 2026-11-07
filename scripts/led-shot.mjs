// Offline self-check renderer for the bulb wall.
// Extracts ledPlan (the single source of truth for layout) from client.js,
// feeds it mock market data for every raster band, and dumps the prim list
// as JSON. led-shot.py turns those dumps into PNGs and audit reports.
// Usage: node scripts/led-shot.mjs [outDir]
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.argv[2] ?? join(root, 'shots');
await mkdir(outDir, { recursive: true });

const src = await readFile(join(root, 'client.js'), 'utf8');
const start = src.indexOf('function ledPlan(env)');
if (start < 0) throw new Error('ledPlan not found in client.js');
let depth = 0;
let end = -1;
for (let i = src.indexOf('{', start); i < src.length; i++) {
	if (src[i] === '{') depth++;
	else if (src[i] === '}') {
		depth--;
		if (depth === 0) { end = i + 1; break; }
	}
}
const ledPlan = new Function(`${src.slice(start, end)}; return ledPlan;`)();

// ---- mock market data, the 13-symbol board from the live watchlist
const MOCK = [
	['同旅行', 'hk00780', '11.34', '11.45', '11.11', '11.27', '-0.62%', '1.1亿', -0.62],
	['贵州茅台', 'sh600519', '1452.00', '1457.72', '1436.00', '1453.00', '+0.07%', '62.0亿', 0.07],
	['宁德时代', 'sz300750', '264.06', '269.89', '251.88', '254.22', '-3.73%', '147.9亿', -3.73],
	['比亚迪', 'sz002594', '86.25', '86.57', '84.80', '85.23', '-1.18%', '22.4亿', -1.18],
	['招商银行账户', 'sh600036', '42.54', '42.92', '42.46', '42.88', '+0.80%', '39.7亿', 0.80],
	['中国平安', 'sh601318', '54.35', '54.67', '53.80', '54.50', '+0.28%', '30.2亿', 0.28],
	['腾讯控股', 'hk00700', '430.40', '428.60', '416.20', '419.80', '-2.46%', '125.0亿', -2.46],
	['阿里巴巴', 'hk09988', '109.10', '107.00', '103.90', '104.90', '-3.85%', '100.6亿', -3.85],
	['美团-W', 'hk03690', '80.30', '83.00', '78.00', '80.40', '+0.12%', '41.7亿', 0.12],
	['苹果', 'usAAPL', '344.17', '345.79', '338.30', '342.37', '-0.52%', '153.3亿', -0.52],
	['微软', 'usMSFT', '535.93', '538.33', '524.47', '530.61', '-0.99%', '143.4亿', -0.99],
	['英伟达', 'usNVDA', '181.60', '194.90', '185.22', '186.64', '+2.78%', '340.7亿', 2.78],
	['特斯拉', 'usTSLA', '343.69', '363.84', '347.60', '358.22', '+4.23%', '131.5亿', 4.23],
];
const L = {
	'board.col.instrument': '名称', 'board.col.code': '代码', 'board.col.prevClose': '前收',
	'board.col.high': '最高', 'board.col.low': '最低', 'board.col.last': '现价',
	'board.col.chgPct': '涨幅', 'board.col.amount': '成交额', 'panel.last': '最新',
	'led.gainers': '涨幅榜', 'led.losers': '跌幅榜', 'led.count': '支数',
	'led.upN': '涨', 'led.downN': '跌', 'led.flatN': '平', 'led.turnover': '总额',
};
const upC = '#ff5b52';
const dnC = '#2edb8b';
const gray = '#9fc4e8';

// deterministic walk so two runs compare equal
let seed = 12345;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
let cur = 1450;
const chart = { pts: [], lo: Infinity, hi: -Infinity, volMax: 1 };
for (let k = 0; k < 240; k++) {
	cur += (rnd() - 0.48) * 9;
	const v = Math.round(rnd() * 9e7);
	chart.pts.push({ c: cur, v, down: k > 0 && cur < chart.pts[k - 1].c });
	chart.lo = Math.min(chart.lo, cur);
	chart.hi = Math.max(chart.hi, cur);
	chart.volMax = Math.max(chart.volMax, v);
}
chart.span = chart.hi - chart.lo || 1;
chart.color = dnC;
chart.hiF = chart.hi.toFixed(2);
chart.loF = chart.lo.toFixed(2);
let icur = 3600;
const idxBars = Array.from({ length: 60 }, (_, k) => {
	icur += (rnd() - 0.5) * 14;
	return { c: icur, ax: `11-${String(1 + (k % 28)).padStart(2, '0')}` };
});

const rowsAll = MOCK.map((m) => {
	const pct = m[8];
	const dir = pct > 0 ? upC : pct < 0 ? dnC : '#8fb3d9';
	return {
		symbol: m[1],
		name: m[0].slice(0, 4),
		pct,
		cells: [m[2], m[3], m[4], m[5], m[6], m[7]],
		cellColors: [gray, upC, dnC, dir, dir, gray],
	};
});
const side = MOCK.map((m) => ({ name: m[0].slice(0, 4), pct: m[8], pctF: m[6] })).sort((a, b) => b.pct - a.pct);

// fixed wall spec: the same 1024x768 bulb matrix the browser renders off-screen
{
	const CW = 800;
	const CH = 450;
	const P = 3.5; // css px per bulb cell inside the wall (3px bulb + 0.5px seam)
	const cols = CW;
	const G = 16; // cells; tiny walls are mocked at std
	const TH = G + 3;
	const FH = G + 3;
	const RTOP = TH + G + 4;
	const CHART_C = 34;
	const HROWS = CH; // the matrix itself is the budget
	const pageSize = Math.max(2, Math.floor((HROWS - RTOP - CHART_C - FH) / (G + 6)));
	const rows = rowsAll.slice(0, Math.min(pageSize, rowsAll.length));
	const pitchC = Math.max(G + 6, Math.floor((HROWS - RTOP - CHART_C - FH) / rows.length));
	const hC = HROWS;
	const title = '寰镜证券行情总屏';
	const wC = (s) => Array.from(String(s)).reduce((acc, ch2) => acc + (ch2.charCodeAt(0) > 255 ? 17 : 9), 0);
	const plan = ledPlan({
		P, cols, hC, tiny: false, pitchC, chartC: CHART_C,
		ledUp: upC, ledDown: dnC,
		title,
		clock: '12:02',
		titleC: wC(title),
		wC,
		idx: {
			name: '上证指数', price: 3649.18, priceF: '3649.18',
			high: 3660.49, highF: '3660.49', low: 3610.2, lowF: '3610.20',
			pct: -1.1, pctF: '-1.10%',
		},
		idxBars,
		L: (k) => L[k] ?? k,
		colLabels: [L['board.col.prevClose'], L['board.col.high'], L['board.col.low'], L['board.col.last'], L['board.col.chgPct'], L['board.col.amount']],
		rows, side, lit: 1, chart,
		footL: '支数:13  涨 6  跌 7  平 0',
		footR: '总额 1339.5亿',
	});
	await writeFile(join(outDir, 'plan-800x450.json'), JSON.stringify(plan));
	console.log(`plan ${String(cols)}x${String(hC)} cells (wall px ${String(plan.w)}x${String(plan.h)})`);
}
