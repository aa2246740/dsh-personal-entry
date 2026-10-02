# 开发并列功能

新建独立 DSH 插件，在 manifest 的 `peerDependencies` 声明 `dsh-personal`，在 `dsh.client.inject` 中声明它的客户端依赖。使用子页面图标等 0.2.5 新增字段时声明 `^0.2.5`，只用基础字段时 `^0.2.4` 仍然兼容：

```json
{
  "peerDependencies": { "dsh-personal": "^0.2.5" },
  "dsh": { "client": { "platform": "web", "inject": ["dsh-personal"] } }
}
```

这只是与 Personal 相关的字段，完整插件还需 Host 入口、构建后的 `./client` 导出、官方 bundle patch 与必要的 DSH peer 声明。官方依赖由 Host 提供，不能把第二份 Harness 打进功能包。`dsh.client.inject` 决定包加载关系，客户端代码的 `inject` 决定 Cordis 服务依赖，两者都需要。

```tsx
import type { Context } from '@deepseek-ai/cordis'
import type { PersonalFeaturePageProps } from 'dsh-personal/client'
import type {} from 'dsh-personal/client'

export const inject = ['personal']

function JournalIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 3h12v18H6zM9 7h6M9 11h6" fill="none" stroke="currentColor" />
  </svg>
}

function JournalPage({ section, onSectionChange }: PersonalFeaturePageProps) {
  return <section>
    <h1>{section === 'archive' ? '日记归档' : '今天的日记'}</h1>
    <button onClick={() => onSectionChange('archive')}>查看归档</button>
  </section>
}

export function apply(ctx: Context): void {
  ctx.effect(() => ctx.personal.register({
    id: 'journal', title: '日记', order: 20,
    description: '记录今天值得留下的事。',
    icon: JournalIcon, component: JournalPage,
    sections: [{ id: 'today', title: '今天' }, { id: 'archive', title: '归档' }],
  }))
}
```

## 字段

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `id` | 是 | 全局唯一的非空字符串 |
| `title` | 是 | 侧栏与标题栏显示的名称，由功能自己决定语言 |
| `order` | 是 | 越小越靠前，相同时按 id 排序；非数字按 0 处理 |
| `icon` | 是 | 接收 `size` 的方形图标组件，使用 `currentColor` 以跟随主题；侧栏按 16px、图标栏按 18px 请求 |
| `component` | 是 | 功能页面，填满标题栏以下的区域 |
| `sections` | 否 | 子页面，`id` 在功能内唯一；两个及以上时显示为可折叠分组 |
| `sections[].icon` | 否 | 0.2.5 起，子页面标题前的 16px 图标 |
| `description` | 否 | 0.2.5 起可选，作为侧栏悬停提示 |
| `detail` | 否 | 0.2.5 起不再显示，保留只为兼容旧注册 |

## 导航约定

- 排在最前的功能是个人空间的默认页面。想做「总览」这类首页时，用最小的 `order` 注册一个无子页面的功能即可。
- 用户明确打开过的功能和各功能的子页面会记在本机。该功能暂未注册（加载中或热重载）时先显示第一个功能，注册后自动回到它；已不存在的子页面回退到第一个。
- 页面接收 `section`、`navigationKey`、`onSectionChange`。0.2.8 起还提供可选的 `portalContainer`，用于 `createPortal(content, portalContainer)` 或浮层库的 `container` 参数。个人空间位于原生 dialog 中，同文档浮层应挂到这个容器或功能自己的 DOM 内；直接挂到 `document.body` 会落到 dialog 后面。iframe 内部的浮层不受影响。内部路由变化调用 `onSectionChange` 同步侧栏高亮；用户重复点同一子页面时 `navigationKey` 仍会增加，页面可据此回到该子页面的根视图。不要在自家页面后台切换时抢占其他功能的选择。
- `ctx.personal.select(id, section?)` 打开指定功能；`select(null)` 回到默认功能（0.2.4 及以前表示打开总览目录，目录已移除）。`getSelection()` 返回当前显示的功能，没有功能时为 `null`。
- 已打开过的功能在个人面板内保持挂载，回到工作时也只隐藏，重新进入会保留页面状态。后台业务与资源占用由功能自己负责，移除注册会正常卸载组件。页面标题栏属于总壳，功能页面不需要再处理 macOS 红绿灯和窗口拖动。
- 页面或图标抛错只影响该功能自身。注册的移除函数可重复调用，但不允许重复 id 覆盖已有功能。无需修改 Personal 源码或 OOPS 即可增加、移除并列功能。
- 功能的业务数据、路由和持久化由功能插件自己负责。

## 打开宿主设置等全局界面

Personal 0.2.8 的 `ctx.personal.suspend()` 暂时隐藏个人空间，并返回幂等的恢复函数。功能打开宿主设置前先调用它，设置关闭后调用恢复函数（取消恢复时传 `false`）；页面和 iframe 始终保留。若用户期间主动切换空间，恢复函数不会覆盖其选择。旧版本没有此接口，兼容消费者应按需探测。
