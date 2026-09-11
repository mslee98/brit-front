import { HStack, Text, VStack } from '@seed-design/react'

import { MATCHING_TYPOGRAPHY } from '../constants/matchingTypography'

interface MatchingPendingTimerProps {
  countdownLabel: string
}

export function MatchingPendingTimer({ countdownLabel }: MatchingPendingTimerProps) {
  return (
    <VStack gap="x2" align="center" width="full">
      <HStack
        width="full"
        gap="x3"
        px="x4"
        py="x3"
        bg="bg.informativeWeak"
        borderRadius="r3"
        align="center"
        justify="center"
      >
        <Text textStyle="t4Medium" color="fg.informative">
          응답 대기 중
        </Text>
        <Text
          textStyle={MATCHING_TYPOGRAPHY.heading}
          color="fg.neutral"
          className="tabular-nums"
        >
          {countdownLabel}
        </Text>
      </HStack>
      <Text textStyle={MATCHING_TYPOGRAPHY.helper} color="fg.neutralMuted">
        응답이 없으면 다른 판매자를 자동으로 찾아드려요
      </Text>
    </VStack>
  )
}
