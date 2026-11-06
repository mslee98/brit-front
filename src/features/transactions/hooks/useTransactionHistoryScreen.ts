/**
 * useTransactionHistoryScreen
 *
 * 책임: 월·날짜·유형·상태 조건, 월 요약(카드·달력), 목록 첫 페이지·더 보기,
 *       목록/달력 전환, 진행 중 묶음, 행 이동(진행 중 P2P → 거래 화면), 화면 복귀 시 새로고침
 * 비책임: 행·달력 UI (→ components/*), 집계 계산 (→ GET /v1/me/transactions/summary)
 *
 * @see docs/domains/transactions.md
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useActivity, useFlow } from '@stackflow/react'

import {
  fetchTransactionSummary,
  listTransactions,
} from '../api/transactions.api'
import { ALL_STATUS_FILTERS, TRANSACTION_PAGE_SIZE } from '../constants'
import type {
  StatusFilterId,
  TransactionFilter,
  TransactionItem,
  TransactionSummary,
  TransactionTypeFilter,
  TransactionView,
  YearMonth,
} from '../types'
import {
  currentYearMonth,
  formatDateKeyLabel,
  formatMonthLabel,
  isAfterMonth,
  isOpenStatus,
  sameMonth,
  shiftMonth,
  toMonthKey,
} from '../utils/coinFlow'
import { groupTransactionsByDate } from '../utils/historyCopy'

type LoadState = 'loading' | 'ready' | 'error'

export function useTransactionHistoryScreen() {
  const { push } = useFlow()
  const [month, setMonth] = useState<YearMonth>(() => currentYearMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [type, setType] = useState<TransactionTypeFilter>('ALL')
  const [statuses, setStatuses] = useState<StatusFilterId[]>(ALL_STATUS_FILTERS)
  const [view, setView] = useState<TransactionView>('list')

  const [filterOpen, setFilterOpen] = useState(false)
  const [monthPickerOpen, setMonthPickerOpen] = useState(false)
  const [pickerTarget, setPickerTarget] = useState<'committed' | 'draft'>('committed')
  const [draftType, setDraftType] = useState<TransactionTypeFilter>('ALL')
  const [draftStatuses, setDraftStatuses] = useState<StatusFilterId[]>(ALL_STATUS_FILTERS)
  const [draftMonth, setDraftMonth] = useState<YearMonth>(month)

  const [monthSummary, setMonthSummary] = useState<TransactionSummary | null>(null)
  const [filteredSummary, setFilteredSummary] = useState<TransactionSummary | null>(null)
  const [items, setItems] = useState<TransactionItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  /** 첫 페이지가 도착한 조건. 지금 조건과 다르면 불러오는 중 */
  const [loaded, setLoaded] = useState<{ key: string; state: Exclude<LoadState, 'loading'> } | null>(
    null,
  )
  const [loadingMore, setLoadingMore] = useState(false)
  const listRequestRef = useRef(0)
  const summaryRequestRef = useRef(0)

  const monthKey = toMonthKey(month)
  const filterActive = type !== 'ALL' || statuses.length !== ALL_STATUS_FILTERS.length
  const filter = useMemo<TransactionFilter>(() => ({ type, statuses }), [type, statuses])
  const listKey = `${monthKey}|${selectedDate ?? ''}|${type}|${statuses.join(',')}`
  const listState: LoadState = loaded?.key === listKey ? loaded.state : 'loading'

  const loadSummary = useCallback(() => {
    const requestId = ++summaryRequestRef.current
    const requests = [fetchTransactionSummary(monthKey)]
    if (filterActive) requests.push(fetchTransactionSummary(monthKey, filter))
    return Promise.all(requests)
      .then(([all, filtered]) => {
        if (requestId !== summaryRequestRef.current) return
        setMonthSummary(all)
        setFilteredSummary(filtered ?? all)
      })
      .catch(() => {
        if (requestId !== summaryRequestRef.current) return
        setMonthSummary(null)
        setFilteredSummary(null)
      })
  }, [filter, filterActive, monthKey])

  const loadFirstPage = useCallback(() => {
    const requestId = ++listRequestRef.current
    const key = listKey
    return listTransactions({
      ...filter,
      month: monthKey,
      date: selectedDate ?? undefined,
      size: TRANSACTION_PAGE_SIZE,
    })
      .then((page) => {
        if (requestId !== listRequestRef.current) return
        setItems(page.items)
        setNextCursor(page.nextCursor)
        setLoaded({ key, state: 'ready' })
      })
      .catch(() => {
        if (requestId !== listRequestRef.current) return
        setItems([])
        setNextCursor(null)
        setLoaded({ key, state: 'error' })
      })
  }, [filter, listKey, monthKey, selectedDate])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  useEffect(() => {
    void loadFirstPage()
  }, [loadFirstPage])

  // 거래 화면에서 돌아오면 진행 중이던 건이 끝났을 수 있다
  const { isActive } = useActivity()
  const wasActiveRef = useRef(isActive)
  useEffect(() => {
    if (isActive && !wasActiveRef.current) {
      void loadSummary()
      void loadFirstPage()
    }
    wasActiveRef.current = isActive
  }, [isActive, loadFirstPage, loadSummary])

  const loadMore = useCallback(() => {
    if (!nextCursor || loadingMore) return
    const requestId = listRequestRef.current
    setLoadingMore(true)
    listTransactions({
      ...filter,
      month: monthKey,
      date: selectedDate ?? undefined,
      cursor: nextCursor,
      size: TRANSACTION_PAGE_SIZE,
    })
      .then((page) => {
        if (requestId !== listRequestRef.current) return
        setItems((current) => [...current, ...page.items])
        setNextCursor(page.nextCursor)
      })
      .catch(() => undefined)
      .finally(() => setLoadingMore(false))
  }, [filter, loadingMore, monthKey, nextCursor, selectedDate])

  const refresh = useCallback(
    () => Promise.all([loadSummary(), loadFirstPage()]).then(() => undefined),
    [loadFirstPage, loadSummary],
  )

  /** 날짜를 고르지 않았을 때만 진행 중 건을 위로 올린다 */
  const openItems = useMemo(
    () => (selectedDate ? [] : items.filter((item) => isOpenStatus(item.status))),
    [items, selectedDate],
  )
  const groups = useMemo(() => {
    const rest = selectedDate ? items : items.filter((item) => !isOpenStatus(item.status))
    return groupTransactionsByDate(rest)
  }, [items, selectedDate])

  const dailySummary = useMemo(
    () => new Map((filteredSummary?.byDay ?? []).map((day) => [day.date, day])),
    [filteredSummary],
  )

  const changeMonth = useCallback((next: YearMonth) => {
    if (isAfterMonth(next, currentYearMonth())) return
    setMonth(next)
    setSelectedDate(null)
  }, [])

  const openFilter = useCallback(() => {
    setDraftType(type)
    setDraftStatuses(statuses)
    setDraftMonth(month)
    setFilterOpen(true)
  }, [month, statuses, type])

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
      if (pickerTarget === 'draft') setDraftMonth(next)
      else changeMonth(next)
      setMonthPickerOpen(false)
    },
    [changeMonth, pickerTarget],
  )

  /** 달력에서 고르면 목록으로 돌아와 그날만 보여 준다 */
  const handleDateSelect = useCallback((dateKey: string) => {
    setSelectedDate((current) => (current === dateKey ? null : dateKey))
    setView('list')
  }, [])

  const handleDraftStatusChange = useCallback((id: StatusFilterId, checked: boolean) => {
    setDraftStatuses((current) => {
      if (checked) return current.includes(id) ? current : [...current, id]
      return current.filter((item) => item !== id)
    })
  }, [])

  const resetDraft = useCallback(() => {
    setDraftType('ALL')
    setDraftStatuses(ALL_STATUS_FILTERS)
    setDraftMonth(currentYearMonth())
  }, [])

  const applyDraft = useCallback(() => {
    setType(draftType)
    setStatuses(draftStatuses)
    if (!sameMonth(month, draftMonth)) changeMonth(draftMonth)
    setFilterOpen(false)
  }, [changeMonth, draftMonth, draftStatuses, draftType, month])

  const openAnalysis = useCallback(() => {
    push('TransactionAnalysis', { year: String(month.year), month: String(month.month) }, { animate: true })
  }, [month.month, month.year, push])

  const openItem = useCallback(
    (item: TransactionItem) => {
      if (isOpenStatus(item.status) && item.tradeId) {
        push('Trade', { tradeId: item.tradeId }, { animate: true })
        return
      }
      push('TransactionDetail', { transactionId: item.id }, { animate: true })
    },
    [push],
  )

  const headingCount = selectedDate
    ? (dailySummary.get(selectedDate)?.count ?? items.length)
    : (filteredSummary?.count ?? items.length)
  const listHeading = selectedDate
    ? `${formatDateKeyLabel(selectedDate)} · ${headingCount}건`
    : `${month.month}월 전체 · ${headingCount}건`

  const emptyMessage = selectedDate
    ? '이 날에는 거래가 없어요'
    : filterActive
      ? '조건에 맞는 거래가 없어요'
      : '이 달에는 거래가 없어요'

  return {
    month,
    monthLabel: formatMonthLabel(month),
    canGoNextMonth: !sameMonth(month, currentYearMonth()),
    goPrevMonth: () => changeMonth(shiftMonth(month, -1)),
    goNextMonth: () => changeMonth(shiftMonth(month, 1)),
    selectedDate,
    clearSelectedDate: () => setSelectedDate(null),
    type,
    view,
    setView,
    summary: monthSummary,
    dailySummary,
    openItems,
    groups,
    listState,
    hasMore: nextCursor != null,
    loadingMore,
    loadMore,
    refresh,
    listHeading,
    emptyMessage,
    filterActive,
    filterOpen,
    monthPickerOpen,
    draftType,
    draftStatuses,
    draftMonth,
    pickerMonth: pickerTarget === 'draft' ? draftMonth : month,
    changeType: setType,
    setFilterOpen,
    setMonthPickerOpen,
    openFilter,
    openMonthPicker,
    handleMonthTitleClick,
    handleMonthSelect,
    handleDateSelect,
    handleDraftStatusChange,
    setDraftType,
    resetDraft,
    applyDraft,
    openAnalysis,
    openItem,
  }
}

export type TransactionHistoryScreenModel = ReturnType<typeof useTransactionHistoryScreen>
