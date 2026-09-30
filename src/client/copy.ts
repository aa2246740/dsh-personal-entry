import { useSyncExternalStore } from 'react'

/** Personal shell strings. Feature titles come from each feature in its own language. */
export interface PersonalCopy {
  space: string
  work: string
  spaces: string
  navigation: string
  sidebar: string
  openSidebar: string
  closeSidebar: string
  backToWork: string
  emptyTitle: string
  emptyBody: string
  openPlugins: string
  failedTitle: (title: string) => string
  failedBody: string
  retry: string
  toggleSpace: string
}

const zh: PersonalCopy = {
  space: '个人',
  work: '工作',
  spaces: '切换空间',
  navigation: '个人功能',
  sidebar: '个人侧栏',
  openSidebar: '打开侧栏',
  closeSidebar: '收起侧栏',
  backToWork: '回到工作',
  emptyTitle: '个人空间还是空的',
  emptyBody: '安装并启用个人功能插件（例如 OOPS）后，它会出现在左侧。',
  openPlugins: '前往插件',
  failedTitle: title => `${title} 暂时无法显示`,
  failedBody: '其他功能不受影响。可以重新打开，或先切换到别的功能。',
  retry: '重新打开',
  toggleSpace: '切换个人与工作空间',
}

const en: PersonalCopy = {
  space: 'Personal',
  work: 'Work',
  spaces: 'Switch space',
  navigation: 'Personal features',
  sidebar: 'Personal sidebar',
  openSidebar: 'Open sidebar',
  closeSidebar: 'Close sidebar',
  backToWork: 'Back to Work',
  emptyTitle: 'Your Personal space is empty',
  emptyBody: 'Install and enable a Personal feature plugin, such as OOPS, and it appears on the left.',
  openPlugins: 'Open Plugins',
  failedTitle: title => `${title} can’t be shown right now`,
  failedBody: 'Other features are unaffected. Reopen it, or switch to another feature.',
  retry: 'Reopen',
  toggleSpace: 'Switch between Personal and Work',
}

/** Active DSH language as a subscribable string; undefined when no locale service answers. */
export interface LanguageSource {
  get(): string | undefined
  subscribe(listener: () => void): () => void
}

/** Chinese is the default; any other active DSH language reads English. */
export function copyFor(language: string | undefined): PersonalCopy {
  return language === undefined || language.toLowerCase().startsWith('zh') ? zh : en
}

export function useCopy(language: LanguageSource): PersonalCopy {
  return copyFor(useSyncExternalStore(language.subscribe, language.get))
}
