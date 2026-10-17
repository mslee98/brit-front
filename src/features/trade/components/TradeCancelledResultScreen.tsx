/**
 * TradeCancelledResultScreen — 거래 취소 ResultState (일반/타임아웃/분쟁).
 * 판매자: 반환 Coin + 취소 사유 / 구매자: 취소 사유만.
 */
import { Text, VStack } from '@seed-design/react'

import { ApngPlayer } from '../../../shared/components/ApngPlayer'
import { TextLinkButton } from '../../../shared/components/TextLinkButton'
import { BottomActionButton } from '../../../shared/ui/BottomActionButton'
import { formatCoinUnit } from '../../../shared/utils/formatAmount'
import {
  getTradeCancelledConfirmCta,
  getTradeCancelledDescriptionLines,
  getTradeCancelledReasonBody,
  getTradeCancelledReasonSectionTitle,
  getTradeCancelledReturnedCoinCopy,
  getTradeCancelledTitle,
  getTradeCancelledTransactionsCta,
  resolveTradeCancelVariant,
} from '../copy'
import { MOTION_ASSETS } from '../constants/motionAssets'
import { WAITING_APNG_HERO_SIZE } from '../constants/waitingHero'
import type { TradeDetailViewModel } from '../types'

interface TradeCancelledResultScreenProps {
  trade: TradeDetailViewModel
  onConfirm: () => void
  onOpenTransactions: () => void
}

export function TradeCancelledResultScreen({
  trade,
  onConfirm,
  onOpenTransactions,
}: TradeCancelledResultScreenProps) {
  const variant = resolveTradeCancelVariant(trade.cancellationReason)
  const coinLabel = formatCoinUnit(trade.coinAmount)
  const returnedCoin =
    trade.role === 'SELLER' ? getTradeCancelledReturnedCoinCopy(coinLabel) : null
  const descriptionLines = getTradeCancelledDescriptionLines(variant, trade.role, coinLabel)
  const motionKey = variant === 'dispute' ? 'cancelledDispute' : 'cancelled'
  const motion = MOTION_ASSETS[motionKey]
  const heroSrc = motion.type === 'apng' ? motion.src : ''

  return (
    <VStack
      flexGrow
      minHeight="full"
      px="spacingX.globalGutter"
      pt="spacingY.navToTitle"
      pb="spacingY.screenBottom"
      width="full"
      gap="x0"
    >
      <VStack flexGrow width="full" align="center" gap="x5" py="x2">
        <ApngPlayer src={heroSrc} size={WAITING_APNG_HERO_SIZE} alt="" />

        <VStack gap="x2" width="full" align="center" style={{ maxWidth: 300 }}>
          <Text textStyle="t7Bold" color="fg.neutral" style={{ textAlign: 'center' }}>
            {getTradeCancelledTitle(variant)}
          </Text>
          <VStack gap="x0_5" width="full" align="center">
            {descriptionLines.map((line) => (
              <Text
                key={line}
                textStyle="t4Regular"
                color="fg.neutralMuted"
                style={{ textAlign: 'center' }}
              >
                {line}
              </Text>
            ))}
          </VStack>
        </VStack>

        {returnedCoin ? (
          <VStack
            width="full"
            gap="x1"
            align="flex-start"
            p="x4"
            borderRadius="r4"
            bg="bg.informativeWeak"
          >
            <Text textStyle="t3Regular" color="fg.neutralMuted">
              {returnedCoin.label}
            </Text>
            <Text textStyle="t6Bold" color="fg.neutral" className="tabular-nums">
              {returnedCoin.amountLabel}
            </Text>
            <Text textStyle="t3Regular" color="fg.neutralMuted">
              {returnedCoin.caption}
            </Text>
          </VStack>
        ) : null}

        <VStack
          width="full"
          gap="x2"
          align="flex-start"
          p="x4"
          borderRadius="r4"
          bg="bg.neutralWeak"
        >
          <Text textStyle="t5Bold" color="fg.neutral">
            {getTradeCancelledReasonSectionTitle(variant)}
          </Text>
          <Text textStyle="t4Regular" color="fg.neutralMuted">
            {getTradeCancelledReasonBody(variant, trade.cancellationReason)}
          </Text>
        </VStack>
      </VStack>

      <VStack width="full" gap="x3" align="center" pt="x4">
        <BottomActionButton size="large" variant="brandSolid" onClick={onConfirm}>
          {getTradeCancelledConfirmCta()}
        </BottomActionButton>
        <TextLinkButton tone="brand" onClick={onOpenTransactions}>
          {getTradeCancelledTransactionsCta()}
        </TextLinkButton>
      </VStack>
    </VStack>
  )
}
