# Lua Support for Lithe

为 [Lithe](https://github.com/Lithe-IDEA/Lithe-IDEA) 提供 Lua 代码智能和“运行当前文件”。
这是一个**社区插件**，也是 [Lithe Store](https://github.com/Lithe-IDEA/Lithe-store) 的示例插件：
想发布自己插件的开发者可以直接复制这个仓库作为模板。

> English: Lua language intelligence (via your installed `lua-language-server`) and "Run current file" (via `lua`) for Lithe. Also the reference template for Lithe Store community plugins.

## 功能

| 功能 | 依赖的程序 |
| --- | --- |
| 补全、跳转定义、悬停提示、诊断 | `lua-language-server` |
| 运行当前 `.lua` 文件 | `lua` |

语法高亮由 Lithe 编辑器内置提供，不需要插件。插件本身不包含任何可执行文件，只调用你电脑上已安装的程序。
安装时 Lithe 会弹窗列出以上两个程序，确认后才会安装。

## 安装

1. 安装依赖：

   ```bash
   brew install lua lua-language-server
   ```

2. 在 Lithe 中打开 **设置 → 插件 → ⚙ → 管理插件仓库…**，添加 `https://github.com/Lithe-IDEA/Lithe-store`。
3. 在 **插件市场** 搜索 “Lua Support”，安装并确认。

目前只发布 macOS 包（Apple Silicon 与 Intel 共用）；Lithe for Windows 支持插件市场后会增加 Windows 包。

## 用这个仓库做模板

```text
io.github.lithe-idea.lua-support/plugin.json   # 插件描述，目录名必须等于插件 id
scripts/package.mjs                            # 校验并打包成 dist/<名称>-<版本>-<系统>.zip
.github/workflows/ci.yml                       # PR 时打包，并用 Lithe Store 的规则检查
.github/workflows/release.yml                  # 推送 v<版本> 标签时发布 GitHub Release
```

改成你自己的插件：

1. 把目录和 `plugin.json` 的 `id` 改成你自己的反向域名（如 `io.github.<用户名>.<插件名>`），
   **不要**使用 `dev.lithe.*`；`vendor.signatureRequirement` 保持 `"none"`。
2. 修改 `scripts/package.mjs` 顶部的 `PACKAGE_DIR`、`ASSET_PREFIX`、`OPERATING_SYSTEMS`。
   如果插件包含平台相关的可执行文件，需要按 `<名称>-<版本>-<系统>-<架构>.zip` 分别打包。
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
