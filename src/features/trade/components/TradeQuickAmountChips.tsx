import { HStack } from '@seed-design/react'
import { Chip } from 'seed-design/ui/chip'

import { MotionChipButton } from '../../../shared/motion'
import {
  BUY_QUICK_AMOUNTS,
  SELL_QUICK_PERCENTS,
} from '../constants/tradeCompose'
import type { TradeSide } from '../types'

interface TradeQuickAmountChipsProps {
  side: TradeSide
  onBuyQuickSelect: (amount: number) => void
  onSellPercentSelect: (percent: number) => void
}

function formatBuyChipLabel(amount: number): string {
  if (amount >= 10_000 && amount % 10_000 === 0) {
    return `+${amount / 10_000}만`
  }
  return `+${amount.toLocaleString('ko-KR')}`
}

function formatSellChipLabel(percent: number): string {
  return percent === 100 ? '전액' : `${percent}%`
}

/** 구매: 고정 가산 / 판매: 잔액 비율 칩 */
export function TradeQuickAmountChips({
  side,
  onBuyQuickSelect,
  onSellPercentSelect,
}: TradeQuickAmountChipsProps) {
  if (side === 'BUY') {
    return (
      <HStack gap="x2" flexWrap="wrap" width="full">
        {BUY_QUICK_AMOUNTS.map((amount) => (
          <MotionChipButton
            key={amount}
            size="medium"
            variant="outlineWeak"
            onClick={() => onBuyQuickSelect(amount)}
          >
            <Chip.Label className="tabular-nums">{formatBuyChipLabel(amount)}</Chip.Label>
          </MotionChipButton>
        ))}
      </HStack>
    )
  }

  return (
    <HStack gap="x2" flexWrap="wrap" width="full">
      {SELL_QUICK_PERCENTS.map((percent) => (
        <MotionChipButton
          key={percent}
          size="medium"
          variant="outlineWeak"
          onClick={() => onSellPercentSelect(percent)}
        >
          <Chip.Label className="tabular-nums">{formatSellChipLabel(percent)}</Chip.Label>
        </MotionChipButton>
      ))}
    </HStack>
  )
}
