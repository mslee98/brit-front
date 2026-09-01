import { useActivityParams, useFlow, useStack } from '@stackflow/react'
import { useCallback, useRef, useState, useSyncExternalStore } from 'react'
import { useBooleanState } from 'react-simplikit'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { ApiError } from '../../../shared/api/errors'
import { showSnackbar } from '../../../shared/utils/showSnackbar'
import { navigateToRootHome } from '../../../stackflow/navigateToRootHome'
import { useRequireAuth } from '../../auth/hooks/useRequireAuth'
import { syncHomeWalletFromApi } from '../../home/api/homeWalletSync'
import {
  getHomeWallet,
  subscribeHomeWallet,
} from '../../home/stores/homeWallet.store'
import {
  createBuyOrder,
  createIdempotencyKey,
  createSellOrder,
  shouldUseOrdersHttpApi,
} from '../../orders/api/orders.api'
import {
  createTradeOrder,
  isSplitGroupInProgress,
  isTerminalStatus,
} from '../stores/tradeSession.store'
import { useActiveSplitGroup } from './useActiveSplitGroup'
import { useActiveTrade } from './useActiveTrade'
import { useTradeInputState } from './useTradeInputState'

/**
 * TradeCompose Activity orchestration.
 * Nest API가 있으면 실주문·매칭, 없으면 mock 세션을 사용합니다.
 */
export function useTradeComposeScreen() {
  const { side: initialSide } = useActivityParams<'TradeCompose'>()
  const { replace } = useFlow()
  const { activities } = useStack()
  const { requireAuth, authRequiredDialog } = useRequireAuth('trade')
  const snackbar = useSnackbarAdapter()
  const activeTrade = useActiveTrade()
  const splitGroup = useActiveSplitGroup()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const idempotencyKeyRef = useRef<string | null>(null)

  const useHttp = shouldUseOrdersHttpApi()

  const wallet = useSyncExternalStore(subscribeHomeWallet, getHomeWallet, getHomeWallet)
  const availableCoin = wallet.availableCoin
  const escrowCoin = wallet.escrowCoin

  const tradeInput = useTradeInputState({
    coinBalance: availableCoin,
    initialSide: initialSide === 'SELL' ? 'SELL' : 'BUY',
  })

  const [confirmOpen, openConfirm, closeConfirm] = useBooleanState(false)

  const hasBlockingTrade = useHttp
    ? false
    : isSplitGroupInProgress() ||
      (activeTrade !== null && !isTerminalStatus(activeTrade.status) && !splitGroup)

  const handleSubmit = () => {
    if (
      tradeInput.isSubmitDisabled ||
      !tradeInput.amountKrw ||
      hasBlockingTrade ||
      isSubmitting
    ) {
      return
    }

    requireAuth(() => {
      idempotencyKeyRef.current = createIdempotencyKey()
      openConfirm()
    })
  }

  const refreshWalletFromApi = useCallback(async () => {
    await syncHomeWalletFromApi()
  }, [])

  const handleConfirmTrade = useCallback(async () => {
    if (tradeInput.isSubmitDisabled || !tradeInput.amountKrw || isSubmitting) return

    if (!useHttp) {
      const result = await createTradeOrder({
        side: tradeInput.side,
        amountKrw: tradeInput.amountKrw,
        splitMode: 'NONE',
      })

      if (result.splitGroupId) {
        replace('Trade', { splitGroupId: result.splitGroupId }, { animate: true })
        return
      }

      replace('Trade', { tradeId: result.trade.id }, { animate: true })
      return
    }

    const coinAmount = String(tradeInput.amountKrw)
    const idempotencyKey = idempotencyKeyRef.current ?? createIdempotencyKey()
    idempotencyKeyRef.current = idempotencyKey

    setIsSubmitting(true)
    closeConfirm()

    try {
      if (tradeInput.side === 'SELL') {
        const sellOrder = await createSellOrder({
          coinAmount,
          idempotencyKey,
        })
        await refreshWalletFromApi()
        showSnackbar(snackbar, '판매 주문을 등록했어요.')
        replace(
          'SellOrderDetail',
          { sellOrderId: sellOrder.id, entryContext: 'created' },
          { animate: true },
        )
        return
      }

      const result = await createBuyOrder({
        coinAmount,
        idempotencyKey,
      })

      replace(
        'MatchingWaiting',
        {
          buyOrderId: result.id,
          requestedAmountKrw: Number(result.coinAmount),
          initialPhase: 'searching',
        },
        { animate: true },
      )
    } catch (error) {
      const isUnauthorized =
        error instanceof ApiError &&
        (error.code === 'UNAUTHORIZED' || error.status === 401)

      if (isUnauthorized) {
        showSnackbar(snackbar, '다시 로그인해 주세요.')
        replace('Login', {}, { animate: true })
        return
      }

      const message =
        error instanceof ApiError
          ? error.message
          : '주문을 만들지 못했어요. 잠시 후 다시 시도해 주세요.'
      showSnackbar(snackbar, message)
      idempotencyKeyRef.current = null
    } finally {
      setIsSubmitting(false)
    }
  }, [
    closeConfirm,
    isSubmitting,
    refreshWalletFromApi,
    replace,
    snackbar,
    tradeInput.amountKrw,
    tradeInput.isSubmitDisabled,
    tradeInput.side,
    useHttp,
  ])

  const handleConfirmOpenChange = useCallback(
    (open: boolean) => {
      if (open) openConfirm()
      else closeConfirm()
    },
    [closeConfirm, openConfirm],
  )

  const handleClose = useCallback(() => {
    navigateToRootHome(activities.length)
  }, [activities.length])

  return {
    authRequiredDialog,
    tradeInput,
    availableCoin,
    escrowCoin,
    confirmOpen,
    hasBlockingTrade,
    isSubmitting,
    handleSubmit,
    handleConfirmTrade,
    handleConfirmOpenChange,
    handleClose,
  }
}
