import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'

import {
  ACTIVITIES_WITH_BOTTOM_NAV,
  isBottomNavPath,
  isBottomNavStackTop,
  normalizePathname,
  type BottomNavStackTop,
} from '../../shared/constants/app-layout'
import { appHistory } from '../../stackflow/appHistory'
import { config } from '../../stackflow/config'
import {
  getTopActivitySnapshot,
  subscribeTopActivity,
} from '../../stackflow/plugins/bottomNavChromePlugin'

function matchRoute(route: string, pathname: string): boolean {
  if (route === '/') return pathname === '/'
  if (route === '/404') return pathname === '/404'

  const pattern = route.replace(/:([^/]+)/g, '[^/]+')
  return new RegExp(`^${pattern}$`).test(pathname)
}

function getActivityFromPathname(pathname: string): string | null {
  const normalized = normalizePathname(pathname)
  for (const activity of config.activities) {
    if (matchRoute(activity.route, normalized)) return activity.name
  }
  return null
}

function isBottomNavVisible(pathname: string, topActivity: BottomNavStackTop): boolean {
  if (isBottomNavPath(pathname)) return true
  if (isBottomNavStackTop(topActivity)) return true

  const normalized = normalizePathname(pathname)
  const activity = getActivityFromPathname(normalized)
  if (!activity) return false

  return (ACTIVITIES_WITH_BOTTOM_NAV as readonly string[]).includes(activity)
}

// GlobalBottomNavigation은 Stack 밖에 있어 useStack/useFlow를 쓸 수 없음.
// historySyncPlugin과 동일한 appHistory + stack top activity로 bottom nav 표시를 맞춘다.
function subscribePathname(onStoreChange: () => void) {
  return appHistory.listen(() => onStoreChange())
}

function getPathnameSnapshot() {
  return appHistory.location.pathname
}

interface LayoutContextValue {
  bottomNavVisible: boolean
  pathname: string
  overlayOpen: boolean
  registerOverlay: () => () => void
}

const LayoutContext = createContext<LayoutContextValue>({
  bottomNavVisible: false,
  pathname: '/',
  overlayOpen: false,
  registerOverlay: () => () => {},
})

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [overlayCount, setOverlayCount] = useState(0)
  const pathname = useSyncExternalStore(
    subscribePathname,
    getPathnameSnapshot,
    () => '/',
  )
  const topActivity = useSyncExternalStore(
    subscribeTopActivity,
    getTopActivitySnapshot,
    () => null,
  )
  const bottomNavVisible = isBottomNavVisible(pathname, topActivity)
  const overlayOpen = overlayCount > 0

  const registerOverlay = useCallback(() => {
    setOverlayCount((count) => count + 1)
    return () => setOverlayCount((count) => Math.max(0, count - 1))
  }, [])

  const value = useMemo(
    () => ({
      bottomNavVisible,
      pathname,
      overlayOpen,
      registerOverlay,
    }),
    [bottomNavVisible, pathname, overlayOpen, registerOverlay],
  )

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
}

export function useLayout() {
  return useContext(LayoutContext)
}

export { getActivityFromPathname, isBottomNavVisible }
