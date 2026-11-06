import { HStack } from '@seed-design/react'
import { Chip } from 'seed-design/ui/chip'

import { MotionChipButton } from '../../../shared/motion'
import { MARKET_MODE_BUY, MARKET_MODE_SELL } from '../copy'
import type { MarketMode } from '../types'

interface MarketModeChipsProps {
  value: MarketMode
  onChange: (mode: MarketMode) => void
}

export function MarketModeChips({ value, onChange }: MarketModeChipsProps) {
  return (
    <HStack gap="x2" width="full" role="tablist" aria-label="거래소 모드">
      <MotionChipButton
        size="medium"
        variant={value === 'buy' ? 'solid' : 'outlineWeak'}
        aria-pressed={value === 'buy'}
        onClick={() => onChange('buy')}
        style={{ flex: 1, justifyContent: 'center' }}
      >
        <Chip.Label>{MARKET_MODE_BUY}</Chip.Label>
      </MotionChipButton>
      <MotionChipButton
        size="medium"
        variant={value === 'sell' ? 'solid' : 'outlineWeak'}
        aria-pressed={value === 'sell'}
        onClick={() => onChange('sell')}
        style={{ flex: 1, justifyContent: 'center' }}
      >
        <Chip.Label>{MARKET_MODE_SELL}</Chip.Label>
      </MotionChipButton>
    </HStack>
  )
}
