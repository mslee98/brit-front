import { formatDayHeading, formatTimeOfDay } from '../../../shared/utils/formatDate'
import type {
  TransactionItem,
  TransactionStatus,
  TransactionTimelineStep,
} from '../types'
import { toDateKey } from './coinFlow'

/** 사용자 입장의 한 줄. 상대·포인트 이름이 없으면 종류 이름으로 둔다. */
export function transactionTitle(item: TransactionItem): string {
  const who = item.counterpartyNickname
  const asset = item.assetName ?? (item.partnerName ? `${item.partnerName} 포인트` : null)
  switch (item.kind) {
    case 'P2P_BUY':
      return who ? `${who} 님에게 구매` : '구매'
    case 'P2P_SELL':
      return who ? `${who} 님에게 판매` : '판매'
    case 'BRIT_PURCHASE':
      return 'Brit에서 구매'
    case 'PARTNER_CHARGE':
      return asset ? `${asset} 충전` : '포인트 충전'
    case 'PARTNER_REDEEM':
      return asset ? `${asset} 환전` : '포인트 환전'
    case 'ADMIN_ADJUSTMENT':
      return 'Coin 조정'
  }
}

export function transactionStatusLabel(status: TransactionStatus): string {
  if (status === 'PROCESSING') return '진행 중'
  if (status === 'CHECKING') return '확인 중'
  if (status === 'CANCELLED') return '취소'
  if (status === 'FAILED') return '실패'
  return '완료'
}

export type StatusTone = 'neutral' | 'warning' | 'critical'

export function transactionStatusTone(status: TransactionStatus): StatusTone {
  if (status === 'PROCESSING' || status === 'CHECKING') return 'warning'
  if (status === 'FAILED') return 'critical'
  return 'neutral'
}

/** 오후 3:20 · 진행 중. 완료는 상태를 붙이지 않는다. */
export function transactionSubtitle(item: TransactionItem): string {
  const time = formatTimeOfDay(item.occurredAt)
  return item.status === 'COMPLETED' ? time : `${time} · ${transactionStatusLabel(item.status)}`
}

export const TIMELINE_STEP_LABEL: Record<TransactionTimelineStep, string> = {
  REQUESTED: '거래 시작',
  PAYMENT_REPORTED: '입금 알림',
  CONFIRMED: '입금 확인',
  COMPLETED: '완료',
  CANCELLED: '취소',
  FAILED: '실패',
}

export interface TransactionDateGroup {
  dateKey: string
  label: string
  items: TransactionItem[]
}

/** 이미 최신순인 목록을 날짜별로 묶는다. 페이지가 이어져도 같은 날은 한 묶음. */
export function groupTransactionsByDate(
  items: TransactionItem[],
  now = new Date(),
): TransactionDateGroup[] {
  const groups: TransactionDateGroup[] = []
  for (const item of items) {
    const dateKey = toDateKey(item.occurredAt)
    const last = groups[groups.length - 1]
    if (last && last.dateKey === dateKey) {
      last.items.push(item)
      continue
    }
    groups.push({
      dateKey,
      label: formatDayHeading(item.occurredAt, { now, withWeekday: true, year: 'otherYear' }),
      items: [item],
    })
  }
  return groups
}

export function monthComparisonLines(current: number, previous: number): { lead: string; rest: string } {
  const delta = current - previous
  if (delta === 0) {
    return { lead: '지난달과', rest: '거래량이 같아요' }
  }

  const amount = `${Math.abs(delta).toLocaleString('ko-KR')} C`
  return {
    lead: '지난달보다',
    rest: delta > 0 ? `${amount} 더 거래했어요` : `${amount} 덜 거래했어요`,
  }
}
