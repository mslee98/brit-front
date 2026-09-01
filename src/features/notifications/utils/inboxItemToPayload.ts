import type { NotificationInboxItem } from '../api/notifications.api'
import type { NotificationEventType, NotificationPayload, NotificationPriority } from '../types'

function mapPriority(priority: NotificationInboxItem['priority']): NotificationPriority {
  if (priority === 'HIGH' || priority === 'URGENT') return 'high'
  return 'normal'
}

function extractTradeId(item: NotificationInboxItem): string | undefined {
  if (item.deepLink) {
    const match = item.deepLink.match(/tradeId=([^&]+)/)
    if (match?.[1]) return match[1]
  }
  if (item.referenceType === 'TRADE') return item.referenceId
  return undefined
}

export function inboxItemToPayload(item: NotificationInboxItem): NotificationPayload {
  return {
    id: item.notificationId,
    type: item.type as NotificationEventType,
    tradeId: extractTradeId(item),
    message: item.body,
    title: item.title,
    priority: mapPriority(item.priority),
    createdAt: item.occurredAt,
  }
}
