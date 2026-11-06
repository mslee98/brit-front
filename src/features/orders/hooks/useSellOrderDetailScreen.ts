/**
 * useSellOrderDetailScreen — 판매 주문 상세 + pending 소켓·취소.
 * 구매요청 수락/거절은 GlobalSheetHost(PurchaseRequestSheet)가 담당한다.
 */
import { useActivity, useActivityParams, useFlow, useStack } from '@stackflow/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { ApiError } from '../../../shared/api/errors'
import { useRealtimeResync } from '../../trade/realtime/realtimeSync'
import { showSnackbar } from '../../../shared/utils/showSnackbar'
import { navigateToRootHome } from '../../../stackflow/navigateToRootHome'
import { syncHomeWalletFromApi } from '../../home/api/homeWalletSync'
import { getMySellerProfile } from '../../market/api/market.api'
import type { MarketSellerDto } from '../../market/types'
import { refreshCurrentSellFlow } from '../../trade/hooks/useCurrentSellFlow'
import {
  getOrderSocket,
  ORDER_WS_EVENTS,
  type SellOrderUpdatedPayload,
  type TradeRequestUpdatedPayload,
} from '../../trade/realtime/orderSocket'
import {
  openPurchaseRequestSheet,
  useSellFlowState,
} from '../../trade/stores/sellFlow.store'
import {
  cancelSellOrder,
  getSellOrder,
  getSellOrderPendingRequest,
} from '../api/orders.api'
import type { SellOrderDto, TradeRequestDto } from '../types'
import {
  buildSellOrderDetailCopy,
  resolveSellOrderEntryContext,
} from '../utils/sellOrderDetailCopy'

