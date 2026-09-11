/**
 * useCurrentSellFlow — 1인 1활성 Sell + pending Request 공유 refresh.
 * GlobalSheetHost에서 poll=true로 마운트. 홈 등은 store만 구독.
 */
import { useCallback, useEffect, useRef } from 'react'

import { useOnDocumentVisible } from '../../../shared/hooks/useOnDocumentVisible'
import { useAuthStatus } from '../../auth/stores/authSession.store'
import {
  getSellOrderPendingRequest,
  listMyActiveSellOrders,
  shouldUseOrdersHttpApi,
} from '../../orders/api/orders.api'
import type { SellOrderDto, TradeRequestDto } from '../../orders/types'
import {
  getPendingNotifications,
  subscribeNotifications,
} from '../../notifications/notification.store'
import {
  blocksNewTradeCompose,
  clearActiveTrade,
  getActiveTrade,
  isDisputeTrade,
  isTerminalStatus,
  subscribeTradeSession,
} from '../stores/tradeSession.store'
import {
  clearSellFlow,
  getSellFlowDisplayAmountKrw,
  getSellFlowState,
  setSellFlowHasSellerActiveTrade,
  setSellFlowLoading,
  setSellFlowSnapshot,
  useSellFlowState,
  useSellFlowUiState,
  type SellFlowUiState,
} from '../stores/sellFlow.store'

const POLL_MS = 2500

function readHasSellerActiveTrade(): boolean {
  const trade = getActiveTrade()
  if (trade == null || trade.role !== 'SELLER') return false
  return blocksNewTradeCompose(trade)
}

function clearStaleLocalSellerTrade() {
  const trade = getActiveTrade()
  if (!trade || trade.role !== 'SELLER') return
  if (isTerminalStatus(trade.status) || isDisputeTrade(trade.status)) {
    clearActiveTrade()
  }
}

/**
 * FULLY_RESERVED는 pending이 있을 때만 활성.
 * OPEN/PARTIAL은 remaining > 0일 때만.
 */
async function pickActiveSellFlow(
  sells: SellOrderDto[],
  signal: AbortSignal,
): Promise<{
  sellOrder: SellOrderDto | null
  pendingRequest: TradeRequestDto | null
}> {
  for (const sell of sells) {
    if (signal.aborted) {
      return { sellOrder: null, pendingRequest: null }
    }

    let pending = await getSellOrderPendingRequest(sell.id, signal).catch(() => null)
    if (pending != null && pending.buyer == null) {
      pending = null
    }

    if (pending != null) {
      return { sellOrder: sell, pendingRequest: pending }
    }

    if (sell.status === 'FULLY_RESERVED') {
      continue
    }

    const remaining = Number(sell.amount.remaining)
    if (
      (sell.status === 'OPEN' || sell.status === 'PARTIALLY_MATCHED') &&
      remaining > 0
    ) {
      return { sellOrder: sell, pendingRequest: null }
    }
  }

  return { sellOrder: null, pendingRequest: null }
}

export async function refreshCurrentSellFlow(signal?: AbortSignal): Promise<void> {
  if (!shouldUseOrdersHttpApi()) {
    clearSellFlow()
    return
  }

  const sells = await listMyActiveSellOrders(signal)
  if (signal?.aborted) return

  const { sellOrder, pendingRequest } = await pickActiveSellFlow(
    sells,
    signal ?? new AbortController().signal,
  )
  if (signal?.aborted) return

  clearStaleLocalSellerTrade()

  setSellFlowSnapshot({
    sellOrder,
    pendingRequest,
    hasSellerActiveTrade: readHasSellerActiveTrade(),
  })
}

export interface CurrentSellFlow {
  uiState: SellFlowUiState
  sellOrder: ReturnType<typeof getSellFlowState>['sellOrder']
  pendingRequest: ReturnType<typeof getSellFlowState>['pendingRequest']
  displayAmountKrw: number | null
  isLoading: boolean
  isActing: boolean
  allowDismiss: boolean
  sheetReopenNonce: number
  refresh: () => Promise<void>
}

/**
 * @param options.poll App Root에서만 true — 폴링·알림 refresh 담당
 */
export function useCurrentSellFlow(options?: { poll?: boolean }): CurrentSellFlow {
  const poll = options?.poll === true
  const authStatus = useAuthStatus()
  const flow = useSellFlowState()
  const uiState = useSellFlowUiState()
  const abortRef = useRef<AbortController | null>(null)

  const refresh = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    if (authStatus !== 'authenticated') {
      clearSellFlow()
      return
    }

    if (!getSellFlowState().sellOrder && !getSellFlowState().pendingRequest) {
      setSellFlowLoading(true)
    }

    try {
      await refreshCurrentSellFlow(controller.signal)
    } catch {
      if (controller.signal.aborted) return
      setSellFlowLoading(false)
    }
  }, [authStatus])

  useEffect(() => {
    if (!poll) return

    if (authStatus !== 'authenticated') {
      clearSellFlow()
      return
    }

    void refresh()
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return
      if (getSellFlowState().isActing) return
      void refresh()
    }, POLL_MS)

    return () => {
      abortRef.current?.abort()
      window.clearInterval(timer)
    }
  }, [authStatus, poll, refresh])

  useOnDocumentVisible(() => {
    if (!poll || authStatus !== 'authenticated') return
    void refresh()
  }, poll && authStatus === 'authenticated')

  useEffect(() => {
    if (!poll || authStatus !== 'authenticated') return
    let lastCreatedIds = new Set(
      getPendingNotifications()
        .filter((n) => n.type === 'TRADE_REQUEST_CREATED')
        .map((n) => n.id),
    )

    return subscribeNotifications(() => {
      const created = getPendingNotifications().filter(
        (n) => n.type === 'TRADE_REQUEST_CREATED',
      )
      const nextIds = new Set(created.map((n) => n.id))
      let hasNew = false
      for (const id of nextIds) {
        if (!lastCreatedIds.has(id)) {
          hasNew = true
          break
        }
      }
      lastCreatedIds = nextIds
      if (hasNew) {
        void refresh()
      }
    })
  }, [authStatus, poll, refresh])

  useEffect(() => {
    if (!poll) return
    const sync = () => {
      clearStaleLocalSellerTrade()
      setSellFlowHasSellerActiveTrade(readHasSellerActiveTrade())
    }
    sync()
    return subscribeTradeSession(sync)
  }, [poll])

  return {
    uiState,
    sellOrder: flow.sellOrder,
    pendingRequest: flow.pendingRequest,
    displayAmountKrw: getSellFlowDisplayAmountKrw(),
    isLoading: flow.isLoading,
    isActing: flow.isActing,
    allowDismiss: flow.allowDismiss,
    sheetReopenNonce: flow.sheetReopenNonce,
    refresh,
  }
}
