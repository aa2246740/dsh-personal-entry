import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { useCopy, type PersonalCopy } from './copy.ts'
import { ChevronIcon, FeatureIcon, PanelIcon, PersonalIcon, WorkIcon } from './icons.tsx'
import { loadCollapsed, saveCollapsed } from './memory.ts'
import { isDarwinDesktop, type PersonalShell, type PersonalShellProps } from './shell.ts'
import css from './personal.module.css'

/** Matches the official sidebar's wide-content fade before the rail settles. */
const COLLAPSE_SETTLE_MS = 150

export const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ')

type Navigate = (id: string | null, section?: string) => void

/** Current-space disclosure; feature navigation stays a separate level below. */
export function SpaceMenu({ copy, onWork }: { copy: PersonalCopy; onWork: () => void }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const items = useRef<(HTMLButtonElement | null)[]>([])
  const initialItem = useRef(1)
  const menuId = useId()
  const close = (restoreFocus = false) => {
    setOpen(false)
    if (restoreFocus) trigger.current?.focus()
  }
  useEffect(() => {
    if (!open) return
    items.current[initialItem.current]?.focus()
    const outside = (event: Event) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false)
    }
    // An embedded feature owns another document, so its pointer events do not
    // bubble here. Moving focus into it blurs this window instead.
    const leaveWindow = () => setOpen(false)
    document.addEventListener('pointerdown', outside, true)
    document.addEventListener('focusin', outside)
    window.addEventListener('blur', leaveWindow)
    return () => {
      document.removeEventListener('pointerdown', outside, true)
      document.removeEventListener('focusin', outside)
      window.removeEventListener('blur', leaveWindow)
    }
  }, [open])
  return <div ref={root} className={css.spaceMenu}>
    <button ref={trigger} type="button" className={css.spaceTrigger}
      aria-label={`${copy.space} · ${copy.spaces}`} aria-haspopup="menu" aria-expanded={open}
      aria-controls={open ? menuId : undefined}
      onClick={() => { initialItem.current = 1; setOpen(value => !value) }}
      onKeyDown={event => {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
        event.preventDefault()
        initialItem.current = event.key === 'ArrowDown' ? 0 : 1
        if (open) items.current[initialItem.current]?.focus()
        else setOpen(true)
      }}>
      <PersonalIcon size={16}/><span>{copy.space}</span>
      <span className={css.spaceDisclosure}><ChevronIcon/></span>
    </button>
    {open && <div id={menuId} role="menu" aria-label={copy.spaces} className={css.spaceOptions}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); return }
        if (event.key === 'Tab') { close(); return }
        const current = items.current.findIndex(item => item === document.activeElement)
        let next: number
        if (event.key === 'ArrowDown') next = (current + 1) % 2
        else if (event.key === 'ArrowUp') next = (current + 1) % 2
        else if (event.key === 'Home') next = 0
        else if (event.key === 'End') next = 1
        else return
        event.preventDefault()
        items.current[next]?.focus()
      }}>
      <button ref={element => { items.current[0] = element }} type="button" role="menuitemradio" aria-checked={false}
        tabIndex={-1} className={css.spaceOption} onClick={() => { close(); onWork() }}>
        <WorkIcon size={16}/><span>{copy.work}</span>
      </button>
      <button ref={element => { items.current[1] = element }} type="button" role="menuitemradio" aria-checked={true}
        tabIndex={-1} className={css.spaceOption} onClick={() => close(true)}>
        <PersonalIcon size={16}/><span>{copy.space}</span><span className={css.spaceCheck} aria-hidden="true">✓</span>
      </button>
    </div>}
  </div>
}

/** 28px icon control with a native tooltip, shared by the sidebar, window seat and page header. */
export function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return <button type="button" className={css.iconButton} aria-label={label} title={label} onClick={onClick}>{children}</button>
}

