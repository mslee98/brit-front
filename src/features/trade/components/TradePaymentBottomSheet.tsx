import { useActivityZIndexBase } from '@seed-design/stackflow'
import { Box, HStack, Portal, Text, VStack } from '@seed-design/react'
import { BottomActionButton } from '../../../shared/ui/BottomActionButton'
import {
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetFooter,
  BottomSheetRoot,
} from 'seed-design/ui/bottom-sheet'

import { BottomSheetScrollArea } from '../../../shared/ui/BottomSheetScrollArea'
import { BottomSheetBottomCTA } from '../../../shared/ui/BottomSheetBottomCTA'
import { getPaymentFooterDismissHint } from '../copy'
import { useTradePaymentSheet } from '../hooks/useTradePaymentSheet'
import type { TradeDetailViewModel } from '../types'
import { DisputePlaceholderBottomSheet } from './DisputePlaceholderBottomSheet'
import { TradeCancelAlertDialog } from './TradeCancelAlertDialog'
import { TradePaymentBuyerPanel } from './TradePaymentBuyerPanel'
import { TradePaymentBuyerWaitingPanel } from './TradePaymentBuyerWaitingPanel'
import { TradePaymentConfirmAlertDialog } from './TradePaymentConfirmAlertDialog'
import { TradeRoomPanel } from './TradeRoomPanel'

interface TradePaymentBottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tradeId: string | null
}

function getSheetTitle(status: string | undefined, role: string | undefined): string {
  if (status === 'COMPLETED') return '거래 완료'
  if (status === 'COIN_TRANSFERRING') return '코인 이전 중'
  if (status === 'DISPUTED') return '분쟁 검토 중'
  if (status === 'PAYMENT_TIMEOUT') return '입금 시간 초과'
  if (status === 'PAYMENT_REPORTED' && role === 'SELLER') return '입금 확인'
  if (status === 'PAYMENT_PENDING' && role === 'BUYER') return '입금하기'
  if (status === 'PAYMENT_PENDING' && role === 'SELLER') return '입금 대기'
  if (status === 'PAYMENT_REPORTED' && role === 'BUYER') return '입금 확인 중'
  return '거래 진행'
}

function isBuyerCompactSheet(trade: TradeDetailViewModel): boolean {
  return (
    (trade.status === 'PAYMENT_PENDING' && trade.role === 'BUYER') ||
    trade.status === 'COIN_TRANSFERRING' ||
    trade.status === 'PAYMENT_TIMEOUT'
  )
}

function renderSheetPanel(
  trade: TradeDetailViewModel,
  callbacks: {
    onAccountCopied: () => void
    onCopyFailed: () => void
  },
  motionMountWhen: boolean,
) {
  if (trade.status === 'PAYMENT_PENDING' && trade.role === 'BUYER') {
    return <TradePaymentBuyerPanel trade={trade} {...callbacks} />
  }
  if (trade.status === 'PAYMENT_REPORTED' && trade.role === 'BUYER') {
    return (
      <TradePaymentBuyerWaitingPanel
        trade={trade}
        motionMountWhen={motionMountWhen}
        {...callbacks}
      />
    )
  }
  return <TradeRoomPanel trade={trade} motionMountWhen={motionMountWhen} {...callbacks} />
}

interface TradeActionButtonsProps {
  trade: TradeDetailViewModel
  loading: boolean
  cancellationStep: 'can_request' | 'agree' | 'report_refund' | 'confirm_refund' | null
  onReportPayment: () => void
  onConfirmPayment: () => void
  onDenyPayment: () => void
  onDismiss: () => void
  onRequestCancel: () => void
  onRequestCancellation: () => void
  onAgreeCancellation: () => void
  onReportRefund: () => void
  onConfirmRefund: () => void
  onMarkUnpaid: () => void
}

