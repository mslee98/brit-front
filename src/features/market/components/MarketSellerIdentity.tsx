import type { ReactNode } from 'react'
import { Badge, Box, HStack, Text, VStack } from '@seed-design/react'
import { Avatar } from 'seed-design/ui/avatar'
import { IdentityPlaceholder } from 'seed-design/ui/identity-placeholder'

import { formatTradeTrustLine } from '../../../shared/utils/formatTradeTrust'
import { MARKET_BADGE_NEW, MARKET_BADGE_PREVIOUS } from '../copy'
import type { MarketSellerDto } from '../types'

interface MarketSellerIdentityProps {
  seller: MarketSellerDto
  /** 닉네임 줄 오른쪽 (상태 배지·chevron 등) */
  trailing?: ReactNode
  /** 신뢰 요약이 없을 때 대신 보여 줄 문구. 생략하면 줄을 비운다 */
  emptyStatsText?: string
  /** 신뢰 요약 아래 추가 내용 (금액 등) */
  children?: ReactNode
}

/** 거래소 판매자 정보 — 카드·요청 시트 공용 (아바타 + 닉네임·배지 + 신뢰 요약) */
export function MarketSellerIdentity({
  seller,
  trailing,
  emptyStatsText,
  children,
}: MarketSellerIdentityProps) {
  const statsLine = formatTradeTrustLine(seller) ?? emptyStatsText

  return (
    <HStack gap="x3" align={children ? 'flex-start' : 'center'} width="full">
      <Box flexShrink={0} pt={children ? 'x0_5' : undefined}>
        <Avatar size="36" fallback={<IdentityPlaceholder />} />
      </Box>
      <VStack gap="x2" align="flex-start" flexGrow={1} minWidth="0">
        <VStack gap="x0_5" align="flex-start" width="full">
          <HStack justify="space-between" align="center" width="full" gap="x2">
            <HStack gap="x2" align="center" flexWrap="wrap" minWidth="0">
              <Text textStyle="t5Bold" color="fg.neutral">
                {seller.nickname}
              </Text>
              {seller.hasTradedBefore ? (
                <Badge tone="informative" variant="weak" size="medium">
                  {MARKET_BADGE_PREVIOUS}
                </Badge>
              ) : null}
              {seller.isNewSeller ? (
                <Badge tone="brand" variant="weak" size="medium">
                  {MARKET_BADGE_NEW}
                </Badge>
              ) : null}
            </HStack>
            {trailing}
          </HStack>
          {statsLine ? (
            <Text textStyle="t3Regular" color="fg.neutralMuted">
              {statsLine}
            </Text>
          ) : null}
        </VStack>
        {children}
      </VStack>
    </HStack>
  )
}
