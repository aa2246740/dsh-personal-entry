import { Component, type ReactNode } from 'react'
import type { PersonalIconComponent } from './registry.ts'

type GlyphProps = { size?: number }

function Stroke({ size = 16, children }: GlyphProps & { children: ReactNode }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
}

/** The Personal space: entry row, switcher and empty state. */
export function PersonalIcon({ size }: GlyphProps) {
  return <Stroke size={size}><circle cx="12" cy="8.25" r="3.75"/><path d="M4.75 20c.9-3.7 3.7-5.75 7.25-5.75s6.35 2.05 7.25 5.75"/></Stroke>
}

/** The Work space (the official Conversation view). */
export function WorkIcon({ size }: GlyphProps) {
  return <Stroke size={size}><rect x="3.25" y="7" width="17.5" height="12.75" rx="2.75"/><path d="M9 7V5.75C9 4.78 9.78 4 10.75 4h2.5C14.22 4 15 4.78 15 5.75V7M3.25 12.25h17.5"/></Stroke>
}

/** Sidebar open/close control, matching the official panel glyph's geometry. */
export function PanelIcon({ size }: GlyphProps) {
  return <Stroke size={size}><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="M9.5 4.5v15"/></Stroke>
}

/** Group disclosure; rotated by CSS when open. */
export function ChevronIcon({ size = 12 }: GlyphProps) {
  return <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m4.5 2.75 3.25 3.25-3.25 3.25"/></svg>
}

function Placeholder({ size = 16 }: GlyphProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="4"/></svg>
}

/** A contributed glyph that throws renders a neutral square instead of taking the navigation down. */
export class FeatureIcon extends Component<{ icon?: PersonalIconComponent; size: number }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    const Icon = this.props.icon
    return this.state.failed || !Icon ? <Placeholder size={this.props.size}/> : <Icon size={this.props.size}/>
  }
}
