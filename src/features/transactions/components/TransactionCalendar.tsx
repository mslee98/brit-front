import { WEEKDAY_LABELS, buildMonthCells, toDateKeyFromParts } from '../utils/calendar'
import { formatCompactCoinDelta, todayDateKey } from '../utils/coinFlow'
import type { DailyCoinSummary } from '../utils/coinFlow'
import type { YearMonth } from '../types'

interface TransactionCalendarProps {
  month: YearMonth
  selectedDate: string | null
  dailySummary: Map<string, DailyCoinSummary>
  onDateSelect: (dateKey: string) => void
}

export function TransactionCalendar({
  month,
  selectedDate,
  dailySummary,
  onDateSelect,
}: TransactionCalendarProps) {
  const cells = buildMonthCells(month.year, month.month)
  const today = todayDateKey()

  return (
    <div className="tx-cal" role="grid" aria-label={`${month.year}년 ${month.month}월 거래`}>
      {WEEKDAY_LABELS.map((label) => (
        <div key={label} className="tx-cal__weekday" role="columnheader">
          {label}
        </div>
      ))}
      {cells.map((day, index) => {
        if (day == null) return <div key={`empty-${index}`} />

        const dateKey = toDateKeyFromParts(month.year, month.month, day)
        const summary = dailySummary.get(dateKey)
        const selected = selectedDate === dateKey
        const isToday = dateKey === today
        const showNet = summary != null && (summary.inflow > 0 || summary.outflow > 0)
        const showBothDots = summary != null && summary.inflow > 0 && summary.outflow > 0
        const showOpenDot = summary?.hasOpen === true && !showNet
        const className = [
          'tx-cal__cell',
          isToday ? 'tx-cal__cell--today' : '',
          selected ? 'tx-cal__cell--selected' : '',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <button
            key={dateKey}
            type="button"
            className={className}
            aria-pressed={selected}
            aria-label={`${month.month}월 ${day}일`}
            onClick={() => onDateSelect(dateKey)}
          >
            <span className="tx-cal__day">{day}</span>
            {showNet ? (
              <span
                className={`tx-cal__delta ${
                  summary.net > 0 ? 'tx-cal__delta--in' : 'tx-cal__delta--out'
                }`}
              >
                {formatCompactCoinDelta(summary.net)}
              </span>
            ) : (
              <span className="tx-cal__delta" />
            )}
            {showBothDots ? (
              <span className="tx-cal__dots" aria-hidden>
                <span className="tx-cal__dot tx-cal__dot--in" />
                <span className="tx-cal__dot tx-cal__dot--out" />
              </span>
            ) : showOpenDot ? (
              <span className="tx-cal__dots" aria-hidden>
                <span className="tx-cal__dot tx-cal__dot--open" />
              </span>
            ) : (
              <span className="tx-cal__dots" />
            )}
          </button>
        )
      })}
    </div>
  )
}
