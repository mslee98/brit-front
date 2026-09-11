/**
 * TradePaymentBuyerPendingScreen — 구매자 입금 지시 풀페이지 (PAYMENT_PENDING).
 * 계좌·금액은 페이지에 두고, 바텀시트는 송금 완료 확정에만 쓴다.
 */
import { useEffect, useState } from 'react'
import { IconClockFill, IconILowercaseSerifCircleLine, IconSquare2StackedLine } from '@karrotmarket/react-monochrome-icon'
import { Badge, HStack, Icon, PrefixIcon, Text, VStack } from '@seed-design/react'
import { ActionButton } from 'seed-design/ui/action-button'
import { Callout } from 'seed-design/ui/callout'
import { useLoading } from 'react-simplikit'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { preloadLottieAsset } from '../../../assets/lottie/lottieRegistry'
import { TextLinkButton } from '../../../shared/components/TextLinkButton'
import { BottomActionButton } from '../../../shared/ui/BottomActionButton'
import { SummaryListCard } from '../../../shared/ui/SummaryListCard'
import { formatAmount, formatCoinAmount } from '../../../shared/utils/formatAmount'
import { showSnackbar } from '../../../shared/utils/showSnackbar'
import {
  getPaymentCountdownSummaryLine,
  getPaymentFeeNoneLabel,
  getPaymentFooterReportHint,
  getPaymentPendingCtaLabel,
  getPaymentPendingTitle,
  getPaymentPendingToSeller,
  getPaymentBuyerPendingCancelLabel,
} from '../copy'
import { usePaymentCountdown } from '../hooks/usePaymentCountdown'
import { useTradeDetail } from '../hooks/useTradeDetail'
import type { TradeDetailViewModel } from '../types'
import { copyToClipboard } from '../utils/copyToClipboard'
import {
  getReportPaymentErrorMessage,
  logReportPaymentDev,
  releaseOverlayFocus,
} from '../utils/reportPaymentFeedback'
import { BankAccountSection } from './BankAccountSection'
import { TradePaymentCancelConfirmSheet } from './TradePaymentCancelConfirmSheet'
import { TradePaymentSentConfirmSheet } from './TradePaymentSentConfirmSheet'

interface TradePaymentBuyerPendingScreenProps {
  trade: TradeDetailViewModel
  onCancelled: () => void
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <HStack justify="space-between" align="center" width="full" gap="x3">
      <Text textStyle="t4Regular" color="fg.neutralMuted">
        {label}
      </Text>
      <Text textStyle="t4Medium" color="fg.neutral" className="tabular-nums">
        {value}
      </Text>
    </HStack>
  )
}

