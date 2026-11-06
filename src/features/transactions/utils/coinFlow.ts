import { formatAmountNumber } from '../../../shared/utils/formatAmount'
import { OPEN_STATUSES } from '../constants'
import type { CoinDirection, TransactionKind, TransactionStatus, YearMonth } from '../types'

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

/** ISO 시각 → 기기 시간대 기준 `YYYY-MM-DD`. 서버 KST 집계와 한국에서 같다. */
export function toDateKey(iso: string): string {
  const date = new Date(iso)
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function toMonthKey(month: YearMonth): string {
  return `${month.year}-${pad2(month.month)}`
}

export function currentYearMonth(now = new Date()): YearMonth {
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export function todayDateKey(now = new Date()): string {
  return toDateKey(now.toISOString())
}

export function shiftMonth(month: YearMonth, delta: number): YearMonth {
  const index = month.year * 12 + (month.month - 1) + delta
  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

export function sameMonth(a: YearMonth, b: YearMonth): boolean {
  return a.year === b.year && a.month === b.month
}

export function isAfterMonth(a: YearMonth, b: YearMonth): boolean {
  return a.year * 12 + a.month > b.year * 12 + b.month
}

export function isOpenStatus(status: TransactionStatus): boolean {
  return OPEN_STATUSES.includes(status)
}

export function kindDirection(kind: TransactionKind): CoinDirection {
  return kind === 'P2P_SELL' || kind === 'PARTNER_CHARGE' ? 'OUT' : 'IN'
}

export function absoluteVolume(amounts: Record<TransactionKind, number>): number {
  return Object.values(amounts).reduce((sum, amount) => sum + amount, 0)
}

export function formatSignedCoin(direction: CoinDirection, coinAmount: number): string {
  const sign = direction === 'IN' ? '+' : '-'
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

/** `YYYY-MM-DD` → 11월 3일 */
export function formatDateKeyLabel(dateKey: string): string {
  const [, month, day] = dateKey.split('-')
  return `${Number(month)}월 ${Number(day)}일`
}

/** 2026.11.03 15:20 */
export function formatOccurredAt(iso: string): string {
  const date = new Date(iso)
  return `${toDateKey(iso).replaceAll('-', '.')} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

export function formatPointAmount(amount: number): string {
  return `${formatAmountNumber(amount)} Point`
}
