import type { KeyboardEvent } from 'react'
import {
  IconChevronRightLine,
  IconWonCircleLine,
} from '@karrotmarket/react-monochrome-icon'
import { Box, HStack, Icon, Text, VStack } from '@seed-design/react'

import { formatCoinAmount } from '../../../shared/utils/formatAmount'
import { MARKET_SUMMARY_AVAILABLE, MARKET_SUMMARY_VALUE } from '../copy'

interface MarketSummaryCardProps {
  availableCoinAmount: string
  availableSellOrderCount: number
  onOrdersClick?: () => void
}

export function MarketSummaryCard({
  availableCoinAmount,
  availableSellOrderCount,
  onOrdersClick,
}: MarketSummaryCardProps) {
  const value = MARKET_SUMMARY_VALUE(
    availableSellOrderCount,
    formatCoinAmount(Number(availableCoinAmount)),
  )
  const clickable = Boolean(onOrdersClick)

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!onOrdersClick) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOrdersClick()
    }
  }

  return (
    <HStack
      width="full"
      gap="x3"
      align="center"
      px="x4"
      py="x3_5"
      borderRadius="r4"
      bg="bg.neutralWeak"
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onOrdersClick}
      onKeyDown={clickable ? handleKeyDown : undefined}
    >
      <Box
        flexShrink={0}
        width="40px"
        height="40px"
        borderRadius="r3"
        bg="bg.brandWeak"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Icon svg={<IconWonCircleLine />} size="x5" color="fg.brand" />
      </Box>
      <VStack gap="x0_5" align="flex-start" flexGrow={1} minWidth="0">
        <Text textStyle="t3Regular" color="fg.neutralMuted">
          {MARKET_SUMMARY_AVAILABLE}
        </Text>
        <Text textStyle="t5Bold" color="fg.neutral" className="tabular-nums">
          {value}
        </Text>
      </VStack>
      {clickable ? (
        <Icon svg={<IconChevronRightLine />} size="x5" color="fg.neutralSubtle" />
      ) : null}
    </HStack>
  )
}
