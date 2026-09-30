import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { PersonalRegistry } from './registry.ts'
import { PersonalPage } from './page.tsx'
import { PersonalSidebar, PersonalIcon } from './navigation.tsx'
import { watchPersonalChrome } from './chrome.ts'

declare module '@deepseek-ai/cordis' {
  interface Context { personal: PersonalRegistry }
}

export type { PersonalFeature, PersonalFeaturePageProps, PersonalSection } from './registry.ts'
export const inject = ['slots', 'layout', 'locale']
const PANEL = 'personal' as MainPanelId

/** Register an ordinary global panel and a lifecycle-owned feature registry. */
export function apply(ctx: Context): void {
  const registry = new PersonalRegistry()
  ctx.effect(() => ctx.reflect.provide('personal', registry))
  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main', key: PANEL,
    inject: () => ({ registry, toggleSidebar: () => ctx.layout.toggleSidebar() }),
  }, PersonalPage))
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist', id: PANEL, order: -10, label: '个人',
  }, PersonalIcon))
  ctx.slots.inject('sidebar', () => watchPersonalChrome(ctx.layout.panelInfo, () => {
    const sidebar = ctx.slots.register({ name: 'sidebar', priority: -100,
      inject: () => ({ registry, returnToWork: () => ctx.layout.selectPanel(null), toggleSidebar: () => ctx.layout.toggleSidebar() }),
    }, PersonalSidebar)
    try {
      const leading = ctx.slots.register({ name: 'shell.leading', priority: -100 }, () => null)
      return () => { leading(); sidebar() }
    } catch (error) { sidebar(); throw error }
  }))
}
