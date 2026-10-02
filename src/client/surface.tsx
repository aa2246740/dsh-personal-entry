import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { useCopy } from './copy.ts'
import { cx, PersonalLeading, PersonalSidebar } from './navigation.tsx'
import { PersonalPage } from './page.tsx'
import { isDarwinDesktop, type PersonalShellProps } from './shell.ts'
import css from './personal.module.css'

/**
 * A native modal makes Work inert without touching its DOM or slot ownership.
 * Closing hides this tree; neither space is rebuilt on the next round trip.
 */
export function PersonalSurface({ shell }: PersonalShellProps) {
  const open = useSyncExternalStore(shell.visible.subscribe, shell.visible.get)
  const collapsed = useSyncExternalStore(shell.sidebarCollapsed.subscribe, shell.sidebarCollapsed.get)
  const copy = useCopy(shell.language)
  const dialog = useRef<HTMLDialogElement>(null)
  const [visited, setVisited] = useState(false)
  const darwin = isDarwinDesktop()
  const desktop = darwin || document.documentElement.hasAttribute('data-windows-titlebar')
  const width = collapsed ? (desktop ? 0 : 56) : 280
  useEffect(() => { if (open) setVisited(true) }, [open])
  useLayoutEffect(() => {
    const element = dialog.current!
    if (open && !element.open) element.showModal()
    else if (!open && element.open) element.close()
  }, [open])
  useLayoutEffect(() => {
    const element = dialog.current!
    return () => { if (element.open) element.close() }
  }, [])

  return <dialog ref={dialog} className={cx(css.theme, css.surface)} aria-label={copy.space}
    role={open ? 'dialog' : undefined} aria-modal={open ? true : undefined}
    data-shortcut-modal="personal-space" data-collapsed={collapsed || undefined}
    onCancel={event => event.preventDefault()}
    onClose={event => { if (!event.currentTarget.open) shell.showWork() }}>
    {(open || visited) && <div className={css.surfaceColumns}
      style={{ gridTemplateColumns: `${width}px minmax(0, 1fr)`,
        '--dsh-frame-leading-clearance': darwin && collapsed ? '164px' : '0px' } as CSSProperties}>
      <div className={css.surfaceSidebar}>
        <PersonalSidebar shell={shell} collapsed={collapsed} width={width}/>
      </div>
      <PersonalPage shell={shell} portalContainer={dialog.current ?? undefined}/>
      {darwin && collapsed && <div className={css.surfaceLeading}><PersonalLeading shell={shell}/></div>}
    </div>}
  </dialog>
}
