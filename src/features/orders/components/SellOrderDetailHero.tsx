/**
 * SellOrderDetailHero — 등록 완료 / 재진입 Hero.
 */
import { Box, HStack, Text, VStack } from '@seed-design/react'

import { LOTTIE_ASSETS } from '../../../assets/lottie/lottieRegistry'
import { LottiePlayer } from '../../../shared/components/LottiePlayer'

/** 판매 등록 완료 Hero — 가입 완료(240)보다 작게, 상태 칩과 균형 */
const SELL_ORDER_SUCCESS_LOTTIE_SIZE = 120

interface SellOrderDetailHeroProps {
  headline: string
  subline: string
  statusChip: string
  showSuccessCheck: boolean
}

export function SellOrderDetailHero({
  headline,
  subline,
  statusChip,
  showSuccessCheck,
}: SellOrderDetailHeroProps) {
  return (
    <VStack gap="x4" align="center" width="full" pt="x2">
      {showSuccessCheck ? (
        <Box display="flex" alignItems="center" justifyContent="center">
          <LottiePlayer
            animationData={LOTTIE_ASSETS.success}
            size={SELL_ORDER_SUCCESS_LOTTIE_SIZE}
            loop={false}
            autoplay
          />
        </Box>
      ) : null}

      <VStack gap="x2" align="center" width="full">
        <Text textStyle="t7Bold" color="fg.neutral" style={{ textAlign: 'center' }}>
          {headline}
        </Text>
        <Text textStyle="t4Regular" color="fg.neutralMuted" style={{ textAlign: 'center' }}>
          {subline}
        </Text>
      </VStack>

      <HStack
        align="center"
        gap="x1_5"
        px="x3"
        py="x1_5"
        borderRadius="full"
        bg="bg.positiveWeak"
      >
        <Box borderRadius="full" bg="fg.positive" style={{ width: 6, height: 6 }} />
        <Text textStyle="t3Medium" color="fg.positive">
          {statusChip}
        </Text>
      </HStack>
    </VStack>
  )
}
