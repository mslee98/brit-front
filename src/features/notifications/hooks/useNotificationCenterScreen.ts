import { useCallback, useEffect, useState } from 'react'
import { useFlow } from '@stackflow/react'

import {
  archiveNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  shouldUseNotificationsHttpApi,
} from '../api/notifications.api'
import {
  getUnreadNotificationCount,
  markInboxItemRead,
  setInboxItems,
  setUnreadNotificationCount,
} from '../notification.store'
import { navigateFromDeepLink } from '../utils/navigateFromDeepLink'
import type { NotificationInboxItem } from '../api/notifications.api'

export function useNotificationCenterScreen() {
  const { pop } = useFlow()
  const [items, setItems] = useState<NotificationInboxItem[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!shouldUseNotificationsHttpApi()) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const result = await listNotifications(1, 50)
      setItems(result.items)
      setInboxItems(result.items)
      const unread = result.items.filter((item) => !item.isRead).length
      setUnreadNotificationCount(unread)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleMarkAllRead = useCallback(async () => {
    if (!shouldUseNotificationsHttpApi()) return
    await markAllNotificationsRead()
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })))
    setUnreadNotificationCount(0)
  }, [])

  const handleItemClick = useCallback(async (item: NotificationInboxItem) => {
    if (!item.isRead && shouldUseNotificationsHttpApi()) {
      await markNotificationRead(item.recipientNotificationId)
      markInboxItemRead(item.recipientNotificationId)
      setItems((prev) =>
        prev.map((row) =>
          row.recipientNotificationId === item.recipientNotificationId
            ? { ...row, isRead: true }
            : row,
        ),
      )
      setUnreadNotificationCount(Math.max(0, getUnreadNotificationCount() - 1))
    }
    if (item.deepLink) {
      navigateFromDeepLink(item.deepLink)
    }
    pop()
  }, [pop])

  const handleArchive = useCallback(async (item: NotificationInboxItem) => {
    if (!shouldUseNotificationsHttpApi()) return
    await archiveNotification(item.recipientNotificationId)
    setItems((prev) =>
      prev.filter((row) => row.recipientNotificationId !== item.recipientNotificationId),
    )
    if (!item.isRead) {
      setUnreadNotificationCount(Math.max(0, getUnreadNotificationCount() - 1))
    }
  }, [])

  return {
    items,
    loading,
    refresh,
    handleMarkAllRead,
    handleItemClick,
    handleArchive,
  }
}