function TradeActionButtons({
  trade,
  loading,
  cancellationStep,
  onReportPayment,
  onConfirmPayment,
  onDenyPayment,
  onDismiss,
  onRequestCancel,
  onRequestCancellation,
  onAgreeCancellation,
  onReportRefund,
  onConfirmRefund,
  onMarkUnpaid,
}: TradeActionButtonsProps) {
  const isBuyerPending = trade.status === 'PAYMENT_PENDING' && trade.role === 'BUYER'
  const isSellerReported = trade.status === 'PAYMENT_REPORTED' && trade.role === 'SELLER'
  const isPaymentTimeout = trade.status === 'PAYMENT_TIMEOUT'

  return (
    <VStack gap="x2" width="full">
      {isBuyerPending && (
        <>
          <Text textStyle="t4Regular" color="fg.neutralSubtle">
            {getPaymentFooterDismissHint()}
          </Text>
          <HStack gap="x2" width="full">
            <BottomActionButton
              size="large"
              variant="neutralWeak"
              flexGrow
              disabled={loading}
              onClick={onDismiss}
            >
              아직이에요
            </BottomActionButton>
            <BottomActionButton
              size="large"
              variant="brandSolid"
              flexGrow
              loading={loading}
              onClick={onReportPayment}
            >
              입금했어요
            </BottomActionButton>
          </HStack>
          {trade.actions.includes('CANCEL') && (
            <BottomActionButton
              size="medium"
              variant="neutralWeak"
              flexGrow
              disabled={loading}
              onClick={onRequestCancel}
            >
              거래 취소
            </BottomActionButton>
          )}
        </>
      )}

      {isSellerReported && (
        <>
          <HStack gap="x2" width="full">
            <BottomActionButton
              size="large"
              variant="neutralOutline"
              flexGrow
              loading={loading}
              onClick={onDenyPayment}
            >
              못 받았어요
            </BottomActionButton>
            <BottomActionButton
              size="large"
              variant="brandSolid"
              flexGrow
              loading={loading}
              onClick={onConfirmPayment}
            >
              돈 받았어요
            </BottomActionButton>
          </HStack>
          {/* 쌍방취소 단계별 버튼 (WAITING_SELLER_CONFIRMATION) */}
          {cancellationStep === 'confirm_refund' && (
            <BottomActionButton size="medium" variant="neutralWeak" flexGrow loading={loading} onClick={onConfirmRefund}>
              환불 확인 완료
            </BottomActionButton>
          )}
          {cancellationStep === 'report_refund' && (
            <BottomActionButton size="medium" variant="neutralWeak" flexGrow loading={loading} onClick={onReportRefund}>
              환불했어요
            </BottomActionButton>
          )}
          {cancellationStep === 'agree' && (
            <BottomActionButton size="medium" variant="neutralWeak" flexGrow loading={loading} onClick={onAgreeCancellation}>
              취소 동의하기
            </BottomActionButton>
          )}
          {cancellationStep === 'can_request' && (
            <BottomActionButton size="medium" variant="neutralWeak" flexGrow loading={loading} onClick={onRequestCancellation}>
              취소 요청하기
            </BottomActionButton>
          )}
        </>
      )}

      {isPaymentTimeout && trade.role === 'SELLER' && trade.actions.includes('MARK_UNPAID') && (
        <BottomActionButton
          size="large"
          variant="neutralWeak"
          flexGrow
          loading={loading}
          onClick={onMarkUnpaid}
        >
          미입금 확정
        </BottomActionButton>
      )}

      {!isBuyerPending && !isSellerReported && !isPaymentTimeout && trade.actions.includes('CANCEL') && (
        <BottomActionButton
          size="medium"
          variant="neutralWeak"
          flexGrow
          loading={loading}
          onClick={onRequestCancel}
        >
          거래 취소
        </BottomActionButton>
      )}
    </VStack>
  )
}

