import { VStack } from '@seed-design/react'
import { SegmentedControl } from 'seed-design/ui/segmented-control'

import { TapSegmentedControlItem } from '../../../shared/motion'
import type { TradeSide } from '../types'
import { TradeAmountCard } from './TradeAmountCard'
import { TradeBalanceSummary } from './TradeBalanceSummary'
import { TradeInfoBanner } from './TradeInfoBanner'
import { TradeQuickAmountChips } from './TradeQuickAmountChips'

interface TradeComposeInputProps {
  side: TradeSide
  availableCoin: number
  escrowCoin: number
  amountKrw: number | null
  amountInput: string
  amountError: string | null
  onSideChange: (side: TradeSide) => void
  onAmountInputChange: (value: string) => void
  onQuickAmountSelect: (amount: number) => void
  onSellPercentSelect: (percent: number) => void
}

/** TradeCompose — 잔액·금액 카드·퀵칩·안내 (CTA는 Activity fixedBottom) */
export function TradeComposeInput({
  side,
  availableCoin,
  escrowCoin,
  amountKrw,
  amountInput,
  amountError,
  onSideChange,
  onAmountInputChange,
  onQuickAmountSelect,
  onSellPercentSelect,
}: TradeComposeInputProps) {
  return (
    <VStack gap="x5" width="full" className="trade-compose-body">
      <SegmentedControl
        value={side}
        onValueChange={(value) => onSideChange(value as TradeSide)}
        aria-label="거래 유형"
        className="trade-compose-segmented"
        style={{ width: '100%' }}
      >
        <TapSegmentedControlItem value="BUY">구매</TapSegmentedControlItem>
        <TapSegmentedControlItem value="SELL">판매</TapSegmentedControlItem>
      </SegmentedControl>

      <TradeBalanceSummary
        side={side}
        availableCoin={availableCoin}
        escrowCoin={escrowCoin}
      />

      <TradeAmountCard
        side={side}
        amountKrw={amountKrw}
        amountInput={amountInput}
        amountError={amountError}
        availableCoin={availableCoin}
        onAmountInputChange={onAmountInputChange}
      />

      <TradeQuickAmountChips
        side={side}
        onBuyQuickSelect={onQuickAmountSelect}
        onSellPercentSelect={onSellPercentSelect}
      />

      <TradeInfoBanner side={side} />
    </VStack>
  )
}
