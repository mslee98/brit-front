/**
 * useTradeServerSync — HTTP 모드에서 Trade 상세를 서버로부터 동기화.
 * 스토어에 있는 거래는 그대로 먼저 그리고, GET 응답으로 덮어쓴다.
 * 이후 상태 변경은 /trades 소켓 알림으로 다시 조회하고,
 * 재연결·앱 복귀(resync)와 서버 마감 시각 직후에도 한 번 다시 조회한다.
 */
import { useCallback, useEffect, useRef } from 'react'

import { getMyTrade, shouldUseTradesHttpApi } from '../api/trades.api'
import {
  getTradeSocket,
  TRADE_WS_EVENTS,
  type TradeUpdatedPayload,
} from '../realtime/tradeSocket'
import { DEADLINE_RECHECK_GRACE_MS, useRealtimeResync } from '../realtime/realtimeSync'
import {
  notify,
  setTradeRecord,
} from '../stores/tradeSession.state'
import { serverResponseToTradeRecord, type TradeRecord } from '../types'

/** 지금 상태에서 서버가 스스로 상태를 바꾸는 마감 시각 (입금 기한·판매자 확인 기한) */
function nextServerDeadline(trade: TradeRecord): string | undefined {
  if (trade.status === 'PAYMENT_PENDING') return trade.paymentDeadline
  if (trade.status === 'PAYMENT_REPORTED') return trade.sellerConfirmDeadline
  return undefined
}

export function useTradeServerSync(tradeId: string | null | undefined) {
  const abortRef = useRef<AbortController | null>(null)
  const deadlineTimerRef = useRef<number | null>(null)

  const syncTrade = useCallback(
    async function sync(signal?: AbortSignal): Promise<TradeRecord | undefined> {
      if (!tradeId || !shouldUseTradesHttpApi()) return undefined
      try {
        const dto = await getMyTrade(tradeId, signal)
        const updated = serverResponseToTradeRecord(dto)
        setTradeRecord(updated)
        notify()
        if (deadlineTimerRef.current != null) window.clearTimeout(deadlineTimerRef.current)
        deadlineTimerRef.current = null
        const deadline = nextServerDeadline(updated)
        if (deadline) {
          const dueInMs = new Date(deadline).getTime() - Date.now()
          deadlineTimerRef.current = window.setTimeout(
            () => void sync(signal),
            Math.max(0, dueInMs) + DEADLINE_RECHECK_GRACE_MS,
          )
        }
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

  useRealtimeResync(refetchIfVisible, enabled)

  useEffect(
    () => () => {
      if (deadlineTimerRef.current != null) window.clearTimeout(deadlineTimerRef.current)
      deadlineTimerRef.current = null
    },
    [tradeId],
  )

  return { syncTrade }
}
