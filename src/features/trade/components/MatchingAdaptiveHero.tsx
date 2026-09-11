import { Box, HStack, Text, VStack } from '@seed-design/react'

import { MATCHING_TYPOGRAPHY } from '../constants/matchingTypography'
import type { MatchingHeroMode } from '../hooks/useMatchingHeroMode'
import { MATCHING_HERO_APNG_SIZE } from '../hooks/useMatchingHeroMode'
import {
  MATCHING_EMPTY_SEARCHING_DESCRIPTION,
  MATCHING_SEARCHING_STATUS_LINE,
} from '../copy'
import { MatchingPendingTimer } from './MatchingPendingTimer'
import { TradeMotion } from './TradeMotion'

interface MatchingAdaptiveHeroProps {
  heroMode: MatchingHeroMode
  isPending: boolean
  pendingTitle?: string
  pendingDescription?: string
  countdownLabel?: string
}

function LiveDot() {
  return (
    <Box
      width="x2"
      height="x2"
      borderRadius="full"
      bg="bg.brandSolid"
      flexShrink={0}
      aria-hidden
    />
  )
}

/**
 * Adaptive status 영역 — 제목은 MatchingSearchSummary가 담당.
 * - large: 큰 APNG + 찾는 중 카피
 * - medium: 가로 compact banner (small APNG)
 * - compact: PENDING 요청 대기
 * - collapsed: 스크롤 sticky 한 줄
 * - hidden: listFocused — 렌더 없음
 */
export function MatchingAdaptiveHero({
  heroMode,
  isPending,
  pendingTitle,
  pendingDescription,
  countdownLabel,
}: MatchingAdaptiveHeroProps) {
  if (heroMode === 'hidden') return null

  if (heroMode === 'collapsed') {
    return (
      <HStack
        width="full"
        px="spacingX.globalGutter"
        py="x2"
        gap="x2"
        align="center"
        className="matching-hero-collapsed"
        bg="bg.layerDefault"
      >
        <LiveDot />
        <Text textStyle={MATCHING_TYPOGRAPHY.helper} color="fg.neutral">
          {MATCHING_SEARCHING_STATUS_LINE}
        </Text>
      </HStack>
    )
  }

  if (heroMode === 'compact' && isPending) {
    return (
      <VStack
        width="full"
        gap="x2"
        px="spacingX.globalGutter"
        py="x3"
        align="center"
        className="matching-hero-pending"
      >
        {pendingTitle ? (
          <Text
            as="h2"
            textStyle={MATCHING_TYPOGRAPHY.heading}
            color="fg.neutral"
            style={{ textAlign: 'center' }}
          >
            {pendingTitle}
          </Text>
        ) : null}
        {pendingDescription ? (
          <Text
            textStyle={MATCHING_TYPOGRAPHY.body}
            color="fg.neutralSubtle"
            style={{ textAlign: 'center' }}
          >
            {pendingDescription}
          </Text>
        ) : null}
        {countdownLabel ? <MatchingPendingTimer countdownLabel={countdownLabel} /> : null}
      </VStack>
    )
  }

  if (heroMode === 'medium') {
    // MatchingFeed가 이미 globalGutter를 주므로 여기서는 중복 px 금지
    return (
      <HStack
        width="full"
        px="x3"
        py="x3"
        gap="x3"
        align="center"
        borderRadius="r3"
        bg="bg.neutralWeak"
        className="matching-hero-medium"
      >
        <Box aria-hidden flexShrink={0}>
          <TradeMotion variant="matchingSearch" size={MATCHING_HERO_APNG_SIZE.medium} />
        </Box>
        <VStack gap="x0_5" align="flex-start" flexGrow style={{ minWidth: 0 }}>
          <Text textStyle={MATCHING_TYPOGRAPHY.rowTitle} color="fg.neutral">
            {MATCHING_SEARCHING_STATUS_LINE}
          </Text>
          <Text textStyle={MATCHING_TYPOGRAPHY.helper} color="fg.neutralMuted">
            계속 업데이트할게요
          </Text>
        </VStack>
        <LiveDot />
      </HStack>
    )
  }

  // large — empty / discovery
  return (
    <VStack
      gap="x4"
      width="full"
      flexShrink={0}
      align="center"
      px="spacingX.globalGutter"
      pb="x2"
      className="matching-hero-large"
    >
      <Box aria-hidden="true">
        <TradeMotion variant="matchingSearch" size={MATCHING_HERO_APNG_SIZE.large} />
      </Box>

      <VStack gap="x1" align="center" width="full">
        <Text
          textStyle={MATCHING_TYPOGRAPHY.rowTitle}
          color="fg.neutral"
          style={{ textAlign: 'center' }}
        >
          {MATCHING_SEARCHING_STATUS_LINE}
        </Text>
        <Text
          textStyle={MATCHING_TYPOGRAPHY.body}
          color="fg.neutralSubtle"
          style={{ textAlign: 'center' }}
        >
          {MATCHING_EMPTY_SEARCHING_DESCRIPTION}
        </Text>
      </VStack>
    </VStack>
  )
}
