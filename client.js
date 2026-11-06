/**
 * 寰镜 MarketLens — Client half (browser bundle, plain JS, no JSX/build).
 * Renders the sidebar panel icon (`sidebar.panellist`) and the board itself
 * (`main` keyed panel). The UI never talks to upstream market APIs: every
 * read goes through the same-origin routes served by this package's Host
 * half under /market-lens/*.
 */
window.__ModuleLoader__.load({
	id: '@suifei/dsh-market-lens',
	factory(require) {
		const React = require('react');
		const h = React.createElement;
		const NS = 'market-lens';
		const PKG = '@suifei/dsh-market-lens';
		const PANEL_ID = 'market-lens';
		const BASE = '/market-lens';
		const LS_WATCH = 'ml.watchlist.v1';
		const LS_PREFS = 'ml.prefs.v1';
		const LS_SEEN = 'ml.seen.v1';

		const zh = {
			'panel.title': '寰镜行情',
			'news.title': '快讯', 'news.loading': '快讯加载中…', 'news.empty': '暂无快讯',
			'fin.title': '财报 · 主要指标', 'fin.unsupported': '财报暂支持 A 股', 'fin.error': '财报获取失败',
			'fin.col.report': '报告期', 'fin.col.revenue': '营收', 'fin.col.revYoY': '营收同比',
			'fin.col.profit': '归母净利', 'fin.col.profitYoY': '净利同比', 'fin.col.eps': 'EPS',
			'crash.prefix': '面板渲染异常：', 'crash.hint': '（请把这条消息贴给我修；其它面板不受影响）',
			'meta.error': '无法连接行情服务（宿主插件未激活或路由被拦截）',
			'search.placeholder': '代码 / 名称 / 拼音，如 600519、gzmt、腾讯',
			'search.empty': '无匹配结果',
			'toolbar.palette': '配色',
			'toolbar.import': '批量导入',
			'toolbar.refreshing': '刷新中',
			'toolbar.paused': '已暂停',
			'toolbar.error': '数据暂不可用',
			'filter.all': '全部', 'filter.cn': 'A股', 'filter.hk': '港股', 'filter.us': '美股', 'filter.index': '指数',
			'sort.default': '默认', 'sort.gainers': '涨幅↓', 'sort.losers': '跌幅↑', 'sort.amount': '成交额↓',
			'list.title': '自选', 'list.addHint': '搜索上方添加标的', 'list.remove': '移除',
			'indexbar.title': '指数',
			'detail.title': '详情', 'detail.back': '返回自选',
			'detail.period.day': '日K', 'detail.period.week': '周K', 'detail.period.month': '月K',
			'chart.hint': '拖拽框选放大 · 滚轮缩放 · 右键拖动平移 · 点击K线看当日 · 双击回全览 · Shift+拖拽平移', 'chart.reset': '全览',
			'list.staleHint': '缓存数据，恢复轮询后自动更新', 'kline.retry': '重试',
			'detail.ma': 'MA', 'detail.chartError': 'K线获取失败', 'detail.loading': '加载中…',
			'metric.price': '现价', 'metric.change': '涨跌幅', 'metric.open': '今开', 'metric.prev': '昨收',
			'metric.high': '最高', 'metric.low': '最低', 'metric.volume': '成交量', 'metric.amount': '成交额',
			'metric.turnover': '换手率', 'metric.pe': '市盈率', 'metric.marketCap': '总市值',
			'metric.amplitude': '振幅', 'metric.volRatio': '量比', 'metric.pb': '市净率',
			'list.pin': '钉到顶部', 'list.unpin': '取消置顶',
			'alert.title': '提醒', 'alert.new': '设提醒', 'alert.none': '暂无提醒',
			'alert.type.priceUp': '价格 ≥', 'alert.type.priceDown': '价格 ≤', 'alert.type.pctUp': '涨幅 ≥ (%)', 'alert.type.pctDown': '跌幅 ≥ (%)',
			'alert.type.maUp': '上穿 MA', 'alert.type.maDown': '下破 MA', 'alert.type.volSpike': '量比 ≥',
			'alert.threshold': '阈值', 'alert.cooldown': '静默期(分)', 'alert.save': '保存', 'alert.cancel': '取消', 'alert.delete': '删除',
			'alert.armed': '监控中', 'alert.fired': '已触发', 'alert.fireNote': '{{symbol}} {{rule}}',
			'alert.barTitle': '寰镜提醒', 'alert.dismiss': '清除',
			'palette.redup': '红涨绿跌', 'palette.greenup': '绿涨红跌', 'palette.blueorange': '蓝涨橙跌', 'palette.goldviolet': '紫涨金跌', 'palette.tealrose': '青涨玫跌',
			'day.date': '日期', 'day.change': '涨跌', 'day.changePct': '涨幅', 'day.amplitude': '振幅', 'metric.close': '收盘',
			'advice.surge': '强势拉升', 'advice.rise': '稳步走高', 'advice.flat': '窄幅盘整', 'advice.drop': '正快速下降', 'advice.slump': '加速下挫',
			'import.title': '批量导入自选', 'import.placeholder': '每行一个代码或名称，最多 50 条',
			'import.confirm': '导入', 'import.cancel': '取消', 'import.toomany': '超出 50 条的部分已忽略',
			'notice': '延迟公开行情 · 非 Level-2 · 只读无交易',
		};
		const en = {
			'panel.title': 'MarketLens',
			'news.title': 'News flash', 'news.loading': 'Loading news…', 'news.empty': 'No news',
			'fin.title': 'Reports · key metrics', 'fin.unsupported': 'Financial reports cover A-shares only for now', 'fin.error': 'Reports unavailable',
			'fin.col.report': 'Period', 'fin.col.revenue': 'Revenue', 'fin.col.revYoY': 'Rev YoY',
			'fin.col.profit': 'Net profit', 'fin.col.profitYoY': 'NP YoY', 'fin.col.eps': 'EPS',
			'crash.prefix': 'Panel render error: ', 'crash.hint': ' (paste this message to fix it; other panels are unaffected)',
			'meta.error': 'Cannot reach the market service (host plugin inactive or route blocked)',
			'search.placeholder': 'Code / name / pinyin, e.g. 600519, gzmt, tencent',
			'search.empty': 'No matches',
			'toolbar.palette': 'Colors',
			'toolbar.import': 'Bulk import',
			'toolbar.refreshing': 'Refreshing',
			'toolbar.paused': 'Paused',
			'toolbar.error': 'Data unavailable',
			'filter.all': 'All', 'filter.cn': 'A-shares', 'filter.hk': 'HK', 'filter.us': 'US', 'filter.index': 'Indices',
			'sort.default': 'Manual', 'sort.gainers': 'Top gainers', 'sort.losers': 'Top losers', 'sort.amount': 'Turnover',
			'list.title': 'Watchlist', 'list.addHint': 'Search above to add instruments', 'list.remove': 'Remove',
			'indexbar.title': 'Indices',
			'detail.title': 'Detail', 'detail.back': 'Back to watchlist',
			'detail.period.day': 'Daily', 'detail.period.week': 'Weekly', 'detail.period.month': 'Monthly',
			'chart.hint': 'drag to box-zoom · wheel zooms · right-drag pans · click a bar for the day · double-click shows all', 'chart.reset': 'Overview',
			'list.staleHint': 'cached values; live once polling recovers', 'kline.retry': 'Retry',
			'detail.ma': 'MA', 'detail.chartError': 'K-line unavailable', 'detail.loading': 'Loading…',
			'metric.price': 'Last', 'metric.change': 'Chg %', 'metric.open': 'Open', 'metric.prev': 'Prev',
			'metric.high': 'High', 'metric.low': 'Low', 'metric.volume': 'Volume', 'metric.amount': 'Turnover',
			'metric.turnover': 'Turnover', 'metric.pe': 'P/E', 'metric.marketCap': 'Mkt cap',
			'metric.amplitude': 'Range', 'metric.volRatio': 'Vol ratio', 'metric.pb': 'P/B',
			'list.pin': 'Pin to top', 'list.unpin': 'Unpin',
			'alert.title': 'Alerts', 'alert.new': 'New alert', 'alert.none': 'No alerts yet',
			'alert.type.priceUp': 'Price ≥', 'alert.type.priceDown': 'Price ≤', 'alert.type.pctUp': 'Gain ≥ (%)', 'alert.type.pctDown': 'Drop ≥ (%)',
			'alert.type.maUp': 'Cross above MA', 'alert.type.maDown': 'Break below MA', 'alert.type.volSpike': 'Vol ratio ≥',
			'alert.threshold': 'Threshold', 'alert.cooldown': 'Silence (min)', 'alert.save': 'Save', 'alert.cancel': 'Cancel', 'alert.delete': 'Delete',
			'alert.armed': 'armed', 'alert.fired': 'fired', 'alert.fireNote': '{{symbol}} {{rule}}',
			'alert.barTitle': 'MarketLens alerts', 'alert.dismiss': 'Clear',
			'palette.redup': 'Red up', 'palette.greenup': 'Green up', 'palette.blueorange': 'Blue up', 'palette.goldviolet': 'Violet up', 'palette.tealrose': 'Teal up',
			'day.date': 'Date', 'day.change': 'Chg', 'day.changePct': 'Chg %', 'day.amplitude': 'Range', 'metric.close': 'Close',
			'advice.surge': 'surging', 'advice.rise': 'trending up', 'advice.flat': 'consolidating', 'advice.drop': 'falling fast', 'advice.slump': 'breaking down',
			'import.title': 'Bulk import watchlist', 'import.placeholder': 'One code or name per line, up to 50',
			'import.confirm': 'Import', 'import.cancel': 'Cancel', 'import.toomany': 'Lines beyond 50 ignored',
			'notice': 'Delayed public data · not Level-2 · read-only, no trading',
		};

		const CSS = `
.ml-root{--ml-up:#e04f4f;--ml-down:#2fa36b;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base);display:flex;flex-direction:column;height:100%;min-height:0;overflow:hidden;font-variant-numeric:tabular-nums}
.ml-root[data-pal="greenup"]{--ml-up:#2fa36b;--ml-down:#e04f4f}
.ml-root[data-pal="blueorange"]{--ml-up:#4f8fe0;--ml-down:#e09b3c}
.ml-root[data-pal="goldviolet"]{--ml-up:#9a5ce8;--ml-down:#c9a227}
.ml-root[data-pal="tealrose"]{--ml-up:#1f9e8e;--ml-down:#d9527f}
.ml-palmenu{position:absolute;top:34px;right:8px;z-index:20;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l2);border-radius:10px;padding:4px;display:flex;flex-direction:column;box-shadow:0 6px 24px rgba(0,0,0,.28)}
.ml-palmenu button{display:flex;align-items:center;gap:8px;padding:6px 10px;background:none;border:0;border-radius:8px;color:var(--dsw-alias-label-primary);font-size:12px;cursor:pointer;white-space:nowrap}
.ml-palmenu button:hover{background:var(--dsw-alias-bg-layer-2)}
.ml-palmenu i{display:inline-flex;gap:2px}
.ml-palmenu i s{width:10px;height:10px;border-radius:3px;display:block}
.ml-daybar{display:flex;flex-wrap:wrap;gap:2px 14px;padding:5px 10px;border-top:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);font-size:11px;flex:none}
.ml-daybar span{display:flex;gap:5px;align-items:baseline}
.ml-daybar i{font-style:normal;color:var(--dsw-alias-label-secondary)}
.ml-flat{color:var(--dsw-alias-label-secondary)}
.up{color:var(--ml-up)}
.down{color:var(--ml-down)}
.up .rm,.down .rm{color:inherit}
.ml-top{display:flex;gap:8px;align-items:center;padding:10px 14px;border-bottom:1px solid var(--dsw-alias-border-l1);flex-wrap:wrap}
.ml-brand{font-weight:600;margin-right:auto;display:flex;gap:8px;align-items:baseline;min-width:0}
.ml-brand small{color:var(--dsw-alias-label-secondary);font-weight:400;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ml-searchbox{position:relative;flex:1 1 240px;max-width:420px}
.ml-search{width:100%;box-sizing:border-box;padding:7px 10px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:inherit;font:inherit}
.ml-results{position:absolute;top:calc(100% + 4px);left:0;right:0;margin:0;padding:4px;list-style:none;max-height:320px;overflow:auto;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l2);border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.28);z-index:40}
.ml-results li{display:flex;gap:8px;align-items:center;padding:6px 8px;border-radius:6px;cursor:pointer}
.ml-results li:hover{background:var(--dsw-alias-bg-layer-2)}
.ml-badge{font-size:10px;padding:1px 5px;border-radius:4px;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);flex:none}
.ml-btn{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:inherit;border-radius:8px;padding:6px 9px;font:inherit;cursor:pointer}
.ml-btn:hover{background:var(--dsw-alias-bg-layer-2)}
.ml-btn[aria-pressed="true"]{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}
.ml-status{font-size:12px;color:var(--dsw-alias-label-secondary);display:flex;gap:6px;align-items:center}
.ml-status[data-err="1"]{color:var(--dsw-alias-state-error-primary)}
.ml-indexbar{display:flex;gap:6px;padding:8px 14px}
.ml-hwrap{position:relative;border-bottom:1px solid var(--dsw-alias-border-l1);flex:none}
.ml-hscroll{overflow-x:auto;display:flex;scrollbar-width:none;touch-action:pan-x;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;outline:none}
.ml-hscroll:focus-visible{box-shadow:inset 0 0 0 2px var(--dsw-alias-brand-primary)}
.ml-hscroll::-webkit-scrollbar{width:8px;height:8px}
.ml-hscroll::-webkit-scrollbar-track{background:transparent}
.ml-hscroll::-webkit-scrollbar-thumb{background:transparent;border-radius:4px;border:2px solid transparent;background-clip:content-box}
.ml-hscroll:hover::-webkit-scrollbar-thumb,.ml-hscroll:focus::-webkit-scrollbar-thumb{background:var(--dsw-alias-border-l2)}
.ml-hscroll::-webkit-scrollbar-thumb:hover{background:var(--dsw-alias-label-secondary)}
.ml-hwrap::before,.ml-hwrap::after{content:'';position:absolute;top:0;bottom:0;width:26px;pointer-events:none;z-index:2;opacity:0;transition:opacity .18s}
.ml-hwrap::before{left:0;background:linear-gradient(90deg,var(--dsw-alias-bg-base),transparent)}
.ml-hwrap::after{right:0;background:linear-gradient(270deg,var(--dsw-alias-bg-base),transparent)}
.ml-hwrap:has([data-f="l"])::before,.ml-hwrap:has([data-f="b"])::before,
.ml-hwrap:has([data-f="r"])::after,.ml-hwrap:has([data-f="b"])::after{opacity:1}
.ml-hwrap .ml-hscroll{scrollbar-color:var(--dsw-alias-border-l2) transparent}
.ml-hwrap:not(:hover):not(:focus-within) .ml-hscroll{scrollbar-color:transparent transparent}
.ml-idx{flex:none;display:flex;flex-direction:column;gap:2px;padding:6px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);min-width:118px}
.ml-idx b{font-size:12px;font-weight:500;color:var(--dsw-alias-label-secondary)}
.ml-idx span{font-size:14px;font-weight:600}
.ml-idx i{font-size:11px;font-style:normal}
.ml-main{display:grid;grid-template-columns:300px minmax(0,1fr) 300px;gap:10px;padding:10px 14px;flex:1;min-height:0}
.ml-root:not([data-wide="1"]) .ml-main{grid-template-columns:minmax(0,1fr);display:flex;flex-direction:column;overflow-y:auto}
.ml-root:not([data-wide="1"]) .ml-panelcol[data-col="chart"]{min-height:340px;flex:none}
.ml-panelcol{display:flex;flex-direction:column;gap:10px;min-height:0;min-width:0}
.ml-panel{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);display:flex;flex-direction:column;min-height:0;min-width:0;overflow:hidden}
.ml-panel>header{display:flex;gap:6px;align-items:center;padding:8px 10px;border-bottom:1px solid var(--dsw-alias-border-l1);flex-wrap:wrap;font-size:12px;color:var(--dsw-alias-label-secondary)}
.ml-panel>header .ml-title{font-weight:600;color:var(--dsw-alias-label-primary);margin-right:auto}
.ml-rows{overflow-y:auto;flex:1;min-height:0}
.ml-row{display:flex;align-items:center;gap:10px;position:relative;padding:8px 10px;border-bottom:1px solid var(--dsw-alias-border-l1);cursor:pointer;background:none;border-left:0;border-right:0;border-top:0;color:inherit;font:inherit;text-align:left;width:100%}
.ml-row .nm{flex:1 1 auto;min-width:0;display:flex;flex-direction:column}
.ml-row .nm b{font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ml-row .nm code{font-size:11px;color:var(--dsw-alias-label-secondary)}
.ml-row .nm .ad{font-size:11px;line-height:1.3}
.ml-row:hover,.ml-row[aria-current="true"]{background:var(--dsw-alias-bg-layer-2)}
.ml-row .qt{flex:none;display:grid;grid-template-columns:auto auto;gap:0 10px;justify-items:end;align-items:baseline}
.ml-row .qt b{font-size:15px;font-weight:600}
.ml-row .qt .rm{font-size:11px;white-space:nowrap}
.ml-row .rm-x{position:absolute;top:6px;right:8px;visibility:hidden;z-index:2}
.ml-row:hover .rm-x{visibility:visible}
.ml-row .ml-spark{flex:none}
.ml-spark{width:64px;height:26px;display:block;overflow:visible}
.ml-spark.empty{visibility:hidden}
.ml-chart{flex:1;min-height:260px;position:relative;display:flex;flex-direction:column}
.ml-canvas-wrap{flex:1;position:relative;min-height:0}
.ml-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:crosshair}
.ml-tip{position:absolute;pointer-events:none;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:6px 8px;font-size:11px;display:grid;grid-template-columns:auto auto;gap:1px 12px;z-index:5;white-space:nowrap}
.ml-legend{position:absolute;top:6px;left:10px;right:78px;display:flex;flex-wrap:wrap;gap:2px 10px;font-size:11px;line-height:15px;color:var(--dsw-alias-label-secondary);pointer-events:none;white-space:nowrap;text-shadow:0 1px 0 var(--dsw-alias-bg-layer-1),0 -1px 0 var(--dsw-alias-bg-layer-1)}
.ml-legend b{color:var(--dsw-alias-label-primary)}
.ml-zoomreset{position:absolute;top:6px;right:74px;z-index:6}
.ml-bar{display:flex;align-items:center;gap:10px;height:30px;padding:0 12px;background:var(--dsw-alias-bg-layer-2);border-top:1px solid var(--dsw-alias-border-l1);font-size:12px;overflow:hidden}
.ml-bar .bell{animation:mlring 2.6s ease-in-out infinite}
.ml-bar:hover .bell,.ml-bar:hover .line{animation-play-state:paused}
@keyframes mlring{0%,58%,100%{transform:rotate(0)}63%{transform:rotate(14deg)}70%{transform:rotate(-11deg)}78%{transform:rotate(7deg)}86%{transform:rotate(-4deg)}}
.ml-bar .line{display:flex;align-items:center;gap:8px;background:none;border:0;cursor:pointer;color:var(--dsw-alias-label-primary);padding:2px 8px;border-radius:6px;white-space:nowrap;animation:mlslide .35s ease-out}
.ml-bar .line:hover{background:var(--dsw-alias-bg-overlay)}
@keyframes mlslide{from{transform:translateY(70%);opacity:0}to{transform:none;opacity:1}}
.ml-bar .line code{color:var(--dsw-alias-label-secondary)}
.ml-bar .dismiss{margin-left:auto;flex:none}
.ml-alertlist{list-style:none;margin:0;padding:4px 10px;display:flex;flex-direction:column;gap:4px}
.ml-alertlist li{display:flex;align-items:center;gap:8px;font-size:12px}
.ml-alertlist .sym{font-weight:600}
.ml-alertlist code{color:var(--dsw-alias-label-secondary)}
.ml-alertlist .rule{margin-left:auto;color:var(--dsw-alias-label-secondary)}
.ml-alertform{display:flex;flex-wrap:wrap;gap:8px;align-items:end;padding:8px 10px;border-top:1px dashed var(--dsw-alias-border-l1)}
.ml-alertform label{display:flex;flex-direction:column;gap:2px;font-size:11px;color:var(--dsw-alias-label-secondary)}
.ml-alertform input,.ml-alertform select{font-size:12px;padding:3px 6px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:6px;width:88px}
.ml-alertform select{width:auto}
.ml-alertform .acts{display:flex;gap:6px;margin-left:auto}
.ml-metrics{display:grid;grid-template-columns:repeat(auto-fill,minmax(86px,1fr));gap:6px 8px;padding:10px}
.ml-row.pinned{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 7%,transparent)}
.row-pin{opacity:0;margin-left:6px;cursor:pointer;font-size:10px;filter:grayscale(1)}
.ml-row:hover .row-pin{opacity:.55}
.row-pin.on{opacity:.9;filter:none}
@keyframes mltick{0%{background:color-mix(in srgb,currentColor 26%,transparent)}100%{background:transparent}}
.tick-up,.tick-down{animation:mltick .9s ease-out;border-radius:4px}
.ml-metric{flex:none;min-width:86px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:6px 9px;background:var(--dsw-alias-bg-layer-2)}
.ml-metric b{display:block;font-size:11px;font-weight:400;color:var(--dsw-alias-label-secondary)}
.ml-metric span{font-size:14px;font-weight:600}
.ml-chip{font-size:11px;padding:3px 8px;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);background:none;color:var(--dsw-alias-label-secondary);cursor:pointer}
.ml-chip[aria-pressed="true"]{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}
.ml-note{padding:4px 14px 8px;font-size:11px;color:var(--dsw-alias-label-secondary)}
.ml-back{display:none}
.ml-root:not([data-wide="1"]) .ml-panelcol[data-col="chart"].ml-hidden-narrow,.ml-root:not([data-wide="1"]) .ml-panelcol[data-col="detail"].ml-hidden-narrow{display:none}
.ml-root:not([data-wide="1"]) .ml-back{display:inline-flex}
.ml-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px}
.ml-dialog{width:min(480px,100%);border:1px solid var(--dsw-alias-border-l2);border-radius:14px;background:var(--dsw-alias-bg-overlay);padding:14px;display:flex;flex-direction:column;gap:10px}
.ml-dialog textarea{min-height:160px;resize:vertical;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:inherit;font:inherit;padding:8px}
.ml-dialog footer{display:flex;justify-content:flex-end;gap:8px}
.ml-pad{padding:10px 12px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.ml-errorbar{padding:8px 14px;font-size:12px;color:var(--dsw-alias-state-error-primary);border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.ml-fintable{width:max-content;min-width:100%;border-collapse:collapse;font-size:12px}
.ml-hscroll > *{flex:none;min-width:100%}
.ml-hwrap.ml-finrow{border-bottom:0}
.ml-root ::-webkit-scrollbar{width:9px;height:9px}
.ml-root ::-webkit-scrollbar-track{background:transparent}
.ml-root ::-webkit-scrollbar-thumb{background:var(--dsw-alias-border-l1);border-radius:5px;border:2px solid transparent;background-clip:content-box}
.ml-root ::-webkit-scrollbar-thumb:hover{background:var(--dsw-alias-border-l2)}
.ml-rows{scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l1) transparent}
.ml-rows:hover{scrollbar-color:var(--dsw-alias-border-l2) transparent}
.ml-fintable th{text-align:left;font-weight:400;color:var(--dsw-alias-label-secondary);padding:6px 8px;border-bottom:1px solid var(--dsw-alias-border-l1);white-space:nowrap}
.ml-fintable td{padding:6px 8px;border-bottom:1px solid var(--dsw-alias-border-l1);white-space:nowrap}
.ml-fintable tr:last-child td{border-bottom:0}
.ml-news{overflow-y:auto;flex:1;min-height:0}
.ml-news-item{display:flex;gap:8px;align-items:baseline;padding:7px 10px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.ml-news-item:last-child{border-bottom:0}
.ml-news-item a{color:inherit;text-decoration:none;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ml-news-item a:hover{color:var(--dsw-alias-brand-primary)}
.ml-news-item time{margin-left:auto;font-size:11px;color:var(--dsw-alias-label-secondary);flex:none}
	`.trim();

		// ---------- helpers ----------
		function fmtSigned(value, digits = 2) {
			if (value === null || value === void 0 || !Number.isFinite(value)) return '—';
			return `${value > 0 ? '+' : ''}${value.toFixed(digits)}`;
		}
		function fmtNum(value, digits = 2) {
			if (value === null || value === void 0 || !Number.isFinite(value)) return '—';
			return value.toFixed(digits);
		}
		function fmtBig(value) {
			if (value === null || value === void 0 || !Number.isFinite(value)) return '—';
			const abs = Math.abs(value);
			if (abs >= 1e8) return `${(value / 1e8).toFixed(2)}亿`;
			if (abs >= 1e4) return `${(value / 1e4).toFixed(2)}万`;
			return value.toFixed(0);
		}
		function dirClass(value) {
			if (value === null || value === void 0 || !Number.isFinite(value)) return 'ml-flat';
			return value > 0 ? 'up' : value < 0 ? 'down' : 'ml-flat';
		}
		function loadLs(key, fallback) {
			try {
				const raw = window.localStorage.getItem(key);
				return raw === null ? fallback : JSON.parse(raw);
			} catch {
				return fallback;
			}
		}
		function saveLs(key, value) {
			try {
				window.localStorage.setItem(key, JSON.stringify(value));
			} catch { /* storage may be unavailable; the board still works */ }
		}
		function marketOf(symbol) {
			if (symbol.startsWith('sh') || symbol.startsWith('sz') || symbol.startsWith('bj')) return 'cn';
			if (symbol.startsWith('hk')) return 'hk';
			return 'us';
		}
		const BADGE = { cn: 'A', hk: 'HK', us: 'US' };

		async function api(path, params, signal, write) {
			const url = new URL(BASE + '/' + path, window.location.origin);
			for (const [key, value] of Object.entries(params)) if (value !== void 0 && value !== null) url.searchParams.set(key, String(value));
			const init = {
				method: write?.method ?? 'GET',
				signal,
				cache: 'no-store',
				credentials: 'same-origin',
			};
			if (write?.body !== void 0) {
				init.headers = { 'content-type': 'application/json' };
				init.body = JSON.stringify(write.body);
			}
			const response = await window.fetch(url, init);
			const text = await response.text().catch(() => '');
			let body = null;
			try {
				body = JSON.parse(text);
			} catch { /* keep raw for the diagnostic message */ }
			if (!response.ok || body === null) {
				const detail = body?.error?.message ?? text.slice(0, 90).replace(/\s+/g, ' ');
				const error = new Error(`HTTP ${String(response.status)} ${detail}`);
				error.status = response.status;
				throw error;
			}
			return body;
		}

		// ---------- diagnostic reporting (batched POST /market-lens/diag) ----------
		const CLIENT_REV = '0.6.1';
		const diagQueue = [];
		let diagTimer = 0;
		function diagSend(rows) {
			try {
				const body = JSON.stringify({ rows });
				if (window.document.hidden && navigator.sendBeacon !== void 0) {
					navigator.sendBeacon(BASE + '/diag', new Blob([body], { type: 'application/json' }));
					return;
				}
				void window.fetch(BASE + '/diag', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body,
					credentials: 'same-origin',
					keepalive: true,
				}).catch(() => void 0);
			} catch { /* the log must never break the board */ }
		}
		function flushDiag() {
			window.clearTimeout(diagTimer);
			diagTimer = 0;
			const rows = diagQueue.splice(0, 60);
			if (rows.length > 0) diagSend(rows);
		}
		function diag(ev, fields) {
			diagQueue.push({
				ev,
				...fields,
			});
			if (diagQueue.length >= 40 || window.document.hidden === true) {
				flushDiag();
				return;
			}
			if (diagTimer === 0) diagTimer = window.setTimeout(flushDiag, 1200);
		}
		// A hidden page can be torn down any moment; never leave queued rows behind.
		window.document.addEventListener('visibilitychange', () => {
			if (window.document.hidden === true) flushDiag();
		});

		// ---------- small components ----------
		const PALETTES = {
			redup: { up: '#e04f4f', down: '#2fa36b', hollow: true },
			greenup: { up: '#2fa36b', down: '#e04f4f', hollow: true },
			blueorange: { up: '#4f8fe0', down: '#e09b3c', hollow: false },
			goldviolet: { up: '#9a5ce8', down: '#c9a227', hollow: false },
			tealrose: { up: '#1f9e8e', down: '#d9527f', hollow: false },
		};

		function PanelIcon({ size, active }) {
			const s = size ?? 18;
			const iconRef = React.useRef(null);
			// The status strip asks the whole client to open the board; the sidebar row is the one real entry point.
			React.useEffect(() => {
				const onActivate = () => {
					let node = iconRef.current?.parentElement;
					while (node !== null && node !== void 0 && node.matches?.('button, [role="button"], a') !== true) node = node.parentElement;
					if (node !== null && node !== void 0) node.click();
				};
				window.addEventListener('market-lens:activate', onActivate);
				return () => window.removeEventListener('market-lens:activate', onActivate);
			}, []);
			return h('svg', {
				ref: iconRef,
				viewBox: '0 0 64 64', width: s, height: s, 'aria-hidden': true,
				style: { display: 'block', color: active ? 'var(--dsw-alias-brand-primary)' : 'currentColor' },
			},
				h('circle', { cx: 30, cy: 30, r: 21, fill: 'none', stroke: 'currentColor', strokeWidth: 5 }),
				h('line', { x1: 45.5, y1: 45.5, x2: 58, y2: 58, stroke: 'currentColor', strokeWidth: 7, strokeLinecap: 'round' }),
				h('line', { x1: 21, y1: 22, x2: 21, y2: 38, stroke: 'var(--dsw-alias-label-primary)', strokeWidth: 3 }),
				h('rect', { x: 18, y: 26, width: 6, height: 8, rx: 1.5, fill: 'var(--dsw-alias-label-primary)' }),
				h('line', { x1: 30, y1: 22, x2: 30, y2: 38, stroke: 'var(--dsw-alias-brand-primary)', strokeWidth: 3 }),
				h('rect', { x: 27, y: 25, width: 6, height: 10, rx: 1.5, fill: 'var(--dsw-alias-brand-primary)' }),
			);
		}

		/**
		 * Horizontal scroll region: no visible bar until hovered/focused, edge fades
		 * hint what lies beyond, touch drags natively, arrow keys work (tabIndex).
		 */
		function HScroll({ children, className, label }) {
			const ref = React.useRef(null);
			const [fade, setFade] = React.useState('n');
			const sync = () => {
				const el = ref.current;
				if (el === null) return;
				const left = el.scrollLeft > 4;
				const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
				setFade(left && right ? 'b' : left ? 'l' : right ? 'r' : 'n');
			};
			React.useEffect(() => {
				sync();
				const el = ref.current;
				if (el === null || window.ResizeObserver === void 0) return void 0;
				const ro = new window.ResizeObserver(sync);
				ro.observe(el);
				return () => ro.disconnect();
			}, [children]);
			return h('div', { className: `ml-hwrap ${className ?? ''}` },
				h('div', {
					className: 'ml-hscroll', ref, 'data-f': fade, tabIndex: 0, role: 'group', 'aria-label': label,
					onScroll: sync,
				}, children));
		}

		function QuoteCell({ value, pct, digits }) {
			return h('span', { className: dirClass(pct ?? value) }, fmtNum(value, digits ?? 2));
		}

		function IndexBar({ indexBar, quotes }) {
			return h(HScroll, { label: 'indices' },
			h('section', { className: 'ml-indexbar', 'aria-label': 'indices' },
				indexBar.map((symbol) => {
					const quote = quotes.get(symbol);
					const pct = quote?.changePct ?? null;
					return h('div', { className: 'ml-idx', key: symbol },
						h('b', null, quote?.name ?? symbol),
						quote === void 0
							? h('span', { className: 'ml-flat' }, '—')
							: h(React.Fragment, null,
								h('span', { className: dirClass(pct) }, fmtNum(quote.price, quote.price > 1000 ? 0 : 2)),
								h('i', { className: dirClass(pct) }, `${fmtSigned(pct)}%`)),
					);
				})));
		}

		// sparkline feed: module-level cache so filters/sorting never refetch within the window
		const sparkCache = new Map(); // symbol -> { at, closes }
		function Spark({ symbol, pct }) {
			const [closes, setCloses] = React.useState(() => {
				const hit = sparkCache.get(symbol);
				return hit !== void 0 && hit.fails === void 0 && Date.now() - hit.at < 300000 ? hit.closes : null;
			});
			React.useEffect(() => {
				const hit = sparkCache.get(symbol);
				if (hit !== void 0 && Date.now() - hit.at < 300000) {
					setCloses(hit.closes);
					return void 0;
				}
				let dead = false;
				api('kline', { symbol, period: 'day', count: 22 }).then((body) => {
					const line = (body.bars ?? []).slice(-22).map((bar) => bar.c).filter((v) => v !== null);
					sparkCache.set(symbol, { at: Date.now(), closes: line });
					if (!dead) setCloses(line);
				}, () => {
					sparkCache.set(symbol, { at: Date.now(), closes: null }); // cold path, retry after TTL
					if (!dead) setCloses(null);
				});
				return () => {
					dead = true;
				};
			}, [symbol]);
			if (closes === null || closes.length < 3) return h('svg', { className: 'ml-spark empty', 'aria-hidden': true });
			const w = 64;
			const ht = 26;
			let lo = Infinity;
			let hi = -Infinity;
			for (const v of closes) {
				if (v < lo) lo = v;
				if (v > hi) hi = v;
			}
			const span = hi === lo ? 1 : hi - lo;
			const px = (i) => i / (closes.length - 1) * w;
			const py = (v) => ht - 3 - (v - lo) / span * (ht - 6);
			const line = closes.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ');
			const rising = closes[closes.length - 1] >= closes[0];
			const stroke = rising ? 'var(--ml-up)' : 'var(--ml-down)';
			const change5 = (closes[closes.length - 1] - closes[closes.length - 6]) / closes[closes.length - 6] * 100;
			return h('svg', {
				className: 'ml-spark', 'aria-hidden': true, viewBox: `0 0 ${String(w)} ${String(ht)}`,
				title: `${fmtSigned(change5)}% · 5D`,
			},
				h('path', { d: `M ${line.replace(/ /g, ' L ')} L ${String(w)},${String(ht)} L 0,${String(ht)} Z`, fill: stroke, opacity: 0.14, stroke: 'none' }),
				h('polyline', { points: line, fill: 'none', stroke, strokeWidth: 1.3, strokeLinejoin: 'round', strokeLinecap: 'round' }),
				h('circle', { cx: px(closes.length - 1).toFixed(1), cy: py(closes[closes.length - 1]).toFixed(1), r: 1.9, fill: stroke }),
			);
		}

		function WatchRow({ instrument, quote, active, pinned, onPin, onSelect, onRemove, t }) {
			const pct = quote?.changePct ?? null;
			const advice = pct === null ? '' : pct >= 3 ? 'advice.surge' : pct >= 1 ? 'advice.rise' : pct > -1 ? 'advice.flat' : pct > -3 ? 'advice.drop' : 'advice.slump';
			const prev = React.useRef(quote?.price);
			const moved = quote?.price !== void 0 && prev.current !== void 0 && quote.price !== prev.current;
			const tick = moved ? (quote.price > prev.current ? ' tick-up' : ' tick-down') : '';
			React.useEffect(() => { prev.current = quote?.price; }, [quote?.price]);
			return h('button', {
				type: 'button', className: 'ml-row' + (pinned === true ? ' pinned' : ''), 'aria-current': active ? true : void 0,
				onClick: () => onSelect(instrument.symbol),
			},
				h('span', { className: 'nm' },
					h('b', null, quote?.name ?? instrument.name ?? instrument.symbol),
					h('code', null, instrument.symbol),
					onPin === void 0 ? null : h('span', {
						className: 'row-pin' + (pinned === true ? ' on' : ''), role: 'button', tabIndex: -1,
						title: pinned === true ? t('list.unpin') : t('list.pin'),
						onClick: (event) => {
							event.stopPropagation();
							onPin(instrument.symbol);
						},
					}, pinned === true ? '📌' : '📍'),
					advice === '' ? null : h('span', { className: `ad ${dirClass(Math.abs(pct) < 1 ? 0 : pct)}` }, t(advice)),
				),
			h(Spark, { symbol: instrument.symbol, pct }),
				h('span', { className: 'qt' },
					h('b', { key: String(quote?.price), className: dirClass(pct) + tick }, fmtNum(quote?.price)),
					h('span', { className: `rm ${dirClass(pct)}`, title: quote?.stale === true ? t('list.staleHint') : void 0 }, quote === void 0 ? t('toolbar.error') : `${fmtSigned(pct)}% · ${fmtSigned(quote.change)} · ${fmtBig(quote.amount)}`),
					onRemove === void 0 ? null : h('span', {
						className: 'rm-x', role: 'button', tabIndex: -1,
						title: t('list.remove'),
						onClick: (event) => {
							event.stopPropagation();
							onRemove(instrument.symbol);
						},
					}, '×'),
				),
			);
		}

		function Metrics({ quote, t }) {
			const prev = React.useRef(quote.price);
			const moved = quote.price !== void 0 && quote.price !== null && prev.current !== void 0 && prev.current !== null && quote.price !== prev.current;
			const tick = moved ? (quote.price > prev.current ? ' tick-up' : ' tick-down') : '';
			React.useEffect(() => { prev.current = quote.price; }, [quote.price]);
			// 开/高/低 relative to prev close: above = up color, below = down color, level = neutral
			const cmpPrev = (value) => (value === null || quote.prevClose === null || quote.prevClose === void 0)
				? null
				: value > quote.prevClose ? 1 : value < quote.prevClose ? -1 : 0;
			const cells = [
				['metric.price', quote.price === null ? null : fmtNum(quote.price), quote.changePct, tick],
				['metric.change', quote.changePct === null ? null : `${fmtSigned(quote.changePct)}%`, quote.changePct, ''],
				['metric.open', quote.open === null ? null : fmtNum(quote.open), cmpPrev(quote.open), ''],
				['metric.prev', quote.prevClose === null ? null : fmtNum(quote.prevClose), null, ''],
				['metric.high', quote.high === null ? null : fmtNum(quote.high), cmpPrev(quote.high), ''],
				['metric.low', quote.low === null ? null : fmtNum(quote.low), cmpPrev(quote.low), ''],
				['metric.amplitude', quote.amplitude === null ? null : `${fmtNum(quote.amplitude)}%`, null, ''],
				['metric.volume', quote.volume === null ? null : fmtBig(quote.volume), null, ''],
				['metric.amount', quote.amount === null ? null : fmtBig(quote.amount), null, ''],
				['metric.turnover', quote.turnoverRate === null ? null : `${fmtNum(quote.turnoverRate)}%`, null, ''],
				['metric.volRatio', quote.volRatio === null ? null : fmtNum(quote.volRatio), null, ''],
				['metric.pe', quote.pe === null ? null : fmtNum(quote.pe), null, ''],
				['metric.pb', quote.pb === null ? null : fmtNum(quote.pb), null, ''],
				['metric.marketCap', quote.marketCap === null ? null : fmtBig(quote.marketCap), null, ''],
			];
			return h('div', { className: 'ml-metrics' },
				cells.map(([key, text, pct, tickClass]) => h('div', { className: 'ml-metric', key },
					h('b', null, t(key)),
					key === 'metric.price'
						? h('span', { key: String(quote.price), className: `${pct === null || pct === void 0 ? '' : dirClass(pct)}${tickClass}` }, text ?? '—')
						: h('span', { className: pct === null || pct === void 0 ? '' : dirClass(pct) }, text ?? '—'))));
		}

		// ---------- K-line canvas chart ----------
		function movingAverage(bars, span) {
			const out = new Array(bars.length).fill(null);
			const queue = [];
			let sum = 0;
			let counted = 0;
			for (let index = 0; index < bars.length; index++) {
				const close = bars[index].c;
				queue.push(close);
				if (close !== null) {
					sum += close;
					counted++;
				}
				if (queue.length > span) {
					const dropped = queue.shift();
					if (dropped !== null) {
						sum -= dropped;
						counted--;
					}
				}
				if (queue.length === span && counted === span) out[index] = sum / span;
			}
			return out;
		}

		function KLineChart({ data, showMa, hollow, t }) {
			const wrapRef = React.useRef(null);
			const canvasRef = React.useRef(null);
			const [view, setView] = React.useState({ count: 90, offset: 0 }); // offset = bars hidden on the right
			const [cross, setCross] = React.useState(null); // crosshair: global bar index + pixel position
			const [sel, setSel] = React.useState(null); // box-zoom selection in canvas pixels
			const [picked, setPicked] = React.useState(null); // bar clicked for the day-detail strip
			const geo = React.useRef({ start: 0, count: 1, step: 1, plotWidth: 1, priceHeight: 1, low: 0, high: 1 });
			const bars = data?.bars ?? [];
			const total = bars.length;
			const maSpans = [5, 10, 20, 60];
			const maColors = ['#e6a23c', '#409eff', '#9a5ce8', '#d95c8a'];
			const maSeries = React.useMemo(
				() => maSpans.map((span) => ({ span, values: movingAverage(bars, span) })),
				[data],
			);

			React.useEffect(() => {
				setView((current) => ({ count: Math.min(Math.max(20, current.count), Math.max(20, total)), offset: 0 }));
				setCross(null);
				setSel(null);
				setPicked(null);
			}, [data]);

			const draw = React.useCallback(() => {
				const canvas = canvasRef.current;
				const wrap = wrapRef.current;
				if (canvas === null || wrap === null || total === 0) return;
				const ratio = window.devicePixelRatio || 1;
				const width = wrap.clientWidth;
				const height = wrap.clientHeight;
				if (width < 40 || height < 40) return;
				canvas.width = Math.round(width * ratio);
				canvas.height = Math.round(height * ratio);
				const ctx2 = canvas.getContext('2d');
				ctx2.scale(ratio, ratio);
				const styles = getComputedStyle(wrap);
				const token = (name, fallback) => (styles.getPropertyValue(name) || '').trim() || fallback;
				const colorUp = token('--ml-up', '#e04f4f');
				const colorDown = token('--ml-down', '#2fa36b');
				const colorText = token('--dsw-alias-label-secondary', '#8a8f98');
				const colorGrid = token('--dsw-alias-border-l1', '#2a2a2e');
				const colorBg = token('--dsw-alias-bg-layer-1', '#17171a');
				ctx2.fillStyle = colorBg;
				ctx2.fillRect(0, 0, width, height);
				const count = Math.min(Math.max(20, Math.round(view.count)), total);
				const offset = Math.max(0, Math.min(Math.round(view.offset), total - count));
				const start = total - count - offset;
				const visible = bars.slice(start, start + count);
				const priceHeight = Math.max(80, height * 0.72);
				const volumeTop = priceHeight + 14;
				const axisWidth = 64;
				const plotWidth = Math.max(40, width - axisWidth - 8);
				let low = Infinity;
				let high = -Infinity;
				for (const bar of visible) {
					if (bar.l !== null && bar.l < low) low = bar.l;
					if (bar.h !== null && bar.h > high) high = bar.h;
				}
				const mas = showMa ? maSeries.map((m) => ({ span: m.span, values: m.values.slice(start, start + count) })) : [];
				for (const ma of mas) for (const value of ma.values) if (value !== null) {
					if (value < low) low = value;
					if (value > high) high = value;
				}
				if (!Number.isFinite(low) || !Number.isFinite(high) || low === high) {
					low = (low || 1) * 0.99;
					high = (high || 1) * 1.01;
				}
				const pad = (high - low) * 0.04;
				low -= pad;
				high += pad;
				const y = (value) => 8 + (high - value) / (high - low) * (priceHeight - 16);
				const step = plotWidth / count;
				const x = (index) => index * step + step / 2;
				ctx2.strokeStyle = colorGrid;
				ctx2.fillStyle = colorText;
				ctx2.font = '10px system-ui, sans-serif';
				ctx2.lineWidth = 1;
				for (let line = 0; line <= 4; line++) {
					const value = low + (high - low) * line / 4;
					const yy = Math.round(y(value)) + 0.5;
					ctx2.beginPath();
					ctx2.moveTo(0, yy);
					ctx2.lineTo(plotWidth, yy);
					ctx2.stroke();
					ctx2.fillText(value.toFixed(value > 1000 ? 0 : 2), plotWidth + 6, yy + 3);
				}
				let maxVolume = 0;
				for (const bar of visible) if (bar.v !== null && bar.v > maxVolume) maxVolume = bar.v;
				// volume pane: subtle ground + divider line, like pro terminals
				ctx2.globalAlpha = 0.16;
				ctx2.fillStyle = colorGrid;
				ctx2.fillRect(0, volumeTop - 8, plotWidth, height - volumeTop + 8);
				ctx2.globalAlpha = 1;
				ctx2.strokeStyle = colorGrid;
				ctx2.beginPath();
				ctx2.moveTo(0, Math.round(priceHeight + 7) + 0.5);
				ctx2.lineTo(plotWidth, Math.round(priceHeight + 7) + 0.5);
				ctx2.stroke();
				for (let index = 0; index < visible.length; index++) {
					const bar = visible[index];
					if (bar.c === null) continue;
					const up = bar.o !== null && bar.c >= bar.o;
					const color = up ? colorUp : colorDown;
					ctx2.strokeStyle = color;
					ctx2.fillStyle = color;
					const cx = Math.round(x(index));
					if (bar.h !== null && bar.l !== null) {
						ctx2.beginPath();
						ctx2.moveTo(cx + 0.5, y(bar.h));
						ctx2.lineTo(cx + 0.5, y(bar.l));
						ctx2.stroke();
					}
					const bodyTop = y(Math.max(bar.o ?? bar.c, bar.c));
					const bodyHeight = Math.max(1, Math.abs(y(bar.o ?? bar.c) - y(bar.c)));
					const bodyWidth = Math.max(1, Math.min(step * 0.62, 13));
					if (up && hollow === true) {
						// hollow bullish candle (classic A-share terminal look): bg fill + outline
						ctx2.fillStyle = colorBg;
						ctx2.fillRect(cx - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
						ctx2.fillStyle = color;
						ctx2.lineWidth = 1;
						ctx2.strokeRect(cx - bodyWidth / 2 + 0.5, bodyTop + 0.5, Math.max(1, bodyWidth - 1), Math.max(1, bodyHeight - 1));
					} else ctx2.fillRect(cx - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
					if (bar.v !== null && maxVolume > 0) {
						const volumeHeight = bar.v / maxVolume * (height - volumeTop - 6);
						ctx2.globalAlpha = 0.55;
						ctx2.fillRect(cx - bodyWidth / 2, height - volumeHeight, bodyWidth, volumeHeight);
						ctx2.globalAlpha = 1;
					}
				}
				const maColorsLocal = ['#e6a23c', '#409eff', '#9a5ce8', '#d95c8a'];
				mas.forEach((ma, lineIndex) => {
					ctx2.strokeStyle = maColorsLocal[lineIndex % maColorsLocal.length];
					ctx2.lineWidth = 1.4;
					ctx2.beginPath();
					let started = false;
					ma.values.forEach((value, index) => {
						if (value === null) {
							started = false;
							return;
						}
						const px = x(index);
						const py = y(value);
						if (!started) {
							ctx2.moveTo(px, py);
							started = true;
						} else ctx2.lineTo(px, py);
					});
					ctx2.stroke();
				});
				ctx2.fillStyle = colorText;
				const first = visible[0]?.t ?? '';
				const lastBar = visible[visible.length - 1]?.t ?? '';
				ctx2.fillText(String(first), 4, height - 4);
				ctx2.fillText(String(lastBar), Math.max(4, plotWidth - 84), height - 4);
				// selected bar: translucent column so the picked day stays findable after zoom
				if (picked !== null && picked >= start && picked < start + count) {
					ctx2.fillStyle = colorText;
					ctx2.globalAlpha = 0.1;
					ctx2.fillRect(picked - start === 0 ? 0 : x(picked - start) - step / 2, 0, step, height - 16);
					ctx2.globalAlpha = 1;
				}
				// last-price line: dashed, tagged on the axis, colored by direction
				const lastV = visible[visible.length - 1];
				if (lastV?.c !== null && lastV?.c !== void 0) {
					const prevC = visible[visible.length - 2]?.c ?? lastV.prevClose ?? lastV.c;
					const lastColor = lastV.c >= prevC ? colorUp : colorDown;
					const ly = Math.round(y(lastV.c)) + 0.5;
					ctx2.setLineDash([5, 4]);
					ctx2.strokeStyle = lastColor;
					ctx2.lineWidth = 1;
					ctx2.beginPath();
					ctx2.moveTo(0, ly);
					ctx2.lineTo(plotWidth, ly);
					ctx2.stroke();
					ctx2.setLineDash([]);
					ctx2.fillStyle = lastColor;
					ctx2.fillRect(plotWidth + 2, ly - 8.5, axisWidth - 4, 17);
					ctx2.fillStyle = '#ffffff';
					ctx2.fillText(lastV.c.toFixed(lastV.c > 1000 ? 0 : 2), plotWidth + 6, ly + 3);
				}
				geo.current = {
					start,
					count,
					step,
					plotWidth,
					priceHeight,
					low,
					high,
				};
				if (sel !== null) {
					const sx = Math.min(sel.x0, sel.x1);
					const sw = Math.abs(sel.x1 - sel.x0);
					ctx2.fillStyle = 'rgba(64,158,255,0.15)';
					ctx2.fillRect(sx, 0, sw, priceHeight);
					ctx2.strokeStyle = 'rgba(64,158,255,0.65)';
					ctx2.strokeRect(sx + 0.5, 0.5, sw, priceHeight - 1);
				}
				if (cross !== null && cross.x <= plotWidth) {
					ctx2.setLineDash([3, 3]);
					ctx2.strokeStyle = colorText;
					ctx2.lineWidth = 1;
					const cxh = Math.round(cross.x) + 0.5;
					ctx2.beginPath();
					ctx2.moveTo(cxh, 0);
					ctx2.lineTo(cxh, height - 16);
					ctx2.stroke();
					if (cross.y < priceHeight) {
						const cyh = Math.round(cross.y) + 0.5;
						ctx2.beginPath();
						ctx2.moveTo(0, cyh);
						ctx2.lineTo(plotWidth, cyh);
						ctx2.stroke();
					}
					ctx2.setLineDash([]);
					ctx2.font = '10px system-ui, sans-serif';
					if (cross.y < priceHeight) {
						const price = high - (cross.y - 8) / (priceHeight - 16) * (high - low);
						const label = price.toFixed(price > 1000 ? 0 : 2);
						ctx2.fillStyle = token('--dsw-alias-bg-overlay', '#2a2a2e');
						ctx2.fillRect(plotWidth + 2, cross.y - 8, axisWidth - 4, 16);
						ctx2.strokeStyle = token('--dsw-alias-border-l2', '#3a3a3f');
						ctx2.strokeRect(plotWidth + 2.5, cross.y - 7.5, axisWidth - 5, 15);
						ctx2.fillStyle = token('--dsw-alias-label-primary', '#e8e8ea');
						ctx2.fillText(label, plotWidth + 6, cross.y + 3);
					}
					const crossBar = bars[cross.gi];
					if (crossBar !== void 0) {
						const dlabel = String(crossBar.t);
						const dw = Math.min(84, Math.max(52, dlabel.length * 7 + 8));
						const dx = Math.max(0, Math.min(plotWidth - dw, cross.x - dw / 2));
						ctx2.fillStyle = token('--dsw-alias-bg-overlay', '#2a2a2e');
						ctx2.fillRect(dx, height - 14, dw, 13);
						ctx2.strokeStyle = token('--dsw-alias-border-l2', '#3a3a3f');
						ctx2.strokeRect(dx + 0.5, height - 13.5, dw - 1, 12);
						ctx2.fillStyle = token('--dsw-alias-label-primary', '#e8e8ea');
						ctx2.fillText(dlabel, dx + 4, height - 4);
					}
				}
			}, [bars, view, total, showMa, cross, sel, picked, hollow, maSeries]);

			React.useEffect(() => {
				const wrap = wrapRef.current;
				if (wrap === null) return void 0;
				const observer = new ResizeObserver(() => draw());
				observer.observe(wrap);
				draw();
				return () => observer.disconnect();
			}, [draw]);

			const pointers = React.useRef(new Map());
			const pinch = React.useRef(null);
			const pan = React.useRef(null);
			const pressTimer = React.useRef(void 0);

			function localXY(event) {
				const rect = event.currentTarget.getBoundingClientRect();
				return {
					x: event.clientX - rect.left,
					y: event.clientY - rect.top,
				};
			}
			function barAtPixel(px) {
				const g = geo.current;
				if (g === null) return 0;
				return g.start + Math.max(0, Math.min(g.count - 1, Math.floor(px / g.step)));
			}
			function setCrossAt(event) {
				const { x, y } = localXY(event);
				setCross({ gi: barAtPixel(x), x, y });
			}
			function panBy(clientX) {
				const p = pan.current;
				if (p === null || geo.current === null) return;
				// capture p: the setView callback runs after pointerup may already null pan.current
				const shift = Math.round((p.x - clientX) / geo.current.step);
				setView((current) => ({ ...current, offset: Math.max(0, Math.min(total - current.count, p.offset + shift)) }));
			}
			function onPointerDown(event) {
				// the placeholder before the first draw has no geometry: keep pointer effects off it
				if (geo.current === null) return;
				event.currentTarget.setPointerCapture?.(event.pointerId);
				pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
				if (pointers.current.size === 2) {
					const [a, b] = [...pointers.current.values()];
					pinch.current = { distance: Math.abs(a.x - b.x) || 1, count: view.count };
					return;
				}
				if (event.pointerType === 'touch') {
					const at = localXY(event);
					pressTimer.current = window.setTimeout(() => setCross({ gi: barAtPixel(at.x), y: at.y, x: at.x }), 450);
					pan.current = { x: event.clientX, offset: view.offset };
				} else if (event.shiftKey || event.button === 1 || event.button === 2) {
					// right-drag pans the time axis, like every desktop charting tool
					pan.current = { x: event.clientX, offset: view.offset };
				} else {
					const { x } = localXY(event);
					setSel({ x0: x, x1: x });
				}
			}
			function onPointerMove(event) {
				if (pointers.current.has(event.pointerId)) pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
				if (pressTimer.current !== void 0 && Math.abs((pan.current?.x ?? event.clientX) - event.clientX) > 6) {
					window.clearTimeout(pressTimer.current);
					pressTimer.current = void 0;
				}
				if (pointers.current.size === 2 && pinch.current !== null) {
					const [a, b] = [...pointers.current.values()];
					const distance = Math.abs(a.x - b.x) || 1;
					const next = Math.round(pinch.current.count * pinch.current.distance / distance);
					setView((current) => ({ ...current, count: Math.min(Math.max(20, next), total) }));
					return;
				}
				if (sel !== null) {
					const { x } = localXY(event);
					setSel((current) => current === null ? current : { ...current, x1: x });
				}
				if (pan.current !== null && event.buttons > 0) panBy(event.clientX);
				if (event.pointerType === 'mouse') setCrossAt(event);
			}
			function onPointerUp(event) {
				pointers.current.delete(event.pointerId);
				if (pointers.current.size < 2) pinch.current = null;
				pan.current = null;
				window.clearTimeout(pressTimer.current);
				pressTimer.current = void 0;
				if (sel === null) return;
				const g = geo.current;
				const i0 = Math.max(0, Math.min(g.count - 1, Math.floor(Math.min(sel.x0, sel.x1) / g.step)));
				const i1 = Math.max(0, Math.min(g.count - 1, Math.floor(Math.max(sel.x0, sel.x1) / g.step)));
				setSel(null);
				if (Math.abs(sel.x1 - sel.x0) < 4) {
					// a click, not a drag: pin that day's detail strip
					setPicked((current) => current === g.start + i0 ? null : g.start + i0);
					return;
				}
				if (i1 - i0 < 3) return;
				const count = Math.max(5, i1 - i0 + 1);
				const startG = g.start + i0;
				setView({
					count,
					offset: Math.max(0, Math.min(total - count, total - count - startG)),
				});
				window.setTimeout(() => {
					const wrap = wrapRef.current;
					if (wrap !== null) diag('panel.chart.zoom', {
						count,
						bars: total,
					});
				}, 0);
			}
			function onWheel(event) {
				event.preventDefault();
				const factor = event.deltaY > 0 ? 1.15 : 0.87;
				const g = geo.current;
				if (g === null) return;
				const rect = event.currentTarget.getBoundingClientRect();
				const frac = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, g.plotWidth)));
				setView((current) => {
					const count = Math.min(Math.max(5, Math.round(current.count * factor)), total);
					if (count === current.count) return current;
					const anchor = g.start + frac * current.count; // keep the bar under the cursor in place
					const start = anchor - frac * count;
					return {
						count,
						offset: Math.max(0, Math.min(total - count, Math.round(total - count - start))),
					};
				});
			}
			// React attaches wheel passively; a non-passive listener is needed to stop the page from scrolling through.
			React.useEffect(() => {
				const canvas = canvasRef.current;
				if (canvas === null) return void 0;
				const native = (event) => onWheel(event);
				canvas.addEventListener('wheel', native, { passive: false });
				return () => canvas.removeEventListener('wheel', native);
			}, [total]);
			const resetView = () => setView({ count: Math.min(total, 90), offset: 0 });
			function onDoubleClick() {
				resetView();
				setPicked(null);
			}

			const zoomed = total > 0 && (view.count < total - 1 || view.offset > 0);
			const relCls = (value, base) => (value === null || value === void 0 || base === null || base === void 0)
				? 'ml-flat'
				: value > base ? 'up' : value < base ? 'down' : 'ml-flat';
			const legendBar = cross === null ? void 0 : bars[cross.gi];
			const legendPrev = legendBar === void 0 ? void 0 : bars[bars.indexOf(legendBar) - 1];
			const legendChg = legendBar?.c !== void 0 && legendBar?.c !== null && (legendPrev?.c ?? null) !== null ? (legendBar.c - legendPrev.c) / legendPrev.c * 100 : null;
			// day detail strip: the clicked bar expanded like a terminal's bottom readout
			const dayBar = picked === null ? void 0 : bars[picked];
			const dayPrev = picked === null || picked === 0 ? void 0 : bars[picked - 1];
			const dayChg = dayBar?.c != null && dayPrev?.c != null ? dayBar.c - dayPrev.c : null;
			const dayPct = dayChg !== null && dayPrev?.c ? dayChg / dayPrev.c * 100 : null;
			const dayAmp = dayBar?.h != null && dayBar?.l != null && dayPrev?.c ? (dayBar.h - dayBar.l) / dayPrev.c * 100 : null;
			const dayCells = dayBar === void 0 ? void 0 : [
				['day.date', String(dayBar.t), ''],
				['metric.open', fmtNum(dayBar.o), ''],
				['metric.high', fmtNum(dayBar.h), ''],
				['metric.low', fmtNum(dayBar.l), ''],
				['metric.close', fmtNum(dayBar.c), dayChg === null ? '' : dirClass(dayChg)],
				['day.change', dayChg === null ? '—' : fmtSigned(dayChg), dayChg === null ? '' : dirClass(dayChg)],
				['day.changePct', dayPct === null ? '—' : `${fmtSigned(dayPct)}%`, dayPct === null ? '' : dirClass(dayPct)],
				['day.amplitude', dayAmp === null ? '—' : `${fmtNum(dayAmp)}%`, ''],
				['metric.volume', fmtBig(dayBar.v), ''],
			];
			return h('div', { className: 'ml-chart' },
				h('div', { className: 'ml-canvas-wrap', ref: wrapRef },
					h('canvas', {
						className: 'ml-canvas', ref: canvasRef,
						onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onDoubleClick,
						onContextMenu: (event) => event.preventDefault(),
						onPointerLeave: () => setCross(null),
					}),
					h('div', { className: 'ml-legend' }, legendBar === void 0 ? t('chart.hint') : [
						h('b', { key: 'd' }, String(legendBar.t)),
						h('span', { key: 'o', className: relCls(legendBar.o, legendPrev?.c ?? legendBar.o) }, `O ${fmtNum(legendBar.o)}`),
						h('span', { key: 'h', className: relCls(legendBar.h, legendPrev?.c ?? legendBar.h) }, `H ${fmtNum(legendBar.h)}`),
						h('span', { key: 'l', className: relCls(legendBar.l, legendPrev?.c ?? legendBar.l) }, `L ${fmtNum(legendBar.l)}`),
						h('span', { key: 'c', className: relCls(legendBar.c, legendPrev?.c ?? legendBar.c) }, `C ${fmtNum(legendBar.c)}`),
						h('span', { key: 'p', className: legendChg === null ? '' : dirClass(legendChg) }, legendChg === null ? '' : `${fmtSigned(legendChg)}%`),
						h('span', { key: 'v' }, `Vol ${fmtBig(legendBar.v)}`),
						...(showMa ? maSeries.filter((m) => m.values[cross.gi] !== null).map((m, i) => h('span', {
							key: `ma${m.span}`,
							style: { color: maColors[i % maColors.length] },
						}, `MA${String(m.span)} ${fmtNum(m.values[cross.gi])}`)) : []),
					]),
					zoomed ? h('button', {
						type: 'button', className: 'ml-btn ml-zoomreset', onClick: resetView,
					}, '⤢ ' + t('chart.reset')) : null),
				dayCells === void 0 ? null : h('footer', { className: 'ml-daybar' },
					dayCells.map(([key, text, cls]) => h('span', { key },
						h('i', null, t(key)),
						h('b', { className: cls }, text)))),
			);
		}

		// ---------- bulk import dialog ----------
		function ruleTextClient(alert, t) {
			switch (alert.type) {
				case 'priceUp': return `${t('alert.type.priceUp')} ${String(alert.value)}`;
				case 'priceDown': return `${t('alert.type.priceDown')} ${String(alert.value)}`;
				case 'pctUp': return `${t('alert.type.pctUp')} ${String(alert.value)}%`;
				case 'pctDown': return `${t('alert.type.pctDown')} ${String(alert.value)}%`;
				case 'maUp': return `${t('alert.type.maUp')} MA${String(alert.span ?? 5)}`;
				case 'maDown': return `${t('alert.type.maDown')} MA${String(alert.span ?? 5)}`;
				default: return `${t('alert.type.volSpike')} ${String(alert.value)}`;
			}
		}

		const ALERT_TYPE_ICONS = {
			priceUp: '📈', priceDown: '📉', pctUp: '📈', pctDown: '📉', maUp: '⤴️', maDown: '⤵️', volSpike: '🔊',
		};

		function AlertsCard({ alerts, selected, quote, onAdd, onDelete, t }) {
			const [form, setForm] = React.useState(null);
			const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
			const needValue = form !== null && ['priceUp', 'priceDown', 'pctUp', 'pctDown', 'volSpike'].includes(form.type);
			const needSpan = form !== null && ['maUp', 'maDown'].includes(form.type);
			return h('section', { className: 'ml-panel ml-alerts' },
				h('header', null,
					h('span', { className: 'ml-title' }, t('alert.title')),
					h('button', {
						type: 'button', className: 'ml-btn', disabled: selected === null,
						onClick: () => setForm(form === null ? {
							type: quote?.price !== void 0 && quote?.price !== null ? 'priceUp' : 'pctUp',
							value: quote?.price ?? 3,
							span: 5,
							cooldownMin: 30,
						} : null),
					}, t('alert.new'))),
				alerts.length === 0 && form === null ? h('div', { className: 'ml-pad' }, t('alert.none')) : null,
				alerts.length === 0 ? null : h('ul', { className: 'ml-alertlist' },
					alerts.map((alert) => h('li', { key: alert.id },
						h('span', { className: 'sym' }, ALERT_TYPE_ICONS[alert.type] ?? '🔔', ' ', alert.name ?? alert.symbol),
						h('code', null, alert.symbol),
						h('span', { className: 'rule' }, ruleTextClient(alert, t)),
						h('button', {
							type: 'button', className: 'rm-x', title: t('alert.delete'),
							onClick: () => onDelete(alert.id),
						}, '×')))),
				form === null ? null : h('div', { className: 'ml-alertform' },
					h('select', {
						value: form.type, onChange: (event) => set('type', event.target.value),
					}, ['priceUp', 'priceDown', 'pctUp', 'pctDown', 'maUp', 'maDown', 'volSpike'].map((type) => h('option', { key: type, value: type }, t(`alert.type.${type}`)))),
					needValue ? h('label', null, t('alert.threshold'), h('input', {
						type: 'number', step: 'any', min: '0', value: String(form.value),
						onChange: (event) => set('value', Number(event.target.value)),
					})) : null,
					needSpan ? h('label', null, 'MA', h('select', {
						value: String(form.span), onChange: (event) => set('span', Number(event.target.value)),
					}, [5, 10, 20, 60].map((span) => h('option', { key: span, value: String(span) }, `MA${String(span)}`)))) : null,
					h('label', null, t('alert.cooldown'), h('input', {
						type: 'number', step: '1', min: '0', max: '1440', value: String(form.cooldownMin),
						onChange: (event) => set('cooldownMin', Number(event.target.value)),
					})),
					h('div', { className: 'acts' },
						h('button', { type: 'button', className: 'ml-btn', onClick: () => setForm(null) }, t('alert.cancel')),
						h('button', {
							type: 'button', className: 'ml-btn',
							disabled: selected === null || (needValue && !(form.value > 0)),
							onClick: () => {
								void onAdd({
									symbol: selected,
									type: form.type,
									value: needValue ? form.value : 1,
									span: form.span,
									cooldownMin: form.cooldownMin,
								});
								setForm(null);
							},
						}, t('alert.save')))));
		}

		/** Bottom status strip: vertical marquee of fired alerts; hover pauses, click opens the board. */
		function AlertBar({ t }) {
			const [events, setEvents] = React.useState([]);
			const [slot, setSlot] = React.useState(0);
			const [paused, setPaused] = React.useState(false);
			const cursorRef = React.useRef(0);
			React.useEffect(() => {
				let stopped = false;
				const poll = async () => {
					try {
						const body = await api('alerts', { since: cursorRef.current });
						if (stopped) return;
						if (body.events.length > 0) {
							cursorRef.current = Math.max(cursorRef.current, ...body.events.map((row) => row.id));
							setEvents((current) => [...current, ...body.events].slice(-30));
						}
					} catch { /* the strip stays quiet while the host sleeps */ }
				};
				 void poll();
				const timer = window.setInterval(poll, 8000);
				return () => {
					stopped = true;
					window.clearInterval(timer);
				};
			}, []);
			React.useEffect(() => {
				if (paused || events.length < 2) return void 0;
				const timer = window.setInterval(() => setSlot((current) => current + 1), 3000);
				return () => window.clearInterval(timer);
			}, [paused, events.length]);
			if (events.length === 0) return null;
			const shown = events.slice(-30);
			const currentRow = shown[shown.length - 1 - (slot % shown.length)];
			const dir = currentRow.changePct === null || currentRow.changePct === void 0 ? '' : dirClass(currentRow.changePct);
			return h('div', {
				className: 'ml-bar', role: 'status',
				onMouseEnter: () => setPaused(true),
				onMouseLeave: () => setPaused(false),
			},
				h('span', { className: 'bell', 'aria-hidden': true }, '🔔'),
				h('button', {
					type: 'button', className: `line ${dir}`, key: currentRow.id,
					title: t('alert.barTitle'),
					onClick: () => window.dispatchEvent(new CustomEvent('market-lens:activate', { detail: { symbol: currentRow.symbol } })),
				},
					h('b', null, ALERT_TYPE_ICONS[currentRow.type] ?? '🔔', ' ', currentRow.name ?? currentRow.symbol),
					h('span', null, `${fmtNum(currentRow.price)}`, currentRow.changePct === null || currentRow.changePct === void 0 ? '' : ` ${fmtSigned(currentRow.changePct)}%`),
					h('code', null, new Date(currentRow.at).toLocaleTimeString())),
				h('button', {
					type: 'button', className: 'ml-btn dismiss',
					onClick: () => {
						void api('alerts', {}, void 0, { method: 'POST', body: { action: 'dismiss' } });
						setEvents([]);
					},
				}, t('alert.dismiss')));
		}

		function ImportDialog({ onImport, onClose, t }) {
			const [text, setText] = React.useState('');
			const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
			return h('div', { className: 'ml-overlay', role: 'dialog', 'aria-modal': true, 'aria-label': t('import.title'), onClick: (event) => {
				if (event.target === event.currentTarget) onClose();
			} },
				h('div', { className: 'ml-dialog' },
					h('label', null, t('import.title')),
					h('textarea', { autoFocus: true, placeholder: t('import.placeholder'), value: text, onChange: (event) => setText(event.target.value) }),
					lines.length > 50 ? h('small', { style: { color: 'var(--dsw-alias-state-warn-primary)' } }, t('import.toomany')) : null,
					h('footer', null,
						h('button', { type: 'button', className: 'ml-btn', onClick: onClose }, t('import.cancel')),
						h('button', {
							type: 'button', className: 'ml-btn', disabled: lines.length === 0,
							onClick: () => onImport(lines.slice(0, 50)),
						}, t('import.confirm')))));
		}

		// ---------- financials & news cards ----------
		function FinancialCard({ fin, t }) {
			const body = fin?.body;
			return h('section', { className: 'ml-panel' },
				h('header', null, h('span', { className: 'ml-title' }, t('fin.title'))),
				fin === null || fin.state === 'busy' ? h('div', { className: 'ml-pad' }, t('detail.loading'))
					: fin.state === 'error' ? h('div', { className: 'ml-pad' }, t('fin.error'))
						: body.unsupported === true ? h('div', { className: 'ml-pad' }, t('fin.unsupported'))
							: h(HScroll, { label: 'financials', className: 'ml-finrow' }, h('table', { className: 'ml-fintable' },
								h('thead', null, h('tr', null,
									[t('fin.col.report'), t('fin.col.revenue'), t('fin.col.revYoY'), t('fin.col.profit'), t('fin.col.profitYoY'), t('fin.col.eps')]
										.map((label, index) => h('th', { key: index }, label)))),
								h('tbody', null, body.rows.map((row) => h('tr', { key: row.report },
									h('td', null, row.report),
									h('td', null, fmtBig(row.revenue)),
									h('td', { className: dirClass(row.revenueYoY) }, row.revenueYoY === null ? '—' : `${fmtSigned(row.revenueYoY)}%`),
									h('td', null, fmtBig(row.netProfit)),
									h('td', { className: dirClass(row.netProfitYoY) }, row.netProfitYoY === null ? '—' : `${fmtSigned(row.netProfitYoY)}%`),
									h('td', null, fmtNum(row.eps, 2))))))));
		}

		function newsTimeText(value) {
			if (typeof value !== 'string' || value === '') return '';
			if (value.includes('T')) {
				const date = new Date(value);
				return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
			}
			return value.slice(11, 16);
		}

		function NewsCard({ news, t }) {
			return h('section', { className: 'ml-panel', style: { flex: 1, minHeight: 140 } },
				h('header', null,
					h('span', { className: 'ml-title' }, t('news.title')),
					news.source === '' || news.source === void 0 ? null : h('span', null, news.source)),
				news.state === 'busy' && news.items.length === 0 ? h('div', { className: 'ml-pad' }, t('news.loading'))
					: news.items.length === 0 ? h('div', { className: 'ml-pad' }, t('news.empty'))
						: h('div', { className: 'ml-news' },
							news.items.map((item, index) => h('div', { className: 'ml-news-item', key: `${String(item.time)}|${index}` },
								item.url === '' ? h('span', null, item.title)
									: h('a', { href: item.url, target: '_blank', rel: 'noreferrer' }, item.title),
								newsTimeText(item.time) === '' ? null : h('time', null, newsTimeText(item.time))))));
		}

		// ---------- panel ----------
		function createPanel(t) {
			function Panel() {
				const rootRef = React.useRef(null);
				const [wide, setWide] = React.useState(() => (typeof document === 'undefined' ? true : document.documentElement.clientWidth >= 900));
				const [meta, setMeta] = React.useState(null);
				const [watchlist, setWatchlist] = React.useState(() => loadLs(LS_WATCH, null));
				const [prefs, setPrefs] = React.useState(() => ({ pinned: [], ...loadLs(LS_PREFS, { palette: 'redup', filter: 'all', sort: 'default', showMa: true }) }));
				const seenRef = React.useRef(loadLs(LS_SEEN, {}));
				const seenQuote = (symbol) => {
					const row = seenRef.current[symbol];
					return row === void 0 ? void 0 : {
						...row,
						stale: true,
					};
				};
				const [quotes, setQuotes] = React.useState(() => new Map());
				const [refresh, setRefresh] = React.useState({ state: 'idle', at: 0, error: null });
				const [search, setSearch] = React.useState({ q: '', items: [], open: false, busy: false });
				const searchSeq = React.useRef(0);
				const searchTimer = React.useRef(void 0);
				const [selected, setSelected] = React.useState(() => loadLs(LS_WATCH, []) [0] ?? null);
				const [view, setView] = React.useState('list');
				const [period, setPeriod] = React.useState('day');
				const [kline, setKline] = React.useState(null);
				const [klineSeq, setKlineSeq] = React.useState(0);
				const [importing, setImporting] = React.useState(false);
				const [metaError, setMetaError] = React.useState(null);
				const [fin, setFin] = React.useState(null);
				const [news, setNews] = React.useState({ state: 'idle', items: [], source: '' });
				const [alertsList, setAlertsList] = React.useState([]);
				const [palOpen, setPalOpen] = React.useState(false);
				React.useEffect(() => {
					if (palOpen === false) return void 0;
					const onDoc = (event) => {
						if (event.target?.closest?.('.ml-palwrap') === void 0) setPalOpen(false);
					};
					window.document.addEventListener('pointerdown', onDoc, true);
					return () => window.document.removeEventListener('pointerdown', onDoc, true);
				}, [palOpen]);
				const refreshAlerts = React.useCallback(() => {
					api('alerts', { since: 0 }).then(
						(body) => setAlertsList(body.alerts ?? []),
						() => { /* keep the last known list */ },
					);
				}, []);
				React.useEffect(() => {
					refreshAlerts();
					const timer = window.setInterval(refreshAlerts, 15000);
					return () => window.clearInterval(timer);
				}, [refreshAlerts]);
				const addAlert = async (input) => {
					try {
						await api('alerts', {}, void 0, { method: 'POST', body: input });
						diag('panel.alert.add', { symbol: input.symbol, type: input.type });
					} catch (error) {
						diag('panel.alert.fail', { message: String(error?.message ?? error) });
					}
					refreshAlerts();
				};
				const dropAlert = async (id) => {
					try {
						await api('alerts', { id }, void 0, { method: 'DELETE' });
					} catch (error) {
						diag('panel.alert.fail', { message: String(error?.message ?? error) });
					}
					refreshAlerts();
				};

				React.useEffect(() => {
					saveLs(LS_WATCH, watchlist ?? []);
				}, [watchlist]);
				React.useEffect(() => {
					saveLs(LS_PREFS, prefs);
				}, [prefs]);

				React.useEffect(() => {
					const onActivate = (event) => {
						const symbol = event.detail?.symbol;
						if (typeof symbol !== 'string') return;
						setSelected(symbol);
						setView('detail');
						setWatchlist((current) => {
							const list = current ?? (meta?.defaultWatchlist ?? []);
							return list.includes(symbol) ? list : [...list, symbol];
						});
					};
					window.addEventListener('market-lens:activate', onActivate);
					return () => window.removeEventListener('market-lens:activate', onActivate);
				}, [meta]);

				React.useEffect(() => {
					diag('panel.mount', {
						rev: CLIENT_REV,
						href: window.location.href.slice(0, 120),
						nav: window.navigator.userAgent.slice(0, 80),
					});
					let stopped = false;
					let timer = 0;
					let controller = null;
					const load = async () => {
						controller = new AbortController();
						try {
							const value = await api('meta', {}, controller.signal);
							if (stopped) return;
							diag('panel.meta.ok', { symbols: value.defaultWatchlist.length });
							setMeta(value);
							setMetaError(null);
							setWatchlist((current) => (current === null || current.length === 0 ? value.defaultWatchlist : current));
							setSelected((current) => current ?? value.defaultWatchlist[0] ?? null);
						} catch (error) {
							if (stopped) return;
							diag('panel.meta.fail', {
								message: String(error?.message ?? error),
								status: error?.status ?? null,
							});
							setMetaError(String(error?.message ?? error));
							timer = window.setTimeout(load, 5000);
						}
					};
					void load();
					return () => {
						stopped = true;
						window.clearTimeout(timer);
						controller?.abort();
					};
				}, []);

				React.useEffect(() => {
					const wrap = rootRef.current;
					if (wrap === null) return void 0;
					const observer = new ResizeObserver(() => setWide(wrap.clientWidth >= 900));
					observer.observe(wrap);
					setWide(wrap.clientWidth >= 900);
					return () => observer.disconnect();
				}, []);

				const symbols = React.useMemo(() => {
					const list = new Set([...(meta?.indexBar ?? []), ...(watchlist ?? [])]);
					return [...list];
				}, [meta, watchlist]);
				const symbolsKey = symbols.join(',');

				React.useEffect(() => {
					if (symbolsKey === '') return void 0;
					let stopped = false;
					let timer = 0;
					let controller = null;
					let lastQuotesState = null;
					let hidTicks = 0;
					const intervalMs = meta?.pollIntervalMs ?? 5000;
					const tick = async () => {
						if (window.document.hidden) {
							hidTicks++;
							if (hidTicks === 30) diag('panel.hidden', { symbols: symbolsKey.split(',').length });
							timer = window.setTimeout(tick, 1000);
							return;
						}
						controller = new AbortController();
						setRefresh((current) => ({ ...current, state: 'busy' }));
						try {
							const body = await api('quotes', { symbols: symbolsKey }, controller.signal);
							if (stopped) return;
							const next = new Map();
							for (const quote of body.quotes) next.set(quote.symbol, quote);
							setQuotes(next);
							for (const quote of body.quotes) seenRef.current[quote.symbol] = {
								symbol: quote.symbol,
								name: quote.name,
								price: quote.price,
								change: quote.change,
								changePct: quote.changePct,
								amount: quote.amount,
								at: Date.now(),
							};
							saveLs(LS_SEEN, seenRef.current);
							if (lastQuotesState !== 'ok') {
								lastQuotesState = 'ok';
								diag('panel.quotes.ok', { rows: next.size });
							}
							setRefresh({ state: 'ok', at: Date.now(), error: null });
						} catch (error) {
							if (!stopped) {
								if (lastQuotesState !== 'error') {
									lastQuotesState = 'error';
									diag('panel.quotes.fail', { message: String(error?.message ?? error) });
								}
								setRefresh((current) => ({ ...current, state: 'error', at: Date.now(), error: String(error) }));
							}
						} finally {
							controller = null;
							if (!stopped) timer = window.setTimeout(tick, intervalMs);
						}
					};
					const onVisible = () => {
						if (!window.document.hidden) {
							window.clearTimeout(timer);
							void tick();
						}
					};
					window.addEventListener('visibilitychange', onVisible);
					void tick();
					return () => {
						stopped = true;
						window.clearTimeout(timer);
						controller?.abort();
						window.removeEventListener('visibilitychange', onVisible);
					};
				}, [symbolsKey, meta?.pollIntervalMs]);

				React.useEffect(() => {
					if (selected === null) {
						setKline(null);
						return void 0;
					}
					const controller = new AbortController();
					setKline({ state: 'busy' });
					api('kline', { symbol: selected, period, count: 320 }, controller.signal).then((body) => {
							diag('panel.kline.ok', {
								symbol: selected,
								period,
								bars: body.bars.length,
								source: body.source,
							});
							setKline({ state: 'ok', body });
						},
						(error) => {
							if (controller.signal.aborted) return;
							diag('panel.kline.fail', {
								symbol: selected,
								period,
								message: String(error?.message ?? error),
							});
							setKline({ state: 'error', error: String(error) });
						},
					);
					return () => controller.abort();
				}, [selected, period, klineSeq]);

				React.useEffect(() => {
					if (selected === null) {
						setFin(null);
						return void 0;
					}
					const controller = new AbortController();
					setFin({ state: 'busy' });
					api('financials', { symbol: selected }, controller.signal).then(
						(body) => {
							diag('panel.fin.ok', {
								symbol: selected,
								rows: body.rows.length,
								unsupported: body.unsupported === true,
							});
							setFin({ state: 'ok', body });
						},
						(error) => {
							if (!controller.signal.aborted) {
								diag('panel.fin.fail', {
									symbol: selected,
									message: String(error?.message ?? error),
								});
								setFin({ state: 'error' });
							}
						},
					);
					return () => controller.abort();
				}, [selected]);

				const selectedName = quotes.get(selected ?? '')?.name ?? '';
				React.useEffect(() => {
					let stopped = false;
					let timer = 0;
					let controller = null;
					let lastNewsState = null;
					const noteNews = (state, fields) => {
						if (lastNewsState === state) return;
						lastNewsState = state;
						diag(state === 'ok' ? 'panel.news.ok' : 'panel.news.fail', fields ?? {});
					};
					const load = async (keyword) => {
						controller = new AbortController();
						setNews((current) => ({ ...current, state: 'busy' }));
						try {
							const body = await api('news', { q: keyword, limit: 12 }, controller.signal);
							if (stopped) return;
							if (keyword !== '' && body.items.length === 0) throw new Error('empty for keyword');
							noteNews('ok', {
								count: body.items.length,
								source: body.source,
							});
							setNews({ state: 'ok', items: body.items, source: body.source });
						} catch {
							if (!stopped && keyword !== '') {
								// keyword produced no hits and both feeds failed the same way; fall back to the global feed
								try {
									const globalBody = await api('news', { limit: 12 }, controller.signal);
									if (!stopped) {
										noteNews('ok', {
											count: globalBody.items.length,
											source: globalBody.source,
										});
										setNews({ state: 'ok', items: globalBody.items, source: globalBody.source });
									}
								} catch {
									if (!stopped) {
										noteNews('error', null);
										setNews((current) => ({ ...current, state: 'error' }));
									}
								}
							} else if (!stopped) {
								noteNews('error', null);
								setNews((current) => ({ ...current, state: 'error' }));
							}
						} finally {
							if (!stopped) timer = window.setTimeout(() => void load(keyword), 60000);
						}
					};
					void load(selectedName === selected ? '' : selectedName);
					return () => {
						stopped = true;
						window.clearTimeout(timer);
						controller?.abort();
					};
				}, [selectedName]);

				const runSearch = (query) => {
					window.clearTimeout(searchTimer.current);
					if (query.trim() === '') {
						setSearch({ q: query, items: [], open: false, busy: false });
						return;
					}
					setSearch((current) => ({ ...current, q: query, open: true, busy: true }));
					searchTimer.current = window.setTimeout(() => {
						const seq = ++searchSeq.current;
						const controller = new AbortController();
						api('search', { q: query, limit: 20 }, controller.signal).then((body) => {
							if (seq !== searchSeq.current) return;
							setSearch((current) => ({ ...current, items: body.items, busy: false }));
						}, () => {
							if (seq === searchSeq.current) setSearch((current) => ({ ...current, busy: false }));
						});
					}, 250);
				};

				const addToWatch = (symbol) => {
					setWatchlist((current) => {
						const list = current ?? [];
						return list.includes(symbol) ? list : [...list, symbol];
					});
					setSelected(symbol);
					setSearch((current) => ({ ...current, q: '', items: [], open: false }));
				};
				const removeFromWatch = (symbol) => {
					setWatchlist((current) => (current ?? []).filter((item) => item !== symbol));
					if (selected === symbol) {
						const rest = (watchlist ?? []).filter((item) => item !== symbol);
						setSelected(rest[0] ?? null);
					}
				};
				const importTokens = async (lines) => {
					setImporting(false);
					const resolved = [];
					for (const line of lines) {
						try {
							const body = await api('search', { q: line, limit: 1 });
							if (body.items.length > 0) resolved.push(body.items[0].symbol);
						} catch { /* skip a failing line, keep the rest */ }
					}
					setWatchlist((current) => {
						const list = current ?? [];
						return [...list, ...resolved.filter((symbol) => !list.includes(symbol))];
					});
				};

				const instrumentRows = (watchlist ?? (meta?.defaultWatchlist ?? [])).map((symbol) => ({ symbol, market: marketOf(symbol), name: quotes.get(symbol)?.name ?? seenQuote(symbol)?.name ?? symbol }));
				const filtered = instrumentRows.filter((row) => prefs.filter === 'all' || (prefs.filter === 'index' ? (meta?.indexBar ?? []).includes(row.symbol) : row.market === prefs.filter));
				const sorted = [...filtered];
				if (prefs.sort === 'gainers' || prefs.sort === 'losers') {
					const dir = prefs.sort === 'gainers' ? -1 : 1;
					sorted.sort((a, b) => {
						const pa = quotes.get(a.symbol)?.changePct;
						const pb = quotes.get(b.symbol)?.changePct;
						if (pa === null || pa === void 0) return 1;
						if (pb === null || pb === void 0) return -1;
						return (pa - pb) * dir;
					});
				} else if (prefs.sort === 'amount') sorted.sort((a, b) => (quotes.get(b.symbol)?.amount ?? -1) - (quotes.get(a.symbol)?.amount ?? -1));
				// Pinned rows keep their own order and float to the top of any sort (professional boards never move a pinned row).
				const pinOrder = prefs.pinned ?? [];
				if (pinOrder.length > 0) {
					const rank = (symbol) => {
						const at = pinOrder.indexOf(symbol);
						return at === -1 ? pinOrder.length : at;
					};
					sorted.sort((a, b) => rank(a.symbol) - rank(b.symbol));
				}
				const togglePin = (symbol) => setPrefs((current) => {
					const list = current.pinned ?? [];
					return { ...current, pinned: list.includes(symbol) ? list.filter((item) => item !== symbol) : [...list, symbol] };
				});

				const selectedQuote = selected === null ? void 0 : quotes.get(selected) ?? seenQuote(selected);
				const showList = wide || view === 'list';
				const showDetail = wide || view === 'detail';

				return h('div', { className: 'ml-root', ref: rootRef, 'data-wide': wide ? '1' : '0', 'data-pal': prefs.palette },
					h('header', { className: 'ml-top' },
						h('span', { className: 'ml-brand' }, t('panel.title'), h('small', null, t('notice'))),
						h('span', { className: 'ml-searchbox' },
							h('input', {
								className: 'ml-search', type: 'search', role: 'searchbox',
								placeholder: t('search.placeholder'), value: search.q, 'aria-busy': search.busy,
								onChange: (event) => runSearch(event.target.value),
								onFocus: () => search.items.length > 0 && setSearch((current) => ({ ...current, open: true })),
								onBlur: () => window.setTimeout(() => setSearch((current) => ({ ...current, open: false })), 180),
							}),
							search.open ? h('ul', { className: 'ml-results' },
								search.items.length === 0 && !search.busy
									? h('li', null, t('search.empty'))
									: search.items.map((item) => h('li', {
										key: item.symbol,
										onMouseDown: (event) => event.preventDefault(),
										onClick: () => addToWatch(item.symbol),
									},
										h('span', { className: 'ml-badge' }, BADGE[item.market] ?? item.market),
										h('b', null, item.name),
										h('code', { style: { color: 'var(--dsw-alias-label-secondary)' } }, item.symbol),
									)),
							) : null),
						h('span', { className: 'ml-palwrap', style: { position: 'relative' } },
							h('button', {
								type: 'button', className: 'ml-btn', title: t('toolbar.palette'), 'aria-expanded': palOpen,
								onClick: () => setPalOpen((current) => !current),
							}, h('i', { style: { display: 'inline-flex', gap: 2, marginRight: 6, verticalAlign: -1 } },
								h('s', { style: { width: 10, height: 10, borderRadius: 3, background: PALETTES[prefs.palette]?.up ?? PALETTES.redup.up, display: 'block' } }),
								h('s', { style: { width: 10, height: 10, borderRadius: 3, background: PALETTES[prefs.palette]?.down ?? PALETTES.redup.down, display: 'block' } })),
								t(`palette.${prefs.palette in PALETTES ? prefs.palette : 'redup'}`)),
							palOpen ? h('div', { className: 'ml-palmenu' },
								Object.entries(PALETTES).map(([id, pal]) => h('button', {
									key: id, type: 'button',
									onClick: () => {
										setPrefs((current) => ({ ...current, palette: id }));
										setPalOpen(false);
									},
								}, h('i', null, h('s', { style: { background: pal.up } }), h('s', { style: { background: pal.down } })), t(`palette.${id}`)))) : null),
						h('button', { type: 'button', className: 'ml-btn', onClick: () => setImporting(true) }, t('toolbar.import')),
						h('span', { className: 'ml-status', 'data-err': refresh.state === 'error' ? '1' : '0' },
							refresh.state === 'busy' ? t('toolbar.refreshing') : refresh.state === 'error' ? t('toolbar.error') : refresh.at === 0 ? '' : new Date(refresh.at).toLocaleTimeString()),
					),
					h(IndexBar, { indexBar: meta?.indexBar ?? [], quotes }),
					metaError !== null ? h('div', { className: 'ml-errorbar' }, `${t('meta.error')}（${metaError}）`) : null,
					h('div', { className: 'ml-main' },
						showList ? h('div', { className: 'ml-panelcol', 'data-col': 'list' },
							h('section', { className: 'ml-panel', style: { flex: 1 } },
								h('header', null,
									h('span', { className: 'ml-title' }, t('list.title')),
									h('select', {
										className: 'ml-btn', value: prefs.sort, 'aria-label': 'sort',
										onChange: (event) => setPrefs((current) => ({ ...current, sort: event.target.value })),
									}, ['default', 'gainers', 'losers', 'amount'].map((mode) => h('option', { key: mode, value: mode }, t(`sort.${mode}`)))),
								),
								h('header', null, ['all', 'cn', 'hk', 'us', 'index'].map((mode) => h('button', {
									key: mode, type: 'button', className: 'ml-chip', 'aria-pressed': prefs.filter === mode,
									onClick: () => setPrefs((current) => ({ ...current, filter: mode })),
								}, t(`filter.${mode}`)))),
								h('div', { className: 'ml-rows' },
									sorted.length === 0 ? h('div', { style: { padding: 12, color: 'var(--dsw-alias-label-secondary)' } }, t('list.addHint'))
										: sorted.map((row) => h(WatchRow, {
											key: row.symbol, instrument: row, quote: quotes.get(row.symbol) ?? seenQuote(row.symbol),
											pinned: (prefs.pinned ?? []).includes(row.symbol), onPin: togglePin,
											active: row.symbol === selected,
											onSelect: (symbol) => {
												setSelected(symbol);
												setView('detail');
											},
											onRemove: removeFromWatch,
											t,
										})))),
						) : null,
						showDetail ? h('div', { className: 'ml-panelcol', 'data-col': 'chart' },
							h('section', { className: 'ml-panel', style: { flex: 2 } },
								h('header', null,
									h('button', { type: 'button', className: 'ml-btn ml-back', onClick: () => setView('list') }, '‹ ' + t('detail.back')),
									h('span', { className: 'ml-title' }, selectedQuote?.name ?? selected ?? t('detail.title'), selected === null ? '' : h('code', { style: { marginLeft: 6 } }, selected)),
									['day', 'week', 'month'].map((mode) => h('button', {
										key: mode, type: 'button', className: 'ml-chip', 'aria-pressed': period === mode,
										onClick: () => setPeriod(mode),
									}, t(`detail.period.${mode}`))),
									h('button', {
										type: 'button', className: 'ml-chip', 'aria-pressed': prefs.showMa,
										onClick: () => setPrefs((current) => ({ ...current, showMa: !current.showMa })),
									}, t('detail.ma'))),
								kline === null || kline.state === 'busy' ? h('div', { style: { padding: 16 } }, t('detail.loading'))
									: kline.state === 'error' ? h('div', { className: 'ml-pad', style: { display: 'flex', gap: 10, alignItems: 'center' } },
										t('detail.chartError'),
										h('button', { type: 'button', className: 'ml-btn', onClick: () => setKlineSeq((current) => current + 1) }, t('kline.retry')))
										: h(KLineChart, { data: kline.body, showMa: prefs.showMa, hollow: PALETTES[prefs.palette]?.hollow === true, t }),
							)) : null,
						showDetail ? h('div', { className: 'ml-panelcol', 'data-col': 'detail' },
							h('section', { className: 'ml-panel' },
								h('header', null, h('span', { className: 'ml-title' }, t('detail.title'))),
								selectedQuote === void 0 ? h('div', { className: 'ml-pad' }, t('toolbar.error'))
									: h(Metrics, { quote: selectedQuote, t })),
							h(AlertsCard, { alerts: alertsList, selected, quote: selectedQuote, onAdd: addAlert, onDelete: dropAlert, t }),
							h(FinancialCard, { fin, t }),
							h(NewsCard, { news, t }),
						) : null),
					importing ? h(ImportDialog, { onImport: importTokens, onClose: () => setImporting(false), t }) : null,
				);
			}
			return Panel;
		}

		/** Keeps a render crash inside the board instead of blanking the slot. */
		class ErrorBoundary extends React.Component {
			constructor(props) {
				super(props);
				this.state = { error: null };
			}
			static getDerivedStateFromError(error) {
				return { error };
			}
			componentDidCatch(error, info) {
				console.error(`${PKG}: panel crashed`, error);
				diag('panel.crash', {
					message: String(error?.message ?? error),
					stack: String(info?.componentStack ?? error?.stack ?? '').slice(0, 400),
				});
			}
			retry() {
				this.setState({ error: null });
			}
			render() {
				if (this.state.error === null) return this.props.children;
				return h('div', { className: 'ml-root', style: { padding: 16, gap: 6, display: 'flex', flexDirection: 'column' } },
					h('b', { style: { color: 'var(--dsw-alias-state-error-primary)' } }, this.props.prefix + String(this.state.error?.message ?? this.state.error)),
					h('span', { className: 'ml-pad' }, this.props.hint === void 0 ? '' : this.props.hint()),
					h('button', {
						type: 'button', className: 'ml-btn', style: { alignSelf: 'flex-start' },
						title: '重新渲染面板 / re-render the board',
						onClick: () => this.retry(),
					}, '↻'));
			}
		}

		function apply(ctx) {
			ctx.effect(() => {
				const tag = document.createElement('style');
				tag.dataset.plugin = PKG;
				tag.textContent = CSS;
				document.head.append(tag);
				return () => tag.remove();
			}, `${PKG}: styles`);
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), `${PKG}: locale`);
			const t = ctx.locale.bind(NS);
			ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
				name: 'sidebar.panellist', id: PANEL_ID, order: 30, label: () => ctx.locale.bind(NS)('panel.title'),
			}, PanelIcon));
			const PanelInner = createPanel(t);
			function Panel() {
				return h(ErrorBoundary, { prefix: t('crash.prefix'), hint: () => t('crash.hint') }, h(PanelInner));
			}
			ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL_ID }, Panel));
			ctx.slots.inject('shell.bottom', () => ctx.slots.register({ name: 'shell.bottom', key: `${NS}-bar` }, () => h(AlertBar, { t })));
			ctx.effect(() => {
				const onHide = () => flushDiag();
				window.addEventListener('pagehide', onHide);
				return () => {
					flushDiag();
					window.removeEventListener('pagehide', onHide);
				};
			}, `${PKG}: diag flush`);
			diag('client.apply', { rev: CLIENT_REV });
			flushDiag();
			console.log(`${PKG}: client half applied`);
		}

		return { inject: ['slots', 'locale'], apply };
	},
});
