import { HStack, Text, VStack } from '@seed-design/react'

import { TRANSACTION_KIND_LABEL, TRANSACTION_KINDS } from '../constants'
import { MonthPickerSheet } from './MonthPickerSheet'
import { MonthSelector } from './MonthSelector'
import {
  absoluteVolume,
  formatCoinVolume,
  formatMonthLabel,
  kindDirection,
} from '../utils/coinFlow'
import { monthComparisonLines } from '../utils/historyCopy'
import type { TransactionKind, YearMonth } from '../types'

/** 들어옴은 브랜드 계열, 나감은 중립 계열 두 톤만 쓴다 */
const BAR_COLOR: Record<TransactionKind, string> = {
  P2P_BUY: 'var(--seed-color-bg-brand-solid)',
  BRIT_PURCHASE: 'var(--seed-color-fg-brand)',
  PARTNER_REDEEM: 'var(--seed-color-stroke-brand-weak)',
  ADMIN_ADJUSTMENT: 'var(--seed-color-bg-brand-weak)',
  P2P_SELL: 'var(--seed-color-fg-neutral)',
  PARTNER_CHARGE: 'var(--seed-color-fg-neutral-subtle)',
}

/** 0이어도 항상 보여 줄 종류. 나머지는 금액이 있을 때만 */
const CORE_KINDS: TransactionKind[] = ['P2P_BUY', 'P2P_SELL', 'PARTNER_CHARGE', 'PARTNER_REDEEM']

interface TransactionAnalysisScreenProps {
  month: YearMonth
  /** null이면 불러오는 중 */
  amounts: Record<TransactionKind, number> | null
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
  const total = amounts ? absoluteVolume(amounts) : 0
  const kinds = TRANSACTION_KINDS.filter(
    (kind) => CORE_KINDS.includes(kind) || (amounts?.[kind] ?? 0) > 0,
  )
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
            {amounts ? formatCoinVolume(total) : '— C'}
          </Text>
          <Text textStyle="t4Regular" color="fg.neutralMuted">
            {comparison.lead}
          </Text>
          <Text textStyle="t5Bold" color="fg.neutral" className="tabular-nums">
            {comparison.rest}
          </Text>
        </VStack>

        <div className="tx-analysis-bar" aria-hidden>
          {kinds.map((kind) =>
            amounts && amounts[kind] > 0 && total > 0 ? (
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
          {kinds.map((kind) => {
            const amount = amounts?.[kind] ?? 0
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
                      {TRANSACTION_KIND_LABEL[kind]}
                    </Text>
                    <Text textStyle="t3Regular" color="fg.neutralSubtle">
                      {kindDirection(kind) === 'IN' ? '들어온 Coin' : '나간 Coin'}
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

        {amounts && total === 0 ? (
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
