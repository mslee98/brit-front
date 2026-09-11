export const APP_LAYOUT = {
  frame: { minWidth: 360, maxWidth: 616 },
  desktopSidePanel: { width: 360, gap: 16 },
  navigation: { height: 64 },
  bottomNavigation: { height: 64 },
  fixedBottom: { minHeight: 88 },
} as const

export const ACTIVITIES_WITH_BOTTOM_NAV = ['Home', 'My', 'Transactions'] as const

export const MY_TAB_PATH = '/my' as const

export const TRANSACTIONS_TAB_PATH = '/transactions' as const

export const STORE_PATH = '/store' as const

export const COMMUNITY_PATH = '/community' as const

export const BOTTOM_NAV_TAB_PATHS = [
  '/',
  MY_TAB_PATH,
  TRANSACTIONS_TAB_PATH,
] as const

export const LEGACY_MY_TAB_PATH = '/detail/profile' as const

export const LEGACY_TRANSACTIONS_TAB_PATH = '/detail/transactions' as const

export const LEGACY_STORE_PATH = '/detail/store' as const

export const LEGACY_COMMUNITY_PATH = '/detail/community' as const

export const LEGACY_PATH_REDIRECTS: Record<string, string> = {
  [LEGACY_MY_TAB_PATH]: MY_TAB_PATH,
  [LEGACY_TRANSACTIONS_TAB_PATH]: TRANSACTIONS_TAB_PATH,
  [LEGACY_STORE_PATH]: STORE_PATH,
  [LEGACY_COMMUNITY_PATH]: COMMUNITY_PATH,
}

export function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }
  return pathname
}

export function isBottomNavPath(pathname: string): boolean {
  return (BOTTOM_NAV_TAB_PATHS as readonly string[]).includes(
    normalizePathname(pathname),
  )
}

export type BottomNavStackTop = {
  name: string
  params?: Record<string, unknown>
} | null

export function isBottomNavStackTop(top: BottomNavStackTop): boolean {
  if (!top) return false
  return (ACTIVITIES_WITH_BOTTOM_NAV as readonly string[]).includes(top.name)
}

/** Stack 외부 크롬(바텀 nav) Alert Dialog z-index */
export const CHROME_ALERT_DIALOG_LAYER_INDEX = 50
