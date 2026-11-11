# 寰镜 MarketLens 发布规程（三渠道）

> 2026-11-07 用户裁定固化。每次版本更新，**三个分发面都要过一遍**；更新流程一律走 `scripts/release.mjs`（下文 §2），不得手工散步。

## 1. 三个渠道与其角色

| 渠道 | 地址/对象 | 角色 | 更新方式 |
|---|---|---|---|
| **npm** | `@suifei/dsh-market-lens`（registry.npmjs.org） | 发行本体：所有安装路径的源头 | `npm publish`（脚本第 6 步）；令牌见 §5 |
| **dsh.so 插件市场** | 提交页 `www.dsh.so/zh/submit/`，条目对象 `github.com/suifei/dsh-market-lens`（**注意不是旧占位仓库 `suifei/market-lens`**） | 生态入口：让 DSH 用户可发现、可安装 | 大版本/新增能力后重新粘贴检查 →「提交到 dsh.so」（服务端每次重新拉取 tarball 重扫，不吃缓存）；元数据（星标/许可证）自动同步。**提交前自查**：`dsh` 字段、README 安装节、MIT LICENSE、仓库名规范、`dsh-plugin` topic、无安装钩子 |
| **awesome-dsh-plugin**（同时喂 dshmarket 目录） | `github.com/awesome-dsh-plugin/awesome-dsh-plugin` 的 `data/plugins/suifei__dsh-market-lens.yml` | 社区清单收录；dshmarket 的「申请收录插件」按钮就指向它的 contributing.md | **✅ 已收录（2026-11-07 维护者 fkysly 手工落 main，PR #12855 已关闭）**。条目描述如需变更：改仓库里的 yml 再走一次 PR；`screenshots.json` 的键由夜间探测自动补，**不要**手动改共享文件 |

本机开发面（不算渠道）：desktop profile 用 **`link:` 直链**装（`plugin_manager install_bundle link:E:\works\dsh-market-lens`），源码改动刷新页面即达，无需重装；npm 用户升级走插件市场更新。

## 2. 标准发布流程（一条命令）

```powershell
pwsh -Command "node scripts\release.mjs <新版本号 x.y.z> --msg '<一句话变更摘要>' [--host-port <当前 GUI 端口>]
# 令牌无需传参：脚本读 NPM_TOKEN（--token 仍可显式覆盖）"
```

脚本按序执行，**任一步失败即整体中止、已提交但未推送**（可修复后重跑同版本）：

1. **版本三同步**：`package.json` / `index.js` 的 `version:` / `client.js` 的 `CLIENT_REV` 一次性改写为同一版本号（漏一处就是 0.27.0 事故的伏笔）。
2. **语法门**：`node --check client.js && node --check index.js`。
3. **测试门**：`node --test test/` 全绿（当前基线 42 项）。
4. **灯墙自检门**：`node scripts/led-shot.mjs` 出三帧 plan → `python scripts/led-shot.py` 用 lamp.bin 真点阵出图并撞字审计，**TOTAL collisions: 0** 才放行（`--python` 可指定解释器；缺省用 PATH 中的 python）。
5. **提交推送**：`git add`（受版本管理的发布文件 + 脚本改动的三处）→ `git commit -F`（UTF-8 无 BOM）→ `git tag v<x.y.z>` → `git push origin main --follow-tags`。
6. **npm 发布**：`npm publish`，令牌经 `npm_config_//registry.npmjs.org/:_authToken` **环境变量注入**（不写盘、不残留），显式 `--registry=https://registry.npmjs.org`（本机默认镜像只做安装加速，发布必走官方）。
7. **发布核验**：匿名 GET `registry.npmjs.org/@suifei%2Fdsh-market-lens` 确认 `dist-tags.latest` 翻正（传播约 1–3 分钟，脚本轮询最多 90s）；给了 `--host-port` 则再探 `/market-lens/meta` 应等于新版本（宿主半若改了 index.js，需在插件管理里把 `include:market-lens` 关→开热重载后再验，脚本会提示）。
8. **打印人工清单**：dsh.so 重新提交、（若有）awesome 条目同步、本文件渠道表核对。

## 3. 发布前后必须同步的文档（脚本提示，人工确认）

- **README.md**：安装节常在（不动）；「功能」段如新增面板级能力需补一句；`screenshots.json` 路径有效性。
- **AGENTS.md**：新架构条款（本轮：v0.29.0 WebGL2 游戏管线已写入）。
- **dsh.so / awesome 条目文案**：描述、关键词与 README 首段一致（股票/看盘/盯盘/摸鱼/股市/A股/港股/美股 全关键词群不得稀释）。

## 4. 事故先例（为什么每道门都存在）

