import { useEffect, useRef } from 'react'
import { HStack, Text, VStack } from '@seed-design/react'
import { SegmentedControl } from 'seed-design/ui/segmented-control'

import { TapSegmentedControlItem } from '../../../shared/motion'
import type { TransactionView } from '../types'
import { MonthPickerSheet } from './MonthPickerSheet'
import { MonthSelector } from './MonthSelector'
import { MonthlyCoinSummary } from './MonthlyCoinSummary'
import { TransactionCalendar } from './TransactionCalendar'
import { TransactionFilterSheet } from './TransactionFilterSheet'
import { OpenTransactionSection, TransactionList } from './TransactionList'
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
  }, [model.selectedDate])

  return (
    <VStack style={{ paddingBottom: 'var(--app-content-bottom-padding)' }}>
      <MonthSelector
        label={model.monthLabel}
        onTitleClick={() => model.openMonthPicker('committed')}
        onPrev={model.goPrevMonth}
        onNext={model.goNextMonth}
        canGoNext={model.canGoNextMonth}
      />
      <MonthlyCoinSummary summary={model.summary} onOpenAnalysis={model.openAnalysis} />

      {model.openItems.length > 0 ? (
        <>
          <div className="tx-separator" />
          <OpenTransactionSection items={model.openItems} onItemClick={model.openItem} />
        </>
      ) : null}

      <div className="tx-separator" />
      <div className="tx-toolbar">
        <VStack px="spacingX.globalGutter" py="x3">
          <TransactionTypeChips value={model.type} onChange={model.changeType} />
        </VStack>
      </div>

      <div ref={listRef} className="tx-list-anchor">
        <HStack
          align="center"
          justify="space-between"
          gap="x2"
          px="spacingX.globalGutter"
          pt="x2"
        >
          <HStack align="center" gap="x2">
            <Text textStyle="t5Bold" color="fg.neutral">
              {model.listHeading}
            </Text>
            {model.selectedDate ? (
              <button type="button" className="tx-filter-button" onClick={model.clearSelectedDate}>
                <Text textStyle="t4Medium" color="fg.brand">
                  날짜 해제
                </Text>
              </button>
            ) : null}
          </HStack>
          <SegmentedControl
            value={model.view}
            onValueChange={(value) => model.setView(value as TransactionView)}
            aria-label="보기 방식"
            className="tx-view-toggle"
          >
            <TapSegmentedControlItem value="list">목록</TapSegmentedControlItem>
            <TapSegmentedControlItem value="calendar">달력</TapSegmentedControlItem>
          </SegmentedControl>
        </HStack>

        {model.view === 'calendar' ? (
          <VStack px="spacingX.globalGutter" pt="x3" pb="x2">
            <TransactionCalendar
              month={model.month}
              selectedDate={model.selectedDate}
              dailySummary={model.dailySummary}
              onDateSelect={model.handleDateSelect}
            />
          </VStack>
        ) : (
          <TransactionList
            groups={model.groups}
            showDateLabels={!model.selectedDate}
            state={model.listState}
            emptyMessage={model.emptyMessage}
            hasMore={model.hasMore}
            loadingMore={model.loadingMore}
            onLoadMore={model.loadMore}
            onRetry={() => void model.refresh()}
            onItemClick={model.openItem}
          />
        )}
      </div>

      <TransactionFilterSheet
        open={model.filterOpen}
        type={model.draftType}
        statuses={model.draftStatuses}
        month={model.draftMonth}
        onOpenChange={model.setFilterOpen}
        onTypeChange={model.setDraftType}
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
