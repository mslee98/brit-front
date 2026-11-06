/**
 * MarketSellOrderList — 거래소 카드 리스트 (marketplace 전용).
 */
import { Text, VStack } from '@seed-design/react'

import { MARKET_EMPTY } from '../copy'
import type { MarketSellOrderItemDto } from '../types'
import { MarketListingCard } from './MarketListingCard'

interface MarketSellOrderListProps {
  items: MarketSellOrderItemDto[]
  disabled?: boolean
  onSelect?: (sellOrderId: string) => void
}

export function MarketSellOrderList({
  items,
  disabled,
  onSelect,
}: MarketSellOrderListProps) {
  if (items.length === 0) {
    return (
      <Text textStyle="t4Regular" color="fg.neutralMuted" style={{ padding: '8px 0' }}>
        {MARKET_EMPTY}
      </Text>
    )
  }

  return (
    <VStack gap="x3" width="full">
      {items.map((item) => (
        <MarketListingCard
          key={item.sellOrderId}
          item={item}
          disabled={disabled}
          onSelect={onSelect}
        />
      ))}
    </VStack>
  )
}
