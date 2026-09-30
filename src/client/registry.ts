import type { ComponentType } from 'react'

/** Square glyph used by features and their destinations; `size` is in px. */
export type PersonalIconComponent = ComponentType<{ size?: number }>

/** One feature-local navigation destination. */
export interface PersonalSection {
  readonly id: string
  readonly title: string
  /** Optional 16px glyph shown before the title. */
  readonly icon?: PersonalIconComponent
}

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
  /** Ascending position; ties sort by id. The first feature is the default destination. */
  readonly order: number
  readonly icon: PersonalIconComponent
  readonly component: ComponentType<PersonalFeaturePageProps>
  readonly sections?: readonly PersonalSection[]
  /** One-line summary, used as the navigation tooltip. */
  readonly description?: string
  /** @deprecated Accepted for 0.2 registrations; Personal no longer displays it. */
  readonly detail?: string
}

/** The navigation position Personal restores across reloads. */
export interface PersonalLocation {
  readonly feature: string | null
  readonly sections: Readonly<Record<string, string>>
}

/** Storage for the last location; implementations must not throw. */
export interface PersonalMemory {
  load(): PersonalLocation | undefined
  save(location: PersonalLocation): void
}

const rank = (feature: PersonalFeature): number => Number.isFinite(feature.order) ? feature.order : 0

function validate(feature: PersonalFeature): void {
  if (typeof feature?.id !== 'string' || feature.id === '') throw new Error('Personal feature id must be a non-empty string')
  if (typeof feature.title !== 'string') throw new Error(`Personal feature title must be a string: ${feature.id}`)
  if (!feature.component) throw new Error(`Personal feature has no component: ${feature.id}`)
  const ids = feature.sections?.map(section => section.id) ?? []
  if (new Set(ids).size !== ids.length) throw new Error(`Duplicate Personal section: ${feature.id}`)
}

/**
 * Stable snapshots support registration, removal and React subscriptions.
 * The explicitly opened feature is a preference: while it is not registered
 * (still loading, or reloading) Personal shows the first feature instead and
 * returns to it once it registers again.
 */
export class PersonalRegistry {
  private rows: readonly PersonalFeature[] = []
  private readonly listeners = new Set<() => void>()
  private preferred: string | null = null
  private readonly sections = new Map<string, string>()
  private readonly versions = new Map<string, number>()
  private readonly memory: PersonalMemory | undefined

  constructor(memory?: PersonalMemory) {
    this.memory = memory
    const saved = memory?.load()
    if (!saved) return
    this.preferred = saved.feature
    for (const [feature, section] of Object.entries(saved.sections)) this.sections.set(feature, section)
  }

  /** Current ordered features; stable until the registry changes. */
  getSnapshot = (): readonly PersonalFeature[] => this.rows

  /** Observe registry changes; returns the listener disposer. */
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  /** Register one unique feature and return its idempotent disposer. */
  register(feature: PersonalFeature): () => void {
    validate(feature)
    if (this.rows.some(row => row.id === feature.id)) throw new Error(`Personal feature already registered: ${feature.id}`)
    this.rows = [...this.rows, feature].sort((a, b) => rank(a) - rank(b) || a.id.localeCompare(b.id))
    this.emit()
    return () => {
      if (!this.rows.includes(feature)) return
      this.rows = this.rows.filter(row => row !== feature)
      this.emit()
    }
  }

  /** Displayed feature: the opened one when registered, otherwise the first; null only when empty. */
  getSelection = (): string | null => {
    if (this.preferred !== null && this.rows.some(row => row.id === this.preferred)) return this.preferred
    return this.rows[0]?.id ?? null
  }

  /** Active leaf of the displayed feature; stable between navigation changes. */
  getSelectedSection = (): string | null => {
    const id = this.getSelection()
    return id === null ? null : this.getSection(id)
  }

  /** Explicit leaf clicks remain observable even when the same leaf is selected. */
  getNavigationKey = (): number => {
    const id = this.getSelection()
    return id === null ? 0 : this.getFeatureNavigationKey(id)
  }

  /** Command counter belonging only to the named feature. */
  getFeatureNavigationKey = (id: string): number => this.versions.get(id) ?? 0

  /** Last visited leaf for a feature when it still exists, or its first registered leaf. */
  getSection = (id: string): string | null => {
    const sections = this.rows.find(row => row.id === id)?.sections
    const remembered = this.sections.get(id)
    if (remembered !== undefined && sections?.some(section => section.id === remembered)) return remembered
    return sections?.[0]?.id ?? null
  }

  /** Update a feature's leaf without stealing selection from another feature. */
  setSection = (id: string, section: string): void => {
    this.requireSection(id, section)
    if (this.sections.get(id) === section) return
    this.sections.set(id, section)
    this.persist()
    this.emit()
  }

  /** Open a registered feature (optionally one of its leaves), or null for the default feature. */
  select = (id: string | null, section?: string): void => {
    if (id !== null && !this.rows.some(row => row.id === id)) throw new Error(`Unknown Personal feature: ${id}`)
    if (id !== null && section !== undefined) {
      this.requireSection(id, section)
      this.sections.set(id, section)
      this.versions.set(id, this.getFeatureNavigationKey(id) + 1)
    } else if (this.preferred === id) return
    this.preferred = id
    this.persist()
    this.emit()
  }

  private requireSection(id: string, section: string): void {
    if (!this.rows.find(row => row.id === id)?.sections?.some(row => row.id === section)) throw new Error(`Unknown Personal section: ${id}/${section}`)
  }

  private persist(): void {
    this.memory?.save({ feature: this.preferred, sections: Object.fromEntries(this.sections) })
  }

  private emit(): void { for (const listener of this.listeners) listener() }
}
