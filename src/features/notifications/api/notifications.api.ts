import { httpGet, httpPatch } from '../../../shared/api/httpClient'
import { shouldUseHttpApi } from '../../../shared/api/apiMode'
import type { NotificationEventType } from '../types'

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

export function shouldUseNotificationsHttpApi(): boolean {
  return shouldUseHttpApi()
}

export async function listNotifications(
  page = 1,
  size = 20,
  signal?: AbortSignal,
): Promise<NotificationPageResult> {
  return httpGet<NotificationPageResult>(
    `/v1/me/notifications?page=${page}&size=${size}`,
    signal,
  )
}

export async function getUnreadNotificationCount(
  signal?: AbortSignal,
): Promise<{ count: number }> {
  return httpGet<{ count: number }>('/v1/me/notifications/unread-count', signal)
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
