/**
 * usePurchaseRequestActions — Accept/Reject + navigate (GlobalSheetHost용).
 */
import { useCallback } from 'react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { ApiError } from '../../../shared/api/errors'
import { showSnackbar } from '../../../shared/utils/showSnackbar'
import { actions } from '../../../stackflow/stackflow'
import {
  acceptTradeRequest,
  rejectTradeRequest,
} from '../../orders/api/orders.api'
import type { TradeRequestRejectionReason } from '../../orders/types'
import { refreshCurrentSellFlow } from './useCurrentSellFlow'
import {
  clearSellFlowPending,
  getSellFlowState,
  setSellFlowActing,
  setSellFlowAllowDismiss,
} from '../stores/sellFlow.store'

export function usePurchaseRequestActions() {
  const snackbar = useSnackbarAdapter()

  const handleAccept = useCallback(async () => {
    const current = getSellFlowState().pendingRequest
    if (!current || getSellFlowState().isActing) return

    setSellFlowActing(true)
    try {
      const result = await acceptTradeRequest(current.id)
      setSellFlowAllowDismiss(true)
      clearSellFlowPending()
      showSnackbar(snackbar, '거래를 수락했어요.')
      actions.replace('Trade', { tradeId: result.tradeId }, { animate: true })
      void refreshCurrentSellFlow()
    } catch (error) {
      const isUnauthorized =
        error instanceof ApiError &&
        (error.code === 'UNAUTHORIZED' || error.status === 401)
      if (isUnauthorized) {
        showSnackbar(snackbar, '다시 로그인해 주세요.')
        actions.replace('Login', {}, { animate: true })
        return
      }
      showSnackbar(
        snackbar,
        error instanceof ApiError
          ? error.message
          : '수락에 실패했어요. 잠시 후 다시 시도해 주세요.',
      )
      void refreshCurrentSellFlow()
    } finally {
      setSellFlowActing(false)
      setSellFlowAllowDismiss(false)
    }
  }, [snackbar])

  const handleReject = useCallback(
    async (reasonCode: TradeRequestRejectionReason) => {
      const current = getSellFlowState().pendingRequest
      if (!current || getSellFlowState().isActing) return

      setSellFlowActing(true)
      try {
        await rejectTradeRequest(current.id, { reasonCode })
        setSellFlowAllowDismiss(true)
        clearSellFlowPending()
        showSnackbar(snackbar, '신청을 거절했어요.')
        void refreshCurrentSellFlow()
      } catch (error) {
        const isUnauthorized =
          error instanceof ApiError &&
          (error.code === 'UNAUTHORIZED' || error.status === 401)
        if (isUnauthorized) {
          showSnackbar(snackbar, '다시 로그인해 주세요.')
          actions.replace('Login', {}, { animate: true })
          return
        }
        showSnackbar(
          snackbar,
          error instanceof ApiError
            ? error.message
            : '거절에 실패했어요. 잠시 후 다시 시도해 주세요.',
        )
      } finally {
        setSellFlowActing(false)
        setSellFlowAllowDismiss(false)
      }
    },
    [snackbar],
  )

  return { handleAccept, handleReject }
}
