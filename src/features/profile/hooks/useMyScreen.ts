import { useCallback, useEffect, useState } from 'react'
import { useFlow } from '@stackflow/react'
import { useSyncExternalStore } from 'react'

import { getMe } from '../../auth/api/auth.api'
import type { AuthMeResult } from '../../auth/types/signup'
import { useAuthStatus } from '../../auth/stores/authSession.store'
import {
  getUnreadNotificationCount as fetchUnreadNotificationCount,
  shouldUseNotificationsHttpApi,
} from '../../notifications/api/notifications.api'
import {
  getUnreadNotificationCount,
  setUnreadNotificationCount,
  subscribeNotifications,
} from '../../notifications/notification.store'
import type { MyMenuItemConfig } from '../constants/myMenu.config'

function getVerificationLabel(me: AuthMeResult): string {
  if (me.status === 'ACTIVE' && me.bankAccount.status === 'ACTIVE') {
    return '본인 인증 완료'
  }
  return '인증 필요'
}

function formatUnreadDetail(count: number): string | undefined {
  if (count <= 0) return undefined
  return count > 99 ? '99+' : String(count)
}

export function useMyScreen() {
  const { push, replace } = useFlow()
  const authStatus = useAuthStatus()
  const isAuthenticated = authStatus === 'authenticated'
  const [me, setMe] = useState<AuthMeResult | null>(null)
  const [loading, setLoading] = useState(true)

  const unreadCount = useSyncExternalStore(
    subscribeNotifications,
    getUnreadNotificationCount,
    () => 0,
  )

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setMe(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const result = await getMe()
      setMe(result)
      if (shouldUseNotificationsHttpApi()) {
        const { count } = await fetchUnreadNotificationCount()
        setUnreadNotificationCount(count)
      }
    } catch {
      setMe(null)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleMenuItemClick = useCallback(
    (item: MyMenuItemConfig) => {
      const navigate = item.navigationMode === 'replace' ? replace : push
      navigate(item.activity, {}, { animate: true })
    },
    [push, replace],
  )

  const resolveMenuDetail = useCallback(
    (item: MyMenuItemConfig): string | undefined => {
      if (item.detailKey === 'unreadCount') {
        return formatUnreadDetail(unreadCount)
      }
      return undefined
    },
    [unreadCount],
  )

  const handleProfileClick = useCallback(() => {
    push('SecuritySettings', {}, { animate: true })
  }, [push])

  return {
    loading,
    nickname: me?.nickname ?? me?.loginId ?? me?.name ?? 'Brit',
    verificationLabel: me ? getVerificationLabel(me) : '인증 필요',
    unreadCount,
    refresh,
    resolveMenuDetail,
    handleMenuItemClick,
    handleProfileClick,
  }
}
