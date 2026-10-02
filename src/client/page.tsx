import { Component, memo, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { useCopy, type PersonalCopy } from './copy.ts'
import { FeatureIcon, PanelIcon, PersonalIcon } from './icons.tsx'
import { cx, IconButton } from './navigation.tsx'
import { isDarwinDesktop, type PersonalShell, type PersonalShellProps } from './shell.ts'
import css from './personal.module.css'

/** A failed feature keeps the header, the sidebar and every other feature usable. */
class FeatureBoundary extends Component<{ children: ReactNode; title: string; copy: PersonalCopy }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    const { copy, title } = this.props
    if (!this.state.failed) return this.props.children
    return <div className={css.notice} role="alert">
      <h2>{copy.failedTitle(title)}</h2>
      <p>{copy.failedBody}</p>
      <button type="button" className={css.pill} onClick={() => this.setState({ failed: false })}>{copy.retry}</button>
    </div>
  }
}

function Empty({ shell, copy }: { shell: PersonalShell; copy: PersonalCopy }) {
  return <div className={css.notice}>
    <span className={css.noticeMark}><PersonalIcon size={22}/></span>
    <h2>{copy.emptyTitle}</h2>
    <p>{copy.emptyBody}</p>
    {shell.canOpenPlugins() && <button type="button" className={css.pill} onClick={shell.openPlugins}>{copy.openPlugins}</button>}
  </div>
}

/** Personal main panel: a title row aligned with the Conversation header, then the selected feature. */
export const PersonalPage = memo(function PersonalPage({ shell, portalContainer }: PersonalShellProps & { portalContainer?: HTMLElement }) {
  const { registry } = shell
  const copy = useCopy(shell.language)
  const features = useSyncExternalStore(registry.subscribe, registry.getSnapshot)
  const selected = useSyncExternalStore(registry.subscribe, registry.getSelection)
  const section = useSyncExternalStore(registry.subscribe, registry.getSelectedSection)
  useSyncExternalStore(registry.subscribe, registry.getNavigationKey)
  const sidebarHidden = useSyncExternalStore(shell.sidebarHidden.subscribe, shell.sidebarHidden.get)
  // Opened features stay mounted while hidden, so switching back keeps their state.
  const [visited, setVisited] = useState<ReadonlySet<string>>(() => new Set(selected ? [selected] : []))
  useEffect(() => {
    if (selected) setVisited(previous => previous.has(selected) ? previous : new Set([...previous, selected]))
  }, [selected])
  const active = features.find(feature => feature.id === selected)
  const leaf = active?.sections?.find(item => item.id === section)
  return <section className={cx(css.theme, css.page)} aria-label={copy.space}>
    <header className={css.header} data-window-drag data-ud-check="personal-header">
      {sidebarHidden && !isDarwinDesktop() && <IconButton label={copy.openSidebar} onClick={shell.toggleSidebar}><PanelIcon size={16}/></IconButton>}
      <h1 className={css.crumbs}>
        {active
          ? <>
            <span className={leaf ? css.crumb : css.crumbCurrent}><span className={css.crumbGlyph}><FeatureIcon icon={active.icon} size={16}/></span>{active.title}</span>
            {leaf && <><span className={css.crumbSep} aria-hidden="true">/</span><span className={css.crumbCurrent}>{leaf.title}</span></>}
          </>
          : <span className={css.crumbCurrent}>{copy.space}</span>}
      </h1>
    </header>
    <div className={css.body}>
      {!active && <Empty shell={shell} copy={copy}/>}
      {features.filter(feature => visited.has(feature.id) || feature.id === selected).map(feature => {
        const Page = feature.component
        return <div key={feature.id} className={css.featurePage} hidden={feature.id !== selected}>
          <FeatureBoundary title={feature.title} copy={copy}>
            <Page section={registry.getSection(feature.id)} navigationKey={registry.getFeatureNavigationKey(feature.id)} onSectionChange={next => registry.setSection(feature.id, next)} portalContainer={portalContainer}/>
          </FeatureBoundary>
        </div>
      })}
    </div>
  </section>
})
