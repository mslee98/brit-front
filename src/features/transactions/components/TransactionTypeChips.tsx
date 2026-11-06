import { FilterChips, type FilterChipItem } from '../../../shared/ui/FilterChips'
import { HISTORY_KINDS, HISTORY_KIND_CHIP_LABEL } from '../constants'
import type { HistoryKindFilter } from '../types'

interface TransactionTypeChipsProps {
  value: HistoryKindFilter
  onChange: (value: HistoryKindFilter) => void
}

const CHIPS: FilterChipItem<HistoryKindFilter>[] = [
  { id: 'ALL', label: '전체' },
  ...HISTORY_KINDS.map((kind) => ({ id: kind, label: HISTORY_KIND_CHIP_LABEL[kind] })),
]

export function TransactionTypeChips({ value, onChange }: TransactionTypeChipsProps) {
  return <FilterChips items={CHIPS} value={value} onChange={onChange} aria-label="거래 유형" />
}
