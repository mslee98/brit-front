import { useEffect, useRef, useState } from 'react'
import { useBooleanState, useLoading } from 'react-simplikit'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { useLayoutOverlay } from '../../../app/layouts/useLayoutOverlay'
import { showSnackbar } from '../../../shared/utils/showSnackbar'
import { shouldUseTradesHttpApi } from '../api/trades.api'
import { isPaymentPendingFullPage, isSellerPaymentReportedConfirm } from '../utils/tradeSheetPolicy'
import { useTradeDetail } from './useTradeDetail'

interface UseTradePaymentSheetOptions {
  open: boolean
  onOpenChange: (open: boolean) => void
  tradeId: string | null
}

export function useTradePaymentSheet({ open, onOpenChange, tradeId }: UseTradePaymentSheetOptions) {
  const portalContainerRef = useRef<HTMLElement | null>(
    typeof document !== 'undefined' ? document.getElementById('app-frame-portal') : null,
  )
  const snackbar = useSnackbarAdapter()
  const [loading, startLoading] = useLoading()
  const [cancelDialogOpen, openCancelDialog, closeCancelDialog] = useBooleanState(false)
  const [confirmDialogOpen, openConfirmDialog, closeConfirmDialog] = useBooleanState(false)
  const [denyDialogOpen, openDenyDialog, closeDenyDialog] = useBooleanState(false)
  const [disputeOpen, openDisputeSheet, closeDisputeSheet] = useBooleanState(false)
  const [mountedTradeId, setMountedTradeId] = useState<string | null>(tradeId)

  useEffect(() => {
    if (tradeId) setMountedTradeId(tradeId)
  }, [tradeId])

  useEffect(() => {
    const hasOpenDialog =
      cancelDialogOpen || confirmDialogOpen || denyDialogOpen || disputeOpen

    if (!tradeId && !open && !loading && !hasOpenDialog) {
      setMountedTradeId(null)
    }
  }, [
    cancelDialogOpen,
    confirmDialogOpen,
    denyDialogOpen,
    disputeOpen,
    loading,
    open,
    tradeId,
  ])

  const activeTradeId = mountedTradeId ?? ''
  const {
    trade,
    confirmPayment,
    denyPayment,
    cancelTrade,
    requestCancellation,
    agreeCancellation,
    reportRefund,
    confirmRefund,
    markUnpaid,
  } = useTradeDetail(activeTradeId)
  useLayoutOverlay(open && Boolean(mountedTradeId))

  // 입금 대기/지시: 풀페이지 전용 — 시트가 열려 있으면 닫음
  useEffect(() => {
    if (!open || !trade) return
    if (isPaymentPendingFullPage(trade)) {
      onOpenChange(false)
    }
  }, [onOpenChange, open, trade])

  const runAction = async (action: () => Promise<unknown>) => {
    try {
      await startLoading(action())
    } catch {
      showSnackbar(snackbar, '요청을 처리하지 못했어요.', 'critical')
    }
  }

  const handleConfirmCancel = async () => {
    await runAction(() => cancelTrade())
    closeCancelDialog()
  }

  const handleRequestCancellation = () => {
    void runAction(() => requestCancellation())
  }

  const handleAgreeCancellation = () => {
    void runAction(agreeCancellation)
  }

  const handleReportRefund = () => {
    void runAction(reportRefund)
  }

  const handleConfirmRefund = () => {
    void runAction(confirmRefund)
  }

  const handleMarkUnpaid = () => {
    void runAction(markUnpaid)
  }

  const handleConfirmPayment = () => {
    openConfirmDialog()
  }

  const handleDenyPayment = () => {
    openDenyDialog()
  }

  const handleSheetOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && loading) return
    onOpenChange(nextOpen)
  }

  const copyCallbacks = {
    onAccountCopied: () => showSnackbar(snackbar, '계좌번호를 복사했어요.'),
    onAmountCopied: () => showSnackbar(snackbar, '금액을 복사했어요.'),
    onCopyFailed: () => showSnackbar(snackbar, '복사하지 못했어요.', 'critical'),
  }

  const hasActions =
    trade &&
    trade.status !== 'COMPLETED' &&
    trade.status !== 'DISPUTED' &&
    trade.actions.some((a) => {
      // 구매자 입금 선언 이후에는 일반 거래 취소 CTA를 노출하지 않음
      if (
        a === 'CANCEL' &&
        trade.status === 'PAYMENT_REPORTED' &&
        trade.role === 'BUYER'
      ) {
        return false
      }
      return [
        'CONFIRM_PAYMENT',
        'CANCEL',
        'MARK_UNPAID',
        'REQUEST_CANCELLATION',
        'AGREE_CANCELLATION',
        'REPORT_REFUND',
        'CONFIRM_REFUND',
      ].includes(a)
    })

  const showActionFooter =
    trade &&
    trade.status !== 'COMPLETED' &&
    trade.status !== 'COIN_TRANSFERRING' &&
    !isPaymentPendingFullPage(trade) &&
    !isSellerPaymentReportedConfirm(trade) &&
    hasActions

  // 쌍방취소 단계 계산 (서버 actions 기반)
  const cancellationStep = (() => {
    if (!trade || !shouldUseTradesHttpApi()) return null
    const serverActions = trade.serverActions
    if (!serverActions) return null
    if (serverActions.canConfirmRefund) return 'confirm_refund' as const
    if (serverActions.canReportRefund) return 'report_refund' as const
    if (serverActions.canAgreeCancellation) return 'agree' as const
    if (serverActions.canRequestCancellation) return 'can_request' as const
    return null
  })()

  return {
    portalContainerRef,
    mountedTradeId,
    trade,
    loading,
    open,
    cancelDialogOpen,
    confirmDialogOpen,
    denyDialogOpen,
    disputeOpen,
    showActionFooter,
    cancellationStep,
    copyCallbacks,
    handleSheetOpenChange,
    handleConfirmCancel,
    handleConfirmPayment,
    handleDenyPayment,
    handleRequestCancellation,
    handleAgreeCancellation,
    handleReportRefund,
    handleConfirmRefund,
    handleMarkUnpaid,
    openCancelDialog,
    closeCancelDialog,
    openConfirmDialog,
    closeConfirmDialog,
    openDenyDialog,
    closeDenyDialog,
    openDisputeSheet,
    closeDisputeSheet,
    runAction,
    confirmPayment,
    denyPayment,
  }
}
