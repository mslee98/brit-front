import type { ReactNode } from 'react'
import {
  IconBellLine,
  IconCheckmarkBadgeLine,
  IconCheckmarkCircleLine,
  IconClockLine,
  IconExclamationmarkCircleLine,
  IconPersonLine,
  IconShoppingbagLine,
  IconWonCircleArrowLeftLine,
  IconWonLine,
  IconXmarkCircleLine,
} from '@karrotmarket/react-monochrome-icon'

import type { NotificationListFilter } from '../api/notifications.api'
import type { NotificationEventType } from '../types'

export type NotificationTone = 'brand' | 'positive' | 'critical' | 'warning' | 'neutral'

interface TypePresentation {
  icon: ReactNode
  tone: NotificationTone
  /** actionState=REQUIRED일 때 보여 줄 행동 라벨 */
  actionLabel?: string
}

const PRESENTATION: Partial<Record<NotificationEventType, TypePresentation>> = {
  TRADE_REQUEST_CREATED: { icon: <IconShoppingbagLine />, tone: 'brand', actionLabel: '응답 필요' },
  TRADE_REQUEST_ACCEPTED: {
    icon: <IconCheckmarkCircleLine />,
    tone: 'brand',
    actionLabel: '입금 필요',
  },
  TRADE_REQUEST_REJECTED: { icon: <IconXmarkCircleLine />, tone: 'neutral' },
  TRADE_PAYMENT_REPORTED: { icon: <IconWonLine />, tone: 'warning', actionLabel: '입금 확인 필요' },
  TRADE_PAYMENT_REPORT_WITHDRAWN: { icon: <IconWonCircleArrowLeftLine />, tone: 'neutral' },
  TRADE_COMPLETED: { icon: <IconCheckmarkCircleLine />, tone: 'positive' },
  TRADE_EXPIRED: { icon: <IconClockLine />, tone: 'neutral' },
  TRADE_CANCELLED: { icon: <IconXmarkCircleLine />, tone: 'neutral' },
  DISPUTE_OPENED: { icon: <IconExclamationmarkCircleLine />, tone: 'critical' },
  DISPUTE_RESOLVED: { icon: <IconCheckmarkBadgeLine />, tone: 'neutral' },
  USER_REGISTRATION_REQUESTED: { icon: <IconPersonLine />, tone: 'neutral' },
  USER_REGISTRATION_APPROVED: { icon: <IconPersonLine />, tone: 'positive' },
  USER_REGISTRATION_REJECTED: { icon: <IconPersonLine />, tone: 'neutral' },
}

const FALLBACK: TypePresentation = { icon: <IconBellLine />, tone: 'neutral' }

export function getNotificationPresentation(type: NotificationEventType): TypePresentation {
  return PRESENTATION[type] ?? FALLBACK
}

export const NOTIFICATION_FILTER_LABEL: Record<NotificationListFilter, string> = {
  all: '전체',
  unread: '안 읽음',
  action: '확인 필요',
}

export const NOTIFICATION_EMPTY_COPY: Record<
  NotificationListFilter,
  { title: string; detail: string }
> = {
  all: { title: '알림이 없어요', detail: '거래 요청이나 입금 소식이 생기면 알려드릴게요' },
  unread: { title: '모두 읽었어요', detail: '새 알림이 오면 여기에 보여요' },
  action: {
    title: '확인할 일이 없어요',
    detail: '응답이나 입금 확인이 필요하면 여기에 모아 보여드려요',
  },
}
