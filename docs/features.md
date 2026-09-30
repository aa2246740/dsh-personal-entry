# 开发并列功能

新建独立 DSH 插件，在 manifest 的 `peerDependencies` 声明 `dsh-personal`，在 `dsh.client.inject` 中声明它的客户端依赖。当前兼容接口使用 `^0.2.4`：

```json
{
  "peerDependencies": { "dsh-personal": "^0.2.4" },
  "dsh": { "client": { "platform": "web", "inject": ["dsh-personal"] } }
}
```

这只是与 Personal 相关的字段，完整插件还需 Host 入口、构建后的 `./client` 导出、官方 bundle patch 与必要的 DSH peer 声明。官方依赖由 Host 提供，不能把第二份 Harness 打进功能包。`dsh.client.inject` 决定包加载关系，客户端代码的 `inject` 决定 Cordis 服务依赖，两者都需要。

```tsx
import type { Context } from '@deepseek-ai/cordis'
import type { PersonalFeaturePageProps } from 'dsh-personal/client'
import type {} from 'dsh-personal/client'

export const inject = ['personal']

function JournalIcon({ size = 20 }: { size?: number }) {
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
    description: '记录今天值得留下的事。', detail: '每天一点记录',
    icon: JournalIcon, component: JournalPage,
    sections: [{ id: 'today', title: '今天' }, { id: 'archive', title: '归档' }],
  }))
}
```

功能 id 全局唯一，叶子 id 在功能内唯一。`order` 越小越靠前，相同时按 id 排序。叶子首项是默认目的地；页面接收 `section`、`navigationKey`、`onSectionChange`。内部路由变化调用 `onSectionChange` 同步高亮；用户重复点同一菜单时 `navigationKey` 仍会增加，页面可据此返回该叶子的根页面。不要在自家页面后台切换时抢占其他功能的选择。

当前选择和各功能叶子只保留于本次 Client 生命周期，已访问页面在个人面板内保持挂载。离开面板后的业务恢复和持久数据由功能插件负责。注册的移除函数可重复调用，但不允许重复 id 覆盖已有功能。无需修改 Personal 源码或 OOPS 即可增加、移除并列功能。
