import type { PersonalLocation, PersonalMemory } from './registry.ts'

const LOCATION_KEY = 'dsh-personal.location.v1'
const COLLAPSED_KEY = 'dsh-personal.collapsed.v1'

/** Browser storage may be absent, denied or full; every access degrades to "nothing remembered". */
function storage(): Storage | undefined {
  try { return globalThis.localStorage ?? undefined } catch { return undefined }
}

function read(key: string): unknown {
  try {
    const text = storage()?.getItem(key)
    return text ? JSON.parse(text) : undefined
  } catch { return undefined }
}

function write(key: string, value: unknown): void {
  try { storage()?.setItem(key, JSON.stringify(value)) } catch { /* Remembering is a convenience only. */ }
}

/** Parse untrusted stored data into a location, dropping anything malformed. */
export function parseLocation(value: unknown): PersonalLocation | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const { feature, sections } = value as Record<string, unknown>
  const clean: Record<string, string> = {}
  if (typeof sections === 'object' && sections !== null) {
    for (const [id, section] of Object.entries(sections)) if (typeof section === 'string') clean[id] = section
  }
  return { feature: typeof feature === 'string' ? feature : null, sections: clean }
}

/** Last Personal location in this browser profile. */
export const browserMemory: PersonalMemory = {
  load: () => parseLocation(read(LOCATION_KEY)),
  save: location => write(LOCATION_KEY, location),
}

/** Feature groups the user folded in the sidebar. */
export function loadCollapsed(): Set<string> {
  const value = read(COLLAPSED_KEY)
  return new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [])
}

export function saveCollapsed(ids: ReadonlySet<string>): void {
  write(COLLAPSED_KEY, [...ids])
}
