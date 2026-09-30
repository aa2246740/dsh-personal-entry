import type { ILayout } from '@deepseek-ai/dsh-client-ui-layout/client'

/** Mount Personal's slot contributions only while its main panel is selected. */
export function watchPersonalChrome(panelInfo: ILayout['panelInfo'], mount: () => () => void): () => void {
  let release: (() => void) | undefined
  const sync = () => {
    if (panelInfo.getSnapshot().activePanelId === 'personal') {
      if (!release) release = mount()
    } else {
      const previous = release
      release = undefined
      previous?.()
    }
  }
  const unsubscribe = panelInfo.subscribe(sync)
  try { sync() } catch (error) { unsubscribe(); throw error }
  return () => { unsubscribe(); const previous = release; release = undefined; previous?.() }
}
