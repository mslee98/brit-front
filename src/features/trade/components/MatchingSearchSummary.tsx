import { Text, VStack } from '@seed-design/react'

import { formatCoinAmount } from '../../../shared/utils/formatAmount'
import { MATCHING_TYPOGRAPHY } from '../constants/matchingTypography'

interface MatchingSearchSummaryProps {
  amountKrw: number
}

export function MatchingSearchSummary({ amountKrw }: MatchingSearchSummaryProps) {
  const coinLabel = formatCoinAmount(amountKrw)

  return (
    <VStack
      width="full"
      px="spacingX.globalGutter"
      pt="spacingY.navToTitle"
      pb="x2"
      gap="x1"
      className="matching-search-summary"
    >
      <Text as="h1" textStyle={MATCHING_TYPOGRAPHY.heading} color="fg.neutral">
        {coinLabel}을 찾고 있어요
      </Text>
    </VStack>
  )
}
