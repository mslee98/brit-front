/**
 * SellOrderList — 거래소·매칭 공용 판매글 리스트.
 * matching 모드만 우선 구현. marketplace는 props 예약.
 */
import { Text } from '@seed-design/react'
import { List } from 'seed-design/ui/list'

import { SellOrderRow, type SellOrderRowProps } from './SellOrderRow'

export type SellOrderListMode = 'matching' | 'marketplace'

export interface SellOrderListItem
  extends Omit<SellOrderRowProps, 'onSelect' | 'animate' | 'disabled'> {
  id: string
}

interface SellOrderListProps {
  mode: SellOrderListMode
  items: SellOrderListItem[]
  emptyMessage?: string
  animate?: boolean
  disabled?: boolean
  onSelect?: (id: string) => void
}

export function SellOrderList({
  mode,
  items,
  emptyMessage = '아직 조건에 맞는 판매자가 없어요',
  animate = false,
  disabled,
  onSelect,
}: SellOrderListProps) {
  void mode

  if (items.length === 0) {
    return (
      <Text textStyle="t4Regular" color="fg.neutralMuted" style={{ padding: '16px 0' }}>
        {emptyMessage}
      </Text>
    )
  }

  return (
    <List>
      {items.map((item) => (
        <SellOrderRow
          key={item.id}
          {...item}
          animate={animate}
          disabled={disabled}
          onSelect={onSelect ? () => onSelect(item.id) : undefined}
        />
      ))}
    </List>
  )
}
