import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { watchPersonalChrome } from './chrome.ts'
import { copyFor, type LanguageSource } from './copy.ts'
import { browserMemory } from './memory.ts'
import { PersonalEntryIcon, PersonalLeading, PersonalSidebar } from './navigation.tsx'
import { PersonalPage } from './page.tsx'
import { PersonalRegistry } from './registry.ts'
import { createFlag, type PersonalShell } from './shell.ts'
import { registerSpaceShortcut } from './shortcut.ts'

declare module '@deepseek-ai/cordis' {
  interface Context { personal: PersonalRegistry }
}

export type {
  PersonalFeature, PersonalFeaturePageProps, PersonalIconComponent, PersonalSection,
} from './registry.ts'
export type { PersonalRegistry } from './registry.ts'
export const inject = ['slots', 'layout', 'locale']

const PANEL = 'personal' as MainPanelId
const PLUGINS = 'plugins' as MainPanelId

/**
 * Personal is one ordinary global panel plus a feature registry. While the panel is
 * selected it shadows the official sidebar and window seat at priority -100; leaving
 * the panel or unloading the plugin releases them, restoring the official column.
 */
export function apply(ctx: Context): void {
  const registry = new PersonalRegistry(browserMemory)
  const language: LanguageSource = {
    get: () => { try { return ctx.locale.getLocale().active } catch { return undefined } },
    subscribe: listener => { try { return ctx.locale.subscribe(listener) } catch { return () => {} } },
  }
  const hasPanel = (id: MainPanelId) => {
    try { return ctx.slots.entriesOfSlot('main').some(entry => entry.options.key === id) } catch { return false }
  }
  const showWork = () => ctx.layout.selectPanel(null)
  const shell: PersonalShell = {
    registry,
    language,
    sidebarHidden: createFlag(),
    toggleSidebar: () => ctx.layout.toggleSidebar(),
    showWork,
    canOpenPlugins: () => hasPanel(PLUGINS),
    openPlugins: () => { if (hasPanel(PLUGINS)) ctx.layout.selectPanel(PLUGINS) },
  }
  ctx.effect(() => ctx.reflect.provide('personal', registry))
  ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL, inject: () => ({ shell }) }, PersonalPage))
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist', id: PANEL, order: -10, label: () => copyFor(language.get()).space,
  }, PersonalEntryIcon))
  ctx.slots.inject('sidebar', () => watchPersonalChrome(ctx.layout.panelInfo, () => {
    const sidebar = ctx.slots.register({ name: 'sidebar', priority: -100, inject: () => ({ shell }) }, PersonalSidebar)
    try {
      const leading = ctx.slots.register({ name: 'shell.leading', priority: -100, inject: () => ({ shell }) }, PersonalLeading)
      return () => { leading(); sidebar() }
    } catch (error) { sidebar(); throw error }
  }))
  registerSpaceShortcut(ctx, () => copyFor(language.get()).toggleSpace, () => {
    if (ctx.layout.panelInfo.getSnapshot().activePanelId === PANEL) showWork()
    else ctx.layout.selectPanel(PANEL)
  })
}
