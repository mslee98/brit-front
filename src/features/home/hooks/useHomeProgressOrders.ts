/**
 * useHomeProgressOrders — 구매 진행 + 공유 sellFlow 기반 판매 카드.
 * Sell 폴링은 GlobalSheetHost(useCurrentSellFlow poll)가 담당.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useOnDocumentVisible } from '../../../shared/hooks/useOnDocumentVisible'
import { useAuthStatus } from '../../auth/stores/authSession.store'
import {
  listMyActiveBuyOrders,
  shouldUseOrdersHttpApi,
} from '../../orders/api/orders.api'
import type { BuyOrderDto } from '../../orders/types'
import { useCurrentSellFlow } from '../../trade/hooks/useCurrentSellFlow'
import type { HomeProgressSellOrder } from '../types'

const HOME_PROGRESS_POLL_MS = 2500

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

  const refreshProgressOrders = useCallback(async () => {
    await Promise.all([refreshBuyOrders(), sellFlow.refresh()])
  }, [refreshBuyOrders, sellFlow])

  useEffect(() => {
    if (!isActive) return
    void refreshBuyOrders()

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return
      void refreshBuyOrders()
    }, HOME_PROGRESS_POLL_MS)

    return () => {
      abortRef.current?.abort()
      window.clearInterval(timer)
    }
  }, [isActive, refreshBuyOrders])

  const refetchIfVisible = useCallback(() => {
    if (!isActive) return
    void refreshBuyOrders()
  }, [isActive, refreshBuyOrders])

  useOnDocumentVisible(refetchIfVisible, isActive)

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
