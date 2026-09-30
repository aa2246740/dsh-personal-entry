import type { Context } from '@deepseek-ai/cordis'

/** The part of the official shortcut service Personal uses, typed locally so no API type is pinned. */
interface ShortcutService {
  register(command: {
    id: string
    label: () => string
    aliases: readonly string[]
    defaults: Record<string, never>
    regions: readonly string[]
    modals: readonly string[]
    resolve(): { status: 'handled'; run(): void }
  }): () => void
}

/**
 * Offer "switch space" in the official shortcut settings. It ships unbound so it
 * can never collide with a current or future DSH default; users choose the keys.
 * The command exists only while the shortcut service does, and any API change
 * leaves Personal working without it.
 */
export function registerSpaceShortcut(ctx: Context, label: () => string, run: () => void): void {
  ctx.inject(['shortcuts'], scope => {
    scope.effect(() => {
      const service = (scope as unknown as { shortcuts?: Partial<ShortcutService> }).shortcuts
      if (typeof service?.register !== 'function') return () => {}
      try {
        return service.register({
          id: 'personal.space.toggle',
          label,
          aliases: ['personal', 'work', 'space', '个人', '工作'],
          defaults: {},
          regions: ['page', 'editable'],
          modals: [],
          resolve: () => ({ status: 'handled', run }),
        })
      } catch (error) {
        console.warn('[dsh-personal] space shortcut unavailable', error)
        return () => {}
      }
    }, 'dsh-personal: space shortcut')
  })
}
