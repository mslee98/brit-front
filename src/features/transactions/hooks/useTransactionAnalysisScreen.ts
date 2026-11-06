import { useCallback, useEffect, useState } from 'react'
import { useActivityParams } from '@stackflow/react'

import { fetchTransactionSummary } from '../api/transactions.api'
import type { TransactionKind, YearMonth } from '../types'
import { absoluteVolume, currentYearMonth, shiftMonth, toMonthKey } from '../utils/coinFlow'

function parseMonth(year: string | undefined, month: string | undefined): YearMonth {
  const fallback = currentYearMonth()
  const parsedYear = Number(year)
  const parsedMonth = Number(month)
  if (!Number.isInteger(parsedYear) || !Number.isInteger(parsedMonth)) return fallback
  if (parsedMonth < 1 || parsedMonth > 12) return fallback
  return { year: parsedYear, month: parsedMonth }
}

interface AnalysisData {
  monthKey: string
  amounts: Record<TransactionKind, number>
  previousVolume: number
}

/**
 * useTransactionAnalysisScreen — 선택 월의 완료 거래 구성.
 * 이번 달·지난달 요약 API의 종류별 합계를 쓴다.
 */
export function useTransactionAnalysisScreen() {
  const params = useActivityParams<'TransactionAnalysis'>()
  const [month, setMonth] = useState<YearMonth>(() => parseMonth(params.year, params.month))
  const [monthPickerOpen, setMonthPickerOpen] = useState(false)
  const [data, setData] = useState<AnalysisData | null>(null)
  const monthKey = toMonthKey(month)

  useEffect(() => {
    const controller = new AbortController()
    const previousKey = toMonthKey(shiftMonth(month, -1))
    Promise.all([
      fetchTransactionSummary(monthKey, {}, controller.signal),
      fetchTransactionSummary(previousKey, {}, controller.signal),
    ])
      .then(([current, previous]) =>
        setData({
          monthKey,
          amounts: current.byKind,
          previousVolume: absoluteVolume(previous.byKind),
        }),
      )
      .catch(() => undefined)
    return () => controller.abort()
  }, [month, monthKey])

  const handleMonthSelect = useCallback((next: YearMonth) => {
    setMonth(next)
    setMonthPickerOpen(false)
  }, [])

  const current = data?.monthKey === monthKey ? data : null

  return {
    month,
    amounts: current?.amounts ?? null,
    previousVolume: current?.previousVolume ?? 0,
    monthPickerOpen,
    openMonthPicker: () => setMonthPickerOpen(true),
    setMonthPickerOpen,
    handleMonthSelect,
  }
}