- **0.27.0 npm 版不可用**：peer 依赖在 link/精简 profile 下解析不到 → 宿主静默不挂载（无路由、无入口）。教训→0.27.1 起 schemastery/dsh-tools 为真实依赖；发布核验第 7 步专门验 meta 活体。
- **提交错仓库**：dsh.so 检查器扫到改名前的空占位 `suifei/market-lens`（1.2kB / 1 文件 / 0 JS）报「repository 缺失」——渠道表的地址栏写死了正确仓库全名。
- **「market-lens 幽灵仓库」勘误（2026-11-07 API 实证）**：`suifei` 名下 43 个仓库清单中**不存在** `market-lens`；检查器截图里的占位页是国内 GitHub 镜像的缓存幻影（页面自带「用 访问该站点」镜像提示）。该次扫描异常的真身是下条的 stage 版本。
- **npm `0.0.0-stage` 幽灵版本**：首发新 scope 包时 npm 自动留下的建包占位（345B/2 文件、无 repository/MIT），按版本序抓取的工具会扫到它（dsh.so 报「1.2kB、1 文件、0 JS/TS、repository 缺失」即此）。已 `npm deprecate`；彻底删除需「允许 unpublish」权限的令牌或 npmjs.com 网页操作，属已知无害干扰。
- **翻页卡死**（0.26→0.27）：每次轮询整墙重烘焙；教训→签名比对进流程第 3/4 道门。
- **npm 令牌无 Bypass 2FA**：发布 403 两次；令牌属性写死在渠道表。
- **release.mjs 首跑即抓虫（0.29.2）**：`node --test test/` 在 execFileSync 下当模块解析而炸（改无参自动发现）；Windows 上 `npm` 需 `shell:true` 解析（已修；publish 失败时提交/推送已完成，脚本会提示**原版本重发**指令而非要求重跑）。
- **PS 环境变量写法坑**：`$env:"npm_config_//…"` 含冒号会被解析成驱动器路径报错；令牌注入以临时 `.npmrc`（用完还原）为唯一可靠路径，脚本内部用 process.env 展开不受影响。
- **registry 安装态黑屏（0.34.2 事故，0.34.3 修复）**：宿主模块 runner 在**包安装**（npm/GitHub 源）时给到的是**虚拟 `import.meta.url`**，`new URL('../assets/lamp.bin', import.meta.url)` 直接抛 `Invalid URL` → `/market-lens/lampfont` 全 502（实测 37 秒内 6401 次）→ 点阵字库永远不 ready → 灯墙只剩顶部 DOM 行情条、画布全黑。link/file 安装是 `file:` URL 所以一直正常——**只有换安装方式才暴露**。修复：资源解析加 `import.meta.resolve('<pkg>/assets/<file>')` 兜底通道（并把模块 URL 写进错误信息），`package.json` `exports` 补 `"./assets/*"`。教训：**装完必须验资产路由**（`curl /market-lens/lampfont` 应为 200 且 ≈396880 字节），不能只看 meta。
- **声明 DSH 内部包为依赖（审计告警，0.34.6/0.34.7 修复）**：`@deepseek-ai/dsh-tools` 曾作为 `dependencies` 声明，会把 `dsh-agent/dsh-llm/dsh-session…` 整棵内部树装进 profile。我们只用它的 `defineTool`，故改为**本地实现**（`parametersToJsonSchema` + 形同 `defineTool` 的返回对象）。坑：真 `defineTool` 会把作者态 `{ type: 'json' }` **编译成空 schema `{}`**，漏了这步会让宿主抛 `JsonSchemaError` 使行**不激活**（0.34.6 事故，0.34.7 修）。另实测：把 schemastery/dsh-tools 全改 `peerDependencies` **不可行**——干净 profile 装完一个 peer 都不装，import 直接 `ERR_MODULE_NOT_FOUND`。
- **kline 源 resolve null 被缓存（0.34.8 修复）**：降级链 `try { return await run(source) }` 把**不抛错而返回 null** 的源当成成功，`null` 进入 TTL 缓存后 `result.bars` 抛 `Cannot read properties of null (reading 'bars')`，且**每次请求都复现**直到 TTL 过期。修复：源循环校验 `Array.isArray(value.bars)` 才接受，出口再兜一道；客户端 sparkline/K 线诊断与工具渲染同步加 `?.`。

## 5. 令牌与凭据（**绝不入仓**）

| 用途 | 形态 | 生成方式 | 使用方式 |
|---|---|---|---|
| **npm 发布** | granular access token（`npm_…`），权限 **Read and publish**，**必须勾选 Bypass 2FA**，有效期自定（建议 7 天） | npmjs.com → 右上头像 → Account Security → Granular Access Tokens → Generate New Token | **默认走系统环境变量 `NPM_TOKEN`**（2026-11-11 起本机已写入 Machine 级）。脚本取值优先级：`--token` 参数 → `process.env.NPM_TOKEN` → **注册表兜底读取**（`HKCU\Environment` / `HKLM\…\Session Manager\Environment`，因为长期运行的宿主进程环境可能早于变量设置）。命令内部以 `npm_config_//registry.npmjs.org/:_authToken` 环境变量注入，**不落盘、不入仓** |
| **GitHub**（推代码、开/查 PR） | `gh` CLI 的 OAuth 或 git 凭据管理器里的 PAT | `gh auth login` / 系统凭据管理器 | 仅本机使用；**不入仓** |
| **dsh.so 提交** | 无令牌 | — | 网页表单手动提交（粘贴仓库地址 → 开始检查 → 提交到 dsh.so） |

**令牌过期的典型症状**：`npm publish` 返回 `E403 ... Two-factor authentication or granular access token with bypass 2fa enabled is required`（令牌没开 Bypass 2FA）或 `401 Unauthorized`（令牌过期/撤销）。两者都只需重新生成令牌再跑同一条命令——**版本号不用重打**（已提交已推送时按脚本提示原版本重发即可）。

**发布后三条核验（缺一不可）**：
1. `npm view @suifei/dsh-market-lens version` == 新版本（scoped 包可能先进入 registry **staging 队列**，数分钟才转正；脚本会轮询 5 分钟）；
2. `curl /market-lens/meta` 的 `version` == 新版本，且 `/market-lens/lampfont` 返回 200 / ≈396880 字节；
3. 宿主行 `fiberPhase: active`（工具注册通过），`panel.crash` 无新增。

**安装侧已知时滞**：插件管理器默认走 **npmmirror**，新版本发布后镜像 packument 常比 npmjs 晚几分钟；此时 `dsh plugin add <pkg>@<新版本>` 会报 `ERR_PNPM_NO_MATCHING_VERSION`。等几分钟，或显式加 `--registry=https://registry.npmjs.org`。