export function TradePaymentBottomSheet({
  open,
  onOpenChange,
  tradeId,
}: TradePaymentBottomSheetProps) {
  const layerIndex = useActivityZIndexBase({ activityOffset: 1 })
  const sheet = useTradePaymentSheet({ open, onOpenChange, tradeId })

  if (!sheet.mountedTradeId) return null

  const title = getSheetTitle(sheet.trade?.status, sheet.trade?.role)
  const useCompactLayout = sheet.trade ? isBuyerCompactSheet(sheet.trade) : false

  return (
    <>
      <BottomSheetRoot open={open} onOpenChange={sheet.handleSheetOpenChange}>
        <Portal container={sheet.portalContainerRef}>
          <BottomSheetContent
            title={title}
            layerIndex={layerIndex}
            showHandle
            aria-describedby={undefined}
            className={useCompactLayout ? undefined : 'bottom-sheet-scroll-content'}
          >
            <BottomSheetBody className={useCompactLayout ? undefined : 'bottom-sheet-scroll-body'}>
              {sheet.trade ? (
                useCompactLayout ? (
                  renderSheetPanel(sheet.trade, sheet.copyCallbacks, open)
                ) : (
                  <Box className="bottom-sheet-scroll-viewport" width="full">
                    <BottomSheetScrollArea>
                      {renderSheetPanel(sheet.trade, sheet.copyCallbacks, open)}
                    </BottomSheetScrollArea>
                  </Box>
                )
              ) : null}
            </BottomSheetBody>
            {sheet.showActionFooter && sheet.trade && (
              <BottomSheetFooter>
                <BottomSheetBottomCTA behavior="fixed">
                  <TradeActionButtons
                    trade={sheet.trade}
                    loading={sheet.loading}
                    cancellationStep={sheet.cancellationStep}
                    onReportPayment={sheet.handleReportPayment}
                    onConfirmPayment={sheet.handleConfirmPayment}
                    onDenyPayment={sheet.handleDenyPayment}
                    onDismiss={() => sheet.handleSheetOpenChange(false)}
                    onRequestCancel={sheet.openCancelDialog}
                    onRequestCancellation={sheet.handleRequestCancellation}
                    onAgreeCancellation={sheet.handleAgreeCancellation}
                    onReportRefund={sheet.handleReportRefund}
                    onConfirmRefund={sheet.handleConfirmRefund}
                    onMarkUnpaid={sheet.handleMarkUnpaid}
                  />
                </BottomSheetBottomCTA>
              </BottomSheetFooter>
            )}
            {sheet.trade?.status === 'DISPUTED' && (
              <BottomSheetFooter>
                <BottomSheetBottomCTA behavior="fixed">
                  <BottomActionButton
                    size="large"
                    variant="brandSolid"
                    flexGrow
                    onClick={sheet.openDisputeSheet}
                  >
                    분쟁 안내 보기
                  </BottomActionButton>
                </BottomSheetBottomCTA>
              </BottomSheetFooter>
            )}
            {(sheet.trade?.status === 'COMPLETED' || sheet.trade?.status === 'COIN_TRANSFERRING') && (
              <BottomSheetFooter>
                <BottomSheetBottomCTA behavior="fixed">
                  <BottomActionButton
                    size="large"
                    variant="brandSolid"
                    flexGrow
                    onClick={() => sheet.handleSheetOpenChange(false)}
                  >
                    확인
                  </BottomActionButton>
                </BottomSheetBottomCTA>
              </BottomSheetFooter>
            )}
          </BottomSheetContent>
        </Portal>
      </BottomSheetRoot>

      <TradeCancelAlertDialog
        open={sheet.cancelDialogOpen}
        onOpenChange={(nextOpen) => (nextOpen ? sheet.openCancelDialog() : sheet.closeCancelDialog())}
        variant="trade"
        splitContext={
          sheet.trade?.splitLegIndex && sheet.trade.splitTotalLegs
            ? { legIndex: sheet.trade.splitLegIndex, totalLegs: sheet.trade.splitTotalLegs }
            : undefined
        }
        onConfirm={sheet.handleConfirmCancel}
      />

      <TradePaymentConfirmAlertDialog
        open={sheet.reportDialogOpen}
        onOpenChange={sheet.handleReportDialogOpenChange}
        variant="report"
        deferCloseToConfirm
        confirmLoading={sheet.loading}
        onConfirm={sheet.handleReportPaymentWithFeedback}
      />

      <TradePaymentConfirmAlertDialog
        open={sheet.confirmDialogOpen}
        onOpenChange={(nextOpen) =>
          nextOpen ? sheet.openConfirmDialog() : sheet.closeConfirmDialog()
        }
        variant="confirm"
        onConfirm={() => void sheet.runAction(sheet.confirmPayment)}
      />

      <TradePaymentConfirmAlertDialog
        open={sheet.denyDialogOpen}
        onOpenChange={(nextOpen) => (nextOpen ? sheet.openDenyDialog() : sheet.closeDenyDialog())}
        variant="deny"
        onConfirm={() => {
          void sheet.runAction(async () => {
            await sheet.denyPayment()
            sheet.openDisputeSheet()
          })
        }}
      />

      <DisputePlaceholderBottomSheet
        open={sheet.disputeOpen}
        onOpenChange={(nextOpen) =>
          nextOpen ? sheet.openDisputeSheet() : sheet.closeDisputeSheet()
        }
        legIndex={sheet.trade?.splitLegIndex}
        amountKrw={sheet.trade?.amountKrw}
      />
    </>
  )
}
