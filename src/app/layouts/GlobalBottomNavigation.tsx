import {
  IconHouseLine,
  IconPersonCircleLine,
  IconReceiptLine,
} from '@karrotmarket/react-monochrome-icon'
import { useMemo } from 'react'

import {
  BottomNavigation,
  BottomNavigationItem,
  BottomNavigationSafeArea,
} from 'seed-design/ui/bottom-navigation'

import type { AuthRequiredReason } from '../../features/auth/constants/authRequiredCopy'
import { useAuthRequiredPrompt } from '../../features/auth/hooks/useAuthRequiredPrompt'
import { useActiveTrade } from '../../features/trade/hooks/useActiveTrade'
import { CHROME_ALERT_DIALOG_LAYER_INDEX } from '../../shared/constants/app-layout'
import { actions } from '../../stackflow/stackflow'
import { useLayout } from './LayoutContext'
import { useLayoutOverlay } from './useLayoutOverlay'

const TABS = [
  {
    id: 'home',
    label: '홈',
    icon: <IconHouseLine />,
    match: (pathname: string) => pathname === '/',
    activity: 'Home' as const,
    params: {},
  },
  {
    id: 'transactions',
    label: '거래내역',
    icon: <IconReceiptLine />,
    match: (pathname: string) => pathname.startsWith('/detail/transactions'),
    activity: 'Detail' as const,
    params: { id: 'transactions' },
    authReason: 'transactions' as const satisfies AuthRequiredReason,
  },
  {
    id: 'profile',
    label: 'MY',
    icon: <IconPersonCircleLine />,
    match: (pathname: string) => pathname === '/my',
    activity: 'My' as const,
    params: {},
    authReason: 'profile' as const satisfies AuthRequiredReason,
  },
] as const

export function GlobalBottomNavigation() {
  const { bottomNavVisible, overlayOpen, pathname } = useLayout()
  const activeTrade = useActiveTrade()
  const { promptAuth, authRequiredDialog, authRequiredOpen } = useAuthRequiredPrompt({
    onNavigateToLogin: () => actions.push('Login', {}),
    layerIndex: CHROME_ALERT_DIALOG_LAYER_INDEX,
  })

  useLayoutOverlay(authRequiredOpen)

  const showMatchingChip =
    activeTrade?.status === 'MATCHING' && pathname !== '/'

  const showBottomNav = useMemo(
    () => bottomNavVisible && !overlayOpen && !authRequiredOpen,
    [bottomNavVisible, overlayOpen, authRequiredOpen],
  )

  if (!showBottomNav && !authRequiredOpen) return null

  return (
    <>
      {authRequiredDialog}
      {showBottomNav && (
        <div
          className="sticky bottom-0 shrink-0"
          style={{ zIndex: 'var(--app-chrome-z-index)' }}
        >
          <BottomNavigation>
            {TABS.map((tab) => {
              const active = tab.match(pathname)
              const badge = tab.id === 'home' && showMatchingChip ? '매칭 중' : undefined
              return (
                <BottomNavigationItem
                  key={tab.id}
                  label={tab.label}
                  icon={tab.icon}
                  active={active}
                  badge={badge}
                  onClick={() => {
                    if (active) return
                    if (tab.id === 'home') {
                      actions.replace(tab.activity, tab.params, { animate: false })
                      return
                    }
                    promptAuth(
                      () => actions.replace(tab.activity, tab.params, { animate: false }),
                      tab.authReason,
                    )
                  }}
                />
              )
            })}
          </BottomNavigation>
          <BottomNavigationSafeArea />
        </div>
      )}
    </>
  )
}
