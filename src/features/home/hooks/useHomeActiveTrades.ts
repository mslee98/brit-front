import { useCallback, useEffect, useRef, useState } from 'react'

import { useOnDocumentVisible } from '../../../shared/hooks/useOnDocumentVisible'
import { useAuthStatus } from '../../auth/stores/authSession.store'
import { getMyTrade, getMyTrades, shouldUseTradesHttpApi } from '../../trade/api/trades.api'
import {
  getTradeSocket,
  TRADE_WS_EVENTS,
  type TradeUpdatedPayload,
} from '../../trade/realtime/tradeSocket'
import { isTerminalStatus } from '../../trade/stores/tradeSession.store'
import {
  serverListItemToTradeRecord,
  serverResponseToTradeRecord,
  serverStatusToClientStatus,
  type ServerTradeStatus,
  type TradeRecord,
} from '../../trade/types'

const ACTIVE_TRADES_PAGE_SIZE = 20

const SERVER_TRADE_STATUSES: readonly ServerTradeStatus[] = [
  'WAITING_BUYER_PAYMENT',
  'PAYMENT_TIMEOUT',
  'WAITING_SELLER_CONFIRMATION',
  'COIN_TRANSFERRING',
  'COMPLETED',
  'CANCELLED',
  'DISPUTED',
]

function isServerTradeStatus(status: string): status is ServerTradeStatus {
  return (SERVER_TRADE_STATUSES as readonly string[]).includes(status)
}

export interface HomeActiveTradesState {
  trades: TradeRecord[]
  isLoading: boolean
  refreshActiveTrades: () => Promise<void>
}

export function useHomeActiveTrades(isActive: boolean): HomeActiveTradesState {
  const authStatus = useAuthStatus()
  const [trades, setTrades] = useState<TradeRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const hasLoadedRef = useRef(false)
  const tradesRef = useRef(trades)
  tradesRef.current = trades

  const refreshActiveTrades = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    if (!shouldUseTradesHttpApi() || authStatus !== 'authenticated') {
      hasLoadedRef.current = false
      setTrades([])
      return
    }

    if (!hasLoadedRef.current) {
      setIsLoading(true)
    }
    try {
      const [listed, disputed] = await Promise.all([
        getMyTrades({ size: ACTIVE_TRADES_PAGE_SIZE }, controller.signal),
        getMyTrades(
          { status: 'DISPUTED', size: ACTIVE_TRADES_PAGE_SIZE },
          controller.signal,
        ),
      ])
      if (controller.signal.aborted) return

      const byId = new Map<string, TradeRecord>()
      for (const dto of [...listed.items, ...disputed.items]) {
        const trade = serverListItemToTradeRecord(dto)
        if (!isTerminalStatus(trade.status)) {
          byId.set(trade.id, trade)
        }
      }

      setTrades([...byId.values()])
    } catch {
      if (controller.signal.aborted) return
      if (!hasLoadedRef.current) {
        setTrades([])
      }
    } finally {
      if (!controller.signal.aborted) {
        hasLoadedRef.current = true
        setIsLoading(false)
      }
    }
  }, [authStatus])

  const upsertTradeFromServer = useCallback(async (tradeId: string) => {
    try {
      const dto = await getMyTrade(tradeId)
      const record = serverResponseToTradeRecord(dto)
      setTrades((prev) => {
        if (isTerminalStatus(record.status)) {
          return prev.filter((trade) => trade.id !== record.id)
        }
        const index = prev.findIndex((trade) => trade.id === record.id)
        if (index < 0) return [record, ...prev]
        const next = [...prev]
        next[index] = record
        return next
      })
    } catch {
      // 목록에 없던 거래 한 건 조회 실패는 기존 목록을 유지한다.
    }
  }, [])

  const applyTradeUpdated = useCallback(
    (payload: TradeUpdatedPayload) => {
      if (!isServerTradeStatus(payload.status)) {
        void upsertTradeFromServer(payload.tradeId)
        return
      }
      const clientStatus = serverStatusToClientStatus(payload.status)
      const serverStatus = payload.status
      const known = tradesRef.current.some((trade) => trade.id === payload.tradeId)
      if (!known) {
        void upsertTradeFromServer(payload.tradeId)
        return
      }
      if (isTerminalStatus(clientStatus)) {
        setTrades((prev) => prev.filter((trade) => trade.id !== payload.tradeId))
        return
      }
      setTrades((prev) =>
        prev.map((trade) =>
          trade.id === payload.tradeId
            ? {
                ...trade,
                status: clientStatus,
                serverStatus,
                updatedAt: new Date().toISOString(),
              }
            : trade,
        ),
      )
    },
    [upsertTradeFromServer],
  )

  useEffect(() => {
    if (authStatus !== 'authenticated' || !shouldUseTradesHttpApi()) {
      hasLoadedRef.current = false
      setTrades([])
      return
    }
    if (hasLoadedRef.current) return
    void refreshActiveTrades()
  }, [authStatus, refreshActiveTrades])

  useEffect(() => {
    if (authStatus !== 'authenticated' || !shouldUseTradesHttpApi()) return
    const socket = getTradeSocket()
    const onUpdated = (payload: TradeUpdatedPayload) => {
      applyTradeUpdated(payload)
    }
    socket.on(TRADE_WS_EVENTS.UPDATED, onUpdated)
    return () => {
      socket.off(TRADE_WS_EVENTS.UPDATED, onUpdated)
    }
  }, [applyTradeUpdated, authStatus])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const refetchIfVisible = useCallback(() => {
    if (!isActive) return
    void refreshActiveTrades()
  }, [isActive, refreshActiveTrades])

  useOnDocumentVisible(refetchIfVisible, isActive)

  return { trades, isLoading, refreshActiveTrades }
}
