# 寰镜 MarketLens（@suifei/dsh-market-lens）

A 股 / 港股 / 美股的**只读**行情看板 DSH Web 插件。定位一句话：Web 面板形态覆盖 PC 与移动端的延迟行情看板，**不接任何交易端能力**。

- 数据性质：公开免费接口的**延迟行情**，非 Level-2，UI 常驻标注。
- 市场：A 股（沪/深/北）、港股、美股；指数、个股（板块视图在后续版本）。
- 不做：下单、撤单、持仓盈亏、量化执行、任何写操作（连配置写回都没有）。

## 架构

```
浏览器（DSH Web GUI）                      Node（DSH Host）
┌─────────────────────────┐   同源 HTTP   ┌──────────────────────────┐
│ client.js  React 面板     │ ───────────→ │ index.js                  │
│ · sidebar.panellist 图标  │  /market-lens│  · /market-lens/* routes   │
│ · main keyed 主面板        │   /*        │  · market_search/quotes/   │
│ · Canvas 自绘 K 线（零 CDN）│             │    kline 三个只读工具        │
│ · localStorage 自选/偏好   │             │ lib/service.js             │
└─────────────────────────┘             │  归一化 · TTL 缓存 · 在途去重 │
        UI 永不直连外部行情接口             │  多源降级（按市场分链）        │
                                        │ sources/{eastmoney,        │
                                        │  tencent,yahoo}.js         │
                                        └──────────────────────────┘
```

**行情抓取只发生在宿主侧。** UI 与模型工具共用同一个 `createMarketService`，一个操作、两个调用方。

## 符号规范

内部规范格式（与腾讯公开接口词表一致）：

| 市场 | 规范 | 接受输入 |
|---|---|---|
| 沪/深/北 | `sh600519` `sz000001` `bj830799` | `600519`、`SH600519`、`sh.600519`（裸 6 位按代码段推断：`5/6/9`→sh，`0/3/1`→sz，`4/8`→bj） |
| 港股 | `hk00700`（5 位）、指数别名 `hkHSI` `hkHSTECH` | `700`、`00700`、`HK00700` |
| 美股 | `usAAPL`、指数别名 `usDJI` `usIXIC` `usINX` | `AAPL`、`us.aapl`、`US.AAPL` |

搜索支持代码、中文名、拼音全拼与**拼音首字母**（`gzmt` → 贵州茅台）：拼音匹配委托给上游 suggest 接口（smartbox / 东方财富），宿主侧只做归一化、合并与去重。

## 多源降级

| 市场 | 主源 | 备源 |
|---|---|---|
| A 股（含北交所）/ 指数 | 东方财富 | 腾讯 |
| 港股 | 东方财富 | 腾讯 |
| 美股 / 美指数 | Yahoo chart | 腾讯（美股 K 线自动解析 `.OQ/.N` 后缀码） |

- 东方财富 TLS 在部分网络被重置：适配器带 **https 失败→http 重试**（仅公开只读 GET）。
- 单源失败自动切换；全链失败时 quotes 返回 `failed[]`（UI 显示「数据暂不可用」），有缓存旧值时以 `stale: true` 供出延迟值而非假数据。

## 面板接口（同源，宿主实现）

