import type { NotificationInboxItem } from './api/notifications.api'
import type { AttentionState, NotificationPayload } from './types'

type Listener = () => void

const listeners = new Set<Listener>()
const pendingQueue: NotificationPayload[] = []
let attention: AttentionState | null = null
let unreadCount = 0
let inboxItems: NotificationInboxItem[] = []
const dispatchedNotificationIds = new Set<string>()

function notify() {
  listeners.forEach((listener) => listener())
}

export function subscribeNotifications(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getPendingNotifications(): readonly NotificationPayload[] {
  return pendingQueue
}

export function getAttentionState(): AttentionState | null {
  return attention
}

export function getUnreadNotificationCount(): number {
  return unreadCount
}

export function getInboxItems(): readonly NotificationInboxItem[] {
  return inboxItems
}

export function hasDispatchedNotification(notificationId: string): boolean {
  return dispatchedNotificationIds.has(notificationId)
}

export function markNotificationDispatched(notificationId: string) {
  dispatchedNotificationIds.add(notificationId)
}

export function setUnreadNotificationCount(count: number) {
  unreadCount = count
  notify()
}

export function setInboxItems(items: NotificationInboxItem[]) {
  inboxItems = items
  notify()
}

export function upsertInboxItem(item: NotificationInboxItem) {
  const index = inboxItems.findIndex(
    (row) => row.recipientNotificationId === item.recipientNotificationId,
  )
  if (index === -1) {
    inboxItems = [item, ...inboxItems]
  } else {
    inboxItems = inboxItems.map((row, i) => (i === index ? item : row))
  }
  notify()
}

export function markInboxItemRead(recipientNotificationId: string) {
  inboxItems = inboxItems.map((row) =>
    row.recipientNotificationId === recipientNotificationId
      ? { ...row, isRead: true, readAt: new Date().toISOString() }
      : row,
  )
  notify()
}

export function enqueuePending(notification: NotificationPayload) {
  const exists = pendingQueue.some((item) => item.id === notification.id)
  if (exists) return
  pendingQueue.push(notification)
  notify()
}

export function consumePending(id: string) {
  const index = pendingQueue.findIndex((item) => item.id === id)
  if (index === -1) return
  pendingQueue.splice(index, 1)
  notify()
}

export function clearPendingForTrade(tradeId: string) {
  for (let i = pendingQueue.length - 1; i >= 0; i -= 1) {
    if (pendingQueue[i].tradeId === tradeId) {
      pendingQueue.splice(i, 1)
    }
  }
  if (attention?.tradeId === tradeId) {
    attention = null
  }
  notify()
}

export function setAttention(next: AttentionState | null) {
  attention = next
  notify()
}

export function clearAttention(tradeId?: string) {
  if (!attention) return
  if (tradeId && attention.tradeId !== tradeId) return
  attention = null
  notify()
}

export function resetNotificationStore() {
  pendingQueue.length = 0
  attention = null
  unreadCount = 0
  inboxItems = []
  dispatchedNotificationIds.clear()
  notify()
}
