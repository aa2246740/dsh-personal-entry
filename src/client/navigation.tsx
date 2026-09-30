import { useEffect, useState, useSyncExternalStore } from 'react'
import type { PersonalRegistry } from './registry.ts'
import css from './personal.module.css'

/** Shared line icon for Personal entry and its own navigation. */
export function PersonalIcon({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 10.5 12 3l8.5 7.5v9a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z"/><path d="M9 21v-7h6v7"/></svg>
}

/** Sidebar disclosure icon with a stable accessible label on its button. */
export function MenuIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/></svg>
}

/** Personal-only sidebar occupying the public sidebar slot while selected. */
export function PersonalSidebar({ registry, returnToWork, toggleSidebar, collapsed, width }: {
  registry: PersonalRegistry; returnToWork: () => void; toggleSidebar: () => void; collapsed: boolean; width: number
}) {
  const features = useSyncExternalStore(registry.subscribe, registry.getSnapshot)
  const selected = useSyncExternalStore(registry.subscribe, registry.getSelection)
  const section = useSyncExternalStore(registry.subscribe, registry.getSelectedSection)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(features.slice(0,1).map(feature => feature.id)))
  useEffect(() => { if (selected) setExpanded(previous => new Set([...previous, selected])) }, [selected])
  const navigate = (id: string | null, leaf?: string) => {
    registry.select(id, leaf)
    if (!collapsed && window.matchMedia('(max-width: 760px)').matches) toggleSidebar()
  }
  if (collapsed && width === 0) return null
  return <aside className={`${css.theme} ${css.sidebar} ${collapsed ? css.rail : ''}`} style={{ width }} aria-label="个人侧栏" data-ud-check="personal-navigation">
    <div className={css.windowStrip} data-window-drag/>
    <div className={css.brand}><PersonalIcon size={23}/>{!collapsed && <strong>个人</strong>}</div>
    {collapsed && <button className={css.railButton} aria-label="展开个人菜单" onClick={toggleSidebar}><MenuIcon/></button>}
    <nav className={css.tree} aria-label="个人功能">
      <button className={`${css.navRow} ${selected === null ? css.navSelected : ''}`} onClick={() => navigate(null)} aria-current={selected === null ? 'page' : undefined} title="总览"><PersonalIcon size={17}/>{!collapsed && <span>总览</span>}</button>
      {!collapsed && <div className={css.treeLabel}>我的功能</div>}
      <ul>{features.map(feature => {
        const Icon = feature.icon
        const open = expanded.has(feature.id)
        const active = selected === feature.id
        return <li key={feature.id}>
          <div className={css.moduleRow}>
            <button className={`${css.navRow} ${active ? css.moduleSelected : ''}`} onClick={() => navigate(feature.id)} title={feature.title}><Icon size={19}/>{!collapsed && <span>{feature.title}</span>}</button>
            {!collapsed && !!feature.sections?.length && <button className={css.disclosure} aria-label={`${open ? '收起' : '展开'} ${feature.title}`} aria-expanded={open} onClick={() => setExpanded(previous => { const next = new Set(previous); if (open) next.delete(feature.id); else next.add(feature.id); return next })}><span aria-hidden="true">{open ? '⌄' : '›'}</span></button>}
          </div>
          {!collapsed && open && feature.sections && <ul className={css.leaves}>{feature.sections.map(leaf => <li key={leaf.id}><button className={`${css.navRow} ${active && section === leaf.id ? css.navSelected : ''}`} aria-current={active && section === leaf.id ? 'page' : undefined} onClick={() => navigate(feature.id, leaf.id)}>{leaf.title}</button></li>)}</ul>}
        </li>
      })}</ul>
    </nav>
    <div className={css.sidebarFooter}><button className={css.navRow} onClick={returnToWork} aria-label="回到工作" title="回到工作"><span aria-hidden="true">←</span>{!collapsed && <span>回到工作</span>}</button></div>
  </aside>
}
