import { formatAmountNumber } from '../../../shared/utils/formatAmount'
import type {
  CoinDirection,
  HistoryKind,
  HistoryStatus,
  HistoryTransaction,
  StatusFilterId,
  YearMonth,
} from '../types'

export function coinDirection(kind: HistoryKind): CoinDirection {
  return kind === 'USER_PURCHASE' || kind === 'MERCHANT_REDEEM' ? 'IN' : 'OUT'
}

export function signedCoinAmount(kind: HistoryKind, coinAmount: number): number {
  return coinDirection(kind) === 'IN' ? coinAmount : -coinAmount
}

/** 타임존과 무관하게 거래 시각 문자열의 날짜를 쓴다. */
export function toDateKey(occurredAt: string): string {
  return occurredAt.slice(0, 10)
}

export function isInMonth(occurredAt: string, month: YearMonth): boolean {
  const key = toDateKey(occurredAt)
  const prefix = `${month.year}-${String(month.month).padStart(2, '0')}`
  return key.startsWith(prefix)
}

export function currentYearMonth(now = new Date()): YearMonth {
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export function todayDateKey(now = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function shiftMonth(month: YearMonth, delta: number): YearMonth {
  const index = month.year * 12 + (month.month - 1) + delta
  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

export function sameMonth(a: YearMonth, b: YearMonth): boolean {
  return a.year === b.year && a.month === b.month
}

export function matchesStatusFilter(status: HistoryStatus, filters: StatusFilterId[]): boolean {
  if (status === 'CHECKING') return filters.includes('PROCESSING')
  return filters.includes(status)
}

export interface MonthCoinSummary {
  inflow: number
  outflow: number
  net: number
  count: number
}

/** 건수는 월의 전체 거래, Coin 합계는 완료 건만. */
export function summarizeMonth(items: HistoryTransaction[]): MonthCoinSummary {
  let inflow = 0
  let outflow = 0

  for (const item of items) {
    if (item.status !== 'COMPLETED') continue
    if (coinDirection(item.kind) === 'IN') inflow += item.coinAmount
    else outflow += item.coinAmount
  }

  return {
    inflow,
    outflow,
    net: inflow - outflow,
    count: items.length,
  }
}

export interface DailyCoinSummary {
  inflow: number
  outflow: number
  net: number
  hasOpen: boolean
}

export function summarizeDays(items: HistoryTransaction[]): Map<string, DailyCoinSummary> {
  const map = new Map<string, DailyCoinSummary>()

  for (const item of items) {
    const key = toDateKey(item.occurredAt)
    const current = map.get(key) ?? { inflow: 0, outflow: 0, net: 0, hasOpen: false }

    if (item.status === 'COMPLETED') {
      if (coinDirection(item.kind) === 'IN') current.inflow += item.coinAmount
      else current.outflow += item.coinAmount
      current.net = current.inflow - current.outflow
    } else {
      current.hasOpen = true
    }

    map.set(key, current)
  }

  return map
}

export function completedAmountByKind(items: HistoryTransaction[]): Record<HistoryKind, number> {
  const amounts: Record<HistoryKind, number> = {
    USER_PURCHASE: 0,
    USER_SALE: 0,
    MERCHANT_CHARGE: 0,
    MERCHANT_REDEEM: 0,
  }

  for (const item of items) {
    if (item.status !== 'COMPLETED') continue
    amounts[item.kind] += item.coinAmount
  }

  return amounts
}

export function absoluteVolume(amounts: Record<HistoryKind, number>): number {
  return Object.values(amounts).reduce((sum, amount) => sum + amount, 0)
}

export function formatSignedCoin(kind: HistoryKind, coinAmount: number): string {
  const sign = coinDirection(kind) === 'IN' ? '+' : '-'
  return `${sign}${formatAmountNumber(coinAmount)} C`
}

export function formatNetCoin(net: number): string {
  if (net === 0) return '0 C'
  const sign = net > 0 ? '+' : '-'
  return `${sign}${formatAmountNumber(Math.abs(net))} C`
}

export function formatCoinVolume(amount: number): string {
  return `${formatAmountNumber(amount)} C`
}

/** 캘린더 셀 전용. 1,000 C 이상은 천 단위 k. */
export function formatCompactCoinDelta(net: number): string {
  if (net === 0) return '0'
  const sign = net > 0 ? '+' : '-'
  const abs = Math.abs(net)
  if (abs >= 1000) return `${sign}${Math.round(abs / 1000)}k`
  return `${sign}${formatAmountNumber(abs)}`
}

export function formatMonthLabel(month: YearMonth): string {
  return `${month.year}년 ${month.month}월`
}

export function formatDayHeading(dateKey: string): string {
  const [, month, day] = dateKey.split('-')
  return `${Number(month)}월 ${Number(day)}일`
}

export function formatOccurredAt(occurredAt: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(occurredAt)
  if (!match) return occurredAt
  return `${match[1]}.${match[2]}.${match[3]} ${match[4]}:${match[5]}`
}

export function formatPointAmount(amount: number): string {
  return `${formatAmountNumber(amount)} Point`
}
