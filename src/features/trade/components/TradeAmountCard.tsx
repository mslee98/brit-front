import { Box, HStack, Text, VStack } from '@seed-design/react'

import { AmountHeroField } from '../../../shared/ui/AmountHeroField'
import {
  formatAmount,
  formatAmountNumber,
  formatCoinUnit,
  krwToCoin,
} from '../../../shared/utils/formatAmount'
import { TRADE_COMPOSE_COPY, TRADE_FEE_KRW } from '../constants/tradeCompose'
import { TRADE_COMPOSE_TYPOGRAPHY } from '../constants/tradeComposeTypography'
import type { TradeSide } from '../types'

interface TradeAmountCardProps {
  side: TradeSide
  amountKrw: number | null
  amountInput: string
  amountError: string | null
  availableCoin: number
  onAmountInputChange: (value: string) => void
}

const t = TRADE_COMPOSE_TYPOGRAPHY

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <HStack justify="space-between" align="center" width="full" gap="x3">
      <Text textStyle={t.rowLabel} color="fg.neutralMuted">
        {label}
      </Text>
      <Text textStyle={t.rowValue} color="fg.neutral" className="tabular-nums">
        {value}
      </Text>
    </HStack>
  )
}

/** 거래 금액 입력 + 수수료/예상 요약 — SEED underline TextField */
export function TradeAmountCard({
  side,
  amountKrw,
  amountInput,
  amountError,
  availableCoin,
  onAmountInputChange,
}: TradeAmountCardProps) {
  const copy = TRADE_COMPOSE_COPY[side]
  const feeLabel = formatAmount(TRADE_FEE_KRW)
  const paymentKrw = amountKrw ?? 0
  const expectedCoin = amountKrw !== null ? krwToCoin(amountKrw) : 0

  const summaryValue =
    side === 'BUY'
      ? formatCoinUnit(expectedCoin)
      : `${formatAmountNumber(availableCoin)} Coin`

  return (
    <VStack
      width="full"
      gap="x4"
      p="x4"
      bg="bg.layerDefault"
      borderWidth="1"
      borderColor="stroke.neutralWeak"
      borderRadius="r4"
      align="stretch"
      className="trade-amount-card"
    >
      <AmountHeroField
        size="large"
        fieldVariant="underline"
        value={amountInput}
        onValueChange={onAmountInputChange}
        placeholder="금액을 입력하세요"
        label={copy.amountLabel}
        labelVisuallyHidden={false}
        suffix="Coin"
        errorMessage={amountError ?? undefined}
        invalid={!!amountError}
        className="trade-amount-card__field"
      />

      <VStack gap="x2" width="full">
        <DetailRow label={copy.moneyLabel} value={formatAmount(paymentKrw)} />
        <DetailRow label="수수료" value={feeLabel} />
      </VStack>

      <Box width="full" height="1px" bg="stroke.neutralMuted" aria-hidden />

      <HStack justify="space-between" align="center" width="full" gap="x3">
        <Text textStyle={t.summaryLabel} color="fg.neutral">
          {copy.resultLabel}
        </Text>
        <Text textStyle={t.summaryValue} color="fg.brand" className="tabular-nums">
          {summaryValue}
        </Text>
      </HStack>
    </VStack>
  )
}
