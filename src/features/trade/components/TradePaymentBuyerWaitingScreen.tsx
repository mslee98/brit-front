/**
 * TradePaymentBuyerWaitingScreen — 구매자 입금 확인 대기 (PAYMENT_REPORTED).
 * WaitingStateLayout + coinDollarProtect Lottie(loop) + 거래 정보 시트.
 */
import { useCallback, useState } from 'react'
import { Text, VStack } from '@seed-design/react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { loadLottieAsset } from '../../../assets/lottie/lottieRegistry'
import { LottiePlayer } from '../../../shared/components/LottiePlayer'
import { TextLinkButton } from '../../../shared/components/TextLinkButton'
import { BottomActionButton } from '../../../shared/ui/BottomActionButton'
import { formatAmount, formatCoinUnit } from '../../../shared/utils/formatAmount'
import { showSnackbar } from '../../../shared/utils/showSnackbar'
import {
  getPaymentBuyerWaitingDescriptionLines,
  getPaymentBuyerWaitingDisputeLabel,
  getPaymentBuyerWaitingInfoCta,
  getPaymentBuyerWaitingTimerCaption,
  getPaymentBuyerWaitingWithdrawLabel,
  getPaymentReportedBuyerReassuranceLines,
  getPaymentReportedBuyerStatusLine,
  getPaymentReportedBuyerTitle,
} from '../copy'
import { WAITING_LOTTIE_HERO_SIZE } from '../constants/waitingHero'
import { usePaymentCountdown } from '../hooks/usePaymentCountdown'
import { useTradeDetail } from '../hooks/useTradeDetail'
import type { TradeDetailViewModel } from '../types'
import { TradePaymentConfirmAlertDialog } from './TradePaymentConfirmAlertDialog'
import { TradePaymentInfoSheet } from './TradePaymentInfoSheet'
import { UserSummary } from './UserSummary'
import { WaitingStateLayout } from './WaitingStateLayout'

interface TradePaymentBuyerWaitingScreenProps {
  trade: TradeDetailViewModel
  onOpenDispute?: () => void | Promise<void>
}

export function TradePaymentBuyerWaitingScreen({
  trade,
  onOpenDispute,
}: TradePaymentBuyerWaitingScreenProps) {
  const countdown = usePaymentCountdown(trade.sellerConfirmDeadline)
  const [infoSheetOpen, setInfoSheetOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [disputeLoading, setDisputeLoading] = useState(false)
  const { withdrawPaymentReport } = useTradeDetail(trade.id)
  const snackbar = useSnackbarAdapter()

  const sellerNickname = trade.counterpartyNickname
  const amountLine = `${formatCoinUnit(trade.coinAmount)} · ${formatAmount(trade.amountKrw)}`
  const deadlineExpired = Boolean(trade.sellerConfirmDeadline) && countdown.isExpired
  const reassuranceLines = getPaymentReportedBuyerReassuranceLines()
  const canWithdraw = trade.actions.includes('WITHDRAW_PAYMENT_REPORT')

  const loadCoinDollarProtect = useCallback(() => loadLottieAsset('coinDollarProtect'), [])

  const countdownLabel = trade.sellerConfirmDeadline
    ? countdown.isExpired
      ? '확인 시간이 지났어요'
      : `${countdown.remainingLabel} 남음`
    : null

  const handleWithdrawConfirm = async () => {
    setWithdrawLoading(true)
    try {
      await withdrawPaymentReport()
      setWithdrawOpen(false)
      showSnackbar(snackbar, '입금 신고를 취소했어요.')
    } catch {
      showSnackbar(snackbar, '입금 신고를 취소하지 못했어요.', 'critical')
    } finally {
      setWithdrawLoading(false)
    }
  }

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
            <VStack width="full" align="center" py="x2" gap="x2">
              <TextLinkButton tone="neutral" onClick={() => setInfoSheetOpen(true)}>
                {getPaymentBuyerWaitingInfoCta()}
              </TextLinkButton>
              {canWithdraw ? (
                <TextLinkButton tone="neutral" onClick={() => setWithdrawOpen(true)}>
                  {getPaymentBuyerWaitingWithdrawLabel()}
                </TextLinkButton>
              ) : null}
            </VStack>
            {deadlineExpired ? (
              onOpenDispute ? (
                <BottomActionButton
                  size="large"
                  variant="neutralOutline"
                  onClick={() => setDisputeOpen(true)}
                >
                  {getPaymentBuyerWaitingDisputeLabel()}
                </BottomActionButton>
              ) : null
            ) : null}
          </VStack>
        }
      />

      <TradePaymentInfoSheet
        open={infoSheetOpen}
        onOpenChange={setInfoSheetOpen}
        trade={trade}
      />

      <TradePaymentConfirmAlertDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        variant="withdraw"
        onConfirm={handleWithdrawConfirm}
        deferCloseToConfirm
        confirmLoading={withdrawLoading}
      />

      <TradePaymentConfirmAlertDialog
        open={disputeOpen}
        onOpenChange={setDisputeOpen}
        variant="openDispute"
        deferCloseToConfirm
        confirmLoading={disputeLoading}
        onConfirm={async () => {
          if (!onOpenDispute) return
          setDisputeLoading(true)
          try {
            await onOpenDispute()
            setDisputeOpen(false)
          } catch {
            // 실패 스낵바는 호출부
          } finally {
            setDisputeLoading(false)
          }
        }}
      />
    </>
  )
}
