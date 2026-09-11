/**
 * TradePaymentSellerWaitingScreen — 구매자 입금 대기 (WaitingState B).
 */
import { useEffect, useState } from 'react'
import { VStack } from '@seed-design/react'
import { useLoading } from 'react-simplikit'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { preloadLottieAsset } from '../../../assets/lottie/lottieRegistry'
import { ApngPlayer } from '../../../shared/components/ApngPlayer'
import { TextLinkButton } from '../../../shared/components/TextLinkButton'
import { formatAmount, formatCoinUnit } from '../../../shared/utils/formatAmount'
import { showSnackbar } from '../../../shared/utils/showSnackbar'
import {
  getPaymentSellerWaitingCancelLabel,
  getPaymentSellerWaitingDescriptionLines,
  getPaymentSellerWaitingInfoCta,
  getPaymentSellerWaitingTimerCaption,
  getPaymentSellerWaitingTitle,
} from '../copy'
import { MOTION_ASSETS } from '../constants/motionAssets'
import { WAITING_APNG_HERO_SIZE } from '../constants/waitingHero'
import { usePaymentCountdown } from '../hooks/usePaymentCountdown'
import { useTradeDetail } from '../hooks/useTradeDetail'
import type { TradeDetailViewModel } from '../types'
import { TradeCancelAlertDialog } from './TradeCancelAlertDialog'
import { TradePaymentInfoSheet } from './TradePaymentInfoSheet'
import { UserSummary } from './UserSummary'
import { WaitingStateLayout } from './WaitingStateLayout'

const waitingPaymentAsset = MOTION_ASSETS.waitingPayment

interface TradePaymentSellerWaitingScreenProps {
  trade: TradeDetailViewModel
  onCancelled: () => void
}

export function TradePaymentSellerWaitingScreen({
  trade,
  onCancelled,
}: TradePaymentSellerWaitingScreenProps) {
  const countdown = usePaymentCountdown(trade.paymentDeadline)
  const { cancelTrade } = useTradeDetail(trade.id)
  const snackbar = useSnackbarAdapter()
  const [loading, startLoading] = useLoading()
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [infoSheetOpen, setInfoSheetOpen] = useState(false)

  // 다음 단계(입금 확인) Lottie 워밍
  useEffect(() => {
    preloadLottieAsset('britBankMobileNotification')
  }, [])

  const canCancel = trade.actions.includes('CANCEL')
  const buyerNickname = trade.counterpartyNickname

  const countdownLabel = trade.paymentDeadline
    ? countdown.isExpired
      ? '입금 시간이 지났어요'
      : `${countdown.remainingLabel} 남음`
    : null

  const amountLine = `${formatCoinUnit(trade.coinAmount)} · ${formatAmount(trade.amountKrw)}`
  const waitingHeroSrc =
    waitingPaymentAsset.type === 'apng' ? waitingPaymentAsset.src : ''

  const handleConfirmCancel = async () => {
    try {
      await startLoading(cancelTrade())
      onCancelled()
    } catch {
      showSnackbar(snackbar, '거래를 취소하지 못했어요.', 'critical')
    }
  }

  return (
    <>
      <WaitingStateLayout
        illustration={
          <ApngPlayer src={waitingHeroSrc} size={WAITING_APNG_HERO_SIZE} alt="" />
        }
        title={getPaymentSellerWaitingTitle()}
        descriptionLines={getPaymentSellerWaitingDescriptionLines(buyerNickname)}
        countdownLabel={countdownLabel}
        countdownTone={
          countdown.isExpired || countdown.isUrgent ? 'warning' : 'informative'
        }
        timeoutCaption={
          countdown.isExpired ? null : getPaymentSellerWaitingTimerCaption()
        }
        counterparty={
          <UserSummary nicknameMasked={buyerNickname} detail="입금 대기 중" />
        }
        amountLine={amountLine}
        footerExtra={
          <VStack width="full" align="center" py="x2">
            <TextLinkButton tone="neutral" onClick={() => setInfoSheetOpen(true)}>
              {getPaymentSellerWaitingInfoCta()}
            </TextLinkButton>
          </VStack>
        }
        cancelLabel={canCancel ? getPaymentSellerWaitingCancelLabel() : undefined}
        cancelDisabled={loading}
        onCancel={canCancel ? () => setCancelDialogOpen(true) : undefined}
      />

      <TradePaymentInfoSheet
        open={infoSheetOpen}
        onOpenChange={setInfoSheetOpen}
        trade={trade}
      />

      <TradeCancelAlertDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        variant="trade"
        splitContext={
          trade.splitLegIndex && trade.splitTotalLegs
            ? { legIndex: trade.splitLegIndex, totalLegs: trade.splitTotalLegs }
            : undefined
        }
        onConfirm={() => {
          void handleConfirmCancel()
        }}
      />
    </>
  )
}
