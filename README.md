# DSH Personal Entry

DeepSeek Harness 的可扩展个人空间入口。GitHub 仓库和 npm 发布名是 `dsh-personal-entry`，插件内部 ID、安装别名和功能插件 API 保持 `dsh-personal`。这是社区外部插件，通过 DSH 官方公开插件接口接入；不是 DeepSeek 官方维护的插件。

## 已有功能

- 官方侧栏底部显示「个人」入口。进入后，侧栏顶部显示「个人 ▾」，点击后在下拉菜单中选择「工作」回到之前的工作页面；当前的「个人」带勾选，选中它只关闭菜单；macOS 收起侧栏后，红绿灯旁显示「打开侧栏」和「回到工作」。
- 工作页面和访问过的个人功能在空间切换时保持挂载，保留草稿、滚动位置和内嵌页面。首次打开个人空间才创建功能页面；离开后隐藏，功能卸载或 Personal 卸载时释放。
- 个人侧栏按功能分组：有多个子页面的功能是可折叠分组，其余是单行入口；折叠状态和上次打开的位置在本机记住，重新进入时回到原处。
- 个人空间没有自带的「总览」目录页。默认打开排在最前的功能，因此以后的总览插件只需用最小的 `order` 注册即可成为首页。
- 页面标题栏与官方会话标题栏同一高度，显示「功能 / 子页面」，可拖动窗口并避让 macOS 红绿灯。
- 颜色、圆角和动效读取 DSH 主题变量：跟随 DSH 的浅色/深色主题，避让 Windows 标题栏，并保留网页版 56px 图标栏。个人侧栏的收起状态独立于工作侧栏。界面文字随 DSH 语言切换中文或英文。
- 在官方快捷键设置里提供「切换个人与工作空间」命令，默认不绑定按键，不会与官方或其他插件冲突。
- 某个功能的页面或图标出错时只影响它自己，并提供「重新打开」；卸载 Personal 会释放其界面，工作页面始终由官方插件持有。

OOPS 是第一个并列功能，需单独安装。本仓库只包含入口与总壳，不包含聊天、画布、知识库或个人数据。

## 安装与兼容

已发布版本为 0.2.7；本分支的切换性能修复尚未发布，验证见 [性能修复报告](docs/switch-performance.md)。以 DSH 0.2.0-rc.2 构建和测试，声明 `>=0.2.0-rc.1 <0.3.0-0`。DSH 启动时会拒绝声明范围之外的插件，因此范围覆盖整个 0.2 系列（含其补丁版本），但不包括可能带来不兼容改动的 0.3 预发布和正式版。声明范围不代表范围内每个版本都已实测；DSH 0.3 发布后应重新验证再放宽。

兼容性来自以下约束，而不是版本号本身：

- 运行时只依赖 React 与 Cordis 服务 `slots`、`layout`、`locale`，不打包、不 import 任何官方运行时模块，官方包只用于类型检查。
- 使用公开的 `sidebar.footer.action` 和 `shell.overlay` 槽位。空间切换只改变本插件的可见状态；仅「前往插件」调用 `ctx.layout.selectPanel`。不再替换官方 `main`、`sidebar` 或窗口控件。
- 个人界面使用原生 `dialog` 保持焦点范围，关闭时恢复工作界面的焦点。功能若使用 React portal，应使用页面参数 `portalContainer`，详见功能开发指南。
- 快捷键服务按需探测，接口不符时静默跳过；本地存储读写失败时只是不记忆位置。

### 桌面版

