/**
 * TradePaymentSellerConfirmScreen — 판매자 입금 확인 (PAYMENT_REPORTED).
 * WaitingStateLayout + britBankMobileNotification Lottie(loop=false) + dual CTA.
 */
import { useCallback, useState } from 'react'
import { HStack, VStack } from '@seed-design/react'
import { useBooleanState, useLoading } from 'react-simplikit'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { loadLottieAsset } from '../../../assets/lottie/lottieRegistry'
import { LottiePlayer } from '../../../shared/components/LottiePlayer'
import { TextLinkButton } from '../../../shared/components/TextLinkButton'
import { BottomActionButton } from '../../../shared/ui/BottomActionButton'
import { formatAmount, formatCoinUnit } from '../../../shared/utils/formatAmount'
import { showSnackbar } from '../../../shared/utils/showSnackbar'
import {
  getPaymentSellerConfirmAcceptLabel,
  getPaymentSellerConfirmDenyLabel,
  getPaymentSellerConfirmDescriptionLines,
  getPaymentSellerConfirmStatusDetail,
  getPaymentSellerConfirmTitle,
  getPaymentSellerWaitingInfoCta,
} from '../copy'
import { CONFIRM_LOTTIE_HERO_SIZE } from '../constants/waitingHero'
import { usePaymentCountdown } from '../hooks/usePaymentCountdown'
import { useTradeDetail } from '../hooks/useTradeDetail'
import type { TradeDetailViewModel } from '../types'
import { DisputePlaceholderBottomSheet } from './DisputePlaceholderBottomSheet'
import { TradePaymentConfirmAlertDialog } from './TradePaymentConfirmAlertDialog'
import { TradePaymentInfoSheet } from './TradePaymentInfoSheet'
import { UserSummary } from './UserSummary'
import { WaitingStateLayout } from './WaitingStateLayout'

interface TradePaymentSellerConfirmScreenProps {
  trade: TradeDetailViewModel
}

export function TradePaymentSellerConfirmScreen({ trade }: TradePaymentSellerConfirmScreenProps) {
  const { confirmPayment, denyPayment } = useTradeDetail(trade.id)
  const snackbar = useSnackbarAdapter()
  const [loading, startLoading] = useLoading()
  const [infoSheetOpen, setInfoSheetOpen] = useState(false)
  const [confirmDialogOpen, openConfirmDialog, closeConfirmDialog] = useBooleanState(false)
  const [denyDialogOpen, openDenyDialog, closeDenyDialog] = useBooleanState(false)
  const [disputeOpen, openDisputeSheet, closeDisputeSheet] = useBooleanState(false)
  const countdown = usePaymentCountdown(trade.sellerConfirmDeadline)

  const buyerNickname = trade.counterpartyNickname
  const amountLine = `${formatCoinUnit(trade.coinAmount)} · ${formatAmount(trade.amountKrw)}`

  const loadBritBankMobileNotification = useCallback(
    () => loadLottieAsset('britBankMobileNotification'),
    [],
  )

  const countdownLabel = trade.sellerConfirmDeadline
    ? countdown.isExpired
      ? '확인 시간이 지났어요'
      : `${countdown.remainingLabel} 남음`
    : null

  const runAction = async (action: () => Promise<unknown>) => {
    try {
      await startLoading(action())
    } catch {
      showSnackbar(snackbar, '요청을 처리하지 못했어요.', 'critical')
      throw new Error('TRADE_ACTION_FAILED')
    }
  }

  return (
    <>
      <WaitingStateLayout
        illustration={
          <LottiePlayer
            loadAnimation={loadBritBankMobileNotification}
            size={CONFIRM_LOTTIE_HERO_SIZE}
            loop={false}
            autoplay
          />
        }
        title={getPaymentSellerConfirmTitle()}
        descriptionLines={getPaymentSellerConfirmDescriptionLines()}
        countdownLabel={countdownLabel}
        countdownTone={countdown.isExpired ? 'warning' : 'informative'}
        counterparty={
          <UserSummary
            nicknameMasked={buyerNickname}
            detail={getPaymentSellerConfirmStatusDetail()}
          />
        }
        amountLine={amountLine}
        footerExtra={
          <VStack width="full" gap="x4" align="center">
            <VStack width="full" align="center" py="x2">
              <TextLinkButton tone="neutral" onClick={() => setInfoSheetOpen(true)}>
                {getPaymentSellerWaitingInfoCta()}
              </TextLinkButton>
            </VStack>
            <HStack gap="x2" width="full">
              <BottomActionButton
                size="large"
                variant="neutralOutline"
                flexGrow
                disabled={loading}
                onClick={openDenyDialog}
              >
                {getPaymentSellerConfirmDenyLabel()}
              </BottomActionButton>
              <BottomActionButton
                size="large"
                variant="brandSolid"
                flexGrow
                loading={loading}
                onClick={openConfirmDialog}
              >
                {getPaymentSellerConfirmAcceptLabel()}
              </BottomActionButton>
            </HStack>
          </VStack>
        }
      />

      <TradePaymentInfoSheet
        open={infoSheetOpen}
        onOpenChange={setInfoSheetOpen}
        trade={trade}
      />

      <TradePaymentConfirmAlertDialog
        open={confirmDialogOpen}
        onOpenChange={(nextOpen) => (nextOpen ? openConfirmDialog() : closeConfirmDialog())}
        variant="confirm"
        onConfirm={() => void runAction(confirmPayment)}
      />

      <TradePaymentConfirmAlertDialog
        open={denyDialogOpen}
        onOpenChange={(nextOpen) => (nextOpen ? openDenyDialog() : closeDenyDialog())}
        variant="deny"
        onConfirm={async () => {
          await runAction(async () => {
            await denyPayment()
            openDisputeSheet()
          })
        }}
      />

      <DisputePlaceholderBottomSheet
        open={disputeOpen}
        onOpenChange={(nextOpen) => (nextOpen ? openDisputeSheet() : closeDisputeSheet())}
        legIndex={trade.splitLegIndex}
        amountKrw={trade.amountKrw}
      />
    </>
  )
}