/** Feature tree: a feature with several leaves is a foldable group, otherwise a single row. */
function FeatureTree({ shell, copy, navigate }: { shell: PersonalShell; copy: PersonalCopy; navigate: Navigate }) {
  const { registry } = shell
  const features = useSyncExternalStore(registry.subscribe, registry.getSnapshot)
  const selected = useSyncExternalStore(registry.subscribe, registry.getSelection)
  const section = useSyncExternalStore(registry.subscribe, registry.getSelectedSection)
  const [folded, setFolded] = useState(loadCollapsed)
  const changed = useRef(false)
  useEffect(() => { if (changed.current) saveCollapsed(folded) }, [folded])
  const fold = (id: string) => {
    changed.current = true
    setFolded(previous => {
      const next = new Set(previous)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }
  if (features.length === 0) return <p className={css.navEmpty}>{copy.emptyTitle}</p>
  return <nav className={css.nav} aria-label={copy.navigation}>
    <ul className={css.list}>{features.map(feature => {
      const leaves = feature.sections ?? []
      const active = feature.id === selected
      if (leaves.length < 2) {
        return <li key={feature.id}>
          <button type="button" className={css.row} aria-current={active ? 'page' : undefined} title={feature.description} onClick={() => navigate(feature.id, leaves[0]?.id)}>
            <span className={css.glyph}><FeatureIcon icon={feature.icon} size={16}/></span>
            <span className={css.label}>{feature.title}</span>
          </button>
        </li>
      }
      const open = !folded.has(feature.id)
      return <li key={feature.id} className={css.group}>
        <button type="button" className={cx(css.row, css.groupRow, active && !open && css.holdsCurrent)} aria-expanded={open} title={feature.description} onClick={() => fold(feature.id)}>
          <span className={css.glyph}><FeatureIcon icon={feature.icon} size={16}/></span>
          <span className={css.label}>{feature.title}</span>
          <span className={css.chevron}><ChevronIcon/></span>
        </button>
        {open && <ul className={css.leaves}>{leaves.map(leaf => {
          const current = active && section === leaf.id
          return <li key={leaf.id}>
            <button type="button" className={cx(css.row, css.leaf)} aria-current={current ? 'page' : undefined} onClick={() => navigate(feature.id, leaf.id)}>
              {leaf.icon && <span className={css.glyph}><FeatureIcon icon={leaf.icon} size={16}/></span>}
              <span className={css.label}>{leaf.title}</span>
            </button>
          </li>
        })}</ul>}
      </li>
    })}</ul>
  </nav>
}

/** Collapsed Web rail: expand, Work, then one icon per feature. */
function Rail({ shell, copy, navigate }: { shell: PersonalShell; copy: PersonalCopy; navigate: Navigate }) {
  const features = useSyncExternalStore(shell.registry.subscribe, shell.registry.getSnapshot)
  const selected = useSyncExternalStore(shell.registry.subscribe, shell.registry.getSelection)
  return <aside className={cx(css.theme, css.sidebar, css.rail)} aria-label={copy.sidebar}>
    <button type="button" className={cx(css.railButton, css.railToggle)} aria-label={copy.openSidebar} title={copy.openSidebar} onClick={shell.toggleSidebar}>
      <span className={css.railMark}><PersonalIcon size={18}/></span><span className={css.railPanel}><PanelIcon size={18}/></span>
    </button>
    <button type="button" className={css.railButton} aria-label={copy.backToWork} title={copy.backToWork} onClick={shell.showWork}><WorkIcon size={18}/></button>
    <span className={css.railDivider} aria-hidden="true"/>
    <nav className={css.railNav} aria-label={copy.navigation}>{features.map(feature =>
      <button type="button" key={feature.id} className={css.railButton} aria-current={feature.id === selected ? 'page' : undefined} aria-label={feature.title} title={feature.title} onClick={() => navigate(feature.id)}>
        <FeatureIcon icon={feature.icon} size={18}/>
      </button>)}
    </nav>
  </aside>
}

/**
 * Personal sidebar, occupying the official `sidebar` slot only while Personal is selected.
 * It follows the official column states: wide, the Web 56px rail, or fully hidden
 * (macOS and Windows), fading wide content out before the rail settles.
 */
export function PersonalSidebar({ collapsed, width, shell }: PersonalShellProps & { collapsed: boolean; width: number }) {
  const copy = useCopy(shell.language)
  const [settled, setSettled] = useState(collapsed)
  useEffect(() => {
    if (!collapsed) { setSettled(false); return }
    const timer = window.setTimeout(() => setSettled(true), COLLAPSE_SETTLE_MS)
    return () => window.clearTimeout(timer)
  }, [collapsed])
  const hidden = collapsed && width === 0
  useEffect(() => { shell.sidebarHidden.set(hidden) }, [shell, hidden])
  useEffect(() => () => shell.sidebarHidden.set(false), [shell])
  const lastWideWidth = useRef(width)
  if (!collapsed) lastWideWidth.current = width
  const wide = !collapsed || !settled
  const navigate: Navigate = (id, section) => {
    shell.registry.select(id, section)
    if (!collapsed && window.matchMedia?.('(max-width: 760px)').matches) shell.toggleSidebar()
  }
  if (!wide) return hidden ? null : <Rail shell={shell} copy={copy} navigate={navigate}/>
  const darwin = isDarwinDesktop()
  const toggle = <IconButton label={copy.closeSidebar} onClick={shell.toggleSidebar}><PanelIcon size={16}/></IconButton>
  return <aside className={cx(css.theme, css.sidebar, collapsed && css.fading)} style={collapsed ? { width: lastWideWidth.current } : undefined} aria-label={copy.sidebar} data-ud-check="personal-navigation">
    {darwin && <div className={css.topStrip} data-window-drag>{toggle}</div>}
    <div className={css.headRow} data-window-drag>
      <SpaceMenu copy={copy} onWork={shell.showWork}/>
      {!darwin && toggle}
    </div>
    <FeatureTree shell={shell} copy={copy} navigate={navigate}/>
  </aside>
}

/** macOS window-chrome seat beside the traffic lights while the sidebar is hidden. */
export function PersonalLeading({ shell }: PersonalShellProps) {
  const copy = useCopy(shell.language)
  return <div className={cx(css.theme, css.leading)}>
    <IconButton label={copy.openSidebar} onClick={shell.toggleSidebar}><PanelIcon size={16}/></IconButton>
    <IconButton label={copy.backToWork} onClick={shell.showWork}><WorkIcon size={16}/></IconButton>
  </div>
}

/** Official sidebar row glyph for entering Personal. */
export function PersonalEntryIcon({ size = 16 }: { size?: number }) {
  return <PersonalIcon size={size}/>
}
