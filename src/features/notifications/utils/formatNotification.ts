import { formatCoinUnit } from '../../../shared/utils/formatAmount'
import { formatDayHeading, formatTimeOfDay, startOfDay } from '../../../shared/utils/formatDate'
import type { NotificationInboxItem } from '../api/notifications.api'

export interface NotificationDateGroup {
  key: number
  label: string
  items: NotificationInboxItem[]
}

/** 「300,000 Coin · 구매자 김**」 — 거래 알림이 아니면 null */
export function formatNotificationMeta(item: NotificationInboxItem): string | null {
  const parts: string[] = []
  const amount = item.coinAmount ? Number(item.coinAmount) : NaN
  if (Number.isFinite(amount) && amount > 0) {
    parts.push(formatCoinUnit(amount))
  }
  if (item.counterpartyNicknameMasked) {
    const counterpartyRole =
      item.recipientRole === 'SELLER' ? '구매자 ' : item.recipientRole === 'BUYER' ? '판매자 ' : ''
    parts.push(`${counterpartyRole}${item.counterpartyNicknameMasked}`)
  }
  return parts.length > 0 ? parts.join(' · ') : null
}

/** 1시간 미만은 상대 시간, 그 외는 시각 (날짜는 그룹 제목이 맡는다) */
export function formatNotificationTime(iso: string, now = new Date()): string {
  const diffMinutes = Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000)
  if (diffMinutes < 1) return '방금 전'
  if (diffMinutes < 60) return `${diffMinutes}분 전`
  return formatTimeOfDay(iso)
}

/** 최신순 목록을 날짜(오늘 · 어제 · 11월 3일 (화))별로 묶는다 */
export function groupNotificationsByDate(
  items: NotificationInboxItem[],
  now = new Date(),
): NotificationDateGroup[] {
  const groups: NotificationDateGroup[] = []
  for (const item of items) {
    const key = startOfDay(new Date(item.createdAt))
    const last = groups[groups.length - 1]
    if (last?.key === key) {
      last.items.push(item)
    } else {
      groups.push({
        key,
        label: formatDayHeading(item.createdAt, { now, withWeekday: true, year: 'otherYear' }),
        items: [item],
      })
    }
  }
  return groups
}
