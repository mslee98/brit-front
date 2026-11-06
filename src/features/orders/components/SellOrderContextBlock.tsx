/**
 * SellOrderContextBlock — 판매 상세 하단 맥락 블록. 상황에 맞는 한 가지만 노출한다.
 * 알림 미설정 → 알림 카드 / 첫 판매 → 진행 3단계 / 그 외 → 거래소 카드 미리보기.
 */
import { Box, HStack, Text, VStack } from '@seed-design/react'

import { MarketListingCard } from '../../market/components/MarketListingCard'
import type { MarketSellerDto } from '../../market/types'
import { PushEnableCard } from '../../pwa/components/PushEnableCard'
import {
  PUSH_ENABLE_SELL_EMPTY_COPY,
  PUSH_ENABLE_SELL_PENDING_COPY,
} from '../../pwa/constants/pushNotificationCopy'
import { usePushNotification } from '../../pwa/hooks/usePushNotification'
import type { SellOrderDto } from '../types'
import {
  SELL_GUIDE_STEPS,
  SELL_GUIDE_TITLE,
  SELL_PREVIEW_HINT,
  SELL_PREVIEW_TITLE,
} from '../utils/sellOrderDetailCopy'

interface SellOrderContextBlockProps {
  order: SellOrderDto
  hasPendingRequest: boolean
  sellerProfile: MarketSellerDto | null
}

function isListedOnMarket(order: SellOrderDto): boolean {
  return (
    (order.status === 'OPEN' || order.status === 'PARTIALLY_MATCHED') &&
    Number(order.amount.remaining) > 0
  )
}

export function SellOrderContextBlock({
  order,
  hasPendingRequest,
  sellerProfile,
}: SellOrderContextBlockProps) {
  const { eligibility, requestPermission } = usePushNotification()

  const needsPush = eligibility !== 'ready' && eligibility !== 'unsupported'
  if (needsPush) {
    return (
      <PushEnableCard
        eligibility={eligibility}
        onRequestPermission={requestPermission}
        copy={hasPendingRequest ? PUSH_ENABLE_SELL_PENDING_COPY : PUSH_ENABLE_SELL_EMPTY_COPY}
      />
    )
  }

  if (hasPendingRequest || !sellerProfile) return null

  if (sellerProfile.completedTradeCount === 0) {
    return <SellOrderGuide />
  }

  if (!isListedOnMarket(order)) return null

  return (
    <VStack gap="x3" align="flex-start" width="full">
      <Text textStyle="t5Bold" color="fg.neutral">
        {SELL_PREVIEW_TITLE}
      </Text>
      <Box width="full" aria-hidden style={{ pointerEvents: 'none' }}>
        <MarketListingCard
          item={{
            sellOrderId: order.id,
            seller: sellerProfile,
            remainingCoinAmount: order.amount.remaining,
            minimumTradeAmount: order.amount.minimumTrade,
            createdAt: order.createdAt,
          }}
        />
      </Box>
      <Text textStyle="t3Regular" color="fg.neutralSubtle">
        {SELL_PREVIEW_HINT}
      </Text>
    </VStack>
  )
}

function SellOrderGuide() {
  return (
    <VStack gap="x3" align="flex-start" width="full">
      <Text textStyle="t5Bold" color="fg.neutral">
        {SELL_GUIDE_TITLE}
      </Text>
      <VStack as="ol" gap="x3" width="full" p="x4" borderRadius="r3" bg="bg.neutralWeak" style={{ margin: 0 }}>
        {SELL_GUIDE_STEPS.map((step, index) => (
          <HStack as="li" key={step} gap="x3" align="flex-start" width="full">
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
              width="x5"
              height="x5"
              borderRadius="full"
              bg="bg.neutralSolid"
            >
              <Text textStyle="t2Bold" color="fg.neutralInverted">
                {index + 1}
              </Text>
            </Box>
            <Text textStyle="t4Regular" color="fg.neutral">
              {step}
            </Text>
          </HStack>
        ))}
      </VStack>
    </VStack>
  )
}