| Route | 参数 | 返回 |
|---|---|---|
| `GET /market-lens/meta` | — | `{ pollIntervalMs, defaultWatchlist, indexBar, limits, disclaimer }` |
| `GET /market-lens/quotes` | `symbols`（逗号分隔，≤200） | `{ quotes: QuoteRow[], failed: [{symbol, reason}] }` |
| `GET /market-lens/kline` | `symbol, period=day|week|month, count=20–320` | `{ symbol, period, adjust, bars: Bar[], source }` |
| `GET /market-lens/search` | `q`（1–50）, `limit≤30` | `{ items: [{symbol, name, market, kind}] }` |
| `GET /market-lens/news` | `q?`（关键词，可空）, `limit≤30` | `{ items: [{title, url, time, source}], source }` |
| `GET /market-lens/posts` | `symbol`（必填）, `name?`（新闻关键词） | `{ symbol, notice[], posts[{title,url,time,comments,reads}], news[], source }` — 公告(A股)/股吧评论(A·港)/个股新闻三源并行，单源失败置空，全空 502 |
| `GET /market-lens/updates` | `symbols`（逗号列表） | `{ items: [{symbol, notice[], latest, count, unsupported?}] }` — 自选行的**未读公告气泡**数据源（仅公告源，轻量批查） |
| `GET /market-lens/financials` | `symbol` | A 股：`{ rows: [{report, revenue, revenueYoY, netProfit, netProfitYoY, eps, bps}] }`；港/美：`{ unsupported: true }` |
| `GET /market-lens/alerts` | `since`（事件游标） | `{ alerts, events, cursor }`；`POST` 新建规则或 `{action:'dismiss'}` 清未读；`DELETE ?id=` 删规则 |

`QuoteRow = { symbol, name, price, prevClose, open, high, low, change, changePct, volume(股), amount(元), turnoverRate, pe, volRatio, amplitude, pb, marketCap, floatMarketCap, currency?, updatedAt, source, stale? }`。字段可得性因市场与源而异：**缺失为 `null`，UI 显示 `—`，绝不补 0**。K 线前复权固定在宿主侧，UI 与工具都不暴露复权参数。

路由带同源护栏：`Sec-Fetch-Site: cross-site` 或 Origin/Referer 与 Host 不一致一律 403；全部 `cache-control: no-store`。

## 模型工具（只读）

| 工具 | 参数 | 说明 |
|---|---|---|
| `market_search` | `query(1–50)`, `limit?≤30` | 代码/名称/拼音检索 |
| `market_quotes` | `symbols: string[]`（≤200） | 批量报价，含 `source` 与 `stale` 标注 |
| `market_kline` | `symbol`, `period: day|week|month`, `count: 20–320` | 前复权 K 线 |

工具描述内写明「只读行情、不涉及交易」；上限同时写在参数描述与宿主校验（越界报 `BAD_INPUT`）。没有 `market_order` 之类的写工具。

## 可靠性实现点

- 轮询：`setTimeout` 链式调度，上一次完成后才排下一次；`document.hidden` 暂停，回前台立即刷新（面板卸载即整链拆除）。
- 收回：样式、监听、AbortController、定时器全部挂在 `ctx.effect` / 组件 cleanup。
- 指数条与自选行按 key 原地更新文本，不重建列表 DOM，滚动位置与手动顺序不被轮询重置。
- K 线：Canvas 自绘；PC 滚轮缩放 + 拖拽平移 + hover tooltip；移动端双指缩放、单指平移、长按出 tooltip（不依赖 hover）。
- 搜索带序号防竞态，慢的旧响应不覆盖新输入。

## 配置（`cordis.patch.yml` 行内 `config`）

`pollIntervalMs 5000 · quoteTtlMs 5000 · klineTtlMs 60000 · searchTtlMs 300000 · newsTtlMs 60000 · finTtlMs 21600000 · upstreamTimeoutMs 6000 · maxQuoteSymbols ≤200 · maxKlineCount ≤320 · routePath /market-lens · diagLevel errors`

## 诊断日志（自监控闭环，**全局开关**）

**`diagLevel` 是日志总开关**：`off` 完全静音（不落盘、客户端连 POST 都不发）；`errors`（**发布默认**）只保留崩溃/失败行（`panel.crash`、`*.fail`、`route.status`、`route.reject`），日常事件零写盘；`full` 记录一切——开发调试期用。仓库自带的 `cordis.patch.yml` 行内写了 `config: { diagLevel: full }`（开发机现状），**发布前删掉或改回 `errors`** 即可回到静音默认；普通使用者不配置天然是 `errors`。

