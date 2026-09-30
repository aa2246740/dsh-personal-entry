# DSH Personal Entry

DeepSeek Harness 的可扩展个人空间入口。仓库名是 `dsh-personal-entry`，插件 ID 和包名是 `dsh-personal`。这是社区外部插件，通过 DSH 官方公开插件接口接入；不是 DeepSeek 官方维护的插件。

## 已有功能

- 在官方侧栏显示「个人」，进入个人空间后显示独立侧栏，通过「回到工作」恢复官方入口。
- 功能总览、多级菜单、面包屑、菜单折叠、窄屏与主题适配。
- 多个独立功能插件注册到同一目录，拥有各自页面、叶子菜单和数据。
- 按开发者声明的 `order` 排序，卸载当前功能自动返回总览，页面错误保留导航。

OOPS 是第一个并列功能，需单独安装。本仓库只包含入口与总壳，不包含聊天、画布、知识库或个人数据。当前没有界面拖动排序或持久化用户自定义顺序。

## 安装与兼容

当前版本 0.2.4 面向 DSH 0.2.0，声明 `>=0.2.0-rc.1 <0.2.1`，本仓库整理时的构建目标为 0.2.0-rc.2。需对其他 Host 版本另行验证；声明范围不代表整个范围都已实测。

构建后，在官方「插件 → 添加插件」中选择本地 `dsh-personal-0.2.4.tgz`，安装并启用，再安装依赖它的功能插件。包内声明 `dsh.bundle.patch` 和官方可选 peer，使用 Host 提供的官方依赖。本仓库的 `private: true` 防止误发 npm，不影响 GitHub 公开或本地 tgz 安装。

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

`npm run test:registry` 不依赖 Harness，可单独检查排序、注册、移除和叶子导航。`npm test` 还验证真实公开 SlotCore 的切换与恢复。当前未启用 GitHub CI。`docs/ci-example.yml` 提供仅运行无 Host registry 测试的示例，具备 workflow 权限的维护者可按需放入 `.github/workflows/`。完整构建和真实桌面验收应在已配置的开发环境完成，分别记录结果。

## 添加功能

我们或其他开发者都可开发独立功能插件，声明 `dsh-personal` 依赖并调用 `ctx.personal.register()`，无需修改 OOPS 或总壳。注册服务由 Personal 提供，属于本插件 API。代码、manifest 和导航约定见 [功能开发指南](docs/features.md)，职责与生命周期见 [架构说明](docs/architecture.md)。

## 目录

| 路径 | 内容 |
| --- | --- |
| `src/client/registry.ts` | 功能注册、排序和导航状态 |
| `src/client/index.tsx` | 官方槽位接入与 Personal 服务 |
| `src/client/navigation.tsx` | 左侧功能与子菜单 |
| `src/client/page.tsx` | 总览和功能页面容器 |
| `src/client/personal.module.css` | 局部样式 |
| `scripts/develop.mjs` | 复用现有 Harness 的独立构建 |
| `tests/` | 注册和槽位生命周期回归 |

MIT，参见 [LICENSE](LICENSE)。
