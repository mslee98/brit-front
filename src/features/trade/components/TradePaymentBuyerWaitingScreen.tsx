/**
 * TradePaymentBuyerWaitingScreen — 구매자 입금 확인 대기 (PAYMENT_REPORTED).
 * WaitingStateLayout + coinDollarProtect Lottie(loop) + 거래 정보 시트.
 */
import { useCallback, useState } from 'react'
import { Text, VStack } from '@seed-design/react'

import { loadLottieAsset } from '../../../assets/lottie/lottieRegistry'
import { LottiePlayer } from '../../../shared/components/LottiePlayer'
import { TextLinkButton } from '../../../shared/components/TextLinkButton'
import { BottomActionButton } from '../../../shared/ui/BottomActionButton'
import { formatAmount, formatCoinUnit } from '../../../shared/utils/formatAmount'
import {
  getPaymentBuyerWaitingContactLabel,
  getPaymentBuyerWaitingDescriptionLines,
  getPaymentBuyerWaitingDisputeLabel,
  getPaymentBuyerWaitingInfoCta,
  getPaymentBuyerWaitingTimerCaption,
  getPaymentReportedBuyerReassuranceLines,
  getPaymentReportedBuyerStatusLine,
  getPaymentReportedBuyerTitle,
} from '../copy'
import { WAITING_LOTTIE_HERO_SIZE } from '../constants/waitingHero'
import { usePaymentCountdown } from '../hooks/usePaymentCountdown'
import type { TradeDetailViewModel } from '../types'
import { TradePaymentInfoSheet } from './TradePaymentInfoSheet'
import { UserSummary } from './UserSummary'
import { WaitingStateLayout } from './WaitingStateLayout'

interface TradePaymentBuyerWaitingScreenProps {
  trade: TradeDetailViewModel
  onContactSupport?: () => void
  onOpenDispute?: () => void
}

export function TradePaymentBuyerWaitingScreen({
  trade,
  onContactSupport,
  onOpenDispute,
}: TradePaymentBuyerWaitingScreenProps) {
  const countdown = usePaymentCountdown(trade.sellerConfirmDeadline)
  const [infoSheetOpen, setInfoSheetOpen] = useState(false)

  const sellerNickname = trade.counterpartyNickname
  const amountLine = `${formatCoinUnit(trade.coinAmount)} · ${formatAmount(trade.amountKrw)}`
  const deadlineExpired = Boolean(trade.sellerConfirmDeadline) && countdown.isExpired
  const reassuranceLines = getPaymentReportedBuyerReassuranceLines()

  const loadCoinDollarProtect = useCallback(() => loadLottieAsset('coinDollarProtect'), [])

  const countdownLabel = trade.sellerConfirmDeadline
    ? countdown.isExpired
      ? '확인 시간이 지났어요'
      : `${countdown.remainingLabel} 남음`
    : null

  return (
    <>
      <WaitingStateLayout
        illustration={
          <LottiePlayer
            loadAnimation={loadCoinDollarProtect}
            size={WAITING_LOTTIE_HERO_SIZE}
            loop
            autoplay
          />
        }
        title={getPaymentReportedBuyerTitle()}
        descriptionLines={getPaymentBuyerWaitingDescriptionLines()}
        countdownLabel={countdownLabel}
        countdownTone={
          countdown.isExpired || countdown.isUrgent ? 'warning' : 'informative'
        }
        timeoutCaption={
          countdown.isExpired ? null : getPaymentBuyerWaitingTimerCaption()
        }
        counterparty={
          <UserSummary
            nicknameMasked={sellerNickname}
            detail={getPaymentReportedBuyerStatusLine()}
          />
        }
        amountLine={amountLine}
        footerExtra={
          <VStack width="full" gap="x3" align="center">
            <VStack width="full" gap="x0_5" align="center" px="x2">
              {reassuranceLines.map((line) => (
                <Text
                  key={line}
                  textStyle="t3Regular"
                  color="fg.neutralSubtle"
                  style={{ textAlign: 'center' }}
                >
                  {line}
                </Text>
              ))}
            </VStack>
            <VStack width="full" align="center" py="x2">
              <TextLinkButton tone="neutral" onClick={() => setInfoSheetOpen(true)}>
                {getPaymentBuyerWaitingInfoCta()}
              </TextLinkButton>
            </VStack>
            {deadlineExpired ? (
              <VStack width="full" gap="x2">
                {onContactSupport ? (
                  <BottomActionButton
                    size="large"
                    variant="neutralWeak"
                    onClick={onContactSupport}
                  >
                    {getPaymentBuyerWaitingContactLabel()}
                  </BottomActionButton>
                ) : null}
                {onOpenDispute ? (
                  <BottomActionButton
                    size="large"
                    variant="neutralOutline"
                    onClick={onOpenDispute}
                  >
                    {getPaymentBuyerWaitingDisputeLabel()}
                  </BottomActionButton>
                ) : null}
              </VStack>
            ) : null}
          </VStack>
        }
      />

      <TradePaymentInfoSheet
        open={infoSheetOpen}
        onOpenChange={setInfoSheetOpen}
        trade={trade}
      />
    </>
  )
}