面板把关键事件（挂载、每类请求成败、渲染崩溃）批量 POST 到 `/market-lens/diag`，宿主连同护栏拒绝与非常规状态码一起写入 JSONL 日志（客户端与服务端各有一道同级过滤，`full` 之外不产生流水）：

- 位置：`~/.dsh/market-lens/marketlens-diag-<YYYY-MM-DD>.jsonl`（`diagLogDir` / `diagLogMaxBytes` 可在插件配置改，按天分文件、超限轮转为 `.1`）。
- 回读：`GET /market-lens/diag?tail=50` 返回 `{file, rows}`；面板红条本身也带原因。

## 自选行（参考移动端行情组件）

每行 = 名称/代码 + **一句话建议**（按当日涨跌分档：强势拉升 / 稳步走高 / 窄幅盘整 / 正快速下降 / 加速下挫，方向着色）+ **22 日微型趋势线**（SVG，面积渐变 + 端点强调，红涨绿跌跟随当前配色系；悬停显示 5 日累计涨幅）+ 现价/涨幅/成交额。趋势线宿主侧走 K 线缓存（5 分钟窗口），过滤、排序、置顶切换均不重复请求。

## K 线交互与配色

拖拽框选放大 · 滚轮以光标为锚缩放 · **右键拖动平移时间轴** · 双击回全览；**点击 K 线**在图下方展开当日详情条（开高低收、涨跌、涨幅、振幅、量），再点一次取消。悬停十字光标带主题化价签/日期签与左上角 OHLC/MA 图例；最新价虚线 + 轴上价签常驻。

配色五系可切换（工具栏「配色」）：红涨绿跌（**空心阳线**，默认）、绿涨红跌、蓝涨橙跌、紫涨金跌、青涨玫跌；选择持久化在 `ml.prefs.v1`，全部颜色走 CSS 变量并跟随宿主明暗主题。

## 横向滚动规范

界面默认不出现横向滚动条。确需横向内容的区域（指数条、财报横表）统一用 `HScroll`：滚动条**悬停/聚焦才现身**（细圆角、跟随主题），两侧**渐隐边缘**提示还有内容（可滚状态实时更新），触屏 `pan-x` 原生拖动、`overscroll-behavior` 防串滚，`tabIndex` 支持键盘横滚。纵向滚动条全局统一为透明轨道 + 悬停显色的细圆角样式。

## 看盘模式（0.7）

