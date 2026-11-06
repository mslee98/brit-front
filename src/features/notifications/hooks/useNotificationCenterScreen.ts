/**
 * useNotificationCenterScreen
 *
 * 책임: 필터별 첫 페이지·더 보기, 미읽음/확인 필요 건수, SSE 새 알림 합치기,
 *       읽음·모두 읽음·보관(행 메뉴), 딥링크 이동, 화면 복귀 시 새로고침
 * 비책임: 행 UI (→ NotificationItem · NotificationItemMenuSheet), 앱 전역 SSE 연결 (→ NotificationBootstrap)
 *
 * @see docs/domains/notifications.md
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useActivity } from '@stackflow/react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import type { FilterChipItem } from '../../../shared/ui/FilterChips'
import { showSnackbar } from '../../../shared/utils/showSnackbar'
import {
  archiveNotification,
  fetchNotificationCounts,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  shouldUseNotificationsHttpApi,
  type NotificationListFilter,
} from '../api/notifications.api'
import {
  getInboxItems,
  getUnreadNotificationCount,
  markInboxItemRead,
  setUnreadNotificationCount,
  subscribeNotifications,
} from '../notification.store'
import {
  NOTIFICATION_EMPTY_COPY,
  NOTIFICATION_FILTER_LABEL,
} from '../constants/notificationPresentation'
import { groupNotificationsByDate } from '../utils/formatNotification'
import { navigateFromDeepLink } from '../utils/navigateFromDeepLink'
import type { NotificationInboxItem } from '../api/notifications.api'

const PAGE_SIZE = 20
const FILTERS: NotificationListFilter[] = ['all', 'unread', 'action']

function withCount(label: string, count: number): string {
  return count > 0 ? `${label} ${count}` : label
}

function matchesFilter(item: NotificationInboxItem, filter: NotificationListFilter): boolean {
  if (filter === 'unread') return !item.isRead
  if (filter === 'action') return item.actionState === 'REQUIRED'
  return true
}

export function useNotificationCenterScreen() {
  const [filter, setFilter] = useState<NotificationListFilter>('all')
  const [items, setItems] = useState<NotificationInboxItem[]>([])
  /** 첫 페이지가 도착한 필터. 현재 필터와 다르면 불러오는 중 */
  const [loadedFilter, setLoadedFilter] = useState<NotificationListFilter | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [unreadCount, setUnreadCount] = useState(getUnreadNotificationCount())
  const [actionRequiredCount, setActionRequiredCount] = useState(0)
  const requestIdRef = useRef(0)
  const [mountedAt] = useState(() => new Date().toISOString())
  const httpEnabled = shouldUseNotificationsHttpApi()
  const loading = httpEnabled && loadedFilter !== filter

  const refreshCounts = useCallback(() => {
    if (!httpEnabled) return Promise.resolve()
    return fetchNotificationCounts()
      .then((counts) => {
        setUnreadNotificationCount(counts.unreadCount)
        setUnreadCount(counts.unreadCount)
        setActionRequiredCount(counts.actionRequiredCount)
      })
      .catch(() => undefined)
  }, [httpEnabled])

  const loadFirstPage = useCallback(
    (target: NotificationListFilter) => {
      if (!httpEnabled) return Promise.resolve()
      const requestId = ++requestIdRef.current
      return listNotifications(1, PAGE_SIZE, undefined, target)
        .then((result) => {
          if (requestId !== requestIdRef.current) return
          setItems(result.items)
          setPage(1)
          setHasMore(result.pagination.totalPages > 1)
          setLoadedFilter(target)
        })
        .catch(() => {
          if (requestId !== requestIdRef.current) return
          setItems([])
          setHasMore(false)
          setLoadedFilter(target)
        })
    },
    [httpEnabled],
  )

  const refresh = useCallback(
    () => Promise.all([loadFirstPage(filter), refreshCounts()]),
    [filter, loadFirstPage, refreshCounts],
  )

  useEffect(() => {
    void loadFirstPage(filter)
  }, [filter, loadFirstPage])

  useEffect(() => {
    void refreshCounts()
  }, [refreshCounts])

  // 알림에서 거래 화면으로 갔다 돌아오면 처리 필요 상태가 바뀌었을 수 있다
  const { isActive } = useActivity()
  const wasActiveRef = useRef(isActive)
  useEffect(() => {
    if (isActive && !wasActiveRef.current) void refresh()
    wasActiveRef.current = isActive
  }, [isActive, refresh])

  const changeFilter = useCallback((next: NotificationListFilter) => {
    setItems([])
    setHasMore(false)
    setFilter(next)
  }, [])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    const requestId = requestIdRef.current
    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const result = await listNotifications(nextPage, PAGE_SIZE, undefined, filter)
      if (requestId !== requestIdRef.current) return
      setItems((prev) => {
        const seen = new Set(prev.map((row) => row.recipientNotificationId))
        return [...prev, ...result.items.filter((row) => !seen.has(row.recipientNotificationId))]
      })
      setPage(nextPage)
      setHasMore(nextPage < result.pagination.totalPages)
    } catch {
      // 다음 시도에서 다시 불러온다
    } finally {
      setLoadingMore(false)
    }
  }, [filter, hasMore, loadingMore, page])

  /** SSE로 도착한 새 알림을 현재 필터에 맞으면 맨 위에 붙인다 */
  useEffect(() => {
    return subscribeNotifications(() => {
      setUnreadCount(getUnreadNotificationCount())
      const incoming = getInboxItems()
      setItems((prev) => {
        const seen = new Set(prev.map((row) => row.recipientNotificationId))
        const newest = prev[0]?.createdAt ?? mountedAt
        const fresh = incoming.filter(
          (row) =>
            !seen.has(row.recipientNotificationId) &&
            row.createdAt > newest &&
            matchesFilter(row, filter),
        )
        return fresh.length > 0 ? [...fresh, ...prev] : prev
      })
    })
  }, [filter, mountedAt])

  const handleMarkAllRead = useCallback(async () => {
    if (!shouldUseNotificationsHttpApi()) return
    await markAllNotificationsRead()
    const readAt = new Date().toISOString()
    setItems((prev) =>
      filter === 'unread' ? [] : prev.map((item) => ({ ...item, isRead: true, readAt })),
    )
    setHasMore(false)
    setUnreadNotificationCount(0)
    setUnreadCount(0)
  }, [filter])

  const handleItemClick = useCallback(async (item: NotificationInboxItem) => {
    if (!item.isRead && shouldUseNotificationsHttpApi()) {
      setItems((prev) =>
        prev.map((row) =>
          row.recipientNotificationId === item.recipientNotificationId
            ? { ...row, isRead: true }
            : row,
        ),
      )
      markInboxItemRead(item.recipientNotificationId)
      setUnreadNotificationCount(Math.max(0, getUnreadNotificationCount() - 1))
      void markNotificationRead(item.recipientNotificationId).catch(() => undefined)
    }
    if (item.deepLink) {
      navigateFromDeepLink(item.deepLink)
    }
  }, [])

  const snackbar = useSnackbarAdapter()
  const [menuItem, setMenuItem] = useState<NotificationInboxItem | null>(null)

  const handleMenuOpenChange = useCallback((open: boolean) => {
    if (!open) setMenuItem(null)
  }, [])

  const handleArchiveMenuItem = useCallback(async () => {
    const item = menuItem
    if (!item || !shouldUseNotificationsHttpApi()) return
    try {
      await archiveNotification(item.recipientNotificationId)
    } catch {
      showSnackbar(snackbar, '보관하지 못했어요. 잠시 후 다시 시도해 주세요.', 'critical')
      return
    }
    setMenuItem(null)
    setItems((prev) =>
      prev.filter((row) => row.recipientNotificationId !== item.recipientNotificationId),
    )
    void refreshCounts()
    showSnackbar(snackbar, '알림을 보관했어요.')
  }, [menuItem, refreshCounts, snackbar])

  const filterItems = useMemo<FilterChipItem<NotificationListFilter>[]>(
    () =>
      FILTERS.map((id) => ({
        id,
        label:
          id === 'unread'
            ? withCount(NOTIFICATION_FILTER_LABEL[id], unreadCount)
            : id === 'action'
              ? withCount(NOTIFICATION_FILTER_LABEL[id], actionRequiredCount)
              : NOTIFICATION_FILTER_LABEL[id],
      })),
    [unreadCount, actionRequiredCount],
  )

  const now = new Date()

  return {
    filter,
    filterItems,
    setFilter: changeFilter,
    items,
    groups: groupNotificationsByDate(items, now),
    now,
    emptyCopy: NOTIFICATION_EMPTY_COPY[filter],
    loading,
    loadingMore,
    hasMore,
    unreadCount,
    loadMore,
    handleMarkAllRead,
    handleItemClick,
    menuItem,
    openItemMenu: setMenuItem,
    handleMenuOpenChange,
    handleArchiveMenuItem,
  }
}
