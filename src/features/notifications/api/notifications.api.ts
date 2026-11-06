import { httpGet, httpPatch } from '../../../shared/api/httpClient'
import { shouldUseHttpApi } from '../../../shared/api/apiMode'
import type { NotificationEventType } from '../types'

/** 연결된 업무 기준 처리 필요 여부 (읽음과 별개) */
export type NotificationActionState = 'REQUIRED' | 'DONE' | 'NONE'

export type NotificationListFilter = 'all' | 'unread' | 'action'

export interface NotificationInboxItem {
  recipientNotificationId: string
  notificationId: string
  type: NotificationEventType
  title: string
  body: string
  deepLink: string | null
  priority: 'NORMAL' | 'HIGH' | 'URGENT'
  referenceType: string
  referenceId: string
  isRead: boolean
  readAt: string | null
  occurredAt: string
  createdAt: string
  actionState?: NotificationActionState
  recipientRole?: 'BUYER' | 'SELLER' | null
  /** 거래 수량 (bigint 문자열) */
  coinAmount?: string | null
  counterpartyNicknameMasked?: string | null
}

export interface NotificationPageResult {
  items: NotificationInboxItem[]
  pagination: {
    page: number
    size: number
    totalItems: number
    totalPages: number
  }
}

export interface NotificationCounts {
  unreadCount: number
  actionRequiredCount: number
}

export function shouldUseNotificationsHttpApi(): boolean {
  return shouldUseHttpApi()
}

export async function listNotifications(
  page = 1,
  size = 20,
  signal?: AbortSignal,
  filter: NotificationListFilter = 'all',
): Promise<NotificationPageResult> {
  const query = new URLSearchParams({ page: String(page), size: String(size) })
  if (filter !== 'all') query.set('filter', filter)
  return httpGet<NotificationPageResult>(`/v1/me/notifications?${query.toString()}`, signal)
}

export async function fetchUnreadNotificationCount(
  signal?: AbortSignal,
): Promise<{ count: number }> {
  return httpGet<{ count: number }>('/v1/me/notifications/unread-count', signal)
}

/** 미읽음 + 처리 필요 건수 (알림 화면 필터 칩) */
export async function fetchNotificationCounts(signal?: AbortSignal): Promise<NotificationCounts> {
  return httpGet<NotificationCounts>('/v1/me/notifications/counts', signal)
}

export async function markNotificationRead(recipientNotificationId: string): Promise<void> {
  await httpPatch<void>(`/v1/me/notifications/${recipientNotificationId}/read`)
}

export async function markAllNotificationsRead(): Promise<void> {
  await httpPatch<void>('/v1/me/notifications/read-all')
}

export async function archiveNotification(recipientNotificationId: string): Promise<void> {
  await httpPatch<void>(`/v1/me/notifications/${recipientNotificationId}/archive`)
}