- **三列分割条**：列表/K线/详情两缝可拖（260–460 / 280–560 px 限位），宽度写入 `ml.prefs.v1.cols`，窄模式隐藏分割条。
- **证券大厅**（标题右侧的金色按钮，点阵图标 + 悬停像素提示条）：**真·灯矩阵屏**——每页行数按容器高度动态计算，内容先画进离屏"内存页"，再采样切割成 4px 的 n×m 圆形灯珠网格（烘焙成灯屏位图）；rAF 24fps 只做一次 blit + 扫描带 + 随机灯珠明暗抖（活屏感，几乎零开销）。每 4 秒轮播下一行，**一页轮完用逐灯熄灭/点亮的清屏转场翻页**；高亮行下方展开灯格化的阶梯 K 线（数据批量预取，翻页零请求零闪烁）；悬停即停并锁定光标行，点行回落三列。顶部指数跑马灯保留，白底指数卡隐藏。字体：`/market-lens/font` 提供 ArkPixel 12px 简体子集（SIL OFL 1.1）——它只作为内存页的绘字工具，屏幕上呈现的永远是灯珠。
- **个股资讯区**：原"快讯"卡升级为三 Tab——**快讯**（全市场）/**公告**（东财公告，A 股）/**评论**（股吧热帖，A·港股，带回复数），公告与评论跟随当前选中股票，走 `/market-lens/posts` 聚合路由（三源并行、单源失败置空）。
- **当日详情条增强**：点选 K 线后除 OHLC/额量外附**信号标签**——20 根内新高/新低、放量倍数（×n），全部由已在手的 K 线数据本地计算，不加请求。

## 价格提醒（宿主后台评估）

规则存于 `~/.dsh/market-lens/alerts.json`，**评估循环跑在宿主**——面板不开、网页不在前台，提醒照常触发。七类规则：`priceUp/priceDown`（价格≥/≤）、`pctUp/pctDown`（当日涨/跌幅≥）、`maUp/maDown`（上穿/下破 MA5/10/20/60，需拉日线，隔轮评估）、`volSpike`（量比≥，东财源提供）。触发产生事件流（保留 200 条），每条规则带独立**静默期**（默认 30 分钟）防轰炸。

展示：桌面壳底部 `shell.bottom` 状态条——🔔 摇铃动效 + 多行**向上跑马灯**（3 秒一行，涨跌红绿着色），**悬停即停**，点击行跳到行情面板并把该提醒对应的股票选为当前标的，「清除」把当前所有事件标为已读。
- 排障顺序：先看有没有 `route.reject`（护栏误伤）→ `route.status`（路径/参数错）→ `panel.*.fail`（上游源问题）→ `panel.crash`（渲染问题）。

## 数据内容

- **预制自选**：首次打开即有 12 只中外明星股（茅台/宁德/比亚迪/招行/平安/腾讯/阿里/美团/苹果/微软/英伟达/特斯拉）+ 顶部 10 指数条。
- **财经快讯**：新浪财经滚动（支持按标的名称过滤）为主，东财 7×24 备源；60s TTL。
- **财报**：东财 F10 主要财务指标（营收/净利/EPS/BPS + 同比），A 股已支持，港/美股显式标注暂不支持。

## 开发

```bash
node --test          # 离线单测（fetch 全桩）
node scripts/live-probe.mjs   # 真网络冒烟（不在测试里跑，避免 CI 依赖外网）
```

## 发布自检（社区市场流程）

1. 仓库 `github.com/suifei/dsh-market-lens`，public；本目录即包根（`package.json` 声明 `dsh.bundle.patch` → `./cordis.patch.yml`）。
2. `dsh-plugin` topic；`meta.title/description` 在 `locale/zh.json`、`locale/en.json`。✓
3. 建仓满 1 天后再提收录 PR。
4. 向 `awesome-dsh-plugin/awesome-dsh-plugin` 的 `data/plugins/` 提交单文件条目 `suifei__dsh-market-lens.yml`（category 以当时 contributing.md 为准），不动自动生成的 README。
5. npm 发布（可选但推荐）：`npm view @suifei/dsh-market-lens` 确认包名可用后发布。
6. 带 UI 包自查：`dsh.bundle.patch` 存在 ✓；`dsh.client.platform: web` ✓；客户端侧无额外运行时依赖（`peerDependencies` 只列宿主侧 cordis/dsh 面）✓。

## 首版范围与后续

**首版必做**：自选列表（过滤/排序/批量导入，预制 12 只中外明星股）+ 三市场报价 + 日/周/月 K（MA5/10/20/60 可开关、量副图）+ 指数条 + 搜索 + 财经快讯 + A 股财报指标 + 移动端布局模式切换 + 宿主缓存与多源降级 + 三个只读工具。（快讯与财报原在说明书第二版范围，按用户要求提前落地；新闻为全局滚动流 + 标的关键词过滤，非独立新闻聚合面。）

**明确不做**：交易、持仓、选股、AI 投研、L2 盘口。

**后续（按数据源稳定性排序）**：分时图 → 板块/行业视图 → 热力图 → 新闻/快讯 → 自定义布局保存。原则不变：**新数据源先落在宿主侧，UI 只消费归一化结构。**

## 已知边界

- 裸 6 位代码按号段猜测交易所（`92xxxx` 北交所新代码段会被猜成 sh）；带前缀输入永远正确。
- Yahoo 在部分区域返回 403：美股自动落到腾讯，K 线历史长度可能缩短。
- 分时图未进首版；详情页暂以 K 线为主视图。

## License

MIT · 图标为本仓库原创绘制。