export function useSellOrderDetailScreen() {
  const { isActive } = useActivity()
  const params = useActivityParams<'SellOrderDetail'>()
  const { replace } = useFlow()
  const { activities } = useStack()
  const snackbar = useSnackbarAdapter()

  const entryContext = resolveSellOrderEntryContext(params.entryContext)
  const sellFlow = useSellFlowState()

  const [order, setOrder] = useState<SellOrderDto | null>(null)
  const [pendingRequest, setPendingRequest] = useState<TradeRequestDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActing, setIsActing] = useState(false)
  const [infoSheetOpen, setInfoSheetOpen] = useState(false)
  const [cancelSheetOpen, setCancelSheetOpen] = useState(false)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [sellerProfile, setSellerProfile] = useState<MarketSellerDto | null>(null)

  const loadOrder = useCallback(
    async (signal?: AbortSignal) => {
      const next = await getSellOrder(params.sellOrderId, signal)
      setOrder(next)
      return next
    },
    [params.sellOrderId],
  )

  const loadPending = useCallback(
    async (signal?: AbortSignal) => {
      const next = await getSellOrderPendingRequest(params.sellOrderId, signal)
      setPendingRequest(next)
      return next
    },
    [params.sellOrderId],
  )

  const refreshWalletFromApi = useCallback(async () => {
    await syncHomeWalletFromApi()
  }, [])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    const bootstrap = async () => {
      setIsLoading(true)
      try {
        await Promise.all([
          loadOrder(controller.signal),
          loadPending(controller.signal),
        ])
      } catch (error) {
        if (cancelled) return
        if (error instanceof DOMException && error.name === 'AbortError') return
        showSnackbar(
          snackbar,
          error instanceof ApiError
            ? error.message
            : '판매 주문을 불러오지 못했어요.',
        )
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [loadOrder, loadPending, snackbar])

  useEffect(() => {
    const controller = new AbortController()
    getMySellerProfile(controller.signal)
      .then(setSellerProfile)
      .catch(() => {
        // 안내 블록은 없어도 화면이 동작한다
      })
    return () => controller.abort()
  }, [])

  const refreshOrderAndPending = useCallback(async () => {
    await Promise.all([loadOrder(), loadPending()])
  }, [loadOrder, loadPending])

  useEffect(() => {
    if (!isActive) return
    const orders = getOrderSocket()
    const onSell = (payload: SellOrderUpdatedPayload) => {
      if (payload.sellOrderId !== params.sellOrderId) return
      void refreshOrderAndPending().catch(() => undefined)
    }
    const onRequest = (payload: TradeRequestUpdatedPayload) => {
      if (payload.sellOrderId !== params.sellOrderId) return
      void refreshOrderAndPending().catch(() => undefined)
    }
    orders.on(ORDER_WS_EVENTS.SELL_UPDATED, onSell)
    orders.on(ORDER_WS_EVENTS.REQUEST_UPDATED, onRequest)
    return () => {
      orders.off(ORDER_WS_EVENTS.SELL_UPDATED, onSell)
      orders.off(ORDER_WS_EVENTS.REQUEST_UPDATED, onRequest)
    }
  }, [isActive, params.sellOrderId, refreshOrderAndPending])

  const refetchIfVisible = useCallback(() => {
    if (!isActive) return
    void refreshOrderAndPending().catch(() => {
      // 다음 폴링
    })
  }, [isActive, refreshOrderAndPending])

  useRealtimeResync(refetchIfVisible, isActive)

  const isActiveSell = sellFlow.sellOrder?.id === params.sellOrderId
  const resolvedOrder = isActiveSell && sellFlow.sellOrder ? sellFlow.sellOrder : order
  const resolvedPending = isActiveSell ? sellFlow.pendingRequest : pendingRequest

  useEffect(() => {
    if (!resolvedPending) return
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [resolvedPending])

  const remainingSec = resolvedPending
    ? Math.max(
        0,
        Math.ceil((new Date(resolvedPending.expiresAt).getTime() - nowMs) / 1000),
      )
    : 0

  const copy = useMemo(() => {
    if (!resolvedOrder) return null
    return buildSellOrderDetailCopy({
      order: resolvedOrder,
      hasPendingRequest: resolvedPending !== null,
      entryContext,
    })
  }, [entryContext, resolvedOrder, resolvedPending])

  const handleOpenPurchaseRequest = useCallback(() => {
    openPurchaseRequestSheet()
  }, [])

  const handleCancelSellOrder = useCallback(async () => {
    if (!resolvedOrder || isActing) return
    setIsActing(true)
    try {
      await cancelSellOrder(resolvedOrder.id)
      setCancelSheetOpen(false)
      await Promise.all([refreshWalletFromApi(), refreshCurrentSellFlow()])
      showSnackbar(snackbar, '판매 등록을 취소했어요.')
      navigateToRootHome(activities.length)
    } catch (error) {
      const isUnauthorized =
        error instanceof ApiError &&
        (error.code === 'UNAUTHORIZED' || error.status === 401)
      if (isUnauthorized) {
        showSnackbar(snackbar, '다시 로그인해 주세요.')
        replace('Login', {}, { animate: true })
        return
      }
      showSnackbar(
        snackbar,
        error instanceof ApiError
          ? error.message
          : '취소에 실패했어요. 잠시 후 다시 시도해 주세요.',
      )
    } finally {
      setIsActing(false)
    }
  }, [
    activities.length,
    isActing,
    refreshWalletFromApi,
    replace,
    resolvedOrder,
    snackbar,
  ])

  const handleGoHome = useCallback(() => {
    navigateToRootHome(activities.length)
  }, [activities.length])

  return {
    sellOrderId: params.sellOrderId,
    entryContext,
    order: resolvedOrder,
    pendingRequest: resolvedPending,
    sellerProfile,
    copy,
    isLoading,
    isActing: isActing || sellFlow.isActing,
    remainingSec,
    infoSheetOpen,
    cancelSheetOpen,
    setInfoSheetOpen,
    setCancelSheetOpen,
    handleCancelSellOrder,
    handleOpenPurchaseRequest,
    handleGoHome,
  }
}
