/**
 * SellOrderPurchaseRequestSection — 대기 중인 구매 요청 1건. 요청이 없으면 렌더하지 않는다.
 */
import { Badge, HStack, Text, VStack } from '@seed-design/react'
import { ActionButton } from 'seed-design/ui/action-button'

import { formatCoinAmount } from '../../../shared/utils/formatAmount'
import { formatTradeTrustLine, TRADE_TRUST_EMPTY } from '../../../shared/utils/formatTradeTrust'
import type { TradeRequestDto } from '../types'
import {
  SELL_REQUEST_CTA,
  SELL_REQUEST_FROM_MARKET,
  SELL_REQUEST_REMAINING,
  SELL_REQUEST_TITLE,
} from '../utils/sellOrderDetailCopy'

/** 이 시간 이하로 남으면 카운트다운을 경고색으로 */
const URGENT_REMAINING_SEC = 60

interface SellOrderPurchaseRequestSectionProps {
  pending: TradeRequestDto | null
  remainingSec: number
  onOpenPending?: () => void
}

function formatCountdown(remainSec: number): string {
  const minutes = Math.floor(remainSec / 60)
  const seconds = remainSec % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatBuyerName(nicknameMasked: string): string {
  return nicknameMasked.endsWith('님') ? nicknameMasked : `${nicknameMasked}님`
}

export function SellOrderPurchaseRequestSection({
  pending,
  remainingSec,
  onOpenPending,
}: SellOrderPurchaseRequestSectionProps) {
  if (!pending) return null

  const trustLine =
    formatTradeTrustLine({
      completedTradeCount: pending.buyer.completedTradeCount,
      completionRatePct: pending.buyer.completionRate,
    }) ?? TRADE_TRUST_EMPTY
  const urgent = remainingSec <= URGENT_REMAINING_SEC

  return (
    <VStack gap="x3" align="flex-start" width="full">
      <Text textStyle="t5Bold" color="fg.neutral">
        {SELL_REQUEST_TITLE}
      </Text>

      <VStack
        gap="x4"
        width="full"
        align="flex-start"
        p="x4"
        borderRadius="r3"
        borderWidth={1}
        borderColor="stroke.brandWeak"
        bg="bg.layerDefault"
      >
        <VStack gap="x1" align="flex-start" width="full">
          <HStack width="full" justify="space-between" align="center" gap="x2">
            <Text textStyle="t6Bold" color="fg.neutral" className="tabular-nums">
              {formatCoinAmount(Number(pending.match.coinAmount))}
            </Text>
            {pending.origin === 'MARKET' ? (
              <Badge tone="neutral" variant="weak" size="medium">
                {SELL_REQUEST_FROM_MARKET}
              </Badge>
            ) : null}
          </HStack>
          <Text textStyle="t4Regular" color="fg.neutralMuted">
            {formatBuyerName(pending.buyer.nicknameMasked)} · {trustLine}
          </Text>
        </VStack>

        <HStack width="full" justify="space-between" align="center" gap="x3">
          <Text
            textStyle="t4Medium"
            color={urgent ? 'fg.warning' : 'fg.neutral'}
            className="tabular-nums"
          >
            {SELL_REQUEST_REMAINING(formatCountdown(remainingSec))}
          </Text>
          {onOpenPending ? (
            <ActionButton size="small" variant="brandSolid" onClick={onOpenPending}>
              {SELL_REQUEST_CTA}
            </ActionButton>
          ) : null}
        </HStack>
      </VStack>
    </VStack>
  )
}
