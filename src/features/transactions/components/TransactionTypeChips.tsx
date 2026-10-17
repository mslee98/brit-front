import { Chip } from 'seed-design/ui/chip'

import { MotionChipButton } from '../../../shared/motion'
import { HISTORY_KINDS, HISTORY_KIND_CHIP_LABEL } from '../constants'
import type { HistoryKindFilter } from '../types'

interface TransactionTypeChipsProps {
  value: HistoryKindFilter
  onChange: (value: HistoryKindFilter) => void
}

const CHIPS: { id: HistoryKindFilter; label: string }[] = [
  { id: 'ALL', label: '전체' },
  ...HISTORY_KINDS.map((kind) => ({ id: kind, label: HISTORY_KIND_CHIP_LABEL[kind] })),
]

export function TransactionTypeChips({ value, onChange }: TransactionTypeChipsProps) {
  return (
    <div className="tx-chips" role="tablist" aria-label="거래 유형">
      {CHIPS.map((chip) => {
        const selected = value === chip.id
        return (
          <MotionChipButton
            key={chip.id}
            size="medium"
            variant={selected ? 'solid' : 'outlineWeak'}
            className={selected ? 'tx-chip--selected' : undefined}
            aria-pressed={selected}
            onClick={() => onChange(chip.id)}
          >
            <Chip.Label>{chip.label}</Chip.Label>
          </MotionChipButton>
        )
      })}
    </div>
  )
}
