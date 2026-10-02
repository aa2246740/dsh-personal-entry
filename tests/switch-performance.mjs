/** Offline lifecycle regression. Never connects to a running Harness or model. */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const { launchPinnedChromium } = await import(pathToFileURL(resolve(homedir(), '.codex/playwright-runtime/runtime.mjs')).href)
const output = resolve('.local/switch-evidence')
await mkdir(output, { recursive: true })
const react = await readFile('node_modules/react/umd/react.production.min.js', 'utf8')
const reactDOM = await readFile('node_modules/react-dom/umd/react-dom.production.min.js', 'utf8')
const baseline = process.env.PERSONAL_BASELINE_BUNDLE
const runs = baseline ? [['before', resolve(baseline)], ['after', resolve('lib/client.js')]] : [['after', resolve('lib/client.js')]]
const escapeScript = value => value.replaceAll('</script', '<\\/script')
const browser = await launchPinnedChromium()
const results = []

try {
  for (const [name, bundle] of runs) {
    const source = await readFile(bundle, 'utf8')
    const html = `<!doctype html><html><meta charset="utf-8"><title>Personal switch regression fixture</title>
<style>html,body,#root{margin:0;height:100%;font:14px system-ui}#frame{height:100%;display:grid;grid-template-columns:280px 1fr}#work-side{background:#f5f6f8;overflow:auto;padding:12px}#work-main{height:100%;display:flex;flex-direction:column;min-height:0}#history{overflow:auto;flex:1}#history p{margin:12px}#root button{font:inherit}#fixture-label{position:fixed;right:10px;bottom:8px;z-index:999;color:#666;font-size:11px}#overlay{position:absolute;inset:0;pointer-events:none}iframe{border:0;width:100%;height:100%}</style>
<div id="root"></div><div id="fixture-label">OFFLINE FIXTURE · 100 session rows / 311 message rows</div>
<script>${escapeScript(react)}</script><script>${escapeScript(reactDOM)}</script>
<script>
window.__ModuleLoader__={load:({factory})=>window.plugin=factory(name=>name==='react'?React:{Fragment:React.Fragment,jsx:(type,props,key)=>React.createElement(type,{...props,key}),jsxs:(type,props,key)=>React.createElement(type,{...props,key})})};
</script><script>${escapeScript(source)}</script><script>
const h=React.createElement, entries=[], effects=[], subscribers=new Set(), panelListeners=new Set();
const metrics={sidebarMounts:0,sidebarUnmounts:0,workMounts:0,workUnmounts:0,featureMounts:0,featureUnmounts:0,iframeLoads:0,panelWrites:0,slotWrites:0};
let version=0, snapshot={activePanelId:null}, registry, command;
const notify=()=>{version++;subscribers.forEach(fn=>fn())};
const selectPanel=id=>{metrics.panelWrites++;snapshot={activePanelId:id};panelListeners.forEach(fn=>fn());notify()};
const subscribe=fn=>{subscribers.add(fn);return()=>subscribers.delete(fn)};
const ctx={effect:fn=>{const dispose=fn();if(dispose)effects.push(dispose)},
 inject:(deps,fn)=>fn({...ctx,shortcuts:{register:c=>{command=c;return()=>{command=undefined}}}}),
 reflect:{provide:(key,value)=>{registry=value;return()=>{registry=undefined}}},
 locale:{getLocale:()=>({active:'zh'}),subscribe:()=>()=>{}},
 layout:{panelInfo:{getSnapshot:()=>snapshot,subscribe:fn=>{panelListeners.add(fn);return()=>panelListeners.delete(fn)}},selectPanel,toggleSidebar:()=>{}},
 slots:{entriesOfSlot:name=>entries.filter(e=>e.options.name===name),inject:(name,fn)=>ctx.effect(fn),
 register:(options,component)=>{const entry={options,component,id:++metrics.slotWrites};entries.push(entry);notify();return()=>{const index=entries.indexOf(entry);if(index!==-1){entries.splice(index,1);metrics.slotWrites++;notify()}}}}};
function renderEntry(entry,props={}){return entry?h(entry.component,{key:entry.id,...entry.options.inject?.(),...props}):null}
function seat(name){return entries.filter(e=>e.options.name===name).sort((a,b)=>(a.options.priority||0)-(b.options.priority||0))[0]}
function OfficialSidebar(){React.useEffect(()=>{metrics.sidebarMounts++;return()=>metrics.sidebarUnmounts++},[]);return h('aside',{id:'work-side'},h('h2',null,'Work fixture'),entries.filter(e=>e.options.name==='sidebar.panellist').map(e=>h('button',{key:e.id,onClick:()=>selectPanel(e.options.id)},'个人')),Array.from({length:100},(_,i)=>h('p',{key:i},'Session '+i)),entries.filter(e=>e.options.name==='sidebar.footer.action').map(e=>renderEntry(e,{wide:true})))}
function Work(){React.useEffect(()=>{metrics.workMounts++;return()=>metrics.workUnmounts++},[]);return h('main',{id:'work-main'},h('h1',null,'Long conversation fixture'),h('div',{id:'history'},Array.from({length:311},(_,i)=>h('p',{key:i},'Message '+i+' ',Array.from({length:12},(_,j)=>h('span',{key:j},'word '+j+' '))))),h('textarea',{'aria-label':'Work draft',defaultValue:''}))}
function Feature({portalContainer}){window.featureRenders=(window.featureRenders||0)+1;React.useEffect(()=>{metrics.featureMounts++;return()=>metrics.featureUnmounts++},[]);const button=h('button',{id:'portal-probe',style:{position:'absolute',right:12,bottom:12,zIndex:5},onClick:()=>window.portalClicks=(window.portalClicks||0)+1},'Feature menu');return h(React.Fragment,null,portalContainer?ReactDOM.createPortal(button,portalContainer):button,h('iframe',{title:'PPT fixture',srcDoc:${JSON.stringify('<h1>PPT editor fixture</h1><input aria-label="Slide draft"><button onclick="this.textContent=\'Page 2\'">Page 1</button>')},onLoad:()=>metrics.iframeLoads++}))}
function App(){React.useSyncExternalStore(subscribe,()=>version);const sidebar=seat('sidebar');const main=snapshot.activePanelId?entries.find(e=>e.options.name==='main'&&e.options.key===snapshot.activePanelId):null;return h('div',{id:'frame'},sidebar?renderEntry(sidebar,{width:280,collapsed:false}):h(OfficialSidebar),main?renderEntry(main):h(Work),h('div',{id:'overlay'},entries.filter(e=>e.options.name==='shell.overlay').map(e=>renderEntry(e))))}
plugin.apply(ctx);
const removeFeature=registry.register({id:'slides',title:'Slides',order:1,icon:()=>null,component:Feature});
ReactDOM.createRoot(document.getElementById('root')).render(h(App));
window.test={metrics,get panel(){return snapshot.activePanelId},get command(){return command},unload:()=>{effects.reverse().forEach(fn=>fn());notify()},removeFeature,readdFeature:()=>registry.register({id:'slides',title:'Slides',order:1,icon:()=>null,component:Feature})};
window.settle=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
</script></html>`
    const fixture = resolve(output, `${name}.html`)
    await writeFile(fixture, html)
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } })
    page.setDefaultTimeout(8000)
    const errors = []
    const requests = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('request', request => { if (/^https?:/.test(request.url())) requests.push(request.url()) })
    await page.goto(pathToFileURL(fixture).href)
    await page.getByRole('textbox', { name: 'Work draft' }).fill('Work draft must survive')
    await page.locator('#history').evaluate(element => { element.scrollTop = 750 })
    const originalScroll = await page.locator('#history').evaluate(element => element.scrollTop)
    const enter = () => page.getByRole('button', { name: '个人', exact: true }).click()
    const leave = async () => {
      await page.getByRole('button', { name: '个人 · 切换空间', exact: true }).click()
      await page.getByRole('menuitemradio', { name: '工作', exact: true }).click()
      await page.evaluate(() => window.settle())
    }
    await enter()
    const frame = page.frameLocator('iframe')
    await frame.getByRole('textbox', { name: 'Slide draft' }).fill('Unsaved PPT draft')
    await frame.getByRole('button', { name: 'Page 1' }).click()
    await leave()
    await enter()
    const retained = await frame.getByRole('textbox', { name: 'Slide draft' }).inputValue()
    const framePage = await frame.getByRole('button').textContent()
    await leave()
    const workDraft = await page.getByRole('textbox', { name: 'Work draft' }).inputValue()
    const workScroll = await page.locator('#history').evaluate(element => element.scrollTop)
    const samples = []
    for (let i = 0; i < 20; i++) {
      await enter()
      await page.getByRole('button', { name: '个人 · 切换空间', exact: true }).click()
      samples.push(await page.getByRole('menuitemradio', { name: '工作', exact: true }).evaluate(async element => {
        const start = performance.now(); element.click(); await window.settle(); return performance.now() - start
      }))
    }
    const metrics = await page.evaluate(() => ({ ...window.test.metrics }))
    if (name === 'after') {
      assert.equal(await page.evaluate(() => window.featureRenders), 1)
      assert.equal(retained, 'Unsaved PPT draft')
      assert.equal(framePage, 'Page 2')
      assert.equal(workDraft, 'Work draft must survive')
      assert.equal(workScroll, originalScroll)
      assert.deepEqual(metrics, { sidebarMounts: 1, sidebarUnmounts: 0, workMounts: 1, workUnmounts: 0,
        featureMounts: 1, featureUnmounts: 0, iframeLoads: 1, panelWrites: 0, slotWrites: 2 })
      // Native modal focus containment, menu dismissal and collapsed return.
      await enter()
      await page.getByRole('button', { name: 'Feature menu' }).click()
      assert.equal(await page.evaluate(() => window.portalClicks), 1)
      assert.equal(await page.locator('#portal-probe').evaluate(el => !!el.closest('dialog')), true)
      await page.getByRole('button', { name: '个人 · 切换空间', exact: true }).click()
      await page.keyboard.press('Escape')
      assert.equal(await page.getByRole('menu').count(), 0)
      assert.equal(await page.getByRole('dialog').count(), 1)
      assert.equal(await page.getByRole('button', { name: '个人 · 切换空间' }).evaluate(el => el === document.activeElement), true)
      await page.getByRole('button', { name: '个人 · 切换空间' }).click()
      await frame.getByRole('textbox').click()
      assert.equal(await page.getByRole('menu').count(), 0)
      await page.screenshot({ path: resolve(output, 'personal-preserved.png') })
      await page.getByRole('button', { name: '收起侧栏' }).click()
      await page.getByRole('button', { name: '回到工作', exact: true }).click()
      await enter()
      await page.getByRole('button', { name: '打开侧栏', exact: true }).click()
      // Work cannot receive keyboard focus underneath the active Personal dialog.
      assert.equal(await page.locator('[aria-label="Work draft"]').evaluate(el => { el.focus(); return el === document.activeElement }), false)
      for (const width of [320, 375, 768]) {
        await page.setViewportSize({ width, height: 640 })
        const box = await page.getByRole('dialog').boundingBox()
        assert.ok(box.x >= 0 && box.x + box.width <= width)
        await page.getByRole('button', { name: '个人 · 切换空间' }).click()
        const menu = await page.getByRole('menu').boundingBox()
        assert.ok(menu.x >= 0 && menu.x + menu.width <= width)
        await page.keyboard.press('Escape')
      }
      await page.setViewportSize({ width: 1200, height: 800 })
      // A peer can unload and remount while the whole Personal surface is hidden.
      await leave()
      await page.evaluate(() => window.test.removeFeature())
      await page.evaluate(() => window.settle())
      assert.equal(await page.locator('iframe').count(), 0)
      await page.evaluate(() => window.test.readdFeature())
      await enter()
      await frame.getByRole('textbox').waitFor()
      assert.equal(await page.evaluate(() => window.test.metrics.featureMounts), 2)
      // The configured space shortcut must work inside this modal too.
      assert.deepEqual(await page.evaluate(() => window.test.command.modals), ['personal-space'])
      await page.evaluate(() => window.test.command.resolve().run())
      await page.getByRole('textbox', { name: 'Work draft' }).waitFor()
      await page.screenshot({ path: resolve(output, 'work-preserved.png') })
      // Unloading an open plugin releases the modal and all peer UI.
      await enter()
      await page.evaluate(() => window.test.unload())
      await page.getByRole('textbox', { name: 'Work draft' }).fill('Work usable after unload')
      assert.equal(await page.locator('dialog').count(), 0)
      assert.equal(await page.evaluate(() => window.test.metrics.workUnmounts), 0)
      // Platform geometry only: this does not claim native Windows acceptance.
      for (const platform of ['darwin', 'windows']) {
        await page.goto(pathToFileURL(fixture).href)
        await page.evaluate(platform => {
          if (platform === 'darwin') document.documentElement.dataset.platform = 'darwin'
          else { document.documentElement.setAttribute('data-windows-titlebar', ''); document.documentElement.style.setProperty('--dsh-frame-chrome-top', '32px') }
        }, platform)
        await enter()
        if (platform === 'windows') assert.equal((await page.getByRole('dialog').boundingBox()).y, 32)
        await page.getByRole('button', { name: '收起侧栏', exact: true }).click()
        await page.getByRole('button', { name: '打开侧栏', exact: true }).waitFor()
        if (platform === 'darwin') {
          await page.getByRole('button', { name: '回到工作', exact: true }).click()
          await enter()
        }
        await page.getByRole('button', { name: '打开侧栏', exact: true }).click()
        await leave()
        assert.equal(await page.evaluate(() => window.test.metrics.workUnmounts), 0)
      }
    } else {
      assert.equal(metrics.workMounts, 23)
      assert.equal(metrics.sidebarMounts, 23)
      assert.equal(retained, '')
    }
    assert.deepEqual(errors, [])
    assert.deepEqual(requests, [])
    const sorted = [...samples].sort((a, b) => a - b)
    results.push({ name, sha256: createHash('sha256').update(source).digest('hex'), fixtureOnly: true,
      cycles: 22, metrics, state: { workDraft, workScroll, personalDraft: retained, framePage },
      frameReadyMs: { median: sorted[10], p95: sorted[18], samples }, errors, networkRequests: requests })
    await page.close()
  }
  await writeFile(resolve(output, 'results.json'), JSON.stringify(results, null, 2) + '\n')
  console.log(JSON.stringify(results.map(({ frameReadyMs: { samples, ...timing }, ...rest }) => ({ ...rest, timing })), null, 2))
} finally { await browser.close() }
