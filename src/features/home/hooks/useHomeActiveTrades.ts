import { useCallback, useEffect, useRef, useState } from 'react'

import { useOnDocumentVisible } from '../../../shared/hooks/useOnDocumentVisible'
import { useAuthStatus } from '../../auth/stores/authSession.store'
import { getMyTrades, shouldUseTradesHttpApi } from '../../trade/api/trades.api'
import { isTerminalStatus } from '../../trade/stores/tradeSession.store'
import { serverListItemToTradeRecord, type TradeRecord } from '../../trade/types'

const ACTIVE_TRADES_PAGE_SIZE = 20
const HOME_ACTIVE_TRADES_POLL_MS = 2500

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

  const refreshActiveTrades = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    if (!shouldUseTradesHttpApi() || authStatus !== 'authenticated') {
      setTrades([])
      return
    }

    if (!hasLoadedRef.current) {
      setIsLoading(true)
    }
    try {
      const response = await getMyTrades({ size: ACTIVE_TRADES_PAGE_SIZE }, controller.signal)
      if (controller.signal.aborted) return

      const active = response.items
        .map(serverListItemToTradeRecord)
        .filter((trade) => !isTerminalStatus(trade.status))

      setTrades(active)
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

  useEffect(() => {
    if (!isActive) return
    void refreshActiveTrades()

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return
      void refreshActiveTrades()
    }, HOME_ACTIVE_TRADES_POLL_MS)

    return () => {
      abortRef.current?.abort()
      window.clearInterval(timer)
    }
  }, [isActive, refreshActiveTrades])

  const refetchIfVisible = useCallback(() => {
    if (!isActive) return
    void refreshActiveTrades()
  }, [isActive, refreshActiveTrades])

  useOnDocumentVisible(refetchIfVisible, isActive)

  return { trades, isLoading, refreshActiveTrades }
}
