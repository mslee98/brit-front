/**
 * useTradeServerSync — HTTP 모드에서 Trade 상세를 서버로부터 동기화.
 * - 최초 진입 시 즉시 조회
 * - 상대 대기 상태에서는 폴링 (입금 대기 TTL은 상한 없음, 코인 이전은 최대 30회)
 */
import { useCallback, useEffect, useRef } from 'react'

import { useOnDocumentVisible } from '../../../shared/hooks/useOnDocumentVisible'
import { getMyTrade, shouldUseTradesHttpApi } from '../api/trades.api'
import {
  notify,
  setTradeRecord,
  tradesById,
  activeTrade,
} from '../stores/tradeSession.state'
import { serverResponseToTradeRecord, type TradeStatus } from '../types'

const TRADE_POLL_INTERVAL_MS = 2000
const MAX_COIN_TRANSFER_POLLS = 30

const POLLABLE_STATUSES: ReadonlySet<TradeStatus> = new Set([
  'PAYMENT_PENDING',
  'PAYMENT_REPORTED',
  'COIN_TRANSFERRING',
  'PAYMENT_TIMEOUT',
])

function shouldContinuePolling(
  status: TradeStatus | undefined,
  coinTransferPollCount: number,
): boolean {
  if (!status) return true
  if (status === 'COIN_TRANSFERRING') {
    return coinTransferPollCount < MAX_COIN_TRANSFER_POLLS
  }
  return POLLABLE_STATUSES.has(status)
}

export function useTradeServerSync(tradeId: string | null | undefined) {
  const pollCountRef = useRef(0)
  const timerRef = useRef<number | null>(null)
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

    pollCountRef.current = 0

    const controller = new AbortController()
    abortRef.current = controller

    void syncTrade(controller.signal)

    const schedulePoll = () => {
      timerRef.current = window.setTimeout(async () => {
        if (controller.signal.aborted) return

        if (document.visibilityState === 'hidden') {
          schedulePoll()
          return
        }

        const current =
          tradesById.get(tradeId) ??
          (activeTrade?.id === tradeId ? activeTrade : null)

        if (!shouldContinuePolling(current?.status, pollCountRef.current)) return

        if (current?.status === 'COIN_TRANSFERRING') {
          pollCountRef.current += 1
        }

        await syncTrade(controller.signal)
        if (controller.signal.aborted) return

        const next =
          tradesById.get(tradeId) ??
          (activeTrade?.id === tradeId ? activeTrade : null)

        if (shouldContinuePolling(next?.status, pollCountRef.current)) {
          schedulePoll()
        }
      }, TRADE_POLL_INTERVAL_MS)
    }

    schedulePoll()

    return () => {
      controller.abort()
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [tradeId, syncTrade])

  const refetchIfVisible = useCallback(() => {
    void syncTrade(abortRef.current?.signal)
  }, [syncTrade])

  useOnDocumentVisible(refetchIfVisible, enabled)

  return { syncTrade }
}
