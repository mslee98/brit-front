/**
 * PurchaseRequestHeader — 배지 + 결정형 제목 + 보조 문구.
 */
import { Badge, Text, VStack } from '@seed-design/react'

import type { BuyMatchType } from '../../../orders/types'

interface PurchaseRequestHeaderProps {
  coinLabel: string
  nicknameMasked: string
  matchType: BuyMatchType
}

export function PurchaseRequestHeader({
  coinLabel,
  nicknameMasked,
  matchType,
}: PurchaseRequestHeaderProps) {
  const displayName = nicknameMasked.endsWith('님')
    ? nicknameMasked
    : `${nicknameMasked}님`

  return (
    <VStack gap="x2" align="flex-start" width="full">
      {matchType === 'EXACT' && (
        <Badge tone="brand" variant="weak" size="medium">
          정확 매칭
        </Badge>
      )}
      <Text
        as="h2"
        textStyle="t7Bold"
        color="fg.neutral"
        style={{ whiteSpace: 'pre-line' }}
      >
        {`${coinLabel}을\n판매할까요?`}
      </Text>
      <Text textStyle="t4Regular" color="fg.neutralMuted">
        {displayName}이 구매를 요청했어요.
      </Text>
    </VStack>
  )
}
