# git-flow — CaDt-DataLens 插件

调用系统 git，对「当前打开文件所在仓库」执行只读查询。所有结果以只读虚拟标签页展示，不修改任何仓库内容。

## 功能（工具菜单）

- **Git：变更列表** — `status --porcelain`，中文状态标注（已暂存修改 / 未跟踪 / 已修改…）
- **Git：最近历史（50 条）** — `log`（哈希 · 日期 · 作者 · 标题）
- **Git：当前文件历史** — `log --follow -- <文件>`
- **Git：当前文件差异（对比 HEAD）** — `diff HEAD -- <文件>`，以 diff 高亮展示
- **Git：分支列表** — `branch -vv`

## 安装

1. 在本页选择 **代码 → 克隆/下载 → 下载 ZIP**（ZIP 内根目录即 `plugin.json`）。
2. CaDt-DataLens → 设置 → 插件 → **导入插件(.zip)…**。
3. 打开一个位于 git 仓库内的文件，从 **工具(U)** 菜单使用各命令。

## 依赖

- CaDt-DataLens v1.0.0 及以上（需内置进程桥：`cadt.runCommandSync` / `cadt.openVirtualDoc`）
- 系统已安装 git 并加入 PATH；未安装时插件会给出提示，不影响应用其他功能

## 隐私与安全

本插件只以只读参数调用 git（status/log/diff/branch），不执行提交、推送等写操作，也不收集任何数据。

## 许可证

MIT
