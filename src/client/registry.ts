import type { ComponentType } from 'react'

/** One feature-local navigation destination. */
export interface PersonalSection { readonly id: string; readonly title: string }

/** Controlled navigation passed to a feature page; the feature owns its router. */
export interface PersonalFeaturePageProps {
  section: string | null
  navigationKey: number
  onSectionChange: (section: string) => void
}

/** A peer feature in Personal. The feature owns its page and durable data. */
export interface PersonalFeature {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly detail: string
  readonly order: number
  readonly icon: ComponentType<{ size?: number }>
  readonly component: ComponentType<PersonalFeaturePageProps>
  readonly sections?: readonly PersonalSection[]
}

/** Stable snapshots support registration, removal and React subscriptions. */
export class PersonalRegistry {
  private rows: readonly PersonalFeature[] = []
  private readonly listeners = new Set<() => void>()
  private selected: string | null = null
  private readonly sections = new Map<string, string>()
  private readonly versions = new Map<string, number>()

  /** Current ordered features; stable until the registry changes. */
  getSnapshot = (): readonly PersonalFeature[] => this.rows

  /** Observe feature registrations; returns the listener disposer. */
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /** Register one unique feature and return its idempotent disposer. */
  register(feature: PersonalFeature): () => void {
    if (this.rows.some(row => row.id === feature.id)) throw new Error(`Personal feature already registered: ${feature.id}`)
    if (new Set(feature.sections?.map(section => section.id)).size !== (feature.sections?.length ?? 0)) throw new Error(`Duplicate Personal section: ${feature.id}`)
    this.rows = [...this.rows, feature].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
    this.emit()
    return () => {
      if (!this.rows.includes(feature)) return
      this.rows = this.rows.filter(row => row !== feature)
      this.sections.delete(feature.id)
      this.versions.delete(feature.id)
      if (this.selected === feature.id) this.selected = null
      this.emit()
    }
  }

  /** Selection survives leaving the main panel during this client lifetime. */
  getSelection = (): string | null => this.selected

  /** Active leaf; stable between navigation changes. */
  getSelectedSection = (): string | null => this.selected === null ? null : this.getSection(this.selected)

  /** Explicit leaf clicks remain observable even when the same leaf is selected. */
  getNavigationKey = (): number => this.selected === null ? 0 : this.getFeatureNavigationKey(this.selected)

  /** Command counter belonging only to the named feature. */
  getFeatureNavigationKey = (id: string): number => this.versions.get(id) ?? 0

  /** Last visited leaf for a feature, or its first registered leaf. */
  getSection = (id: string): string | null => this.sections.get(id) ?? this.rows.find(row => row.id === id)?.sections?.[0]?.id ?? null

  /** Update a feature's leaf without stealing selection from another feature. */
  setSection = (id: string, section: string): void => {
    const feature = this.rows.find(row => row.id === id)
    if (!feature?.sections?.some(row => row.id === section)) throw new Error(`Unknown Personal section: ${id}/${section}`)
    if (this.getSection(id) === section) return
    this.sections.set(id, section)
    this.emit()
  }

  /** Open a registered feature, or null for the Personal directory. */
  select = (id: string | null, section?: string): void => {
    if (id !== null && !this.rows.some(row => row.id === id)) throw new Error(`Unknown Personal feature: ${id}`)
    if (id !== null && section !== undefined) {
      if (!this.rows.find(row => row.id === id)?.sections?.some(row => row.id === section)) throw new Error(`Unknown Personal section: ${id}/${section}`)
      this.sections.set(id, section)
      this.versions.set(id, this.getFeatureNavigationKey(id) + 1)
    } else if (this.selected === id) return
    this.selected = id
    this.emit()
  }

  private emit(): void { for (const listener of this.listeners) listener() }
}
