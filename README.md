# Lua Support for Lithe

为 [Lithe](https://github.com/Lithe-IDEA/Lithe-IDEA) 提供 Lua 代码智能和“运行当前文件”。
这是一个**社区插件**，也是 [Lithe Store](https://github.com/Lithe-IDEA/Lithe-store) 的示例插件：
想发布自己插件的开发者可以直接复制这个仓库作为模板。

> English: Lua language intelligence (bundled [LuaLS](https://github.com/LuaLS/lua-language-server)) and "Run current file" (via your `lua`) for Lithe. Also the reference template for Lithe Store community plugins.

## 功能

| 功能 | 依赖的程序 |
| --- | --- |
| 补全、跳转定义、悬停提示、诊断 | 插件内置的 lua-language-server（LuaLS 3.19.1），**无需另外安装** |
| 运行当前 `.lua` 文件 | 你电脑上的 `lua`（使用你自己选择的 Lua 版本） |

语法高亮由 Lithe 编辑器内置提供，不需要插件。安装时 Lithe 会弹窗列出以上两个程序，确认后才会安装。

LuaLS 在构建时按 `language-server.json` 固定的版本下载并核对 SHA-256，打进对应平台的插件包；
用户安装时不会再下载任何东西。LuaLS 的日志和生成文件写在
`~/Library/Caches/io.github.lithe-idea.lua-support/`，插件目录保持只读（Lithe 会拒绝加载被改动过的插件）。

## 安装

1. 想用“运行当前文件”的话，先安装 Lua（只影响运行，补全和跳转不需要）：

   ```bash
   brew install lua
   ```

2. 在 Lithe（0.6.1 或更新版本）中打开 **设置 → 插件 → 插件市场**，搜索 “Lua Support”，安装并确认。

Lithe 已预置 Lithe Store 社区插件源。如果你之前移除了它，先在 **⚙ → 管理插件仓库…** 中重新添加
`https://github.com/Lithe-IDEA/Lithe-store`。

目前发布 macOS Apple Silicon 与 Intel 两个包；Lithe for Windows 支持插件市场后会增加 Windows 包。

## 用这个仓库做模板

```text
io.github.lithe-idea.lua-support/plugin.json   # 插件描述，目录名必须等于插件 id
io.github.lithe-idea.lua-support/bin/          # 语言服务器启动脚本（把可写状态放到缓存目录）
language-server.json                           # 固定的 LuaLS 版本、各平台下载地址与 SHA-256
scripts/package.mjs                            # 下载并校验 LuaLS，按平台打包成 dist/<名称>-<版本>-<平台>.zip
.github/workflows/ci.yml                       # PR 时打包，并用 Lithe Store 的规则检查
.github/workflows/release.yml                  # 推送 v<版本> 标签时发布 GitHub Release
```

改成你自己的插件：

1. 把目录和 `plugin.json` 的 `id` 改成你自己的反向域名（如 `io.github.<用户名>.<插件名>`），
   **不要**使用 `dev.lithe.*`；`vendor.signatureRequirement` 保持 `"none"`。
2. 修改 `scripts/package.mjs` 顶部的 `PACKAGE_DIR`、`ASSET_PREFIX`，以及 `language-server.json`。
   包含平台相关可执行文件时按 `<名称>-<版本>-<系统>-<架构>.zip` 分别打包；可执行文件不能在运行时
   往插件目录写文件，需要写的状态请放到用户缓存目录（参考 `bin/lithe-lua-language-server`）。
3. `plugin.json` 的完整格式见 Lithe 的
   [插件契约](https://github.com/Lithe-IDEA/Lithe-IDEA/blob/preview/shared/contracts/plugins/v1/README.md)。

## 发布新版本

1. 修改 `plugin.json` 的 `version`（例如 `0.2.0`），合入 `main`。
2. 推送同名标签：

   ```bash
   git tag v0.2.0 && git push origin v0.2.0
   ```

3. `Release` 工作流会核对标签与版本一致、打包并发布 Release（说明里附 SHA-256）。
4. Lithe Store 的自动追踪会在 6 小时内发现新版本并开合并请求，合并后用户即可在 Lithe 中更新。

首次收录到 Lithe Store 需要手动提交一次，见 Lithe Store 的
[发布文档](https://github.com/Lithe-IDEA/Lithe-store/blob/main/docs/publishing.md)。

## 许可

[Apache-2.0](LICENSE)
