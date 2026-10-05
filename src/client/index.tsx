import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { copyFor, type LanguageSource } from './copy.ts'
import { browserMemory } from './memory.ts'
import { PersonalEntry } from './navigation.tsx'
import { PersonalSurface } from './surface.tsx'
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

const PLUGINS = 'plugins' as MainPanelId

/**
 * A persistent additive surface leaves the Work component tree mounted. Space
 * navigation never elects another main panel or replaces the official sidebar.
 */
export function apply(ctx: Context): void {
  const visible = createFlag()
  const registry = new PersonalRegistry(browserMemory, () => {
    const wasOpen = visible.get()
    visible.set(false)
    let changed = false
    let resumed = false
    const off = visible.subscribe(() => { changed = true })
    return (restore = true) => {
      if (resumed) return
      resumed = true
      off()
      if (restore && wasOpen && !changed) visible.set(true)
    }
  }, () => visible.set(true))
  const language: LanguageSource = {
    get: () => { try { return ctx.locale.getLocale().active } catch { return undefined } },
    subscribe: listener => { try { return ctx.locale.subscribe(listener) } catch { return () => {} } },
  }
  const hasPanel = (id: MainPanelId) => {
    try { return ctx.slots.entriesOfSlot('main').some(entry => entry.options.key === id) } catch { return false }
  }
  const sidebarCollapsed = createFlag()
  const showWork = () => visible.set(false)
  const shell: PersonalShell = {
    registry,
    language,
    visible,
    sidebarCollapsed,
    sidebarHidden: createFlag(),
    toggleSidebar: () => sidebarCollapsed.set(!sidebarCollapsed.get()),
    showPersonal: () => visible.set(true),
    showWork,
    canOpenPlugins: () => hasPanel(PLUGINS),
    openPlugins: () => {
      if (hasPanel(PLUGINS)) { showWork(); ctx.layout.selectPanel(PLUGINS) }
    },
  }
  ctx.effect(() => ctx.reflect.provide('personal', registry))
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay', id: 'personal', inject: () => ({ shell }),
  }, PersonalSurface))
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action', id: 'personal', order: -10, inject: () => ({ shell }),
  }, PersonalEntry))
  registerSpaceShortcut(ctx, () => copyFor(language.get()).toggleSpace, () => {
    visible.set(!visible.get())
  })
}
