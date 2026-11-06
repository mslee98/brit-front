import { httpGet } from '../../../shared/api/httpClient'
import { shouldUseHttpApi } from '../../../shared/api/apiMode'
import {
  ALL_STATUS_FILTERS,
  OPEN_STATUSES,
  TRANSACTION_KINDS,
  TYPE_FILTER_KINDS,
} from '../constants'
import { MOCK_TRANSACTIONS } from '../mocks/history.mock'
import type {
  StatusFilterId,
  TransactionDetail,
  TransactionFilter,
  TransactionItem,
  TransactionKind,
  TransactionStatus,
  TransactionSummary,
} from '../types'
import { toDateKey } from '../utils/coinFlow'

type Wire<T> = {
  [K in keyof T]: T[K] extends number ? string : T[K] extends number | null ? string | null : T[K]
}

type TransactionItemWire = Wire<TransactionItem>

interface TransactionDetailWire extends TransactionItemWire {
  bankName: string | null
  accountNumberMasked: string | null
  exchangeRate: { numerator: string; denominator: string } | null
  timeline: TransactionDetail['timeline']
}

interface TransactionSummaryWire {
  inflow: string
  outflow: string
  net: string
  count: number
  openCount: number
  byKind: Record<TransactionKind, string>
  byDay: { date: string; inflow: string; outflow: string; net: string; count: number; hasOpen: boolean }[]
}

export interface TransactionPage {
  items: TransactionItem[]
  nextCursor: string | null
}

export interface TransactionListParams extends TransactionFilter {
  /** `YYYY-MM` */
  month?: string
  /** `YYYY-MM-DD`. month보다 우선 */
  date?: string
  cursor?: string | null
  size: number
}

function toNumber(value: string | null): number | null {
  return value == null ? null : Number(value)
}

function fromItemWire(wire: TransactionItemWire): TransactionItem {
  return {
    ...wire,
    coinAmount: Number(wire.coinAmount),
    cashAmount: toNumber(wire.cashAmount),
    pointAmount: toNumber(wire.pointAmount),
  }
}

function filterQuery(filter: Partial<TransactionFilter>): URLSearchParams {
  const query = new URLSearchParams()
  if (filter.type && filter.type !== 'ALL') query.set('type', filter.type)
  if (filter.statuses && filter.statuses.length !== ALL_STATUS_FILTERS.length) {
    query.set('status', filter.statuses.join(','))
  }
  return query
}

export async function listTransactions(
  params: TransactionListParams,
  signal?: AbortSignal,
): Promise<TransactionPage> {
  if (!shouldUseHttpApi()) return mockList(params)

  const query = filterQuery(params)
  if (params.date) query.set('date', params.date)
  else if (params.month) query.set('month', params.month)
  if (params.cursor) query.set('cursor', params.cursor)
  query.set('size', String(params.size))

  const page = await httpGet<{ items: TransactionItemWire[]; nextCursor: string | null }>(
    `/v1/me/transactions?${query.toString()}`,
    signal,
  )
  return { items: page.items.map(fromItemWire), nextCursor: page.nextCursor }
}

export async function fetchTransactionSummary(
  month: string,
  filter: Partial<TransactionFilter> = {},
  signal?: AbortSignal,
): Promise<TransactionSummary> {
  if (!shouldUseHttpApi()) return mockSummary(month, filter)

  const query = filterQuery(filter)
  query.set('month', month)
  const wire = await httpGet<TransactionSummaryWire>(
    `/v1/me/transactions/summary?${query.toString()}`,
    signal,
  )
  return {
    inflow: Number(wire.inflow),
    outflow: Number(wire.outflow),
    net: Number(wire.net),
    count: wire.count,
    openCount: wire.openCount,
    byKind: Object.fromEntries(
      Object.entries(wire.byKind).map(([kind, amount]) => [kind, Number(amount)]),
    ) as Record<TransactionKind, number>,
    byDay: wire.byDay.map((day) => ({
      ...day,
      inflow: Number(day.inflow),
      outflow: Number(day.outflow),
      net: Number(day.net),
    })),
  }
}

export async function fetchTransactionDetail(
  transactionId: string,
  signal?: AbortSignal,
): Promise<TransactionDetail> {
  if (!shouldUseHttpApi()) {
    const found = MOCK_TRANSACTIONS.find((item) => item.id === transactionId)
    if (!found) throw new Error('TRANSACTION_NOT_FOUND')
    return found
  }

  const wire = await httpGet<TransactionDetailWire>(
    `/v1/me/transactions/${encodeURIComponent(transactionId)}`,
    signal,
  )
  return {
    ...fromItemWire(wire),
    bankName: wire.bankName,
    accountNumberMasked: wire.accountNumberMasked,
    exchangeRate: wire.exchangeRate
      ? {
          numerator: Number(wire.exchangeRate.numerator),
          denominator: Number(wire.exchangeRate.denominator),
        }
      : null,
    timeline: wire.timeline,
  }
}

// ── mock (VITE_USE_MOCK) ──

const STATUS_FILTER_STATUSES: Record<StatusFilterId, TransactionStatus[]> = {
  COMPLETED: ['COMPLETED'],
  PROCESSING: OPEN_STATUSES,
  CANCELLED: ['CANCELLED'],
  FAILED: ['FAILED'],
}

function mockMatches(item: TransactionItem, filter: Partial<TransactionFilter>): boolean {
  if (filter.type && filter.type !== 'ALL' && !TYPE_FILTER_KINDS[filter.type].includes(item.kind)) {
    return false
  }
  if (filter.statuses) {
    const allowed = filter.statuses.flatMap((id) => STATUS_FILTER_STATUSES[id])
    if (!allowed.includes(item.status)) return false
  }
  return true
}

function mockList(params: TransactionListParams): TransactionPage {
  const items = MOCK_TRANSACTIONS.filter((item) => {
    const key = toDateKey(item.occurredAt)
    if (params.date && key !== params.date) return false
    if (!params.date && params.month && !key.startsWith(params.month)) return false
    return mockMatches(item, params)
  })
  return { items, nextCursor: null }
}

function mockSummary(month: string, filter: Partial<TransactionFilter>): TransactionSummary {
  const summary: TransactionSummary = {
    inflow: 0,
    outflow: 0,
    net: 0,
    count: 0,
    openCount: 0,
    byKind: Object.fromEntries(TRANSACTION_KINDS.map((kind) => [kind, 0])) as Record<
      TransactionKind,
      number
    >,
    byDay: [],
  }
  const days = new Map<string, TransactionSummary['byDay'][number]>()

  for (const item of MOCK_TRANSACTIONS) {
    const date = toDateKey(item.occurredAt)
    if (!date.startsWith(month) || !mockMatches(item, filter)) continue
    const day = days.get(date) ?? { date, inflow: 0, outflow: 0, net: 0, count: 0, hasOpen: false }
    day.count += 1
    summary.count += 1
    if (OPEN_STATUSES.includes(item.status)) {
      day.hasOpen = true
      summary.openCount += 1
    }
    if (item.status === 'COMPLETED') {
      summary.byKind[item.kind] += item.coinAmount
      if (item.direction === 'IN') {
        day.inflow += item.coinAmount
        summary.inflow += item.coinAmount
      } else {
        day.outflow += item.coinAmount
        summary.outflow += item.coinAmount
      }
      day.net = day.inflow - day.outflow
    }
    days.set(date, day)
  }

  summary.net = summary.inflow - summary.outflow
  summary.byDay = [...days.values()].sort((a, b) => a.date.localeCompare(b.date))
  return summary
}
