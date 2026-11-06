import type { KeyboardEvent } from 'react'
import { IconChevronRightLine } from '@karrotmarket/react-monochrome-icon'
import { Badge, HStack, Icon, Text } from '@seed-design/react'

import { formatCoinAmount } from '../../../shared/utils/formatAmount'
import { MARKET_BADGE_SELLING } from '../copy'
import type { MarketSellOrderItemDto } from '../types'
import { MarketSellerIdentity } from './MarketSellerIdentity'

interface MarketListingCardProps {
  item: MarketSellOrderItemDto
  disabled?: boolean
  onSelect?: (sellOrderId: string) => void
}

export function MarketListingCard({
  item,
  disabled,
  onSelect,
}: MarketListingCardProps) {
  const selectable = Boolean(onSelect) && !disabled
  const amountKrw = Number(item.remainingCoinAmount)

  const handleClick = () => {
    if (!selectable || !onSelect) return
    onSelect(item.sellOrderId)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!selectable || !onSelect) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(item.sellOrderId)
    }
  }

  return (
    <HStack
      width="full"
      p="x4"
      bg="bg.layerDefault"
      borderWidth="1"
      borderColor="stroke.neutralWeak"
      borderRadius="r4"
      role={selectable ? 'button' : undefined}
      tabIndex={selectable ? 0 : undefined}
      onClick={selectable ? handleClick : undefined}
      onKeyDown={selectable ? handleKeyDown : undefined}
      style={disabled ? { opacity: 0.55 } : undefined}
    >
      <MarketSellerIdentity
        seller={item.seller}
        trailing={
          <HStack gap="x1" align="center" flexShrink={0}>
            <Badge tone="positive" variant="weak" size="medium">
              {MARKET_BADGE_SELLING}
            </Badge>
            {selectable ? (
              <Icon svg={<IconChevronRightLine />} size="x5" color="fg.neutralSubtle" />
            ) : null}
          </HStack>
        }
      >
        <Text textStyle="t6Bold" color="fg.neutral" className="tabular-nums">
          {formatCoinAmount(amountKrw)}
        </Text>
      </MarketSellerIdentity>
    </HStack>
  )
}
