import { useCallback, useMemo, useState } from 'react'
import { useFlow } from '@stackflow/react'

import { ALL_STATUS_FILTERS } from '../constants'
import { HISTORY_TRANSACTIONS } from '../mocks/history.mock'
import type { HistoryKindFilter, StatusFilterId, YearMonth } from '../types'
import {
  currentYearMonth,
  formatDayHeading,
  formatMonthLabel,
  isInMonth,
  matchesStatusFilter,
  sameMonth,
  summarizeDays,
  summarizeMonth,
  toDateKey,
} from '../utils/coinFlow'

/**
 * useTransactionHistoryScreen — 거래내역 탭의 월·유형·날짜 탐색.
 * 충전·환전과 월 집계 API가 없어 모의 원장으로 화면을 채운다.
 */
export function useTransactionHistoryScreen() {
  const { push } = useFlow()
  const [month, setMonth] = useState<YearMonth>(() => currentYearMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [kind, setKind] = useState<HistoryKindFilter>('ALL')
  const [statuses, setStatuses] = useState<StatusFilterId[]>(ALL_STATUS_FILTERS)

  const [filterOpen, setFilterOpen] = useState(false)
  const [monthPickerOpen, setMonthPickerOpen] = useState(false)
  const [pickerTarget, setPickerTarget] = useState<'committed' | 'draft'>('committed')

  const [draftKind, setDraftKind] = useState<HistoryKindFilter>('ALL')
  const [draftStatuses, setDraftStatuses] = useState<StatusFilterId[]>(ALL_STATUS_FILTERS)
  const [draftMonth, setDraftMonth] = useState<YearMonth>(month)

  const monthItems = useMemo(
    () => HISTORY_TRANSACTIONS.filter((item) => isInMonth(item.occurredAt, month)),
    [month],
  )

  const summary = useMemo(() => summarizeMonth(monthItems), [monthItems])

  const filteredItems = useMemo(() => {
    return monthItems
      .filter((item) => {
        if (kind !== 'ALL' && item.kind !== kind) return false
        if (!matchesStatusFilter(item.status, statuses)) return false
        if (selectedDate && toDateKey(item.occurredAt) !== selectedDate) return false
        return true
      })
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
  }, [kind, monthItems, selectedDate, statuses])

  const calendarItems = useMemo(() => {
    return monthItems.filter((item) => {
      if (kind !== 'ALL' && item.kind !== kind) return false
      return matchesStatusFilter(item.status, statuses)
    })
  }, [kind, monthItems, statuses])

  const dailySummary = useMemo(() => summarizeDays(calendarItems), [calendarItems])

  const filterActive = kind !== 'ALL' || statuses.length !== ALL_STATUS_FILTERS.length

  const openFilter = useCallback(() => {
    setDraftKind(kind)
    setDraftStatuses(statuses)
    setDraftMonth(month)
    setFilterOpen(true)
  }, [kind, month, statuses])

  const openMonthPicker = useCallback((target: 'committed' | 'draft') => {
    setPickerTarget(target)
    setMonthPickerOpen(true)
  }, [])

  const handleMonthTitleClick = useCallback(() => {
    if (selectedDate) {
      setSelectedDate(null)
      return
    }
    openMonthPicker('committed')
  }, [openMonthPicker, selectedDate])

  const handleMonthSelect = useCallback(
    (next: YearMonth) => {
      if (pickerTarget === 'draft') {
        setDraftMonth(next)
      } else {
        setMonth(next)
        setSelectedDate(null)
      }
      setMonthPickerOpen(false)
    },
    [pickerTarget],
  )

  const handleDateSelect = useCallback((dateKey: string) => {
    setSelectedDate((current) => (current === dateKey ? null : dateKey))
  }, [])

  const handleDraftStatusChange = useCallback((id: StatusFilterId, checked: boolean) => {
    setDraftStatuses((current) => {
      if (checked) return current.includes(id) ? current : [...current, id]
      return current.filter((item) => item !== id)
    })
  }, [])

  const resetDraft = useCallback(() => {
    setDraftKind('ALL')
    setDraftStatuses(ALL_STATUS_FILTERS)
    setDraftMonth(currentYearMonth())
  }, [])

  const applyDraft = useCallback(() => {
    const monthChanged = !sameMonth(month, draftMonth)
    setKind(draftKind)
    setStatuses(draftStatuses)
    setMonth(draftMonth)
    if (monthChanged) setSelectedDate(null)
    setFilterOpen(false)
  }, [draftKind, draftMonth, draftStatuses, month])

  const openAnalysis = useCallback(() => {
    push(
      'TransactionAnalysis',
      { year: String(month.year), month: String(month.month) },
      { animate: true },
    )
  }, [month.month, month.year, push])

  const openDetail = useCallback(
    (transactionId: string) => {
      push('TransactionDetail', { transactionId }, { animate: true })
    },
    [push],
  )

  const monthOnlyLabel = `${month.month}월`
  const listHeading = selectedDate
    ? `${formatDayHeading(selectedDate)} · ${filteredItems.length}건`
    : `${monthOnlyLabel} 전체 · ${filteredItems.length}건`

  const emptyMessage = selectedDate
    ? '이 날에는 거래가 없어요'
    : kind !== 'ALL' || statuses.length !== ALL_STATUS_FILTERS.length
      ? '조건에 맞는 거래가 없어요'
      : '이 달에는 거래가 없어요'

  const pickerMonth = pickerTarget === 'draft' ? draftMonth : month

  return {
    month,
    monthLabel: formatMonthLabel(month),
    selectedDate,
    kind,
    summary,
    dailySummary,
    items: filteredItems,
    listHeading,
    emptyMessage,
    filterActive,
    filterOpen,
    monthPickerOpen,
    draftKind,
    draftStatuses,
    draftMonth,
    pickerMonth,
    setKind,
    setFilterOpen,
    setMonthPickerOpen,
    openFilter,
    openMonthPicker,
    handleMonthTitleClick,
    handleMonthSelect,
    handleDateSelect,
    handleDraftStatusChange,
    setDraftKind,
    resetDraft,
    applyDraft,
    openAnalysis,
    openDetail,
  }
}

export type TransactionHistoryScreenModel = ReturnType<typeof useTransactionHistoryScreen>
