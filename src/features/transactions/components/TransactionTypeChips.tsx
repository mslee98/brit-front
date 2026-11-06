import { FilterChips, type FilterChipItem } from '../../../shared/ui/FilterChips'
import { TRANSACTION_TYPE_FILTERS } from '../constants'
import type { TransactionTypeFilter } from '../types'

interface TransactionTypeChipsProps {
  value: TransactionTypeFilter
  onChange: (value: TransactionTypeFilter) => void
}

const CHIPS: FilterChipItem<TransactionTypeFilter>[] = TRANSACTION_TYPE_FILTERS

export function TransactionTypeChips({ value, onChange }: TransactionTypeChipsProps) {
  return <FilterChips items={CHIPS} value={value} onChange={onChange} aria-label="거래 유형" />
}
