import { useEffect, useRef } from 'react'
import { VStack } from '@seed-design/react'

import { MonthPickerSheet } from './MonthPickerSheet'
import { MonthSelector } from './MonthSelector'
import { MonthlyCoinSummary } from './MonthlyCoinSummary'
import { TransactionCalendar } from './TransactionCalendar'
import { TransactionFilterSheet } from './TransactionFilterSheet'
import { TransactionList } from './TransactionList'
import { TransactionTypeChips } from './TransactionTypeChips'
import type { TransactionHistoryScreenModel } from '../hooks/useTransactionHistoryScreen'
import '../transaction-history.css'

interface TransactionHistoryScreenProps {
  model: TransactionHistoryScreenModel
}

export function TransactionHistoryScreen({ model }: TransactionHistoryScreenProps) {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (model.selectedDate == null) return
    listRef.current?.scrollIntoView({ block: 'start' })
  }, [model.listHeading, model.selectedDate])

  return (
    <VStack style={{ paddingBottom: 'var(--app-content-bottom-padding)' }}>
      <MonthSelector
        label={model.monthLabel}
        dateSelected={model.selectedDate != null}
        onTitleClick={model.handleMonthTitleClick}
        onOpenPicker={() => model.openMonthPicker('committed')}
      />
      <MonthlyCoinSummary summary={model.summary} onOpenAnalysis={model.openAnalysis} />
      <div className="tx-separator" />
      <VStack px="spacingX.globalGutter" py="x3">
        <TransactionTypeChips value={model.kind} onChange={model.setKind} />
      </VStack>
      <div className="tx-separator" />
      <VStack px="spacingX.globalGutter" py="x3">
        <TransactionCalendar
          month={model.month}
          selectedDate={model.selectedDate}
          dailySummary={model.dailySummary}
          onDateSelect={model.handleDateSelect}
        />
      </VStack>
      <div className="tx-separator" />
      <div ref={listRef}>
        <TransactionList
          heading={model.listHeading}
          items={model.items}
          emptyMessage={model.emptyMessage}
          onItemClick={(item) => model.openDetail(item.id)}
        />
      </div>

      <TransactionFilterSheet
        open={model.filterOpen}
        kind={model.draftKind}
        statuses={model.draftStatuses}
        month={model.draftMonth}
        onOpenChange={model.setFilterOpen}
        onKindChange={model.setDraftKind}
        onStatusChange={model.handleDraftStatusChange}
        onOpenMonthPicker={() => model.openMonthPicker('draft')}
        onReset={model.resetDraft}
        onApply={model.applyDraft}
      />
      <MonthPickerSheet
        open={model.monthPickerOpen}
        year={model.pickerMonth.year}
        month={model.pickerMonth.month}
        onOpenChange={model.setMonthPickerOpen}
        onSelect={model.handleMonthSelect}
      />
    </VStack>
  )
}
