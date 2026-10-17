import { HStack, Text, VStack } from '@seed-design/react'

import { HISTORY_KIND_LABEL, HISTORY_KINDS } from '../constants'
import { MonthPickerSheet } from './MonthPickerSheet'
import { MonthSelector } from './MonthSelector'
import { absoluteVolume, coinDirection, formatCoinVolume, formatMonthLabel } from '../utils/coinFlow'
import { monthComparisonLines } from '../utils/historyCopy'
import type { HistoryKind, YearMonth } from '../types'

const BAR_COLOR: Record<HistoryKind, string> = {
  USER_PURCHASE: 'var(--seed-color-bg-brand-solid)',
  MERCHANT_REDEEM: 'var(--seed-color-stroke-brand-weak)',
  USER_SALE: 'var(--seed-color-fg-neutral)',
  MERCHANT_CHARGE: 'var(--seed-color-fg-neutral-subtle)',
}

interface TransactionAnalysisScreenProps {
  month: YearMonth
  amounts: Record<HistoryKind, number>
  previousVolume: number
  monthPickerOpen: boolean
  onOpenMonthPicker: () => void
  onMonthPickerOpenChange: (open: boolean) => void
  onMonthSelect: (month: YearMonth) => void
}

export function TransactionAnalysisScreen({
  month,
  amounts,
  previousVolume,
  monthPickerOpen,
  onOpenMonthPicker,
  onMonthPickerOpenChange,
  onMonthSelect,
}: TransactionAnalysisScreenProps) {
  const total = absoluteVolume(amounts)
  const comparison = monthComparisonLines(total, previousVolume)

  return (
    <VStack pb="x8">
      <MonthSelector
        label={formatMonthLabel(month)}
        dateSelected={false}
        onTitleClick={onOpenMonthPicker}
        onOpenPicker={onOpenMonthPicker}
      />

      <VStack px="spacingX.globalGutter" gap="x5" pt="x2">
        <VStack gap="x1">
          <Text textStyle="t4Regular" color="fg.neutralSubtle">
            이번 달 거래
          </Text>
          <Text textStyle="t9Bold" color="fg.neutral" className="tabular-nums">
            {formatCoinVolume(total)}
          </Text>
          <Text textStyle="t4Regular" color="fg.neutralMuted">
            {comparison.lead}
          </Text>
          <Text textStyle="t5Bold" color="fg.neutral" className="tabular-nums">
            {comparison.rest}
          </Text>
        </VStack>

        <div className="tx-analysis-bar" aria-hidden>
          {HISTORY_KINDS.map((kind) =>
            amounts[kind] > 0 && total > 0 ? (
              <div
                key={kind}
                style={{
                  width: `${(amounts[kind] / total) * 100}%`,
                  background: BAR_COLOR[kind],
                }}
              />
            ) : null,
          )}
        </div>

        <VStack gap="x4">
          {HISTORY_KINDS.map((kind) => {
            const amount = amounts[kind]
            const percent = total > 0 ? ((amount / total) * 100).toFixed(1) : '0.0'
            return (
              <HStack key={kind} align="center" justify="space-between" gap="x3">
                <HStack align="center" gap="x2" flexGrow>
                  <span
                    className="tx-cal__dot"
                    style={{ width: 8, height: 8, background: BAR_COLOR[kind] }}
                  />
                  <VStack gap="x0_5">
                    <Text textStyle="t5Medium" color="fg.neutral">
                      {HISTORY_KIND_LABEL[kind]}
                    </Text>
                    <Text textStyle="t3Regular" color="fg.neutralSubtle">
                      {coinDirection(kind) === 'IN' ? '들어온 Coin' : '나간 Coin'}
                    </Text>
                  </VStack>
                </HStack>
                <VStack align="flex-end" gap="x0_5">
                  <Text textStyle="t5Bold" color="fg.neutral" className="tabular-nums">
                    {formatCoinVolume(amount)}
                  </Text>
                  <Text textStyle="t3Regular" color="fg.neutralSubtle" className="tabular-nums">
                    {percent}%
                  </Text>
                </VStack>
              </HStack>
            )
          })}
        </VStack>

        {total === 0 ? (
          <Text textStyle="t4Regular" color="fg.neutralMuted">
            이번 달 완료된 거래가 없어요
          </Text>
        ) : null}
      </VStack>

      <MonthPickerSheet
        open={monthPickerOpen}
        year={month.year}
        month={month.month}
        onOpenChange={onMonthPickerOpenChange}
        onSelect={onMonthSelect}
      />
    </VStack>
  )
}
