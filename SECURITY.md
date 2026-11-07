# 安全基线（Security Baseline）

本文回答 npm 生态扫描器（dsh.so / socket.dev 一类）对本包发出的告警，逐条给出处置结论与证据。**数据面本身就是"只读公开行情"，没有交易、没有用户数据出口**——这是安全基线的根。

## 已修复的漏洞

### GHSA-mrhx-c7xc-m3w5 / CVE-2023-54404（zod 内存耗尽 DoS，CVSS 8.2 高）
- **根因**：依赖图里 `zod@4.4.3`（经 `@deepseek-ai/schemastery` 引入）低于补丁版 4.6.6，超大无界数组校验可耗尽内存。
- **修复**：0.29.3 起在 `package.json` 同时加 `overrides`（npm）与 `pnpm.overrides`（pnpm），把 zod 抬到 `^4.6.6`；实测依赖图收敛到 `zod@4.6.7`，`schemastery` 正常加载（宿主 `meta` 应答即活体证明）。
- **证据**：`pnpm why zod` 全量 dedupe 到 4.6.7；发布脚本 test 门 42/42 全绿。

## 启发式告警（经核实为误报或本包职责所需）

### 「动态代码执行（eval）」与「调试/反射访问」
- **结论：误报。** 对**随包分发的全部源码**（`index.js`、`client.js`、`lib/*.js`、`lib/sources/*.js`）做了正则扫描：`eval(`、`new Function`、`Function('…')`、`debugger`、`Reflect.`、`import(`、字符串定时器——**全部 0 命中**；仅 `client.js` 有 2 处 `console.*`（React ErrorBoundary 的标准错误上报 `console.error`）。
- 扫描器报的「两个包两个实例」来自 **`@deepseek-ai/*` 官方依赖**（harness 自己的工具注册器/校验库），非本包代码，且非确认漏洞，属启发式噪声。

### 「URL 字符串」
- **结论：职责所需。** 行情与资讯必然要访问上游公开数据源（东方财富/腾讯/雅虎财经），端点集中在 `lib/sources/*.js`，**只发只读 GET**，无任何用户数据上行。数据源清单见 README「多源降级」。

### 「AI 检测到的潜在代码异常」
- **结论：无实据。** 本包 2735 行客户端 + 229 行宿主半均为可审计源码，无混淆、无下载执行、无安装脚本（`package.json` 无 `postinstall`/`preinstall`）。

## 结构上的安全性质

- **只读**：三个模型工具 `market_search` / `market_quotes` / `market_kline` 与全部路由均无写动词。
- **依赖极简**：运行依赖仅 `@deepseek-ai/schemastery` + `@deepseek-ai/dsh-tools`（版本对齐宿主运行时），peer 仅 `@deepseek-ai/cordis`（宿主注入）。无第三方图形/网络/加密库。
- **无安装钩子**：tarball 不含 `scripts`、`test`、`node_modules`；`files` 白名单仅源码 + 资产 + 文档。
- **令牌不落盘**：发布用 granular token 经环境变量/临时 `.npmrc` 注入，用完即撤（见 `docs/RELEASE.md`）。

## 报告漏洞

发现安全问题请开 GitHub issue：`github.com/suifei/dsh-market-lens/issues`，勿在公开渠道贴可复现细节之外的敏感信息。
