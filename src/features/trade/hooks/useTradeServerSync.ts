/**
 * useTradeServerSync — HTTP 모드에서 Trade 상세를 서버로부터 동기화.
 * 스토어에 있는 거래는 그대로 먼저 그리고, GET 응답으로 덮어쓴다.
 * 이후 상태 변경은 /trades 소켓 알림으로 다시 조회한다.
 */
import { useCallback, useEffect, useRef } from 'react'

import { useOnDocumentVisible } from '../../../shared/hooks/useOnDocumentVisible'
import { getMyTrade, shouldUseTradesHttpApi } from '../api/trades.api'
import {
  getTradeSocket,
  TRADE_WS_EVENTS,
  type TradeUpdatedPayload,
} from '../realtime/tradeSocket'
import {
  notify,
  setTradeRecord,
} from '../stores/tradeSession.state'
import { serverResponseToTradeRecord } from '../types'

export function useTradeServerSync(tradeId: string | null | undefined) {
  const abortRef = useRef<AbortController | null>(null)

  const syncTrade = useCallback(
    async (signal?: AbortSignal) => {
      if (!tradeId || !shouldUseTradesHttpApi()) return undefined
      try {
        const dto = await getMyTrade(tradeId, signal)
        const updated = serverResponseToTradeRecord(dto)
        setTradeRecord(updated)
        notify()
        return updated
      } catch {
        return undefined
      }
    },
    [tradeId],
  )

  const enabled = Boolean(tradeId) && shouldUseTradesHttpApi()

  useEffect(() => {
    if (!tradeId || !shouldUseTradesHttpApi()) return

    const controller = new AbortController()
    abortRef.current = controller
    void syncTrade(controller.signal)

    return () => {
      controller.abort()
    }
  }, [tradeId, syncTrade])

  useEffect(() => {
    if (!tradeId || !shouldUseTradesHttpApi()) return

    const socket = getTradeSocket()
    const onUpdated = (payload: TradeUpdatedPayload) => {
      if (payload.tradeId !== tradeId) return
      void syncTrade(abortRef.current?.signal)
    }

    socket.on(TRADE_WS_EVENTS.UPDATED, onUpdated)

    return () => {
      socket.off(TRADE_WS_EVENTS.UPDATED, onUpdated)
    }
  }, [tradeId, syncTrade])

  const refetchIfVisible = useCallback(() => {
    void syncTrade(abortRef.current?.signal)
  }, [syncTrade])

  useOnDocumentVisible(refetchIfVisible, enabled)

  return { syncTrade }
}
