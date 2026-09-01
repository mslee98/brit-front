import { useCallback, useEffect, useState } from 'react'
import { useSyncExternalStore } from 'react'

import { getMe } from '../../auth/api/auth.api'
import { useAuthStatus } from '../../auth/stores/authSession.store'
import { shouldUseCoinsHttpApi } from '../../coins/api/coins.api'
import {
  getUnreadNotificationCount as fetchUnreadNotificationCount,
  shouldUseNotificationsHttpApi,
} from '../../notifications/api/notifications.api'
import {
  getUnreadNotificationCount,
  setUnreadNotificationCount,
  subscribeNotifications,
} from '../../notifications/notification.store'
import {
  getHomeWallet,
  subscribeHomeWallet,
} from '../stores/homeWallet.store'
import type { HomeViewModel } from '../types'
import { syncHomeWalletFromApi } from '../api/homeWalletSync'

const EMPTY_WALLET = {
  coinBalance: 0,
  estimatedKrwValue: 0,
  availableCoin: 0,
  escrowCoin: 0,
}

function createEmptyViewModel(isVerified: boolean): HomeViewModel {
  return {
    user: {
      id: '',
      nickname: '',
      isVerified,
    },
    wallet: EMPTY_WALLET,
    unreadNotificationCount: 0,
    recentTrades: [],
  }
}

export function useHomeViewModel(): HomeViewModel & {
  refresh: () => Promise<void>
  isWalletLoading: boolean
} {
  const authStatus = useAuthStatus()
  const isVerified = authStatus === 'authenticated'
  const [data, setData] = useState(() => createEmptyViewModel(isVerified))
  const [isWalletLoading, setIsWalletLoading] = useState(false)

  const wallet = useSyncExternalStore(subscribeHomeWallet, getHomeWallet, () => EMPTY_WALLET)
  const unreadFromStore = useSyncExternalStore(
    subscribeNotifications,
    getUnreadNotificationCount,
    () => 0,
  )

  useEffect(() => {
    setData(createEmptyViewModel(isVerified))
  }, [isVerified])

  const syncUnreadCount = useCallback(async () => {
    if (!isVerified || !shouldUseNotificationsHttpApi()) {
      setUnreadNotificationCount(0)
      return
    }
    try {
      const { count } = await fetchUnreadNotificationCount()
      setUnreadNotificationCount(count)
    } catch {
      setUnreadNotificationCount(0)
    }
  }, [isVerified])

  const syncUser = useCallback(async () => {
    if (!isVerified || !shouldUseCoinsHttpApi()) {
      setData((prev) => ({
        ...prev,
        user: { ...prev.user, isVerified },
        unreadNotificationCount: 0,
      }))
      return
    }

    try {
      const me = await getMe()
      setData((prev) => ({
        ...prev,
        user: {
          id: me.id,
          nickname: me.nickname ?? me.loginId,
          isVerified: true,
        },
        unreadNotificationCount: 0,
      }))
    } catch {
      setData((prev) => ({
        ...prev,
        user: { ...prev.user, isVerified: true },
        unreadNotificationCount: 0,
      }))
    }
  }, [isVerified])

  const syncWallet = useCallback(async () => {
    if (!isVerified || !shouldUseCoinsHttpApi()) return
    setIsWalletLoading(true)
    try {
      await syncHomeWalletFromApi()
    } catch {
      // API 실패 시 0 잔액 유지
    } finally {
      setIsWalletLoading(false)
    }
  }, [isVerified])

  useEffect(() => {
    if (!isVerified) return
    void syncUser()
    void syncWallet()
    void syncUnreadCount()
  }, [isVerified, syncUser, syncWallet, syncUnreadCount])

  const refresh = useCallback(async () => {
    await Promise.all([syncUser(), syncWallet(), syncUnreadCount()])
  }, [syncUser, syncWallet, syncUnreadCount])

  return {
    ...data,
    wallet,
    unreadNotificationCount: unreadFromStore,
    refresh,
    isWalletLoading,
  }
}