从 [GitHub Release](https://github.com/aa2246740/dsh-personal-entry/releases/tag/v0.2.7) 下载 `dsh-personal-0.2.7.tgz`，在官方「插件 → 添加插件」中填入下载后的本地路径，安装并启用。升级时先通过官方界面卸载旧包，再安装新版。OOPS 等功能插件单独安装。

### npm / CLI

npm 包名是 [`dsh-personal-entry`](https://www.npmjs.com/package/dsh-personal-entry)。使用 npm 别名保留 `dsh-personal` 的运行时解析和现有功能插件依赖：

```sh
dsh plugin --profile web add dsh-personal@npm:dsh-personal-entry@0.2.7
```

开发功能插件时也使用同一别名：

```sh
npm install dsh-personal@npm:dsh-personal-entry@0.2.7
```

不要直接安装 npm 上的 `dsh-personal`，它属于另一位发布者。单独安装 `dsh-personal-entry` 也不会提供现有功能需要的 `dsh-personal/client` 解析名。桌面用户使用上面的 GitHub tgz；npm 包通过别名安装。包内声明官方 bundle patch 和可选 peer，复用 Host 依赖。

### 发布

源码的 `private: true` 防止误发到被占用的旧名称。完成构建后运行 `npm run release:pack`，生成桌面包 `dsh-personal-0.2.7.tgz`、npm 包 `dsh-personal-entry-0.2.7.tgz` 和 `SHA256SUMS`，均位于忽略目录 `.local/release/`。两份包的运行时代码相同，npm 包只调整发布元数据，并移除开发脚本及开发依赖。

## 开发

继续使用已有 checkout，不需要每个 Agent 再克隆 Harness 或 OOPS。已有上级 node_modules 时可以直接复用。没有开发工具时才在本仓库执行：

```sh
npm ci --ignore-scripts --legacy-peer-deps
```

目标 Harness 必须已有公共包构建产物及非官方 dshx 的 `tools/dshx/src/client-build.js`。设置 `DSHX_HARNESS` 指向现成目录，或使用已有的 `~/.config/dshx/harness`：

```sh
export DSHX_HARNESS=/absolute/path/to/existing/harness
npm run typecheck
npm test
npm run build
npm pack
```

脚本只在本插件的 node_modules 建立官方包链接，并生成本插件 lib 产物。不会修改或编译官方 Harness，也不会启动、重启或更新运行中的桌面。若本插件的依赖链接已指向其他版本，脚本报错，需核对该链接再切换；不会静默覆盖已有目录。

`npm run test:registry` 不依赖 Harness，可单独检查排序、注册、移除、默认功能、位置记忆和叶子导航。`npm run test:switch` 构建后在离线页面检查真实插件组件的挂载次数、草稿和 iframe 保留、菜单、折叠、焦点、portal 与卸载；它要求已配置的 `~/.codex/playwright-runtime` 固定运行时，不会自动下载浏览器。当前未启用 GitHub CI。`docs/ci-example.yml` 提供仅运行无 Host registry 测试的示例，具备 workflow 权限的维护者可按需放入 `.github/workflows/`。完整构建和真实桌面验收应分别记录。

## 添加功能

我们或其他开发者都可开发独立功能插件，声明 `dsh-personal` 依赖并调用 `ctx.personal.register()`，无需修改 OOPS 或总壳。注册服务由 Personal 提供，属于本插件 API。代码、manifest 和导航约定见 [功能开发指南](docs/features.md)，职责与生命周期见 [架构说明](docs/architecture.md)。

## 目录

| 路径 | 内容 |
| --- | --- |
| `src/client/registry.ts` | 功能注册、排序、默认功能和导航状态 |
| `src/client/index.tsx` | 官方槽位接入与 Personal 服务 |
| `src/client/navigation.tsx` | 空间切换、个人侧栏、图标栏和 macOS 窗口控件 |
| `src/client/page.tsx` | 标题栏、功能页面容器、空状态与错误兜底 |
| `src/client/surface.tsx` | 常驻个人界面、原生 dialog 和独立侧栏布局 |
| `src/client/personal.module.css` | 基于 DSH 主题变量的局部样式 |
| `src/client/memory.ts` | 本机记住位置与折叠状态 |
| `src/client/copy.ts` | 中英文界面文字 |
| `src/client/shortcut.ts` | 可选的空间切换快捷键命令 |
| `scripts/develop.mjs` | 复用现有 Harness 的独立构建 |
| `tests/` | 注册和槽位生命周期回归 |

MIT，参见 [LICENSE](LICENSE)。
