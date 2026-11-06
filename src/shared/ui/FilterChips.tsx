import { Chip } from 'seed-design/ui/chip'

import { MotionChipButton } from '../motion'
import './filter-chips.css'

export interface FilterChipItem<T extends string> {
  id: T
  label: string
}

interface FilterChipsProps<T extends string> {
  items: readonly FilterChipItem<T>[]
  value: T
  onChange: (value: T) => void
  'aria-label': string
}

/** 목록 상단 단일 선택 필터 (가로 스크롤) */
export function FilterChips<T extends string>({
  items,
  value,
  onChange,
  'aria-label': ariaLabel,
}: FilterChipsProps<T>) {
  return (
    <div className="filter-chips" role="tablist" aria-label={ariaLabel}>
      {items.map((chip) => {
        const selected = value === chip.id
        return (
          <MotionChipButton
            key={chip.id}
            size="medium"
            variant={selected ? 'solid' : 'outlineWeak'}
            className={selected ? 'filter-chip--selected' : undefined}
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
