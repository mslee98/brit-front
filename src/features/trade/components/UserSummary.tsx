/**
 * UserSummary — 거래 상대 신뢰 요약 (아바타 + 닉네임 + 거래수·완료율 또는 detail).
 */
import { HStack, Text, VStack } from '@seed-design/react'
import { Avatar } from 'seed-design/ui/avatar'
import { IdentityPlaceholder } from 'seed-design/ui/identity-placeholder'

export interface UserSummaryProps {
  nicknameMasked: string
  /** detail이 없을 때만 사용 */
  completedTradeCount?: number
  completionRate?: number
  /** 지정 시 거래수·완료율 줄 대신 표시 */
  detail?: string
}

export function UserSummary({
  nicknameMasked,
  completedTradeCount,
  completionRate,
  detail,
}: UserSummaryProps) {
  const displayName = nicknameMasked.endsWith('님')
    ? nicknameMasked
    : `${nicknameMasked}님`

  const trustLine =
    detail ??
    (completedTradeCount != null && completionRate != null
      ? `거래 ${completedTradeCount.toLocaleString('ko-KR')}회 · 완료율 ${completionRate}%`
      : null)

  return (
    <HStack
      gap="x3"
      align="center"
      width="full"
      p="x4"
      borderRadius="r3"
      bg="bg.neutralWeak"
    >
      <Avatar size="42" fallback={<IdentityPlaceholder />} />
      <VStack gap="x0_5" align="flex-start" flexGrow minWidth="0">
        <Text textStyle="t5Bold" color="fg.neutral">
          {displayName}
        </Text>
        {trustLine ? (
          <Text textStyle="t3Regular" color="fg.neutralMuted">
            {trustLine}
          </Text>
        ) : null}
      </VStack>
    </HStack>
  )
}
