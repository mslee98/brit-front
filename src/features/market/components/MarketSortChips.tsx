import { HStack } from '@seed-design/react'
import { Chip } from 'seed-design/ui/chip'

import { MotionChipButton } from '../../../shared/motion'
import {
  MARKET_SORT_AMOUNT_ASC,
  MARKET_SORT_AMOUNT_DESC,
  MARKET_SORT_RECENT,
  MARKET_SORT_RECOMMENDED,
} from '../copy'
import type { MarketSortId } from '../types'

interface MarketSortChipsProps {
  value: MarketSortId
  onChange: (sort: MarketSortId) => void
}

const CHIPS: { id: MarketSortId; label: string }[] = [
  { id: 'recommended', label: MARKET_SORT_RECOMMENDED },
  { id: 'amountAsc', label: MARKET_SORT_AMOUNT_ASC },
  { id: 'amountDesc', label: MARKET_SORT_AMOUNT_DESC },
  { id: 'recent', label: MARKET_SORT_RECENT },
]

export function MarketSortChips({ value, onChange }: MarketSortChipsProps) {
  return (
    <HStack
      gap="x2"
      width="full"
      overflowX="auto"
      role="tablist"
      aria-label="정렬"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {CHIPS.map((chip) => {
        const selected = value === chip.id
        return (
          <MotionChipButton
            key={chip.id}
            size="small"
            variant={selected ? 'solid' : 'outlineWeak'}
            aria-pressed={selected}
            onClick={() => onChange(chip.id)}
            style={{ flexShrink: 0 }}
          >
            <Chip.Label>{chip.label}</Chip.Label>
          </MotionChipButton>
        )
      })}
    </HStack>
  )
}
