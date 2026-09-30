import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PersonalRegistry, type PersonalFeature } from '../src/client/registry.ts'

const feature = (id: string, order = 0): PersonalFeature => ({ id, order, title: id, description: '', detail: '', icon: () => null, component: () => null })

test('peer features register in order and disposal repairs the selected page', () => {
  const registry = new PersonalRegistry()
  const removeOops = registry.register(feature('oops', 10))
  const removeJournal = registry.register(feature('journal', 5))
  assert.deepEqual(registry.getSnapshot().map(row => row.id), ['journal', 'oops'])
  registry.select('oops')
  removeJournal()
  assert.equal(registry.getSelection(), 'oops')
  removeOops()
  assert.equal(registry.getSelection(), null)
  assert.deepEqual(registry.getSnapshot(), [])
  removeOops()
})

test('duplicate registration cannot shadow an existing feature; removal permits replacement', () => {
  const registry = new PersonalRegistry()
  const remove = registry.register(feature('oops'))
  assert.throws(() => registry.register(feature('oops')), /already registered/)
  remove()
  registry.register(feature('oops'))
  assert.throws(() => registry.select('missing'), /Unknown/)
})

test('subscriptions have stable snapshots and stop after cleanup', () => {
  const registry = new PersonalRegistry()
  const original = registry.getSnapshot()
  let changes = 0
  const stop = registry.subscribe(() => changes++)
  assert.equal(registry.getSnapshot(), original)
  registry.register(feature('oops'))
  registry.select('oops')
  assert.equal(changes, 2)
  stop()
  registry.select(null)
  assert.equal(changes, 2)
})

test('peer features preserve their own leaf and explicit repeat clicks publish a navigation command', () => {
  const registry = new PersonalRegistry()
  registry.register({...feature('oops'),sections:[{id:'chat',title:'对话'},{id:'boards',title:'画布'}]})
  registry.register(feature('journal'))
  registry.select('oops','boards')
  assert.equal(registry.getSelectedSection(),'boards')
  const first=registry.getNavigationKey()
  registry.select('oops','boards')
  assert.equal(registry.getNavigationKey(),first+1)
  registry.select('journal')
  registry.setSection('oops','chat')
  assert.equal(registry.getSelection(),'journal')
  registry.select('oops')
  assert.equal(registry.getSelectedSection(),'chat')
  assert.throws(()=>registry.select('oops','missing'),/Unknown Personal section/)
  assert.equal(registry.getSelectedSection(),'chat')
})
