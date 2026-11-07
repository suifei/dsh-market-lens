# 寰镜 MarketLens 发布规程（三渠道）

> 2026-11-07 用户裁定固化。每次版本更新，**三个分发面都要过一遍**；更新流程一律走 `scripts/release.mjs`（下文 §2），不得手工散步。

## 1. 三个渠道与其角色

| 渠道 | 地址/对象 | 角色 | 更新方式 |
|---|---|---|---|
| **npm** | `@suifei/dsh-market-lens`（registry.npmjs.org） | 发行本体：所有安装路径的源头 | `npm publish`（脚本第 6 步）；发布令牌为账号 suifei 的 granular token（勾选 Bypass 2FA，**7 天自过期**，过期后在 npmjs.com → Account Security 重新生成并更新调用时的 `NPM_TOKEN`） |
| **dsh.so 插件市场** | 提交页 `www.dsh.so/zh/submit/`，条目对象 `github.com/suifei/dsh-market-lens`（**注意不是旧占位仓库 `suifei/market-lens`**） | 生态入口：让 DSH 用户可发现、可安装 | 大版本/新增能力后重新粘贴检查 →「提交到 dsh.so」（服务端每次重新拉取 tarball 重扫，不吃缓存）；元数据（星标/许可证）自动同步。**提交前自查**：`dsh` 字段、README 安装节、MIT LICENSE、仓库名规范、`dsh-plugin` topic、无安装钩子 |
| **awesome-dsh-plugin** | `github.com/awesome-dsh-plugin/awesome-dsh-plugin` PR **#12855** | 社区清单收录 | 首版收录中（等维护者合并/仓库年龄闸门）；条目行若有名称/描述变化，推送到同 PR 分支即可 |

本机开发面（不算渠道）：desktop profile 用 **`link:` 直链**装（`plugin_manager install_bundle link:E:\works\dsh-market-lens`），源码改动刷新页面即达，无需重装；npm 用户升级走插件市场更新。

## 2. 标准发布流程（一条命令）

```powershell
pwsh -Command "node scripts\release.mjs <新版本号 x.y.z> --msg '<一句话变更摘要>' --token <npm granular token> [--host-port <当前 GUI 端口>]"
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
