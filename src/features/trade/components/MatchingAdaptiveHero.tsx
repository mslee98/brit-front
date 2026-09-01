import { Box, HStack, Text, VStack } from '@seed-design/react'
import { ProgressCircle } from 'seed-design/ui/progress-circle'

import { formatCoinAmount } from '../../../shared/utils/formatAmount'
import { MATCHING_TYPOGRAPHY } from '../constants/matchingTypography'
import type { MatchingHeroMode } from '../hooks/useMatchingHeroMode'
import { MATCHING_HERO_APNG_SIZE } from '../hooks/useMatchingHeroMode'
import { MatchingPendingTimer } from './MatchingPendingTimer'
import { TradeMotion } from './TradeMotion'

interface MatchingAdaptiveHeroProps {
  heroMode: MatchingHeroMode
  title: string
  description?: string
  amountKrw: number
  exactCount: number
  nearCount: number
  isPending: boolean
  countdownLabel?: string
}

function SearchingStatusPill() {
  return (
    <HStack
      gap="x2"
      align="center"
      px="x3"
      py="x2"
      borderRadius="r2"
      borderWidth="1"
      borderColor="stroke.brandWeak"
      className="matching-status-pill"
    >
      <ProgressCircle size="24" tone="brand" />
      <Text textStyle={MATCHING_TYPOGRAPHY.helper} color="fg.brand">
        계속 찾는 중
      </Text>
    </HStack>
  )
}

/**
 * Adaptive Matching Hero
 * - large: 후보 0 — 큰 APNG
 * - compact / medium: 상태 한 줄 (APNG 없음) — 리스트가 주인공
 * - collapsed: 스크롤 sticky
 */
export function MatchingAdaptiveHero({
  heroMode,
  title,
  description,
  amountKrw,
  exactCount,
  nearCount,
  isPending,
  countdownLabel,
}: MatchingAdaptiveHeroProps) {
  const coinLabel = formatCoinAmount(amountKrw)
  const countSummary = `정확 ${exactCount}명 · 가까운 금액 ${nearCount}명`
  const isCompactLike = heroMode === 'compact' || heroMode === 'medium'

  if (heroMode === 'collapsed') {
    return (
      <HStack
        width="full"
        px="spacingX.globalGutter"
        py="x2"
        gap="x2"
        align="center"
        justify="space-between"
        className="matching-hero-collapsed"
        bg="bg.layerDefault"
      >
        <HStack gap="x2" align="center" style={{ minWidth: 0 }}>
          <Box
            width="x2"
            height="x2"
            borderRadius="r1"
            bg="bg.brandSolid"
            flexShrink={0}
            aria-hidden
          />
          <Text textStyle={MATCHING_TYPOGRAPHY.helper} color="fg.neutral" className="tabular-nums">
            계속 찾는 중 · 정확 {exactCount} · 가까운 금액 {nearCount}
          </Text>
        </HStack>
      </HStack>
    )
  }

  if (isCompactLike) {
    return (
      <VStack
        width="full"
        gap="x2"
        px="spacingX.globalGutter"
        pt="x3"
        pb="x2"
        className="matching-hero-compact"
      >
        {isPending ? (
          <VStack gap="x2" align="center" width="full">
            <Text
              as="h1"
              textStyle={MATCHING_TYPOGRAPHY.heading}
              color="fg.neutral"
              style={{ textAlign: 'center' }}
            >
              {title}
            </Text>
            {description && (
              <Text
                textStyle={MATCHING_TYPOGRAPHY.body}
                color="fg.neutralSubtle"
                style={{ textAlign: 'center' }}
              >
                {description}
              </Text>
            )}
            {countdownLabel && <MatchingPendingTimer countdownLabel={countdownLabel} />}
          </VStack>
        ) : (
          <>
            <HStack width="full" justify="space-between" align="center" gap="x3">
              <HStack gap="x2" align="center" style={{ minWidth: 0 }}>
                <ProgressCircle size="24" tone="brand" />
                <Text textStyle={MATCHING_TYPOGRAPHY.helper} color="fg.neutral">
                  {coinLabel} 판매자를 계속 찾는 중
                </Text>
              </HStack>
            </HStack>
            <Text textStyle={MATCHING_TYPOGRAPHY.helper} color="fg.neutralMuted" className="tabular-nums">
              {countSummary}
            </Text>
          </>
        )}
      </VStack>
    )
  }

  // large — empty searching
  return (
    <VStack
      gap="x4"
      width="full"
      flexShrink={0}
      align="center"
      px="spacingX.globalGutter"
      pt="spacingY.navToTitle"
      className="matching-hero-large"
    >
      <Text
        as="h1"
        textStyle={MATCHING_TYPOGRAPHY.heading}
        color="fg.neutral"
        style={{ textAlign: 'center' }}
      >
        {title}
      </Text>

      <Box aria-hidden="true">
        <TradeMotion variant="matchingSearch" size={MATCHING_HERO_APNG_SIZE.large} />
      </Box>

      <SearchingStatusPill />

      {description && (
        <Text
          textStyle={MATCHING_TYPOGRAPHY.body}
          color="fg.neutralSubtle"
          style={{ textAlign: 'center' }}
        >
          {description}
        </Text>
      )}
    </VStack>
  )
}
