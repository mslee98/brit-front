/**
 * useHomeProgressOrders — 구매 진행 + 공유 sellFlow 기반 판매 카드.
 * Sell 신호는 GlobalSheetHost(useCurrentSellFlow poll)가 담당.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useOnDocumentVisible } from '../../../shared/hooks/useOnDocumentVisible'
import { useAuthStatus } from '../../auth/stores/authSession.store'
import { listMyActiveBuyOrders, shouldUseOrdersHttpApi } from '../../orders/api/orders.api'
import type { BuyOrderDto, BuyOrderStatus } from '../../orders/types'
import {
  getOrderSocket,
  ORDER_WS_EVENTS,
  type BuyOrderUpdatedPayload,
} from '../../trade/realtime/orderSocket'
import { useCurrentSellFlow } from '../../trade/hooks/useCurrentSellFlow'
import type { HomeProgressSellOrder } from '../types'

const ACTIVE_BUY_ORDER_STATUSES: readonly BuyOrderStatus[] = [
  'MATCHING',
  'REQUEST_PENDING',
]

function isBuyOrderStatus(status: string): status is BuyOrderStatus {
  return (
    status === 'MATCHING' ||
    status === 'REQUEST_PENDING' ||
    status === 'MATCHED' ||
    status === 'COMPLETED' ||
    status === 'CANCELLED' ||
    status === 'EXPIRED'
  )
}

function isActiveBuyOrderStatus(status: BuyOrderStatus): boolean {
  return (ACTIVE_BUY_ORDER_STATUSES as readonly string[]).includes(status)
}

export interface HomeProgressOrdersState {
  buyOrders: BuyOrderDto[]
  sellOrders: HomeProgressSellOrder[]
  isLoading: boolean
  refreshProgressOrders: () => Promise<void>
  hasActiveProgressOrders: boolean
  skipSellOrders: boolean
}

export function useHomeProgressOrders(isActive: boolean): HomeProgressOrdersState {
  const authStatus = useAuthStatus()
  const sellFlow = useCurrentSellFlow()
  const [buyOrders, setBuyOrders] = useState<BuyOrderDto[]>([])
  const [isLoadingBuys, setIsLoadingBuys] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const hasLoadedRef = useRef(false)
  const buyOrdersRef = useRef(buyOrders)
  buyOrdersRef.current = buyOrders

  const sellOrders = useMemo((): HomeProgressSellOrder[] => {
    if (!sellFlow.sellOrder) return []
    return [
      {
        order: sellFlow.sellOrder,
        hasPendingRequest: sellFlow.uiState === 'PURCHASE_REQUEST',
        pendingRequest: sellFlow.pendingRequest,
      },
    ]
  }, [sellFlow.pendingRequest, sellFlow.sellOrder, sellFlow.uiState])

  const refreshBuyOrders = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    if (!shouldUseOrdersHttpApi() || authStatus !== 'authenticated') {
      hasLoadedRef.current = false
      setBuyOrders([])
      return
    }

    if (!hasLoadedRef.current) {
      setIsLoadingBuys(true)
    }
    try {
      const activeBuys = await listMyActiveBuyOrders(controller.signal)
      if (controller.signal.aborted) return
      setBuyOrders(activeBuys)
    } catch {
      if (controller.signal.aborted) return
      if (!hasLoadedRef.current) {
        setBuyOrders([])
      }
    } finally {
      if (!controller.signal.aborted) {
        hasLoadedRef.current = true
        setIsLoadingBuys(false)
      }
    }
  }, [authStatus])

  const applyBuyOrderUpdated = useCallback(
    (payload: BuyOrderUpdatedPayload) => {
      if (!isBuyOrderStatus(payload.status)) {
        void refreshBuyOrders()
        return
      }
      const known = buyOrdersRef.current.some((order) => order.id === payload.buyOrderId)
      if (!known) {
        if (isActiveBuyOrderStatus(payload.status)) {
          void refreshBuyOrders()
        }
        return
      }
      if (!isActiveBuyOrderStatus(payload.status)) {
        setBuyOrders((prev) => prev.filter((order) => order.id !== payload.buyOrderId))
        return
      }
      const status = payload.status
      setBuyOrders((prev) =>
        prev.map((order) =>
          order.id === payload.buyOrderId ? { ...order, status } : order,
        ),
      )
    },
    [refreshBuyOrders],
  )

  useEffect(() => {
    if (authStatus !== 'authenticated' || !shouldUseOrdersHttpApi()) {
      hasLoadedRef.current = false
      setBuyOrders([])
      return
    }
    if (hasLoadedRef.current) return
    void refreshBuyOrders()
  }, [authStatus, refreshBuyOrders])

  useEffect(() => {
    if (authStatus !== 'authenticated' || !shouldUseOrdersHttpApi()) return
    const orders = getOrderSocket()
    const onBuyUpdated = (payload: BuyOrderUpdatedPayload) => {
      applyBuyOrderUpdated(payload)
    }
    orders.on(ORDER_WS_EVENTS.BUY_UPDATED, onBuyUpdated)
    return () => {
      orders.off(ORDER_WS_EVENTS.BUY_UPDATED, onBuyUpdated)
    }
  }, [applyBuyOrderUpdated, authStatus])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const refetchIfVisible = useCallback(() => {
    if (!isActive) return
    void refreshBuyOrders()
  }, [isActive, refreshBuyOrders])

  useOnDocumentVisible(refetchIfVisible, isActive)

  const refreshProgressOrders = useCallback(async () => {
    await Promise.all([refreshBuyOrders(), sellFlow.refresh()])
  }, [refreshBuyOrders, sellFlow])

  const skipSellOrders = sellFlow.uiState === 'TRADE_IN_PROGRESS'
  const hasActiveProgressOrders =
    buyOrders.length > 0 || (!skipSellOrders && sellOrders.length > 0)

  return {
    buyOrders,
    sellOrders,
    isLoading: isLoadingBuys || sellFlow.isLoading,
    refreshProgressOrders,
    hasActiveProgressOrders,
    skipSellOrders,
  }
}
