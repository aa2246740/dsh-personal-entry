import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SlotCore } from '@deepseek-ai/dsh-client-ui-slots'
import type { PanelInfo } from '@deepseek-ai/dsh-client-ui-layout/client'
import { watchPersonalChrome } from '../src/client/chrome.ts'

test('official slot shadowing restores the original sidebar and its children after work return and unload', () => {
  const slots = new SlotCore()
  slots.register({name:'root',children:{sidebar:{kind:'single',scope:'root'},'shell.leading':{kind:'single',scope:'root'}}},()=>null)
  const official = () => null
  const personal = () => null
  slots.register({name:'sidebar',children:{'sidebar.panellist':{kind:'list',scope:'root'}}},official)
  slots.register({name:'sidebar.panellist',id:'personal'},()=>null)
  const child = slots.entriesOfSlot('sidebar.panellist')[0]
  let snapshot: PanelInfo = {activePanelId:null}
  const listeners = new Set<() => void>()
  let mounts=0
  const stop = watchPersonalChrome({getSnapshot:()=>snapshot,subscribe:listener=>{listeners.add(listener);return()=>{listeners.delete(listener)}}},()=>{
    mounts++
    return slots.register({name:'sidebar',priority:-100},personal)
  })
  const select = (value: PanelInfo['activePanelId']) => { snapshot={activePanelId:value}; for(const listener of listeners)listener() }
  assert.equal(slots.entriesOfSlot('sidebar')[0]?.component,official)
  select('personal' as PanelInfo['activePanelId'])
  select('personal' as PanelInfo['activePanelId'])
  assert.equal(mounts,1)
  assert.equal(slots.entriesOfSlot('sidebar')[0]?.component,personal)
  assert.equal(slots.entriesOfSlot('sidebar.panellist')[0],child)
  select(null)
  assert.equal(slots.entriesOfSlot('sidebar')[0]?.component,official)
  select('personal' as PanelInfo['activePanelId'])
  stop();stop()
  assert.equal(slots.entriesOfSlot('sidebar')[0]?.component,official)
  assert.equal(slots.entriesOfSlot('sidebar.panellist')[0],child)
  assert.equal(listeners.size,0)
})
