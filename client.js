/**
 * 寰镜股票看板 MarketLens — Client half (browser bundle, plain JS, no JSX/build).
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
		const LS_NEWS = 'ml.seenews.v1';

		const zh = {
			'panel.title': '寰镜股票看板',
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
			'chart.hint': '框选放大 · 滚轮缩放 · 右键平移 · 点击看当日 · 双击全览', 'chart.reset': '全览',
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
			'metric.floatCap': '流通市值', 'metric.updated': '更新',
			'advice.surge': '强势拉升', 'advice.rise': '稳步走高', 'advice.flat': '窄幅盘整', 'advice.drop': '正快速下降', 'advice.slump': '加速下挫',
			'feed.notice': '公告', 'feed.posts': '评论', 'feed.pick': '选中一只股票后显示', 'feed.badge': '未读新公告',
			'day.hi20': '20日新高', 'day.lo20': '20日新低', 'day.volUp': '放量',
			'board.title': '证券大厅 · 自动轮播大屏', 'board.short': '证券大厅', 'board.tip': '自动轮播 · 悬停接管 · 点击选中不离场', 'toolbar.density': '点阵密度', 'news.src.sina': '新浪快讯', 'news.src.em': '东方财富', 'news.src.guba': '股吧', 'density.std': '标准 16×16', 'density.tiny': '紧凑 8×8', 'board.split': '拖动调整列宽', 'board.pickHint': '点击查看该股全景',
			'board.col.instrument': '名称', 'board.col.last': '现价', 'board.col.chg': '涨跌', 'board.col.chgPct': '涨幅', 'board.col.amount': '成交额', 'board.col.code': '代码', 'board.col.prevClose': '前收', 'board.col.high': '最高', 'board.col.low': '最低', 'panel.last': '最新', 'led.master': '寰镜证券行情总屏', 'led.min': '寰镜', 'led.gainers': '涨幅榜', 'led.losers': '跌幅榜', 'led.count': '支数', 'led.upN': '涨', 'led.downN': '跌', 'led.flatN': '平', 'led.turnover': '总额',
			'mkt.on': '交易中', 'mkt.pre': '集合竞价', 'mkt.lunch': '午间休市', 'mkt.closed': '已收盘', 'rel.now': '刚刚', 'rel.h': '{n}小时前', 'rel.d': '{n}天前', 'rel.w': '{n}周前', 'rel.mo': '{n}个月前', 'rel.y': '{n}年前',
			'import.title': '批量导入自选', 'import.placeholder': '每行一个代码或名称，最多 50 条',
			'import.confirm': '导入', 'import.cancel': '取消', 'import.toomany': '超出 50 条的部分已忽略',
			'notice': '延迟公开行情 · 非 Level-2 · 只读无交易',
		};
		const en = {
			'panel.title': 'HuanJing Stock Board',
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
			'chart.hint': 'drag=zoom · wheel=scale · right-drag=pan · click=day · dbl-click=all', 'chart.reset': 'Overview',
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
			'metric.floatCap': 'Float cap', 'metric.updated': 'Updated',
			'advice.surge': 'surging', 'advice.rise': 'trending up', 'advice.flat': 'consolidating', 'advice.drop': 'falling fast', 'advice.slump': 'breaking down',
			'feed.notice': 'Filings', 'feed.posts': 'Comments', 'feed.pick': 'Select a stock to load its feeds', 'feed.badge': 'unread filings',
			'day.hi20': '20-bar high', 'day.lo20': '20-bar low', 'day.volUp': 'Volume',
			'board.title': 'Exchange Hall — auto-rotating board', 'board.short': 'Exchange Hall', 'board.tip': 'Auto-rotation · hover takes over · click selects, stays on the wall', 'toolbar.density': 'Dot pitch', 'news.src.sina': 'Sina flash', 'news.src.em': 'Eastmoney', 'news.src.guba': 'Guba', 'density.std': 'Standard 16x16', 'density.tiny': 'Compact 8x8', 'board.split': 'Drag to resize columns', 'board.pickHint': 'Click to open the full view',
			'board.col.instrument': 'Instrument', 'board.col.last': 'Last', 'board.col.chg': 'Chg', 'board.col.chgPct': 'Chg %', 'board.col.amount': 'Turnover', 'board.col.code': 'Code', 'board.col.prevClose': 'Prev', 'board.col.high': 'High', 'board.col.low': 'Low', 'panel.last': 'Last', 'led.master': 'MarketLens Exchange Master Board', 'led.min': 'HJ', 'led.gainers': 'Gainers', 'led.losers': 'Losers', 'led.count': 'Rows', 'led.upN': 'Up', 'led.downN': 'Down', 'led.flatN': 'Flat', 'led.turnover': 'Turnover',
			'mkt.on': 'Open', 'mkt.pre': 'Call auction', 'mkt.lunch': 'Lunch break', 'mkt.closed': 'Market closed', 'rel.now': 'just now', 'rel.h': '{n}h ago', 'rel.d': '{n}d ago', 'rel.w': '{n}w ago', 'rel.mo': '{n}mo ago', 'rel.y': '{n}y ago',
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
.ml-palmenu button[aria-pressed='true']{background:var(--dsw-alias-bg-layer-2);font-weight:700}
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
.ml-brand{font-weight:600;margin-right:auto;display:flex;gap:8px;align-items:baseline;min-width:0;position:relative;z-index:40}
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
.ml-indexbar{display:flex;gap:6px;padding:8px 14px;justify-content:safe space-between}
.ml-hwrap{position:relative;border-bottom:1px solid var(--dsw-alias-border-l1);flex:none}
.ml-hscroll{overflow-x:auto;display:flex;scrollbar-width:none;touch-action:pan-x;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;outline:none}
.ml-hscroll:focus-visible{box-shadow:inset 0 0 0 2px var(--dsw-alias-brand-primary)}
.ml-hscroll::-webkit-scrollbar{width:8px;height:8px}
.ml-hscroll::-webkit-scrollbar-track{background:transparent}
.ml-hscroll::-webkit-scrollbar-thumb{background:transparent;border-radius:4px;border:2px solid transparent;background-clip:content-box}
.ml-hscroll:hover::-webkit-scrollbar-thumb,.ml-hscroll:focus::-webkit-scrollbar-thumb{background:var(--dsw-alias-border-l2)}
.ml-hscroll::-webkit-scrollbar-thumb:hover{background:var(--dsw-alias-label-secondary)}
.ml-hwrap::before,.ml-hwrap::after{content:'';position:absolute;top:0;bottom:0;width:26px;pointer-events:none;z-index:2;opacity:0;transition:opacity .18s}
.ml-hwrap::before{left:0;background:linear-gradient(90deg,var(--ml-fade,var(--dsw-alias-bg-base)),transparent)}
.ml-hwrap::after{right:0;background:linear-gradient(270deg,var(--ml-fade,var(--dsw-alias-bg-base)),transparent)}
.ml-hwrap.ml-finrow{border-bottom:0;--ml-fade:var(--dsw-alias-bg-layer-1)}
.ml-hwrap:has([data-f="l"])::before,.ml-hwrap:has([data-f="b"])::before,
.ml-hwrap:has([data-f="r"])::after,.ml-hwrap:has([data-f="b"])::after{opacity:1}
.ml-hwrap .ml-hscroll{scrollbar-color:var(--dsw-alias-border-l2) transparent}
.ml-hwrap:not(:hover):not(:focus-within) .ml-hscroll{scrollbar-color:transparent transparent}
.ml-idx{flex:none;display:flex;flex-direction:column;gap:2px;padding:6px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);min-width:118px}
.ml-idx b{font-size:12px;font-weight:500;color:var(--dsw-alias-label-secondary)}
.ml-idx span{font-size:14px;font-weight:600}
.ml-idx i{font-size:11px;font-style:normal}
.ml-main{display:grid;grid-template-columns:320px minmax(0,1fr) 350px;gap:10px;padding:10px 14px;flex:1;min-height:0}
.ml-split{cursor:col-resize;background:var(--dsw-alias-border-l1);border-radius:3px;transition:background .15s;touch-action:none;margin:2px -7px}
.ml-split:hover,.ml-split:active{background:var(--dsw-alias-brand-primary)}
@font-face{font-family:'MLPixel';src:url('/market-lens/font?v=0.9.0') format('woff2');font-display:swap}
.ml-led{grid-column:1/-1;position:relative;background:#05080f;border:1px solid #12283f;border-radius:12px;display:flex;flex-direction:column;height:calc(100vh - 104px);min-height:360px;overflow:hidden;color:#d7e9ff;font-family:'MLPixel',ui-monospace,'Cascadia Mono',Consolas,monospace}
.ml-led .num,.ml-led .nm b,.ml-ticker span{letter-spacing:1px}
.ml-ticker{display:flex;gap:40px;padding:9px 12px;white-space:nowrap;overflow:hidden;border-bottom:1px solid #12283f;background:#03060b;flex:none;animation:mltape 45s linear infinite;width:max-content}
.ml-ticker:hover{animation-play-state:paused}
@keyframes mltape{to{transform:translateX(-50%)}}
.ml-ticker span{font-size:14px;text-shadow:0 0 3px currentColor;letter-spacing:1px}
.ml-ledstage{flex:1;min-height:0;position:relative;background:#05080f}
.ml-ledscreen{position:absolute;inset:0;display:block;cursor:crosshair}
.ml-led .up{color:color-mix(in srgb,var(--ml-up) 68%,#fff)}
.ml-led .down{color:color-mix(in srgb,var(--ml-down) 68%,#fff)}
.ml-hall{position:relative;flex:none;display:inline-flex;align-items:center;gap:7px;padding:6px 14px;border-radius:11px;border:1px solid #a8781f;font:inherit;font-size:13px;font-weight:700;letter-spacing:3px;color:#3a2400;cursor:pointer;align-self:center;background-image:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.9) 48%,transparent 56%),linear-gradient(150deg,#7a4f00,#ffd75e 42%,#fff3b8 55%,#e8b23a);background-size:250% 100%,100% 100%;background-position:190% 0,0 0;background-repeat:no-repeat,no-repeat;animation:mlhall-laser 3.4s linear infinite,mlhall-breath 2.6s ease-in-out infinite}
.ml-hall:hover{filter:brightness(1.12) saturate(1.1);transform:translateY(-1px);animation-duration:1.5s,1.3s}
.ml-hall:active{transform:translateY(1px)}
.ml-hall[aria-pressed="true"]{border-color:var(--ml-up);background-image:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.9) 48%,transparent 56%),linear-gradient(150deg,#5a2a00,#ff9d3e 45%,#ffd75e 70%,#b45a10)}
.ml-hall:focus-visible{outline:2px solid #ffd75e;outline-offset:2px}
.ml-hall::after{content:attr(data-tip);position:absolute;top:calc(100% + 8px);left:50%;transform:translateX(-50%) translateY(4px);white-space:nowrap;padding:6px 11px;border-radius:8px;background:#071426;color:#ffe9a8;font-size:11px;font-weight:400;letter-spacing:2px;border:1px solid #a8781f;box-shadow:0 4px 18px -4px rgba(0,0,0,.5),0 0 10px -2px #ffd75e;font-family:'MLPixel',monospace;opacity:0;pointer-events:none;transition:opacity .15s,transform .15s;z-index:41}
.ml-hall:hover::after{opacity:1;transform:translateX(-50%) translateY(0)}
.ml-hall svg{display:block}
@keyframes mlhallblink{50%{opacity:.15}}
.ml-hall .led{animation:mlhallblink 1.1s steps(2) infinite}
@keyframes mlhall-laser{0%{background-position:190% 0,0 0}100%{background-position:-90% 0,0 0}}
@keyframes mlhall-breath{0%,100%{box-shadow:0 0 5px -1px rgba(255,205,90,.55),inset 0 0 6px rgba(122,79,0,.35)}50%{box-shadow:0 0 18px 1px rgba(255,215,94,.85),inset 0 0 10px rgba(255,243,184,.45)}}
@media (prefers-reduced-motion:reduce){.ml-hall,.ml-hall .led{animation:none}}
.ml-palbtn{display:inline-flex;align-items:center;padding:6px 8px}
.ml-palbtn svg{display:block}
.ml-bub{transition:top .15s,right .15s}
.ml-tabs{display:flex;gap:2px}
.ml-tabs button{background:none;border:0;padding:5px 9px;border-radius:8px;font:inherit;font-size:12px;color:var(--dsw-alias-label-secondary);cursor:pointer}
.ml-tabs button[aria-selected="true"]{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-weight:600}
.ml-news-item .cmt{font-size:10px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.ml-root:not([data-wide="1"]) .ml-main{grid-template-columns:minmax(0,1fr);display:flex;flex-direction:column;overflow-y:auto}
.ml-root:not([data-wide="1"]) .ml-panelcol[data-col="chart"]{min-height:340px;flex:none}
.ml-panelcol{display:flex;flex-direction:column;gap:10px;min-height:0;min-width:0}
.ml-panel{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);display:flex;flex-direction:column;min-height:0;min-width:0;overflow:hidden}
.ml-panel>header{display:flex;gap:6px;align-items:center;padding:8px 10px;border-bottom:1px solid var(--dsw-alias-border-l1);flex-wrap:wrap;font-size:12px;color:var(--dsw-alias-label-secondary)}
.ml-panel>header .ml-title{font-weight:600;color:var(--dsw-alias-label-primary);margin-right:auto}
.ml-rows{overflow-y:auto;flex:1;min-height:0}
.ml-row{display:flex;align-items:center;gap:10px;position:relative;padding:9px 12px;margin:1px 5px;border-radius:11px;border-bottom:0;cursor:pointer;background:none;border-left:0;border-right:0;border-top:0;color:inherit;font:inherit;text-align:left;width:100%}
.ml-row .nm{flex:1 1 auto;min-width:0;display:flex;flex-direction:column}
.ml-row .nm b{font-weight:650;letter-spacing:.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ml-row .nm code{font-size:11px;color:var(--dsw-alias-label-secondary)}
.ml-row .nm .ad{font-size:11px;line-height:1.3}
.ml-row:hover{background:var(--dsw-alias-bg-layer-2)}
.ml-row[aria-current="true"]{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 11%,var(--dsw-alias-bg-layer-2));box-shadow:inset 3px 0 0 var(--dsw-alias-brand-primary),inset 0 0 0 1.5px color-mix(in srgb,var(--dsw-alias-brand-primary) 50%,transparent)}
.ml-row[aria-current="true"] .nm b{color:var(--dsw-alias-brand-primary)}
.ml-row .qt{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:3px;min-width:96px}
.ml-row .qt b{font-size:15.5px;font-weight:650}
.ml-row .qt .chips{display:flex;gap:5px;align-items:center}
.ml-row .qt .rm{font-size:10.5px;white-space:nowrap;color:var(--dsw-alias-label-secondary)}
.ml-badge{display:inline-block;padding:2px 8px;border-radius:7px;font-size:11.5px;font-weight:650;color:#fff;background:var(--dsw-alias-label-secondary);white-space:nowrap}
.ml-badge.up{background:var(--ml-up)}
.ml-badge.down{background:var(--ml-down)}
.ml-mktstat{flex:none;display:flex;align-items:center;gap:7px;padding:8px 14px;font-size:11px;color:var(--dsw-alias-label-secondary);border-top:1px solid var(--dsw-alias-border-l1)}
.ml-mktstat .dot{width:7px;height:7px;border-radius:50%;background:currentColor;flex:none}
.ml-mktstat.on{color:#1f9d55}
.ml-mktstat.lunch{color:#c98a00}
.ml-row .rm-x{position:absolute;top:6px;right:8px;visibility:hidden;z-index:2}
.ml-row:hover .rm-x{visibility:visible}
.ml-row .ml-pin{position:absolute;top:3px;left:4px;z-index:3;font-size:11px;line-height:1;padding:4px;border:0;background:none;cursor:pointer;opacity:0;transition:opacity .12s}
.ml-row:hover .ml-pin{opacity:.85}
.ml-row[aria-current="true"] .ml-pin{opacity:0}
.ml-row[aria-current="true"]:hover .ml-pin{opacity:.85}
.ml-row.pinned .ml-pin{opacity:.95}
.ml-row.pinned .nm{padding-left:16px}
.ml-bub{position:absolute;top:-6px;right:6px;min-width:16px;height:16px;padding:0 4px;border-radius:9px;background:var(--ml-up);color:#fff;font-size:10px;font-weight:700;line-height:16px;text-align:center;box-shadow:0 0 0 2px var(--dsw-alias-bg-layer-1),0 0 8px var(--ml-up);animation:mlbub 1.6s ease-in-out infinite;z-index:5}
.ml-row:hover .ml-bub{top:4px;right:30px}
.ml-row:has(.ml-bub):hover .rm-x{right:28px}
@keyframes mlbub{50%{transform:scale(1.13)}}
.ml-row .ml-spark{flex:none}
.ml-spark{width:56px;height:26px;display:block;overflow:visible}
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
.ml-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px 8px;padding:10px}
@media (max-width:1100px){.ml-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}
.ml-row.pinned{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 7%,transparent)}
.row-pin{opacity:0;margin-left:6px;cursor:pointer;font-size:10px;filter:grayscale(1)}
.ml-row:hover .row-pin{opacity:.55}
.row-pin.on{opacity:.9;filter:none}
@keyframes mltick{0%{background:color-mix(in srgb,currentColor 26%,transparent)}100%{background:transparent}}
.tick-up,.tick-down{animation:mltick .9s ease-out;border-radius:4px}
.ml-metric{flex:none;min-width:86px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:6px 9px;background:var(--dsw-alias-bg-layer-2)}
.ml-metric b{display:block;font-size:11px;font-weight:400;color:var(--dsw-alias-label-secondary)}
.ml-metric span{font-size:14px;font-weight:600}
.ml-chip{font-size:11px;padding:3px 9px;border-radius:999px;border:1px solid transparent;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);cursor:pointer}
.ml-chip[aria-pressed="true"]{background:color-mix(in srgb,var(--dsw-alias-bg-layer-2),var(--dsw-alias-label-primary) 18%);color:var(--dsw-alias-label-primary);font-weight:600}
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
.ml-news-item{display:flex;gap:8px;align-items:baseline;padding:9px 12px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.ml-news-item:last-child{border-bottom:0}
.ml-news-item a{color:inherit;text-decoration:none;font-weight:600;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
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
		function fmtBig(value, digits = 2) {
			if (value === null || value === void 0 || !Number.isFinite(value)) return '—';
			const abs = Math.abs(value);
			if (abs >= 1e8) return `${(value / 1e8).toFixed(digits)}亿`;
			if (abs >= 1e4) return `${(value / 1e4).toFixed(digits)}万`;
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
		const CLIENT_REV = '0.34.1';
		const diagQueue = [];
		let diagTimer = 0;
		// the host meta tells the real level; until then assume the shipped 'errors' default
		let diagMode = 'errors';
		const isDiagError = (ev) => ev === 'panel.crash' || ev === 'route.status' || ev === 'route.reject' || String(ev).endsWith('.fail');
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
			if (diagMode === 'off' || (diagMode !== 'full' && !isDiagError(ev))) return;
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

		/** Apple-style session strip: trading state by Beijing-time A-share rules */
		function MktStatus({ t }) {
			const [now, setNow] = React.useState(() => new Date());
			React.useEffect(() => {
				const timer = window.setInterval(() => setNow(new Date()), 30000);
				return () => window.clearInterval(timer);
			}, []);
			const mins = now.getHours() * 60 + now.getMinutes();
			const wd = now.getDay();
			const state = wd === 0 || wd === 6 ? 'closed' : mins >= 555 && mins < 570 ? 'pre' : mins >= 570 && mins < 690 ? 'on' : mins >= 690 && mins < 780 ? 'lunch' : mins >= 780 && mins <= 900 ? 'on' : 'closed';
			return h('div', { className: `ml-mktstat ${state}` },
				h('span', { className: 'dot' }),
				t(`mkt.${state}`),
				h('span', null, new Intl.DateTimeFormat(void 0, { month: 'short', day: 'numeric' }).format(now)));
		}

		function WatchRow({ instrument, quote, active, pinned, badge, onPin, onSelect, onRemove, t }) {
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
				onPin === void 0 ? null : h('span', {
					className: 'ml-pin' + (pinned === true ? ' on' : ''), role: 'button', tabIndex: -1,
					title: pinned === true ? t('list.unpin') : t('list.pin'),
					onClick: (event) => {
						event.stopPropagation();
						onPin(instrument.symbol);
					},
				}, '📍'),
				badge === null || badge === void 0 || badge === 0 || active === true ? null : h('span', { className: 'ml-bub', title: `${String(badge)} ${t('feed.badge')}` }, String(badge > 9 ? '9+' : badge)),
			h('span', { className: 'nm' },
					h('b', null, instrument.symbol),
					h('code', null, quote?.name ?? instrument.name ?? ''),
					advice === '' ? null : h('span', { className: `ad ${dirClass(Math.abs(pct) < 1 ? 0 : pct)}` }, t(advice)),
				),
			h(Spark, { symbol: instrument.symbol, pct }),
				h('span', { className: 'qt' },
					h('b', { key: String(quote?.price), className: dirClass(pct) + tick }, quote?.price === null || quote?.price === void 0 ? '—' : fmtNum(quote.price)),
					h('span', { className: 'chips' },
						h('span', { className: `ml-badge ${dirClass(pct)}`, title: quote?.stale === true ? t('list.staleHint') : void 0 }, quote?.change === null || quote?.change === void 0 ? '—' : fmtSigned(quote.change)),
						pct === null || pct === void 0 ? null : h('span', { className: 'rm' }, `${fmtSigned(pct)}%`)),
					h('span', { className: 'rm' }, quote === void 0 ? t('toolbar.error') : quote.amount === null || quote.amount === void 0 ? '—' : fmtBig(quote.amount)),
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
				['metric.floatCap', quote.floatMarketCap === null ? null : fmtBig(quote.floatMarketCap), null, ''],
				['metric.updated', quote.updatedAt === null || quote.updatedAt === void 0 ? null : new Date(quote.updatedAt).toLocaleTimeString(), null, ''],
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
					if (ctx2.roundRect !== void 0) {
						ctx2.beginPath();
						ctx2.roundRect(plotWidth + 2, ly - 8.5, axisWidth - 6, 17, 4);
						ctx2.fill();
					} else ctx2.fillRect(plotWidth + 2, ly - 8.5, axisWidth - 4, 17);
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
			// context tags: 20-bar extremes and volume expansion, read straight off the bars in hand
			if (dayBar !== void 0 && picked !== null) {
				const win = bars.slice(Math.max(0, picked - 19), picked + 1);
				const cs = win.map((b) => b.c).filter((v) => v !== null);
				if (dayBar.c !== null && cs.length >= 5) {
					if (dayBar.c >= Math.max(...cs)) dayCells.push(['day.hi20', '⚑', 'up']);
					else if (dayBar.c <= Math.min(...cs)) dayCells.push(['day.lo20', '⚑', 'down']);
				}
				const vs = win.map((b) => b.v).filter((v) => v !== null && v > 0);
				if (dayBar.v !== null && vs.length >= 6) {
					const base = vs.slice(0, -1).reduce((a, b) => a + b, 0) / (vs.length - 1);
					if (dayBar.v > base * 2) dayCells.push(['day.volUp', `×${(dayBar.v / base).toFixed(1)}`, '']);
				}
			}
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

		function newsTimeText(value, t) {
			if (typeof value !== 'string' || value === '') return '';
			const date = value.includes('T') ? new Date(value) : new Date(`${value.slice(0, 10)}T08:00:00`);
			if (Number.isNaN(date.getTime())) return value.slice(11, 16);
			const mins = (Date.now() - date.getTime()) / 60000;
			if (!(mins > 0)) return t('rel.now');
			if (mins <= 60) return t('rel.now');
			// same-day news keeps a precise clock; everything older goes relative
			if (mins < 1440 && date.getDate() === new Date().getDate()) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
			const n = (key, k) => String(t(key)).replace('{n}', k);
			if (mins < 10080) return n('rel.h', Math.floor(mins / 60));
			if (mins < 43200) return n('rel.d', Math.floor(mins / 1440));
			if (mins < 525600) return n('rel.w', Math.floor(mins / 10080));
			return n('rel.y', Math.floor(mins / 525600));
		}

		const SRC_KEYS = { 'sina-roll': 'news.src.sina', 'em-notice': 'news.src.em', 'em-search': 'news.src.em', guba: 'news.src.guba', em: 'news.src.em', eastmoney: 'news.src.em' };
		/** raw feed source id(s) like 'em-notice+guba+em-search' -> friendly localized label, unknown ids pass through */
		function srcLabel(raw, t) {
			const names = [...new Set(String(raw).split('+').map((part) => (SRC_KEYS[part] === void 0 ? null : t(SRC_KEYS[part]))).filter((x) => x !== null))];
			return names.length === 0 ? String(raw) : names.join('·');
		}
		function NewsCard({ news, posts, tab, setTab, symbol, t }) {
			const tabs = [['roll', t('news.title')], ['notice', t('feed.notice')], ['posts', t('feed.posts')]];
			const list = tab === 'roll' ? news.items : tab === 'notice' ? posts.notice : posts.posts;
			const busy = tab === 'roll' ? news.state === 'busy' && news.items.length === 0 : posts.state === 'busy';
			return h('section', { className: 'ml-panel', style: { flex: 1, minHeight: 140 } },
				h('header', null,
					symbol === null ? h('span', { className: 'ml-title' }, t('news.title'))
						: h('span', { className: 'ml-tabs', role: 'tablist' }, tabs.map(([id, label]) => h('button', {
							key: id, type: 'button', role: 'tab', 'aria-selected': tab === id,
							onClick: () => setTab(id),
						}, label))),
					tab === 'roll' && (news.source === '' || news.source === void 0 || news.source === 'none') ? null
						: h('span', null, srcLabel(tab === 'roll' ? news.source : posts.source ?? 'em', t))),
				busy ? h('div', { className: 'ml-pad' }, t('news.loading'))
					: symbol === null && tab !== 'roll' ? h('div', { className: 'ml-pad' }, t('feed.pick'))
						: list.length === 0 ? h('div', { className: 'ml-pad' }, t('news.empty'))
							: h('div', { className: 'ml-news' },
								list.map((item, index) => h('div', { className: 'ml-news-item', key: `${String(item.time)}|${index}` },
									item.url === '' ? h('span', null, item.title)
										: h('a', { href: item.url, target: '_blank', rel: 'noreferrer' }, item.title),
									item.comments === void 0 || item.comments === null || item.comments === 0 ? null : h('span', { className: 'cmt' }, `💬${String(item.comments)}`),
									newsTimeText(item.time, t) === '' ? null : h('time', null, newsTimeText(item.time, t))))));
		}

		// ---------- panel ----------
		function createPanel(t) {
			function Panel() {
				const rootRef = React.useRef(null);
				const [wide, setWide] = React.useState(() => (typeof document === 'undefined' ? true : document.documentElement.clientWidth >= 900));
				const [meta, setMeta] = React.useState(null);
				const [watchlist, setWatchlist] = React.useState(() => loadLs(LS_WATCH, null));
				const [prefs, setPrefs] = React.useState(() => ({ pinned: [], ...loadLs(LS_PREFS, { palette: 'redup', filter: 'all', sort: 'default', showMa: true, density: 'std' }) }));
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
				const [feedTab, setFeedTab] = React.useState('roll');
				const [posts, setPosts] = React.useState({ state: 'idle', notice: [], posts: [], news: [], source: '' });
				React.useEffect(() => {
					if (selected === null) return void 0;
					const name = quotes.get(selected)?.name ?? '';
					let dead = false;
					setPosts((current) => ({ ...current, state: 'busy' }));
					api('posts', { symbol: selected, name }).then((body) => {
						if (!dead) setPosts({ state: 'ok', notice: body.notice ?? [], posts: body.posts ?? [], news: body.news ?? [], source: body.source ?? '' });
					}, () => {
						if (!dead) setPosts((current) => ({ ...current, state: 'error' }));
					});
					return () => {
						dead = true;
					};
					// refetches when the selection changes; name reads the live quote once
				}, [selected]);
				const [seenNews, setSeenNews] = React.useState(() => loadLs(LS_NEWS, {}));
				const [updates, setUpdates] = React.useState({});
				function pick(symbol) {
					setSelected(symbol);
					if (symbol === null || symbol === void 0) return;
					setSeenNews((current) => {
						const next = { ...current, [symbol]: new Date().toISOString() };
						saveLs(LS_NEWS, next);
						return next;
					});
				}
				// unread-filings poll: one light batched call every three minutes
				React.useEffect(() => {
					const symbols = (watchlist ?? (meta === null ? [] : meta.defaultWatchlist)).join(',');
					if (symbols === '') return void 0;
					let dead = false;
					const pull = () => api('updates', { symbols }).then((body) => {
						if (!dead) setUpdates(Object.fromEntries((body.items ?? []).map((item) => [item.symbol, item])));
					}, () => void 0);
					pull();
					const timer = window.setInterval(pull, 180000);
					return () => {
						dead = true;
						window.clearInterval(timer);
					};
				}, [meta === null ? '' : (watchlist ?? meta.defaultWatchlist).join(',')]);
				const badgeFor = (symbol) => {
					const entry = updates[symbol];
					if (entry === void 0 || entry.notice === void 0 || symbol === selected) return 0;
					const since = Date.parse(seenNews[symbol] ?? '') || 0;
					return entry.notice.filter((item) => (Date.parse(item.time ?? '') || 0) > since).length;
				};
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
						pick(symbol);
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
							if (value?.diag === 'full' || value?.diag === 'errors' || value?.diag === 'off') diagMode = value.diag;
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
				const newsFailRef = React.useRef(0); // streak survives symbol switches so the backoff holds
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
							newsFailRef.current = 0;
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
										newsFailRef.current = 0;
										setNews({ state: 'ok', items: globalBody.items, source: globalBody.source });
									}
								} catch {
									if (!stopped) {
										newsFailRef.current++;
										noteNews('error', null);
										setNews((current) => ({ ...current, state: 'error' }));
									}
								}
							} else if (!stopped) {
								newsFailRef.current++;
								noteNews('error', null);
								setNews((current) => ({ ...current, state: 'error' }));
							}
						} finally {
							if (!stopped) timer = window.setTimeout(() => void load(keyword), newsFailRef.current >= 3 ? 300000 : 60000);
						}
					};
					// the backoff also gates the first fetch: a fresh mount (symbol switch)
					// must not bypass the 5-minute cooldown while the upstream is down
					const firstKeyword = selectedName === selected ? '' : selectedName;
					if (newsFailRef.current >= 3) timer = window.setTimeout(() => void load(firstKeyword), 300000);
					else void load(firstKeyword);
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
					pick(symbol);
					setSearch((current) => ({ ...current, q: '', items: [], open: false }));
				};
				const removeFromWatch = (symbol) => {
					setWatchlist((current) => (current ?? []).filter((item) => item !== symbol));
					if (selected === symbol) {
						const rest = (watchlist ?? []).filter((item) => item !== symbol);
						pick(rest[0] ?? null);
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
				const [cols, setCols] = React.useState(() => prefs.cols ?? { l: 320, r: 350 });
				const [led, setLed] = React.useState(false);
				function beginSplit(side) {
					return (event) => {
						event.preventDefault();
						const startX = event.clientX;
						const start = side === 'l' ? cols.l : cols.r;
						let next = { ...cols };
						const move = (ev) => {
							const delta = ev.clientX - startX;
							next = side === 'l'
								? { ...cols, l: Math.max(260, Math.min(460, start + delta)) }
								: { ...cols, r: Math.max(280, Math.min(560, start - delta)) };
							setCols(next);
						};
						const up = () => {
							window.document.removeEventListener('pointermove', move);
							window.document.removeEventListener('pointerup', up);
							setPrefs((current) => ({ ...current, cols: next }));
							diag('panel.split', { side: side, l: next.l, r: next.r });
						};
						window.document.addEventListener('pointermove', move);
						window.document.addEventListener('pointerup', up);
					};
				}

				return h('div', { className: 'ml-root', ref: rootRef, 'data-wide': wide ? '1' : '0', 'data-pal': prefs.palette },
					h('header', { className: 'ml-top' },
						h('span', { className: 'ml-brand' }, t('panel.title'), h('small', null, t('notice')),
							h('button', {
								type: 'button', className: 'ml-hall', 'aria-pressed': led,
								'data-tip': t('board.tip'), title: t('board.title'),
								onClick: () => setLed((current) => !current),
							},
								h('svg', { width: 16, height: 16, viewBox: '0 0 16 16', 'aria-hidden': true },
									h('rect', { x: 0, y: 0, width: 16, height: 16, rx: 3, fill: '#3a2400' }),
									h('rect', { x: 2.5, y: 6, width: 2.5, height: 6.5, fill: 'var(--ml-down)' }),
									h('rect', { x: 6.5, y: 3, width: 2.5, height: 9.5, fill: 'var(--ml-up)' }),
									h('rect', { x: 11.5, y: 11.5, width: 2.5, height: 2.5, fill: '#fff3b8', className: 'led' })),
								t('board.short'))),
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
								type: 'button', className: 'ml-btn ml-palbtn', 'aria-expanded': palOpen,
								'aria-label': `${t('toolbar.palette')} · ${t(`palette.${prefs.palette in PALETTES ? prefs.palette : 'redup'}`)}`,
								title: `${t('toolbar.palette')} · ${t(`palette.${prefs.palette in PALETTES ? prefs.palette : 'redup'}`)}`,
								onClick: () => setPalOpen((current) => !current),
							},
								h('svg', { width: 16, height: 16, viewBox: '0 0 16 16', 'aria-hidden': true },
									h('rect', { x: 1, y: 1, width: 6.5, height: 14, rx: 2, fill: 'var(--ml-up)' }),
									h('rect', { x: 8.5, y: 1, width: 6.5, height: 14, rx: 2, fill: 'var(--ml-down)' }))),
							palOpen ? h('div', { className: 'ml-palmenu' },
								Object.entries(PALETTES).map(([id, pal]) => h('button', {
									key: id, type: 'button',
									onClick: () => {
										setPrefs((current) => ({ ...current, palette: id }));
										setPalOpen(false);
									},
								}, h('i', null, h('s', { style: { background: pal.up } }), h('s', { style: { background: pal.down } })), t(`palette.${id}`)))) : null),
						h('button', {
							type: 'button', className: 'ml-btn ml-palbtn', 'aria-pressed': prefs.density === 'tiny',
							title: `${t('toolbar.density')} · ${t(prefs.density === 'tiny' ? 'density.tiny' : 'density.std')}`,
							onClick: () => setPrefs((current) => ({ ...current, density: current.density === 'tiny' ? 'std' : 'tiny' })),
						}, h('svg', { width: 16, height: 16, viewBox: '0 0 16 16', 'aria-hidden': true },
							Array.from({ length: (prefs.density === 'tiny' ? 4 : 2) ** 2 }, (_cell, i) => {
								const side = prefs.density === 'tiny' ? 4 : 8;
								return h('rect', { key: i, x: (i % (16 / side)) * side + 0.5, y: Math.floor(i / (16 / side)) * side + 0.5, width: side - 1, height: side - 1, fill: '#8fb3d9' });
							}))),
						h('button', { type: 'button', className: 'ml-btn', onClick: () => setImporting(true) }, t('toolbar.import')),
						h('span', { className: 'ml-status', 'data-err': refresh.state === 'error' ? '1' : '0' },
							refresh.state === 'busy' ? t('toolbar.refreshing') : refresh.state === 'error' ? t('toolbar.error') : refresh.at === 0 ? '' : new Date(refresh.at).toLocaleTimeString()),
					),
					led === true ? null : h(IndexBar, { indexBar: meta?.indexBar ?? [], quotes }),
					metaError !== null ? h('div', { className: 'ml-errorbar' }, `${t('meta.error')}（${metaError}）`) : null,
					h('div', {
						className: 'ml-main',
						style: led === true ? { gridTemplateColumns: 'minmax(0,1fr)' } : wide ? { gridTemplateColumns: `${cols.l}px 5px minmax(0,1fr) 5px ${cols.r}px` } : void 0,
					},
					led === true ? h(LedBoard, {
						rows: sorted, quotes, seenQuote, meta, t,
						scrollVpx: meta?.scrollVpx,
						tiny: prefs.density === 'tiny',
						ledUp: PALETTES[prefs.palette]?.up ?? PALETTES.redup.up,
						ledDown: PALETTES[prefs.palette]?.down ?? PALETTES.redup.down,
						getKline: (symbol) => api('kline', { symbol, period: 'day', count: 160 }),
						onPick: (symbol) => {
							pick(symbol);
						},
					}) : null,
					led === true ? null : showList ? h('div', { className: 'ml-panelcol', 'data-col': 'list' },
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
											badge: badgeFor(row.symbol),
											active: row.symbol === selected,
											onSelect: (symbol) => {
												pick(symbol);
												setView('detail');
											},
											onRemove: removeFromWatch,
											t,
										})))),
								h(MktStatus, { t }),
						) : null,
						led === true || wide === false ? null : h('div', { className: 'ml-split', onPointerDown: beginSplit('l'), role: 'separator', 'aria-orientation': 'vertical', 'aria-label': t('board.split') }),
						led === true ? null : showDetail ? h('div', { className: 'ml-panelcol', 'data-col': 'chart' },
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
						led === true || wide === false ? null : h('div', { className: 'ml-split', onPointerDown: beginSplit('r'), role: 'separator', 'aria-orientation': 'vertical', 'aria-label': t('board.split') }),
						led === true ? null : showDetail ? h('div', { className: 'ml-panelcol', 'data-col': 'detail' },
							h('section', { className: 'ml-panel' },
								h('header', null, h('span', { className: 'ml-title' }, t('detail.title'))),
								selectedQuote === void 0 ? h('div', { className: 'ml-pad' }, t('toolbar.error'))
									: h(Metrics, { quote: selectedQuote, t })),
							h(AlertsCard, { alerts: alertsList, selected, quote: selectedQuote, onAdd: addAlert, onDelete: dropAlert, t }),
							h(FinancialCard, { fin, t }),
							h(NewsCard, { news, posts, tab: feedTab, setTab: setFeedTab, symbol: selected, t }),
						) : null),
					importing ? h(ImportDialog, { onImport: importTokens, onClose: () => setImporting(false), t }) : null,
				);
			}
			return Panel;
		}

		// ---------- lamp-matrix screen engine (the Exchange Hall renderer) ----------
		// game pipeline: the planner emits prims, the painter bakes two raw
		// content textures (static wall, tape period); the WebGL2 compositor
		// draws every bulb procedurally at display resolution and runs the
		// post-fx chain per frame - scroll, scan glow, flicker, bleed and
		// vignette are shader uniforms, zero rebakes per animation. Without
		// WebGL2 a plain-canvas fallback composites the same two textures.
		const PITCH = 3.5;        // css px per bulb cell inside the off-screen wall (3px bulb + 0.5px seam)
		const BULB = 3;           // bulb footprint in wall px
		const PSZ = 4;            // sprite sheet size (integer canvas)
		const LPX = (v) => Math.round(v); // cell px snap: paint and sampling share this lattice
		// the master board is specced like a real one: a fixed 800 x 450 bulb
		// matrix, rendered and baked off-screen at 1x, then the whole picture
		// is scaled proportionally into the container (letterboxed, never cropped)
		const WALL_COLS = 800;
		const WALL_ROWS = 450;
		const WALL_W_PX = Math.round(WALL_COLS * PITCH); // 3584
		const WALL_H_PX = Math.round(WALL_ROWS * PITCH); // 2688
		const OFF_BG = '#05080f';
		// UCDOS-style bitmap font (HZK16 + ASC16, 8178 glyphs) served by
		// /market-lens/lampfont: one bitmap dot = exactly one bulb, no AA, razor
		// legible. Loaded once; until ready the wall shows nothing but bulbs.
		const LAMP = { ready: false, asc: null, hz: null, map: null };
		let lampPromise = null;
		function loadLamp() {
			if (lampPromise === null) {
				lampPromise = window.fetch(BASE + '/lampfont').then((r) => {
					if (!r.ok) throw new Error(String(r.status));
					return r.arrayBuffer();
				}).then((buf) => {
					const u = new Uint8Array(buf);
					const dv = new DataView(buf);
					if (u[0] !== 0x4d || u[1] !== 0x4c || u[2] !== 0x4c || u[3] !== 0x50) throw new Error('bad lamp.bin');
					const ascLen = dv.getUint32(4, true);
					const hzLen = dv.getUint32(8, true);
					LAMP.asc = u.subarray(16, 16 + ascLen);
					LAMP.hz = u.subarray(16 + ascLen, 16 + ascLen + hzLen);
					LAMP.map = new Uint16Array(buf.slice(16 + ascLen + hzLen));
					LAMP.ready = true;
				}, () => {
					lampPromise = null;
				});
			}
			return lampPromise;
		}
		const ledCharW = (ch, tiny) => tiny ? 9 : (ch.codePointAt(0) < 0x100 ? 9 : 17);
		/** dot-advance width of a string, in bulbs */
		function ledTextW(text, tiny) {
			let w = 0;
			for (const ch of text) w += ledCharW(ch, tiny);
			return Math.max(0, w - 1);
		}
		// std draws the cell as stored (16x16 Han / 8x16 ASCII); tiny folds the
		// bitmap 2x2 (OR) down to 8x8 - the classic compact terminal cut
		function ledText(cx, x, y, text, color, rightAt, tiny) {
			let px = rightAt === void 0 ? x : rightAt - ledTextW(text, tiny) * PITCH;
			cx.fillStyle = color;
			for (const ch of text) {
				const code = ch.codePointAt(0);
				if (code < 0x100) {
					const o = code * 16;
					for (let row = 0; row < 16; row++) {
						let bits = LAMP.asc[o + row];
						if (tiny === true) {
							if ((row & 1) === 1) continue;
							bits |= LAMP.asc[o + row + 1];
						}
						if (bits === 0) continue;
						for (let bx = 0; bx < 8; bx++) if (((bits >> (7 - bx)) & 1) === 1) cx.fillRect(LPX(px + bx * PITCH), LPX(y + (tiny === true ? row >> 1 : row) * PITCH), BULB, BULB);
					}
					px += 9 * PITCH;
					continue;
				}
				const cell = code < 0x10000 ? LAMP.map[code] : 0;
				if (cell > 0) {
					const off = (cell - 1) * 32;
					if (tiny !== true) {
						for (let row = 0; row < 16; row++) {
							const bits = (LAMP.hz[off + row * 2] << 8) | LAMP.hz[off + row * 2 + 1];
							if (bits === 0) continue;
							for (let bx = 0; bx < 16; bx++) if (((bits >> (15 - bx)) & 1) === 1) cx.fillRect(LPX(px + bx * PITCH), LPX(y + row * PITCH), BULB, BULB);
						}
						px += 17 * PITCH;
					} else {
						for (let row = 0; row < 16; row += 2) {
							const bits = ((LAMP.hz[off + row * 2] << 8) | LAMP.hz[off + row * 2 + 1])
								| ((LAMP.hz[off + row * 2 + 2] << 8) | LAMP.hz[off + row * 2 + 3]);
							for (let bx = 0; bx < 16; bx += 2) if ((((bits >> (15 - bx)) & 1) | ((bits >> (14 - bx)) & 1)) === 1) cx.fillRect(LPX(px + (bx >> 1) * PITCH), LPX(y + (row >> 1) * PITCH), BULB, BULB);
						}
						px += 9 * PITCH;
					}
				} else px += 9 * PITCH;
			}
		}
		// ---------- GPU wall compositor: bake once, post-fx every frame ----------
		const SCROLL_DEFAULT = 28; // wall px/s (~8 lamp rows/s) when the host does not configure scrollVpx
		const VERT_SRC = 'attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }';
		const FRAG_SRC = [
		'precision highp float;',
		'uniform vec2 iRes; uniform vec4 uGeo; uniform vec4 uBand; uniform vec4 uPx; uniform vec2 uSzT;',
		'uniform float uScroll; uniform float uTime;',
		'uniform sampler2D uStatic; uniform sampler2D uTape;',
		'vec3 tap5(sampler2D s, vec2 sz, vec2 wp) {',
		'  vec2 uv = wp / sz; vec2 pu = 1.0 / sz; vec3 c = texture2D(s, uv).rgb;',
		'  c = max(c, texture2D(s, uv + vec2(pu.x, 0.0)).rgb);',
		'  c = max(c, texture2D(s, uv - vec2(pu.x, 0.0)).rgb);',
		'  c = max(c, texture2D(s, uv + vec2(0.0, pu.y)).rgb);',
		'  c = max(c, texture2D(s, uv - vec2(0.0, pu.y)).rgb);',
		'  return c;',
		'}',
		'void main() {',
		'  vec2 f = vec2(gl_FragCoord.x, iRes.y - gl_FragCoord.y);',
		'  vec2 w = (f - uGeo.xy) / uGeo.z;',
		'  if (w.x < 0.0 || w.y < 0.0 || w.x >= uPx.z || w.y >= uPx.w) { gl_FragColor = vec4(0.016, 0.027, 0.051, 1.0); return; }',
		'  vec2 cell = floor(w / uPx.x);',
		'  vec2 ctr = (cell + 0.5) * uPx.x;',
		'  vec2 dv = w - (cell + 0.5) * uPx.x;',
		'  float dm = (length(dv) - 0.5 * uPx.y) * uGeo.z;',
		'  float core = smoothstep(0.35, -0.35, dm);',
		'  float dOut = max(dm, 0.0);',
		'  float halo = exp(-dOut * dOut * 5.0);',
		'  float inBand = step(uBand.x, ctr.y) * step(ctr.y, uBand.x + uBand.y);',
		'  vec2 tp = vec2(ctr.x, mod(ctr.y - uBand.x + uScroll, uBand.z));',
		'  vec3 lit = mix(tap5(uStatic, uPx.zw, ctr), tap5(uTape, uSzT, tp), inBand);',
		'  float lum = max(lit.r, max(lit.g, lit.b));',
		'  vec3 vivid = min(lit * 1.35, vec3(1.0));',
		'  float breath = 0.97 + 0.03 * sin(uTime * 1.1 + cell.x * 0.05);',
		'  vec3 base = mix(vec3(0.014, 0.022, 0.040), vec3(0.045, 0.09, 0.155), core);',
		'  float litAmt = smoothstep(0.05, 0.18, lum);',
		'  vec3 col = mix(base, vivid * breath, core * litAmt);',
		'  col += vivid * halo * 0.34 * litAmt * (1.0 - core);',
		'  vec2 bwn = vec2(w.x, mod(w.y - uBand.x + uScroll, uBand.z)) / uSzT;',
		'  vec3 bleed = mix(texture2D(uStatic, w / uPx.zw).rgb, texture2D(uTape, bwn).rgb, inBand);',
		'  col += bleed * 0.12;',
		'  float hh = fract(sin(dot(cell + vec2(floor(uTime * 3.0) * 17.0, floor(uTime * 2.0) * 31.0), vec2(127.1, 311.7))) * 43758.545);',
		'  col *= mix(0.93, 1.05, hh);',
		'  col *= mix(1.0, 0.15, step(hh, 0.002));',
		'  col *= mix(1.0, 1.5, step(0.9978, hh));',
		'  float wave = 0.5 + 0.5 * sin(cell.y * 0.35 - uTime * 1.7);',
		'  col *= 0.994 + 0.006 * wave;',
		'  float sy = fract(uTime * 0.07) * (uPx.w + 240.0) - 120.0;',
		'  col += vec3(0.05, 0.085, 0.12) * exp(-pow((w.y - sy) * 0.018, 2.0)) * (0.4 + 0.6 * core);',
		'  float refl = 0.5 + 0.5 * sin(dot(w, vec2(0.9, 1.4)) - uTime * 0.31);',
		'  col += vec3(0.08, 0.11, 0.16) * smoothstep(0.985, 1.0, refl) * 0.30;',
		'  vec2 vq = w / uPx.zw - 0.5;',
		'  col *= 1.0 - dot(vq, vq) * 0.35;',
		'  gl_FragColor = vec4(min(col, vec3(1.0)), 1.0);',
		'}',
	].join('\n');
		function wallGL(gl) {
			const sh = (type, s) => { const o = gl.createShader(type); gl.shaderSource(o, s); gl.compileShader(o); return o; };
			const prog = gl.createProgram();
			gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT_SRC));
			gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG_SRC));
			gl.linkProgram(prog);
			if (gl.getProgramParameter(prog, gl.LINK_STATUS) !== true) { diag('panel.crash', { stage: 'wallgl', msg: String(gl.getProgramInfoLog(prog)) }); return null; }
			gl.useProgram(prog);
			const buf = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, buf);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
			const al = gl.getAttribLocation(prog, 'aPos');
			gl.enableVertexAttribArray(al);
			gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0);
			const U = {};
			['iRes', 'uGeo', 'uBand', 'uPx', 'uSzT', 'uScroll', 'uTime', 'uStatic', 'uTape'].forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });
			gl.uniform1i(U.uStatic, 0);
			gl.uniform1i(U.uTape, 1);
			return { prog, U, buf };
		}

		/**
		 * The hall itself: a fixed viewport of N quote rows (computed from the
		 * real height), scrolling the whole tape up one seamless LED row per step; the
		 * lit row expands the chart band, which never moves. Page wipes are gone:
		 * chart strip; hover pauses and grabs, click returns to the desk.
		 */
		// layout planner for the bulb wall: pure coordinates, shared by the
		// browser painter and by the offline self-check renderer
		// (scripts/led-shot.mjs) - one source of truth for both.
		// prims: {t:'x',x,y,r,c,s} text (r = right-align rail or null)
		//        {t:'f',x,y,w,h,c,a} filled rect
		function ledPlan(env) {
			// THE BULB IS THE UNIT OF LAYOUT: everything inside counts bulb cells;
			// resolution is a product (cells x pitch), never an input. The wall
			// geometry is env.cols (bulb columns the container fits at P px each);
			// column gutters sit on a 960-cell basis (= a 1920 board at the classic
			// 2px lattice), so a wall only goes full five-zone at 960+ columns.
			const P = env.P;
			const C = env.cols;
			const X = (c) => Math.round(c * P);
			const G = env.tiny === true ? 8 : 16; // glyph height in cells
			const TH = G + 3;
			const FH = G + 3;
			const RTOP = TH + G + 4;
			const upC = env.ledUp;
			const dnC = env.ledDown;
			const wide = C >= 960;
			const u = (v) => Math.round((v * C) / 960);
			const prims = [];
			const txt = (x, y, s, c, r) => { prims.push({ t: 'x', x: X(x), y: X(y), r: r === void 0 ? null : X(r), c, s }); };
			const box = (x, y, w, h, c, a) => { prims.push({ t: 'f', x: X(x), y: X(y), w: Math.max(1, X(w)), h: Math.max(1, X(h)), c, a: a === void 0 ? 1 : a }); };
			const pctColor = (p) => (p === null ? '#cfe6ff' : p > 0 ? upC : p < 0 ? dnC : '#8fb3d9');
			const pitchC = env.pitchC;
			const CH = env.chartC;
			// right rails: full 6 columns on wide walls; 440+ compact brings back
			// the prev-close; below 353 cells the wall is a zoom tier and keeps
			// only name, price and pct (code moves out of the way). Gutters are
			// sized for the widest real values plus breathing room.
			const two = C < 353;
			const four = C >= 440;
			const rails = wide ? [458, 528, 598, 668, 733, 803].map(u) : two ? [C - 70, C - 4] : four ? [C - 383, C - 262, C - 140, C - 4] : [C - 141, C - 81, C - 4];
			const pick = wide ? [0, 1, 2, 3, 4, 5] : two ? [3, 4] : four ? [0, 3, 4, 5] : [3, 4, 5];
			const MXU = wide ? u(235) : 0;
			const nameX = MXU + 10;
			const codeX = wide ? u(315) : 85;
			const tableR = wide ? u(815) : C - 4;
			// title bar + wall clock; on compact walls the index folds into a
			// one-liner right after the board name, clear of the clock rail
			txt(4, 1, env.title, '#ffd75e');
			txt(0, 1, env.clock, '#ffd75e', C - 4);
			if (env.idx !== null) {
				const ix = env.idx;
				if (!wide && C >= 353) {
					txt(4 + env.titleC + 12, 1, `${String(ix.name).slice(0, 4)} ${ix.priceF} ${ix.pctF}`, pctColor(ix.pct), C - 52);
				} else if (wide) {
					txt(4, TH + 1, String(ix.name).slice(0, 8), '#ff6a5e');
					[[env.L('panel.last'), ix.priceF, ix.price], [env.L('board.col.high'), ix.highF, ix.high], [env.L('board.col.low'), ix.lowF, ix.low], [env.L('board.col.chgPct'), ix.pctF, ix.pct]].forEach((cellv, k) => {
						const lx0 = k % 2 === 0 ? 4 : u(118);
						const ly = TH + 5 + G + Math.floor(k / 2) * (G + 3);
						txt(lx0, ly, cellv[0], '#3f618a');
						txt(lx0 + env.wC(cellv[0]) + 2, ly, cellv[1] === null ? '—' : cellv[1], cellv[2] === null ? '#8fb3d9' : pctColor(cellv[2]));
					});
					const iTop = TH + 5 + 2 * (G + 3) + G;
					const iBot = env.hC - FH - CH - 4;
					if (env.idxBars.length > 1 && iBot > iTop + 10) {
						const pts = env.idxBars;
						const lru = u(222) - 4;
						const lo = Math.min(...pts.map((b2) => b2.c));
						const hi = Math.max(...pts.map((b2) => b2.c));
						const span = hi - lo || 1;
						const iRows = Math.max(4, iBot - iTop - 1);
						let pY = null;
						for (let col = 0; col < lru; col++) {
							const idx = Math.min(pts.length - 1, Math.round((col / lru) * (pts.length - 1)));
							const lvl = Math.max(1, Math.round(((pts[idx].c - lo) / span) * iRows));
							const yTop = iTop + (iRows - lvl);
							if (pY !== null && pY !== yTop) box(4 + col, Math.min(pY, yTop), 1, Math.abs(pY - yTop) + 1, '#ffd75e', 0.7);
							box(4 + col, yTop, 1, 1, '#ffd75e');
							pY = yTop;
						}
						txt(4, iBot + 1, pts[0].ax, '#3f618a');
						txt(0, iBot + 1, pts[pts.length - 1].ax, '#3f618a', u(222) - 2);
					}
				}
			}
			// main table header
			txt(nameX, TH + 1, env.L('board.col.instrument'), '#ff6a5e');
			if (!two) txt(codeX, TH + 1, env.L('board.col.code'), '#ff6a5e');
			pick.forEach((ci, j) => txt(0, TH + 1, env.colLabels[ci], '#ff6a5e', rails[j] - 2));
			// tape: the rows group is ONE period of the watchlist. The GPU sampler
			// repeats it under the band, so what leaves the top edge re-enters at
			// the bottom pixel for pixel whatever the band height - the seam CPU
			// stepping showed (358-cell band over a 351-cell period) is gone
			const bandH = env.bandH;
			const txtR = (a, b, s, c, r) => { prims.push({ t: 'x', x: X(a), y: X(b), r: r === void 0 ? null : X(r), c, s, g: 'r' }); };
			const boxR = (a, b, w, h2, c, al) => { prims.push({ t: 'f', x: X(a), y: X(b), w: Math.max(1, X(w)), h: Math.max(1, X(h2)), c, a: al === void 0 ? 1 : al, g: 'r' }); };
			env.rows.forEach((row, i) => {
				const top = RTOP + i * pitchC;
				const y = top + Math.floor((pitchC - G) / 2);
				const color = pctColor(row.pct);
				const on = i === env.lit;
				if (on) boxR(MXU, top, tableR - MXU - 8, pitchC - 2, '#0e2c4c');
				if (on) txtR(MXU, y, '>', '#ffd75e');
				txtR(nameX, y, row.name, on ? '#ffffff' : color);
				if (!two) txtR(codeX, y, row.symbol, '#3f618a');
				pick.forEach((ci, jj) => txtR(0, y, row.cells[ci], ci === 3 || ci === 4 ? (on ? '#ffffff' : color) : on && ci === 5 ? '#ffffff' : row.cellColors[ci], rails[jj] - 2));
			});
			// twin ranking boards ride wide walls only
			if (wide && env.side.length > 0) {
				const SXU = u(815);
				const nSide = Math.max(1, Math.min(6, Math.floor((bandH - 2 * (G + 5)) / (2 * (G + 2)))));
				txt(SXU, TH + 1, env.L('led.gainers'), '#ff6a5e');
				env.side.slice(0, nSide).forEach((e, k) => {
					const yy = TH + 5 + G + k * (G + 2);
					txt(SXU + 4, yy, e.name, pctColor(e.pct));
					txt(0, yy, e.pctF, e.pct > 0 ? upC : dnC, C - 4);
				});
				txt(SXU, TH + 7 + G + nSide * (G + 2), env.L('led.losers'), '#ff6a5e');
				env.side.slice(-nSide).reverse().forEach((e, k) => {
					const yy = TH + 11 + 2 * G + nSide * (G + 2) + k * (G + 2);
					txt(SXU + 4, yy, e.name, pctColor(e.pct));
					txt(0, yy, e.pctF, e.pct < 0 ? dnC : upC, C - 4);
				});
			}
			// lit-row chart strip; hi/lo tick the reserved gutter, top and bottom
			const cy0 = RTOP + bandH; // chart band pinned below the fixed rows band, never moves
			if (env.chart !== null) {
				const ch = env.chart;
				const nCols = Math.max(8, tableR - 120);
				const priceRows = Math.max(6, Math.floor((CH - 8) * 0.62));
				const volRows = Math.max(3, Math.floor((CH - 8) * 0.30));
				let prevY = null;
				for (let col = 0; col < nCols; col++) {
					const idx = Math.min(ch.pts.length - 1, Math.round((col / nCols) * (ch.pts.length - 1)));
					const b2 = ch.pts[idx];
					const lvl = Math.max(1, Math.round(((b2.c - ch.lo) / ch.span) * priceRows));
					const yTop = cy0 + 2 + (priceRows - lvl);
					if (prevY !== null && prevY !== yTop) box(4 + col, Math.min(prevY, yTop), 1, Math.abs(prevY - yTop) + 1, ch.color, 0.7);
					box(4 + col, yTop, 1, 1, ch.color);
					if (col === nCols - 1) {
						box(4 + col - 1, yTop, 1, 1, ch.color);
						box(4 + col - 1, yTop - 1, 1, 1, ch.color);
						box(4 + col, yTop - 1, 1, 1, ch.color);
					}
					const vh = Math.max(1, Math.round(((b2.v === null ? 0 : b2.v) / ch.volMax) * volRows));
					for (let vk = 0; vk < vh; vk++) box(4 + col, cy0 + CH - 2 - (vk + 1), 1, 1, b2.down === true ? dnC : upC, 0.72 - 0.45 * (vk / Math.max(1, vh - 1)));
					prevY = yTop;
				}
				txt(0, cy0, ch.hiF, '#4d7aa8', tableR - 32);
				txt(0, cy0 + CH - G, ch.loF, '#4d7aa8', tableR - 32);
			} else {
				txt(6, cy0 + Math.floor((CH - G) / 2), 'LOADING', '#3f618a');
			}
			const fy = env.hC - FH + 1;
			txt(4, fy, env.footL, '#c8a24a');
			txt(0, fy, env.footR, '#c8a24a', C - 4);
			return { w: X(C), h: X(env.hC), prims, clip: { y: X(RTOP), h: Math.max(1, X(bandH)) }, tape: { y: X(RTOP), h: Math.max(1, X(pitchC * env.rows.length)) } };
		}

		function LedBoard({ rows, quotes, seenQuote, meta, onPick, getKline, ledUp, ledDown, tiny, t, scrollVpx }) {
			// fixed-spec wall: 800 x 450 bulb cells live off-screen; layout
			// constants (ledPlan) sit on a 960-cell basis so this matrix shows
			// the full five-zone master board, and the baked picture is scaled
			// to fit whatever glass the host hands us.
			const G_C = tiny === true ? 8 : 16;
			const TITLE_HC = G_C + 3;
			const FOOT_HC = G_C + 3;
			const ROWS_TOP_C = TITLE_HC + G_C + 4;
			const ROW_MIN_C = G_C + 6;
			const CHART_C = tiny === true ? 20 : 34; // must seat two G-cell text rows (hi/lo ticks)
			const COLS = WALL_COLS;
			const wrapRef = React.useRef(null);
			const canvasRef = React.useRef(null);
			const staticRef = React.useRef(null);
			const tapeCvRef = React.useRef(null);
			const dirtyRef = React.useRef(false);
			const glResRef = React.useRef(null);
			const geoPlanRef = React.useRef(null);
			const pitchRef = React.useRef(0);
			const topRef = React.useRef(0);
			const geoRef = React.useRef({ ox: 0, oy: 0, sc: 1 });
			const scrollPxRef = React.useRef(0);
			const pausedRef = React.useRef(false);
			const idxKRef = React.useRef(null);
			const feedsRef = React.useRef(new Map());
			const sceneSigRef = React.useRef('');
			const [size, setSize] = React.useState({ w: 0, h: 0 });
			const [lit, setLit] = React.useState(0);
			const [paused, setPaused] = React.useState(false);
			pausedRef.current = paused === true;
			// config knob: 0 freezes the tape, otherwise wall px per second
			if (typeof scrollVpx !== 'number') scrollVpx = SCROLL_DEFAULT;
			const [feedTick, setFeedTick] = React.useState(0);
			const HROWS = WALL_ROWS;
			// seamless scroll: the window always holds nWin rows cut from the doubled
			// watchlist tape; every rotation step advances the tape by exactly one LED
			// row and the last row wraps in as the next head; the chart band below
			// the rows never moves, and there are no pages and no bulb wipe anymore
			// seamless cell scroll: the rows band is a fixed window of LED rows
			// over the whole watchlist tape; every step the head moves exactly one
			// bulb cell upward, half-rows clip at the band edges, the chart band
			// below never moves
			const bandH = HROWS - ROWS_TOP_C - CHART_C - FOOT_HC;
			const winN = Math.max(2, Math.floor(bandH / ROW_MIN_C));
			const pitchC0 = rows.length === 0 ? ROW_MIN_C : Math.max(ROW_MIN_C, Math.floor(bandH / Math.min(rows.length, winN)));
			const view = rows;
			const ticker = (meta?.indexBar ?? []).map((symbol) => quotes.get(symbol) ?? seenQuote(symbol)).filter((q) => q !== void 0);
			const tape = ticker.length === 0 ? [] : [...ticker, ...ticker];
			const rowsKey = rows.map((row) => row.symbol).join(',');
			// prefetch every row's bars in batches; rotation then never waits on the network
			React.useEffect(() => {
				let dead = false;
				const symbols = rowsKey === '' ? [] : rowsKey.split(',');
				const pull = () => {
					for (let i = 0; i < symbols.length; i += 3) {
						const batch = symbols.slice(i, i + 3);
						void Promise.all(batch.map((symbol) => getKline(symbol).then(
							(body) => {
								if (!dead) {
									feedsRef.current.set(symbol, body);
								}
							},
							() => void 0,
						))).then(() => {
							if (!dead) setFeedTick((current) => current + 1);
						});
					}
				};
				pull();
				const timer = window.setInterval(pull, 120000);
				return () => {
					dead = true;
					window.clearInterval(timer);
				};
			}, [rowsKey]);
			// report the wall geometry, so live row/col counts and the display
			// scale can be read straight out of the diag log
			React.useEffect(() => {
				diag('panel.led.geo', { wall: `${String(WALL_COLS)}x${String(WALL_ROWS)}`, pitch: pitchC0, winRows: Math.min(rows.length, winN), engine: 'webgl2', scroll: `${String(scrollVpx)}px/s smooth`, disp: size.w === 0 ? 'pending' : `${String(size.w)}x${String(size.h)} @${(Math.min(size.w / WALL_W_PX, size.h / WALL_H_PX)).toFixed(3)}x` });
			}, [Math.min(rows.length, winN), size]);
			// one canvas pixel per css pixel, no devicePixelRatio games: the
			// browser never resamples the wall, so bulbs cannot shimmer or spill
			React.useEffect(() => {
				const wrap = wrapRef.current;
				if (wrap === null) return void 0;
				const fit = () => setSize({ w: Math.max(280, wrap.clientWidth), h: Math.max(200, wrap.clientHeight) });
				fit();
				const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
				if (ro !== null) ro.observe(wrap);
				window.addEventListener('resize', fit);
				void loadLamp().then(() => setFeedTick((current) => current + 1), () => void 0);
				return () => {
					if (ro !== null) ro.disconnect();
					window.removeEventListener('resize', fit);
				};
			}, []);
			// one kline pull for the left index panel; the host cache makes this cheap
			React.useEffect(() => {
				const s = meta?.indexBar?.[0];
				if (s === void 0 || idxKRef.current?.sym === s) return void 0;
				void Promise.resolve(getKline(s)).then((body) => {
					idxKRef.current = { sym: s, bars: body?.bars ?? [] };
					setFeedTick((current) => current + 1);
				}, () => void 0);
				return void 0;
			}, [meta]);
			// paint the exchange master board: the planner returns the prim
			// list, this painter only executes it - the offline self-check
			// renderer feeds the same planner with mock quotes
			React.useEffect(() => {
				if (size.w === 0 || view.length === 0) return;
				if (!LAMP.ready) {
					void loadLamp().then(() => setFeedTick((current) => current + 1), () => void 0);
					return;
				}
				// the frame budget is the fixed matrix; rows share what the frame
				// leaves them, and the footer always sits on the last wall row
				const pitchC = pitchC0;
				const hC = HROWS;
				pitchRef.current = pitchC * PITCH;
				topRef.current = ROWS_TOP_C * PITCH;
				const fmtv = (v) => (v === null || v === void 0 ? '—' : fmtNum(v));
				let upN = 0;
				let dnN = 0;
				let flatN = 0;
				let turn = 0;
				const side = [];
				const rowsP = view.map((row) => {
					const q = quotes.get(row.symbol) ?? seenQuote(row.symbol);
					const pct = q?.changePct ?? null;
					if (pct > 0) upN++;
					else if (pct < 0) dnN++;
					else flatN++;
					if (q?.amount != null) turn += q.amount;
					if (pct !== null) side.push({ name: (q?.name ?? row.name ?? '').slice(0, 4), pct, pctF: `${fmtSigned(pct)}%` });
					const dir = pct === null ? '#cfe6ff' : pct > 0 ? ledUp : pct < 0 ? ledDown : '#8fb3d9';
					return {
						symbol: row.symbol,
						name: (q?.name ?? row.name ?? '').slice(0, 4),
						pct,
						cells: [fmtv(q?.prevClose), fmtv(q?.high), fmtv(q?.low), fmtv(q?.price), pct === null ? '—' : `${fmtSigned(pct)}%`, q?.amount === null || q?.amount === void 0 ? '—' : fmtBig(q.amount, 1)],
						cellColors: ['#9fc4e8', ledUp, ledDown, dir, dir, '#9fc4e8'],
					};
				});
				side.sort((a, b2) => b2.pct - a.pct);
				const idxSym = meta?.indexBar?.[0];
				const idxQ = idxSym === void 0 ? void 0 : quotes.get(idxSym) ?? seenQuote(idxSym);
				const idx = idxQ === void 0 ? null : {
					name: idxQ.name ?? 'INDEX',
					price: idxQ.price ?? null, priceF: fmtv(idxQ.price),
					high: idxQ.high ?? null, highF: fmtv(idxQ.high),
					low: idxQ.low ?? null, lowF: fmtv(idxQ.low),
					pct: idxQ.changePct ?? null, pctF: idxQ.changePct == null ? '—' : `${fmtSigned(idxQ.changePct)}%`,
				};
				const idxBars = idxKRef.current?.sym === idxSym
					? idxKRef.current.bars.filter((b2) => b2.c !== null).slice(-60).map((b2) => ({ c: b2.c, ax: String(b2.d ?? '').slice(5, 10) }))
					: [];
				const litSymbol = view[lit]?.symbol;
				const bars = (litSymbol === void 0 ? void 0 : feedsRef.current.get(litSymbol)?.bars) ?? [];
				const pts = bars.filter((b2) => b2.c !== null);
				const litQ = litSymbol === void 0 ? void 0 : quotes.get(litSymbol) ?? seenQuote(litSymbol);
				const hiAll = pts.length > 1 ? Math.max(...pts.map((b2) => b2.c)) : 0;
				const loAll = pts.length > 1 ? Math.min(...pts.map((b2) => b2.c)) : 0;
				const chart = pts.length > 1 ? {
					pts: pts.map((b2, k) => ({ c: b2.c, v: b2.v ?? null, down: k > 0 && b2.c < pts[k - 1].c })),
					lo: loAll,
					hi: hiAll,
					span: Math.max(1, hiAll - loAll),
					volMax: Math.max(...pts.map((b2) => b2.v ?? 0), 1),
					color: (litQ?.changePct ?? 0) >= 0 ? ledUp : ledDown,
					hiF: fmtNum(hiAll),
					loF: fmtNum(loAll),
				} : null;
				const nowD = new Date();
				// skip the whole re-bake unless something the wall can show has
				// actually moved: scroll head, lit row, lattice mode, every number
				// screen, and the minute the clock prints
				const sig = [
					String(lit), tiny === true ? "T" : "S",
					view.map((r) => {
						const q = quotes.get(r.symbol) ?? seenQuote(r.symbol);
						return `${String(q?.price)}:${String(q?.changePct)}:${String(q?.high)}:${String(q?.low)}:${String(q?.prevClose)}:${String(q?.amount)}`;
					}).join(";"),
					`${String(idx?.priceF)}${String(idx?.pctF)}`,
					`${String(chart?.pts.length)}:${String(chart?.pts.at(-1)?.c)}`,
					String(nowD.getHours() * 60 + nowD.getMinutes()),
				].join("|");
				if (sceneSigRef.current === sig) return;
				sceneSigRef.current = sig;
				const fullTitle = t('led.master');
				const title = COLS >= 200 ? fullTitle : t('led.min');
				const plan = ledPlan({
					P: PITCH, cols: COLS, hC, tiny, pitchC, chartC: CHART_C, bandH,
					ledUp, ledDown,
					title,
					clock: `${String(nowD.getHours()).padStart(2, '0')}:${String(nowD.getMinutes()).padStart(2, '0')}`,
					titleC: ledTextW(title, tiny),
					wC: (s) => ledTextW(String(s), tiny),
					idx, idxBars,
					L: (k) => t(k),
					colLabels: [t('board.col.prevClose'), t('board.col.high'), t('board.col.low'), t('board.col.last'), t('board.col.chgPct'), t('board.col.amount')],
					rows: rowsP, side, lit, chart,
					footL: COLS < 340 ? `${t('led.upN')} ${upN}  ${t('led.downN')} ${dnN}` : `${t('led.count')}:${view.length}  ${t('led.upN')} ${upN}  ${t('led.downN')} ${dnN}  ${t('led.flatN')} ${flatN}`,
					footR: `${t('led.turnover')} ${fmtBig(turn, 1)}`,
				});
				const t0 = performance.now();
				const sC = staticRef.current ?? (staticRef.current = document.createElement('canvas'));
				const tC = tapeCvRef.current ?? (tapeCvRef.current = document.createElement('canvas'));
				sC.width = plan.w;
				sC.height = plan.h;
				tC.width = plan.w;
				tC.height = Math.max(1, plan.tape.h);
				const sx = sC.getContext('2d');
				const tx = tC.getContext('2d');
				sx.fillStyle = '#000';
				sx.fillRect(0, 0, sC.width, sC.height);
				tx.fillStyle = '#000';
				tx.fillRect(0, 0, tC.width, tC.height);
				tx.save();
				tx.translate(0, -plan.tape.y);
				plan.prims.forEach((p) => {
					const x2 = p.g === 'r' ? tx : sx;
					if (p.t === 'f') {
						x2.globalAlpha = p.a;
						x2.fillStyle = p.c;
						x2.fillRect(p.x, p.y, p.w, p.h);
						x2.globalAlpha = 1;
					} else {
						ledText(x2, p.x, p.y, p.s, p.c, p.r === null ? void 0 : p.r, tiny);
					}
				});
				tx.restore();
				geoPlanRef.current = { topPx: plan.tape.y, bandPx: Math.max(1, plan.clip.h), tapePx: Math.max(1, plan.tape.h) };
				dirtyRef.current = true;
				diag('panel.led.bake', { ms: Math.round(performance.now() - t0), px: `${String(plan.w)}x${String(plan.h)}+${String(plan.tape.h)}` });
			}, [size, rows.length, lit, feedTick, tiny, quotes]);
			// every frame is one quad draw: the shader rebuilds the bulb grid in
			// display px (rounded-square masks, no resampled bitmap), samples the
			// baked content at bulb centres (4-neighbour max = footprint tap) and
			// wraps the tape under a mod() scroll offset
			React.useEffect(() => {
				const cv = canvasRef.current;
				if (cv === null || size.w === 0) return void 0;
				cv.width = size.w;
				cv.height = size.h;
				const gl = typeof WebGL2RenderingContext === 'undefined' ? null : cv.getContext('webgl2', { alpha: false, antialias: false });
				const x2d = gl === null ? cv.getContext('2d') : null;
				// GL program + textures are created once per context and reused across
				// resizes; the old effect recompiled the shader and leaked two textures,
				// a program and a buffer on every [size] change
				let res = glResRef.current;
				if (gl !== null && (res === null || res.gl !== gl)) {
					const W = wallGL(gl);
					if (W === null) { res = null; } else {
						const tex = { s: gl.createTexture(), t: gl.createTexture() };
						[tex.s, tex.t].forEach((tt) => {
							gl.bindTexture(gl.TEXTURE_2D, tt);
							gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
							gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
							gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
							gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
						});
						res = { gl, W, tex };
					}
					glResRef.current = res;
				}
				const W = res === null ? null : res.W;
				const tex = res === null ? null : res.tex;
				const sc = Math.min(size.w / WALL_W_PX, size.h / WALL_H_PX);
				const dw = Math.round(WALL_W_PX * sc);
				const dh = Math.round(WALL_H_PX * sc);
				const ox = Math.round((size.w - dw) / 2);
				const oy = Math.round((size.h - dh) / 2);
				geoRef.current = { ox, oy, sc };
				let raf = 0;
				let last = performance.now();
				const step = (ts) => {
					raf = window.requestAnimationFrame(step);
					const dt = Math.min(0.25, (ts - last) / 1000);
					last = ts;
					if (pausedRef.current !== true) scrollPxRef.current += scrollVpx * dt;
					const gp = geoPlanRef.current;
					const sC = staticRef.current;
					const tC = tapeCvRef.current;
					if (gp === null || sC === null || tC === null) return;
					if (W === null) {
						if (x2d === null) return; // webgl2 present but shader failed: no 2d context is available on the same canvas
						x2d.fillStyle = '#04070d';
						x2d.fillRect(0, 0, size.w, size.h);
						x2d.drawImage(sC, ox, oy, dw, dh);
						const th = gp.tapePx * sc;
						x2d.save();
						x2d.beginPath();
						x2d.rect(ox, oy + gp.topPx * sc, dw, gp.bandPx * sc);
						x2d.clip();
						for (let yy = oy + gp.topPx * sc - (scrollPxRef.current % gp.tapePx) * sc; yy < oy + (gp.topPx + gp.bandPx) * sc; yy += th) x2d.drawImage(tC, ox, yy, dw, th);
						x2d.restore();
						return;
					}
					if (dirtyRef.current) {
						dirtyRef.current = false;
						gl.activeTexture(gl.TEXTURE0);
						gl.bindTexture(gl.TEXTURE_2D, tex.s);
						gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sC);
						gl.activeTexture(gl.TEXTURE1);
						gl.bindTexture(gl.TEXTURE_2D, tex.t);
						gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tC);
					}
					gl.viewport(0, 0, size.w, size.h);
					gl.clearColor(0.016, 0.027, 0.051, 1);
					gl.clear(gl.COLOR_BUFFER_BIT);
					gl.useProgram(W.prog);
					gl.uniform2f(W.U.iRes, size.w, size.h);
					gl.uniform4f(W.U.uGeo, ox, oy, sc, 0);
					gl.uniform4f(W.U.uBand, gp.topPx, gp.bandPx, gp.tapePx, 0);
					gl.uniform4f(W.U.uPx, PITCH, BULB, WALL_W_PX, WALL_H_PX);
					gl.uniform2f(W.U.uSzT, tC.width, tC.height);
					gl.uniform1f(W.U.uScroll, scrollPxRef.current % gp.tapePx); // keep float32 far from its 24h drift zone
					gl.uniform1f(W.U.uTime, ts / 1000);
					gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
				};
				raf = window.requestAnimationFrame(step);
				return () => window.cancelAnimationFrame(raf);
			}, [size]);
			// release GPU objects once when the board unmounts (resizes reuse them)
			React.useEffect(() => () => {
				const r = glResRef.current;
				if (r !== null && r.gl !== null) {
					try {
						r.gl.deleteTexture(r.tex.s);
						r.gl.deleteTexture(r.tex.t);
						r.gl.deleteProgram(r.W.prog);
						r.gl.deleteBuffer(r.W.buf);
					} catch (e) { /* context already lost */ }
					glResRef.current = null;
				}
			}, []);
			const hit = (event) => {
				const rect = canvasRef.current.getBoundingClientRect();
				const { ox, oy, sc } = geoRef.current;
				const wy = (event.clientY - rect.top - oy) / sc;
				const gp = geoPlanRef.current;
				if (gp === null || rows.length === 0 || wy < gp.topPx || wy >= gp.topPx + gp.bandPx) return -1;
				const per = Math.max(1, gp.tapePx);
				const rel = ((((wy - gp.topPx + scrollPxRef.current) % per) + per) % per);
				return Math.floor(rel / (pitchRef.current === 0 ? ROW_MIN_C * PITCH : pitchRef.current)) % rows.length;
			};
			return h('div', { className: 'ml-led' },
				tape.length === 0 ? null : h('div', { className: 'ml-ticker' },
					tape.map((q, index) => h('span', { key: `${String(q.symbol)}|${String(index)}`, className: dirClass(q.changePct ?? 0) },
						q.name ?? q.symbol, ' ', fmtNum(q.price, (q.price ?? 0) > 1000 ? 0 : 2), '  ', q.changePct === null || q.changePct === void 0 ? '—' : `${fmtSigned(q.changePct)}%`))),
				h('div', {
					className: 'ml-ledstage',
					ref: wrapRef,
					onMouseMove: (event) => {
						const i = hit(event);
						if (i >= 0) {
							setPaused(true);
							setLit(i);
						} else setPaused(false);
					},
					onMouseLeave: () => setPaused(false),
					onClick: (event) => {
						const i = hit(event);
						if (i >= 0) onPick(view[i].symbol);
					},
				}, h('canvas', { ref: canvasRef, className: 'ml-ledscreen', 'aria-label': t('board.title') })));
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
