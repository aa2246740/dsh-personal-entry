import type { LanguageSource } from './copy.ts'
import type { PersonalRegistry } from './registry.ts'

/** Subscribable boolean shared between the sidebar and the page. */
export interface Flag {
  get(): boolean
  set(value: boolean): void
  subscribe(listener: () => void): () => void
}

export function createFlag(initial = false): Flag {
  let value = initial
  const listeners = new Set<() => void>()
  return {
    get: () => value,
    set: next => {
      if (next === value) return
      value = next
      for (const listener of listeners) listener()
    },
    subscribe: listener => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
  }
}

/** Everything the Personal components receive from the plugin; the only bridge to Host services. */
export interface PersonalShell {
  readonly registry: PersonalRegistry
  readonly language: LanguageSource
  /** True while the frame hides the sidebar column entirely (macOS/Windows collapse). */
  readonly sidebarHidden: Flag
  toggleSidebar(): void
  showWork(): void
  canOpenPlugins(): boolean
  openPlugins(): void
}

/** Slot inject share for every Personal component. */
export interface PersonalShellProps { shell: PersonalShell }

export const isDarwinDesktop = (): boolean => document.documentElement.dataset.platform === 'darwin'
