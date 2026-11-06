/**
 * SellOrderList — 거래소·매칭 공용 판매글 리스트.
 * matching: 내 금액 기준 후보 / marketplace: 공개 매도 browse (데이터 소스는 분리).
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

const DEFAULT_EMPTY: Record<SellOrderListMode, string> = {
  matching: '아직 조건에 맞는 판매자가 없어요',
  marketplace: '지금 나와 있는 판매글이 없어요',
}

export function SellOrderList({
  mode,
  items,
  emptyMessage,
  animate = false,
  disabled,
  onSelect,
}: SellOrderListProps) {
  const resolvedEmpty = emptyMessage ?? DEFAULT_EMPTY[mode]

  if (items.length === 0) {
    return (
      <Text textStyle="t4Regular" color="fg.neutralMuted" style={{ padding: '16px 0' }}>
        {resolvedEmpty}
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
