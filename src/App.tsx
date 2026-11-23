import { useEffect } from 'react'
import { SnackbarProvider } from 'seed-design/ui/snackbar'

import { AppShell } from './app/layouts/AppShell'
import { DesktopSidePanel } from './app/layouts/DesktopSidePanel'
import { GlobalBottomNavigation } from './app/layouts/GlobalBottomNavigation'
import { LayoutProvider } from './app/layouts/LayoutContext'
import { MobileFrame } from './app/layouts/MobileFrame'
import { KeyboardInsetProvider } from './app/providers/KeyboardInsetProvider'
import { NotificationBootstrap } from './features/notifications/components/NotificationBootstrap'
import { DeviceContextDevFab } from './features/pwa/components/DeviceContextDevFab'
import { useTradePushNavigation } from './features/pwa/hooks/useTradePushNavigation'
import { DeviceContextProvider } from './features/pwa/providers/DeviceContextProvider'
import { GlobalActiveTradeBanner } from './features/trade/components/GlobalActiveTradeBanner'
import { GlobalSheetHost } from './features/trade/components/GlobalSheetHost'
import { RealtimeBootstrap } from './features/trade/realtime/RealtimeBootstrap'
import { detectTheme } from './shared/utils/detectTheme'
import { Stack, actions } from './stackflow/stackflow'
import { getLiveActivities } from './stackflow/plugins/stackSnapshotPlugin'
import { navigateToRootLogin } from './stackflow/navigateToRootLogin'
import { useAuthNextAction, useAuthStatus } from './features/auth/stores/authSession.store'

/** URL 직접 진입·세션 만료 시 게스트에게 열리면 안 되는 화면 */
const AUTH_REQUIRED_ACTIVITIES = new Set([
  'AccountSettings',
  'ChangePassword',
  'ChangeBankAccount',
  'TransactionPin',
  'SecuritySettings',
  'NotificationSettings',
  'NotificationCenter',
  'PartnerLinks',
  'PartnerLinkApprove',
  'RegistrationStatus',
])

function TradePushNavigation() {
  useTradePushNavigation()
  return null
}

function AuthEntryNavigation() {
  const authStatus = useAuthStatus()
  const nextAction = useAuthNextAction()

  useEffect(() => {
    if (authStatus === 'authenticated') {
      if (nextAction === 'WAIT_FOR_APPROVAL') {
        actions.replace('RegistrationStatus', { mode: 'wait' }, { animate: false })
        return
      }
      if (nextAction === 'ACTION_REQUIRED') {
        actions.replace('RegistrationStatus', { mode: 'resubmit' }, { animate: false })
      }
      return
    }

    // guest: 인증 필요 화면이면 Login으로 정리 (deep link / 세션 만료)
    const live = getLiveActivities()
    const top = live[live.length - 1]
    if (top && AUTH_REQUIRED_ACTIVITIES.has(top.name)) {
      navigateToRootLogin(live.length, { animate: false })
    }
  }, [authStatus, nextAction])

  return null
}

export default function App() {
  return (
    <SnackbarProvider>
      <KeyboardInsetProvider>
        <DeviceContextProvider>
          <NotificationBootstrap />
          <RealtimeBootstrap />
          <div className="ios-pwa-top-blur-guard" aria-hidden="true" />
          <AppShell sidePanel={<DesktopSidePanel />}>
            <LayoutProvider>
              <TradePushNavigation />
              <AuthEntryNavigation />
              <MobileFrame>
                <div className="flex min-h-0 flex-1 flex-col">
                  <GlobalActiveTradeBanner />
                  <Stack initialContext={{ theme: detectTheme() }} />
                </div>
                <GlobalBottomNavigation />
                <DeviceContextDevFab />
                <div id="app-frame-portal" />
                <GlobalSheetHost />
              </MobileFrame>
            </LayoutProvider>
          </AppShell>
        </DeviceContextProvider>
      </KeyboardInsetProvider>
    </SnackbarProvider>
  )
}

