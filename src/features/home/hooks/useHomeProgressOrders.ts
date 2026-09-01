import { useCallback, useEffect, useRef, useState } from 'react'

import { useOnDocumentVisible } from '../../../shared/hooks/useOnDocumentVisible'
import { useAuthStatus } from '../../auth/stores/authSession.store'
import {
  getSellOrderPendingRequest,
  listMyActiveBuyOrders,
  listMyActiveSellOrders,
  shouldUseOrdersHttpApi,
} from '../../orders/api/orders.api'
import type { BuyOrderDto } from '../../orders/types'
import type { HomeProgressSellOrder } from '../types'

const SELL_PENDING_CHECK_LIMIT = 3
const HOME_PROGRESS_POLL_MS = 2500

export interface HomeProgressOrdersState {
  buyOrders: BuyOrderDto[]
  sellOrders: HomeProgressSellOrder[]
  isLoading: boolean
  refreshProgressOrders: () => Promise<void>
  hasActiveProgressOrders: boolean
}

export function useHomeProgressOrders(isActive: boolean): HomeProgressOrdersState {
  const authStatus = useAuthStatus()
  const [buyOrders, setBuyOrders] = useState<BuyOrderDto[]>([])
  const [sellOrders, setSellOrders] = useState<HomeProgressSellOrder[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const hasLoadedRef = useRef(false)

  const refreshProgressOrders = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    if (!shouldUseOrdersHttpApi() || authStatus !== 'authenticated') {
      setBuyOrders([])
      setSellOrders([])
      return
    }

    if (!hasLoadedRef.current) {
      setIsLoading(true)
    }
    try {
      const [activeBuys, activeSells] = await Promise.all([
        listMyActiveBuyOrders(controller.signal),
        listMyActiveSellOrders(controller.signal),
      ])

      if (controller.signal.aborted) return

      const pendingCheckTargets = activeSells.slice(0, SELL_PENDING_CHECK_LIMIT)
      const pendingResults = await Promise.all(
        pendingCheckTargets.map(async (order) => {
          const pending = await getSellOrderPendingRequest(order.id, controller.signal).catch(
            () => null,
          )
          return pending != null
        }),
      )

      if (controller.signal.aborted) return

      const pendingBySellOrderId = new Map<string, boolean>()
      pendingCheckTargets.forEach((order, index) => {
        pendingBySellOrderId.set(order.id, pendingResults[index] ?? false)
      })

      setBuyOrders(activeBuys)
      setSellOrders(
        activeSells.map((order) => ({
          order,
          hasPendingRequest: pendingBySellOrderId.get(order.id) ?? false,
        })),
      )
    } catch {
      if (controller.signal.aborted) return
      if (!hasLoadedRef.current) {
        setBuyOrders([])
        setSellOrders([])
      }
    } finally {
      if (!controller.signal.aborted) {
        hasLoadedRef.current = true
        setIsLoading(false)
      }
    }
  }, [authStatus])

  useEffect(() => {
    if (!isActive) return
    void refreshProgressOrders()

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return
      void refreshProgressOrders()
    }, HOME_PROGRESS_POLL_MS)

    return () => {
      abortRef.current?.abort()
      window.clearInterval(timer)
    }
  }, [isActive, refreshProgressOrders])

  const refetchIfVisible = useCallback(() => {
    if (!isActive) return
    void refreshProgressOrders()
  }, [isActive, refreshProgressOrders])

  useOnDocumentVisible(refetchIfVisible, isActive)

  const hasActiveProgressOrders = buyOrders.length > 0 || sellOrders.length > 0

  return {
    buyOrders,
    sellOrders,
    isLoading,
    refreshProgressOrders,
    hasActiveProgressOrders,
  }
}
