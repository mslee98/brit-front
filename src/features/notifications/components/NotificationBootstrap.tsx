import { useEffect, useRef } from 'react'

import { useAuthStatus } from '../../auth/stores/authSession.store'
import { sseNotificationSource } from '../adapters/sseNotificationSource'
import {
  getUnreadNotificationCount,
  hasDispatchedNotification,
  markNotificationDispatched,
  setInboxItems,
  setUnreadNotificationCount,
  upsertInboxItem,
} from '../notification.store'
import {
  getUnreadNotificationCount as fetchUnreadCount,
  listNotifications,
  shouldUseNotificationsHttpApi,
} from '../api/notifications.api'
import { dispatchNotification } from '../dispatchNotification'
import { inboxItemToPayload } from '../utils/inboxItemToPayload'
import type { DispatchContext } from '../types'

function buildDispatchContext(): DispatchContext {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/'
  const params = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : '',
  )
  const activityFromPath = (() => {
    if (pathname === '/' || pathname === '') return 'Home'
    if (pathname.startsWith('/trade/compose')) return 'TradeCompose'
    if (pathname.startsWith('/trade/matching/')) return 'MatchingWaiting'
    if (pathname.startsWith('/trade/sell/')) return 'SellOrderDetail'
    if (pathname.startsWith('/trade')) return 'Trade'
    return null
  })()

  return {
    currentActivity: activityFromPath,
    pathname,
    tradeId: params.get('tradeId'),
    isActivityActive: document.visibilityState === 'visible',
    isDocumentVisible: document.visibilityState === 'visible',
  }
}

function dispatchInboxItem(item: Parameters<typeof inboxItemToPayload>[0]) {
  if (hasDispatchedNotification(item.notificationId)) return
  markNotificationDispatched(item.notificationId)
  const payload = inboxItemToPayload(item)
  dispatchNotification(payload, buildDispatchContext())
}

async function syncNotifications() {
  if (!shouldUseNotificationsHttpApi()) return
  try {
    const [countResult, listResult] = await Promise.all([
      fetchUnreadCount(),
      listNotifications(1, 1),
    ])
    setUnreadNotificationCount(countResult.count)
    if (listResult.items[0] && !listResult.items[0].isRead) {
      upsertInboxItem(listResult.items[0])
      dispatchInboxItem(listResult.items[0])
    }
    const fullList = await listNotifications(1, 20)
    setInboxItems(fullList.items)
  } catch {
    // ignore sync errors
  }
}

/**
 * 로그인·foreground·SSE로 Inbox 동기화 및 인앱 dispatch.
 */
export function NotificationBootstrap() {
  const authStatus = useAuthStatus()
  const isAuthenticated = authStatus === 'authenticated'
  const syncedRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated) {
      sseNotificationSource.disconnect()
      syncedRef.current = false
      return
    }

    void syncNotifications()
    syncedRef.current = true

    sseNotificationSource.connect((item) => {
      upsertInboxItem(item)
      if (!item.isRead) {
        setUnreadNotificationCount(getUnreadNotificationCount() + 1)
      }
      dispatchInboxItem(item)
    })

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void syncNotifications()
      }
    }

    window.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleVisibility)

    return () => {
      sseNotificationSource.disconnect()
      window.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleVisibility)
    }
  }, [isAuthenticated])

  return null
}
