import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PersonalRegistry, type PersonalFeature, type PersonalLocation, type PersonalMemory } from '../src/client/registry.ts'
import { parseLocation } from '../src/client/memory.ts'

const feature = (id: string, order = 0): PersonalFeature => ({ id, order, title: id, icon: () => null, component: () => null })
const oops = (): PersonalFeature => ({ ...feature('oops'), sections: [{ id: 'chat', title: '对话' }, { id: 'boards', title: '画布' }] })

function memory(initial?: PersonalLocation): PersonalMemory & { saved: PersonalLocation[] } {
  const saved: PersonalLocation[] = []
  return { saved, load: () => initial, save: location => { saved.push(location) } }
}

test('the first feature is the default destination and disposal falls back without losing the preference', () => {
  const registry = new PersonalRegistry()
  assert.equal(registry.getSelection(), null)
  const removeOops = registry.register(feature('oops', 10))
  const removeJournal = registry.register(feature('journal', 5))
  assert.deepEqual(registry.getSnapshot().map(row => row.id), ['journal', 'oops'])
  assert.equal(registry.getSelection(), 'journal')
  registry.select('oops')
  removeJournal()
  assert.equal(registry.getSelection(), 'oops')
  removeOops()
  assert.equal(registry.getSelection(), null)
  assert.deepEqual(registry.getSnapshot(), [])
  removeOops()
  registry.register(feature('journal', 5))
  assert.equal(registry.getSelection(), 'journal')
  registry.register(feature('oops', 10))
  assert.equal(registry.getSelection(), 'oops', 'a reloaded feature regains the selection')
  registry.select(null)
  assert.equal(registry.getSelection(), 'journal')
})

test('duplicate or malformed registrations cannot shadow an existing feature; removal permits replacement', () => {
  const registry = new PersonalRegistry()
  const remove = registry.register(feature('oops'))
  assert.throws(() => registry.register(feature('oops')), /already registered/)
  assert.throws(() => registry.register({ ...feature('x'), sections: [{ id: 'a', title: 'A' }, { id: 'a', title: 'B' }] }), /Duplicate Personal section/)
  assert.throws(() => registry.register({ ...feature(''), id: '' }), /non-empty/)
  remove()
  registry.register(feature('oops'))
  assert.throws(() => registry.select('missing'), /Unknown/)
})

test('a non-numeric order sorts as zero instead of corrupting the order', () => {
  const registry = new PersonalRegistry()
  registry.register(feature('late', 5))
  registry.register({ ...feature('loose'), order: Number.NaN })
  registry.register(feature('early', -5))
  assert.deepEqual(registry.getSnapshot().map(row => row.id), ['early', 'loose', 'late'])
})

test('subscriptions have stable snapshots and stop after cleanup', () => {
  const registry = new PersonalRegistry()
  const original = registry.getSnapshot()
  let changes = 0
  const stop = registry.subscribe(() => changes++)
  assert.equal(registry.getSnapshot(), original)
  registry.register(feature('oops'))
  registry.register(feature('journal', 1))
  registry.select('journal')
  registry.select('journal')
  assert.equal(changes, 3)
  stop()
  registry.select(null)
  assert.equal(changes, 3)
})

test('peer features preserve their own leaf and explicit repeat clicks publish a navigation command', () => {
  const registry = new PersonalRegistry()
  registry.register(oops())
  registry.register(feature('journal', 1))
  assert.equal(registry.getSelectedSection(), 'chat')
  registry.select('oops', 'boards')
  assert.equal(registry.getSelectedSection(), 'boards')
  const first = registry.getNavigationKey()
  registry.select('oops', 'boards')
  assert.equal(registry.getNavigationKey(), first + 1)
  registry.select('journal')
  registry.setSection('oops', 'chat')
  assert.equal(registry.getSelection(), 'journal')
  assert.equal(registry.getSelectedSection(), null)
  registry.select('oops')
  assert.equal(registry.getSelectedSection(), 'chat')
  assert.throws(() => registry.select('oops', 'missing'), /Unknown Personal section/)
  assert.equal(registry.getSelectedSection(), 'chat')
})

test('the last location is restored once its feature registers, and stale leaves fall back', () => {
  const store = memory({ feature: 'oops', sections: { oops: 'boards', journal: 'gone' } })
  const registry = new PersonalRegistry(store)
  registry.register({ ...feature('journal', -1), sections: [{ id: 'today', title: '今天' }] })
  assert.equal(registry.getSelection(), 'journal', 'shows the first feature while the remembered one loads')
  assert.equal(registry.getSection('journal'), 'today')
  registry.register(oops())
  assert.equal(registry.getSelection(), 'oops')
  assert.equal(registry.getSelectedSection(), 'boards')
  assert.equal(store.saved.length, 0, 'restoring does not write')
  registry.select('oops', 'chat')
  assert.deepEqual(store.saved.at(-1), { feature: 'oops', sections: { oops: 'chat', journal: 'gone' } })
  registry.setSection('journal', 'today')
  assert.equal(store.saved.at(-1)?.sections.journal, 'today')
})

test('stored locations are parsed defensively', () => {
  assert.equal(parseLocation(undefined), undefined)
  assert.equal(parseLocation('oops'), undefined)
  assert.deepEqual(parseLocation({ feature: 3, sections: { oops: 'chat', bad: 1 } }), { feature: null, sections: { oops: 'chat' } })
  assert.deepEqual(parseLocation({ feature: 'oops', sections: null }), { feature: 'oops', sections: {} })
})


test('a peer opens only an available Personal feature', () => {
  let opened = 0
  const registry = new PersonalRegistry(undefined, undefined, () => { opened++ })
  registry.register(feature('oops'))
  registry.register(feature('slides'))
  assert.equal(registry.open('missing'), false)
  assert.equal(opened, 0)
  assert.equal(registry.open('slides'), true)
  assert.equal(registry.getSelection(), 'slides')
  assert.equal(opened, 1)
})
