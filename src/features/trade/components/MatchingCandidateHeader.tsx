import { Box, HStack, Text } from '@seed-design/react'

import { MATCHING_TYPOGRAPHY } from '../constants/matchingTypography'
import type { MatchingDensity } from '../hooks/useMatchingDensity'

interface MatchingCandidateHeaderProps {
  count: number
  density: MatchingDensity
}

export function MatchingCandidateHeader({ count, density }: MatchingCandidateHeaderProps) {
  if (count <= 0) return null

  const showLiveIndicator = density === 'listFocused'

  return (
    <HStack
      width="full"
      py="x2"
      align="center"
      justify="space-between"
      className="matching-candidate-header"
    >
      <Text textStyle={MATCHING_TYPOGRAPHY.rowTitle} color="fg.neutral" className="tabular-nums">
        지금 찾은 거래 {count}개
      </Text>
      {showLiveIndicator ? (
        <HStack gap="x1_5" align="center" flexShrink={0}>
          <Box
            width="6px"
            height="6px"
            borderRadius="full"
            bg="bg.brandSolid"
            flexShrink={0}
            aria-hidden
          />
          <Text textStyle={MATCHING_TYPOGRAPHY.helper} color="fg.neutralMuted">
            실시간 업데이트
          </Text>
        </HStack>
      ) : null}
    </HStack>
  )
}
