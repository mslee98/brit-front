import { useCallback, useSyncExternalStore } from 'react'

import {
  agreeCancellation,
  cancelTrade,
  confirmPayment,
  confirmRefund,
  denyPayment,
  getTradeDetail,
  markUnpaid,
  reportPayment,
  reportRefund,
  requestCancellation,
  subscribeTradeSession,
} from '../stores/tradeSession.store'
import type { TradeDetailViewModel } from '../types'
import { useTradeServerSync } from './useTradeServerSync'

function getTradeDetailSnapshot(tradeId: string): TradeDetailViewModel | null {
  return getTradeDetail(tradeId)
}

export function useTradeDetail(tradeId: string) {
  useTradeServerSync(tradeId)

  const subscribe = useCallback(
    (listener: () => void) => subscribeTradeSession(listener),
    [],
  )

  const getSnapshot = useCallback(() => getTradeDetailSnapshot(tradeId), [tradeId])

  const trade = useSyncExternalStore(subscribe, getSnapshot, () => null)

  /** 액션 시점에 store 최신 version을 읽어 stale closure / TRADE_STATE_CONFLICT 방지 */
  const resolveLiveTrade = useCallback(() => {
    const current = getTradeDetail(tradeId)
    if (!current) throw new Error('TRADE_NOT_FOUND')
    return current
  }, [tradeId])

  const reportPaymentAction = useCallback(async () => {
    const current = resolveLiveTrade()
    return reportPayment(current.id, current.version)
  }, [resolveLiveTrade])

  const confirmPaymentAction = useCallback(async () => {
    const current = resolveLiveTrade()
    return confirmPayment(current.id, current.version)
  }, [resolveLiveTrade])

  const cancelAction = useCallback(async (reason?: string) => {
    const current = resolveLiveTrade()
    return cancelTrade(current.id, current.version, reason)
  }, [resolveLiveTrade])

  const denyPaymentAction = useCallback(async () => {
    const current = resolveLiveTrade()
    return denyPayment(current.id, current.version)
  }, [resolveLiveTrade])

  const requestCancellationAction = useCallback(async (reason?: string) => {
    const current = resolveLiveTrade()
    return requestCancellation(current.id, reason)
  }, [resolveLiveTrade])

  const agreeCancellationAction = useCallback(async () => {
    const current = resolveLiveTrade()
    return agreeCancellation(current.id)
  }, [resolveLiveTrade])

  const reportRefundAction = useCallback(async () => {
    const current = resolveLiveTrade()
    return reportRefund(current.id)
  }, [resolveLiveTrade])

  const confirmRefundAction = useCallback(async () => {
    const current = resolveLiveTrade()
    return confirmRefund(current.id)
  }, [resolveLiveTrade])

  const markUnpaidAction = useCallback(async () => {
    const current = resolveLiveTrade()
    return markUnpaid(current.id)
  }, [resolveLiveTrade])

  return {
    trade,
    reportPayment: reportPaymentAction,
    confirmPayment: confirmPaymentAction,
    denyPayment: denyPaymentAction,
    cancelTrade: cancelAction,
    requestCancellation: requestCancellationAction,
    agreeCancellation: agreeCancellationAction,
    reportRefund: reportRefundAction,
    confirmRefund: confirmRefundAction,
    markUnpaid: markUnpaidAction,
  }
}
