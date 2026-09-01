/**
 * Trade session public API.
 *
 * 책임: subscribe·조회·콜백 등록 + actions/split re-export
 * 비책임: home wallet mutate (→ setOnTradeCompleted 구독)
 */
import {
  clearMatchingSession,
  setOnMatchConfirmed,
} from '../matching/matchingSession.store'
import type { SplitGroup, TradeDetailViewModel, TradeRecord } from '../types'
import { completeMatching } from './tradeSession.actions'
import * as state from './tradeSession.state'
import {
  activeSplitGroup,
  activeTrade,
  buildTradeDetailViewModel,
  invalidateTradeDetailCache,
  listeners,
  notify,
  sessionVersion,
  setActiveSplitGroup,
  setActiveTrade,
  tradeDetailCache,
  tradesById,
} from './tradeSession.state'

export {
  agreeCancellation,
  cancelTrade,
  confirmPayment,
  confirmRefund,
  createTradeOrder,
  denyPayment,
  focusSplitLegTrade,
  markUnpaid,
  reportPayment,
  reportRefund,
  requestCancellation,
} from './tradeSession.actions'
export { getSplitGroupById, isSplitGroupInProgress } from './tradeSession.split'
export {
  isTerminalStatus,
  setTradeSessionDevHooks,
  type TradeSessionDevHooks,
} from './tradeSession.state'

setOnMatchConfirmed(({ tradeId, amountKrw }) => {
  completeMatching(tradeId, amountKrw)
})

export function setOnTradeMatched(callback: ((tradeId: string) => void) | null) {
  // 단일 listener만 유지 — Trade Activity 비활성 시 다른 화면이 덮어쓸 수 있음.
  state.setOnMatchedCallback(callback)
}

export function setOnTradeCompleted(
  callback: ((input: { side: TradeRecord['side']; coinAmount: number }) => void) | null,
) {
  state.setOnTradeCompletedCallback(callback)
}

export function getTradeSessionVersion(): number {
  return sessionVersion
}

export function getActiveTrade(): TradeRecord | null {
  return activeTrade
}

export function getActiveSplitGroup(): SplitGroup | null {
  return activeSplitGroup
}

export function getTradesById(): ReadonlyMap<string, TradeRecord> {
  return tradesById
}

export function subscribeTradeSession(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getTradeDetail(tradeId: string): TradeDetailViewModel | null {
  if (!tradeId) return null

  const trade = tradesById.get(tradeId) ?? (activeTrade?.id === tradeId ? activeTrade : null)
  if (!trade) return null

  const cached = tradeDetailCache.get(tradeId)
  if (cached && cached.version === trade.version) {
    return cached.detail
  }

  const detail = buildTradeDetailViewModel(trade)
  tradeDetailCache.set(tradeId, { version: trade.version, detail })
  return detail
}

export function resetTradeSession() {
  state.devHooks.clearSimulation?.()
  clearMatchingSession()
  setActiveSplitGroup(null)
  tradesById.clear()
  invalidateTradeDetailCache()
  setActiveTrade(null)
  notify()
}

/**
 * HTTP 모드에서 서버 tradeId로 Trade 레코드를 세션에 등록.
 * MatchingWaiting에서 matched 후 Trade Activity 진입 시 사용.
 */
export function bootstrapServerTrade(tradeId: string): void {
  if (tradesById.has(tradeId)) return

  // 아직 서버에서 데이터를 받지 못한 경우 최소 레코드 생성
  // useTradeDetail → useTradeServerSync가 즉시 서버 조회를 실행함
  const now = new Date().toISOString()
  const placeholder: import('../types').TradeRecord = {
    id: tradeId,
    tradeId,
    side: 'BUY',
    role: 'BUYER',
    status: 'PAYMENT_PENDING',
    amountKrw: 0,
    coinAmount: 0,
    version: 0,
    matchingStartedAt: now,
    updatedAt: now,
  }
  tradesById.set(tradeId, placeholder)
  setActiveTrade(placeholder)
  notify()
}
