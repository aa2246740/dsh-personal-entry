import { Component, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import type { PersonalFeature, PersonalRegistry } from './registry.ts'
import css from './personal.module.css'
import { MenuIcon } from './navigation.tsx'

function Arrow({ back = false }: { back?: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={back ? { transform: 'rotate(180deg)' } : undefined}><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
}

/** A failed feature cannot remove the directory or the Work return control. */
class FeatureBoundary extends Component<{ children: ReactNode; title: string }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    return this.state.failed ? <div className={css.failure} role="alert"><h2>{this.props.title} 暂时无法显示</h2><p>可以重试，或从上方回到个人首页。</p><button onClick={() => this.setState({ failed: false })}>重新打开</button></div> : this.props.children
  }
}

function FeatureCard({ feature, onOpen }: { feature: PersonalFeature; onOpen: () => void }) {
  const Icon = feature.icon
  return <button className={css.card} onClick={onOpen} aria-label={`打开 ${feature.title}`} data-ud-check="feature-card">
    <span className={css.cardTop}><span className={css.featureIcon}><Icon size={32}/></span><Arrow/></span>
    <span className={css.cardTitle}>{feature.title}</span><span className={css.cardDescription}>{feature.description}</span>
    <span className={css.cardDetail}>{feature.detail}</span>
  </button>
}

/** Directory and feature navigation inside the official main panel. */
export function PersonalPage({ registry, toggleSidebar }: { registry: PersonalRegistry; toggleSidebar: () => void }) {
  const features = useSyncExternalStore(registry.subscribe, registry.getSnapshot)
  const selected = useSyncExternalStore(registry.subscribe, registry.getSelection)
  const section = useSyncExternalStore(registry.subscribe, registry.getSelectedSection)
  useSyncExternalStore(registry.subscribe, registry.getNavigationKey)
  const [visited, setVisited] = useState<Set<string>>(() => new Set(selected ? [selected] : []))
  useEffect(() => { if (selected) setVisited(previous => new Set([...previous, selected])) }, [selected])
  const active = features.find(feature => feature.id === selected)
  const leaf = active?.sections?.find(item => item.id === section)
  return <section className={`${css.theme} ${css.page}`} aria-label="个人空间">
    <header className={css.header} data-ud-check="personal-header">
      <div className={css.breadcrumb}><button className={css.menuButton} onClick={toggleSidebar} aria-label="切换个人菜单"><MenuIcon/></button><button onClick={() => registry.select(null)} aria-current={!active ? 'page' : undefined}>个人</button>{active && <><span className={css.divider}>/</span><span>{active.title}</span></>}{leaf && <><span className={css.divider}>/</span><span className={css.leafTitle}>{leaf.title}</span></>}</div>
    </header>
    {!active && <div className={css.home}>
      <div className={css.intro} data-ud-check="personal-intro"><span className={css.eyebrow}>留一点空间，给自己</span><h1>生活里的想法，从这里开始。</h1><p>聊一聊，记下来，让零散的灵感慢慢成形。</p></div>
      <div className={css.sectionLabel}>我的功能<span>{features.length.toString().padStart(2, '0')}</span></div>
      <div className={css.grid}>{features.map(feature => <FeatureCard key={feature.id} feature={feature} onOpen={() => registry.select(feature.id)}/>)}</div>
      {features.length === 0 && <p className={css.empty}>还没有添加功能。启用个人功能插件后，它会出现在这里。</p>}
    </div>}
    {features.filter(feature => visited.has(feature.id) || feature.id === selected).map(feature => {
      const Page = feature.component
      return <div key={feature.id} className={css.featurePage} hidden={selected !== feature.id}><FeatureBoundary title={feature.title}><Page section={registry.getSection(feature.id)} navigationKey={registry.getFeatureNavigationKey(feature.id)} onSectionChange={next => registry.setSection(feature.id, next)}/></FeatureBoundary></div>
    })}
  </section>
}
