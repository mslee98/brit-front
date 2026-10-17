import { useCallback, useMemo, useState } from 'react'
import { useActivityParams } from '@stackflow/react'

import { HISTORY_TRANSACTIONS } from '../mocks/history.mock'
import type { YearMonth } from '../types'
import {
  absoluteVolume,
  completedAmountByKind,
  currentYearMonth,
  isInMonth,
  shiftMonth,
} from '../utils/coinFlow'

function parseMonth(year: string | undefined, month: string | undefined): YearMonth {
  const fallback = currentYearMonth()
  const parsedYear = Number(year)
  const parsedMonth = Number(month)
  if (!Number.isInteger(parsedYear) || !Number.isInteger(parsedMonth)) return fallback
  if (parsedMonth < 1 || parsedMonth > 12) return fallback
  return { year: parsedYear, month: parsedMonth }
}

/**
 * useTransactionAnalysisScreen — 선택 월의 완료 거래 구성.
 * 지난달 비교도 같은 모의 원장에서 계산한다.
 */
export function useTransactionAnalysisScreen() {
  const params = useActivityParams<'TransactionAnalysis'>()
  const [month, setMonth] = useState<YearMonth>(() => parseMonth(params.year, params.month))
  const [monthPickerOpen, setMonthPickerOpen] = useState(false)

  const monthItems = useMemo(
    () => HISTORY_TRANSACTIONS.filter((item) => isInMonth(item.occurredAt, month)),
    [month],
  )
  const previous = shiftMonth(month, -1)
  const previousItems = useMemo(
    () => HISTORY_TRANSACTIONS.filter((item) => isInMonth(item.occurredAt, previous)),
    [previous],
  )

  const amounts = useMemo(() => completedAmountByKind(monthItems), [monthItems])
  const previousVolume = absoluteVolume(completedAmountByKind(previousItems))

  const handleMonthSelect = useCallback((next: YearMonth) => {
    setMonth(next)
    setMonthPickerOpen(false)
  }, [])

  return {
    month,
    amounts,
    previousVolume,
    monthPickerOpen,
    openMonthPicker: () => setMonthPickerOpen(true),
    setMonthPickerOpen,
    handleMonthSelect,
  }
}