export function TradePaymentBuyerPendingScreen({
  trade,
  onCancelled,
}: TradePaymentBuyerPendingScreenProps) {
  const amountLabel = formatAmount(trade.amountKrw)
  const coinLabel = formatCoinAmount(trade.amountKrw)
  const sellerAccount = trade.sellerAccount
  const countdown = usePaymentCountdown(trade.paymentDeadline)
  const { reportPayment, cancelTrade } = useTradeDetail(trade.id)
  const snackbar = useSnackbarAdapter()
  const [loading, startLoading] = useLoading()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)

  // 다음 단계(판매자 확인 대기) Lottie 워밍
  useEffect(() => {
    preloadLottieAsset('coinDollarProtect')
  }, [])

  const canCancel = trade.actions.includes('CANCEL')
  const timerIsWarning = countdown.isUrgent || countdown.isExpired
  const timerLine =
    trade.paymentDeadline && !countdown.isExpired
      ? getPaymentCountdownSummaryLine(
          countdown.remainingClockLabel,
          countdown.deadlineTimeLabel,
        )
      : countdown.isExpired
        ? '입금 시간이 지났어요'
        : null

  const splitLegLabel =
    trade.splitLegIndex && trade.splitTotalLegs
      ? `${trade.splitLegIndex}건 · ${amountLabel}`
      : null

  const handleCopyAccount = async () => {
    if (!sellerAccount) return
    const copied = await copyToClipboard(sellerAccount.accountNumber)
    if (copied) {
      showSnackbar(snackbar, '계좌번호를 복사했어요.')
    } else {
      showSnackbar(snackbar, '복사하지 못했어요.', 'critical')
    }
  }

  const handleCopyAmount = async () => {
    const copied = await copyToClipboard(String(trade.amountKrw))
    if (copied) {
      showSnackbar(snackbar, '금액을 복사했어요.')
    } else {
      showSnackbar(snackbar, '복사하지 못했어요.', 'critical')
    }
  }

  const handleConfirmSent = async () => {
    logReportPaymentDev('start', trade.id, { status: trade.status, version: trade.version })

    try {
      const updated = await startLoading(reportPayment())
      logReportPaymentDev('success', trade.id, {
        status: updated?.status,
        version: updated?.version,
      })
      setConfirmOpen(false)
      releaseOverlayFocus()
    } catch (error) {
      logReportPaymentDev('error', trade.id, {
        message: error instanceof Error ? error.message : String(error),
        status: trade.status,
        version: trade.version,
      })
      showSnackbar(snackbar, getReportPaymentErrorMessage(error), 'critical')
    }
  }

  const handleConfirmCancel = async () => {
    try {
      await startLoading(cancelTrade())
      setCancelConfirmOpen(false)
      onCancelled()
    } catch {
      showSnackbar(snackbar, '거래를 취소하지 못했어요.', 'critical')
    }
  }

  return (
    <>
      <VStack
        flexGrow
        minHeight="full"
        px="spacingX.globalGutter"
        pt="spacingY.navToTitle"
        pb="spacingY.screenBottom"
        width="full"
        gap="x0"
      >
        <VStack flexGrow width="full" gap="x5" align="stretch">
          <VStack gap="x2" width="full" align="flex-start">
            {splitLegLabel && (
              <Badge tone="warning" variant="weak" size="medium">
                {splitLegLabel}
              </Badge>
            )}
            <Text textStyle="t7Bold" color="fg.neutral" className="tabular-nums">
              {getPaymentPendingTitle(amountLabel)}
            </Text>
            <Text textStyle="t4Regular" color="fg.neutralMuted">
              {getPaymentPendingToSeller(trade.counterpartyNickname)}
            </Text>
            {timerLine && (
              <HStack gap="x1" align="center">
                <Icon
                  svg={<IconClockFill />}
                  size="x4"
                  color={timerIsWarning ? 'fg.warning' : 'fg.neutralMuted'}
                />
                <Text
                  textStyle="t4Medium"
                  color={timerIsWarning ? 'fg.warning' : 'fg.neutralMuted'}
                  className="tabular-nums"
                >
                  {timerLine}
                </Text>
              </HStack>
            )}
          </VStack>

          {sellerAccount && (
            <SummaryListCard>
              <VStack gap="x4" width="full" p="x4" align="stretch">
                <BankAccountSection
                  bankName={sellerAccount.bankName}
                  accountNumber={sellerAccount.accountNumber}
                  accountHolder={sellerAccount.holderName}
                  iconUrl={sellerAccount.iconUrl}
                  onCopyAccount={() => {
                    void handleCopyAccount()
                  }}
                />
                <HStack justify="space-between" align="center" width="full" gap="x3">
                  <VStack gap="x0_5" align="flex-start" minWidth="0">
                    <Text textStyle="t4Medium" color="fg.neutralMuted">
                      입금 금액
                    </Text>
                    <Text textStyle="t6Bold" color="fg.neutral" className="tabular-nums">
                      {amountLabel}
                    </Text>
                  </VStack>
                  <ActionButton
                    size="xsmall"
                    variant="neutralWeak"
                    onClick={() => {
                      void handleCopyAmount()
                    }}
                  >
                    <PrefixIcon svg={<IconSquare2StackedLine />} />
                    금액 복사
                  </ActionButton>
                </HStack>
              </VStack>
            </SummaryListCard>
          )}

          <VStack gap="x3" width="full" align="stretch">
            <SummaryRow label="받을 Coin" value={coinLabel} />
            <SummaryRow label="수수료" value={getPaymentFeeNoneLabel()} />
            <SummaryRow label="거래 금액" value={amountLabel} />
          </VStack>

          <Callout
            tone="informative"
            prefixIcon={<IconILowercaseSerifCircleLine />}
            description={getPaymentFooterReportHint(coinLabel)}
          />
        </VStack>

        <VStack gap="x3" width="full" align="stretch" pt="x5">
          <BottomActionButton
            size="large"
            variant="brandSolid"
            disabled={!sellerAccount || loading}
            onClick={() => setConfirmOpen(true)}
          >
            {getPaymentPendingCtaLabel()}
          </BottomActionButton>
          {canCancel && (
            <VStack width="full" align="center">
              <TextLinkButton
                tone="neutral"
                disabled={loading}
                onClick={() => setCancelConfirmOpen(true)}
              >
                {getPaymentBuyerPendingCancelLabel()}
              </TextLinkButton>
            </VStack>
          )}
        </VStack>
      </VStack>

      {sellerAccount && (
        <TradePaymentSentConfirmSheet
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          bankName={sellerAccount.bankName}
          accountNumber={sellerAccount.accountNumber}
          accountHolder={sellerAccount.holderName}
          amountKrw={trade.amountKrw}
          iconUrl={sellerAccount.iconUrl}
          confirmLoading={loading}
          onConfirm={handleConfirmSent}
        />
      )}

      <TradePaymentCancelConfirmSheet
        open={cancelConfirmOpen}
        onOpenChange={setCancelConfirmOpen}
        onReportPayment={() => setConfirmOpen(true)}
        onConfirmCancel={handleConfirmCancel}
      />
    </>
  )
}
