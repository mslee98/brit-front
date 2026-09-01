/**
 * Trade session mutations — create / payment / cancel / focus.
 */
import { krwToCoin } from '../../../shared/utils/formatAmount'
import { PAYMENT_DEADLINE_MINUTES, SELLER_CONFIRM_DEADLINE_MINUTES } from '../constants'
import {
  clearMatchingSession,
  getMatchingSession,
  startMatchingSession,
} from '../matching/matchingSession.store'
import type { CreateTradeOrderInput, CreateTradeOrderResult, TradeRecord } from '../types'
import { serverResponseToTradeRecord } from '../types'
import {
  agreeCancellationHttp,
  cancelTradeHttp,
  confirmPaymentHttp,
  confirmRefundHttp,
  markUnpaidHttp,
  reportPaymentHttp,
  reportRefundHttp,
  requestCancellationHttp,
  shouldUseTradesHttpApi,
} from '../api/trades.api'
import { buildSplitPlan, buildSplitPlanWithUnit } from '../utils/splitPlan'
import {
  activeSplitGroup,
  activeTrade,
  addMinutes,
  assertTrade,
  createTradeRecord,
  delay,
  devHooks,
  emitTradeCompleted,
  generateTradeId,
  isTerminalStatus,
  notify,
  onMatchedCallback,
  setActiveTrade,
  setTradeRecord,
  tradesById,
} from './tradeSession.state'
import {
  advanceSplitAfterLegComplete,
  clearSplitGroup,
  createSplitTradeOrder,
  isSplitGroupInProgress,
} from './tradeSession.split'

function startMatchingForTrade(trade: TradeRecord) {
  setActiveTrade(trade)
  startMatchingSession({
    tradeId: trade.id,
    amountKrw: trade.amountKrw,
  })
}

export function completeMatching(tradeId: string, amountKrw?: number) {
  const trade = tradesById.get(tradeId)
  if (!trade || trade.status !== 'MATCHING') {
    return
  }

  const now = new Date().toISOString()
  const resolvedAmountKrw = amountKrw ?? trade.amountKrw
  const updated: TradeRecord = {
    ...trade,
    status: 'PAYMENT_PENDING',
    amountKrw: resolvedAmountKrw,
    coinAmount: krwToCoin(resolvedAmountKrw),
    version: trade.version + 1,
    updatedAt: now,
    paymentDeadline: addMinutes(now, PAYMENT_DEADLINE_MINUTES),
  }
  setTradeRecord(updated)
  clearMatchingSession()
  notify()
  onMatchedCallback?.(tradeId)
}

export async function createTradeOrder(
  input: CreateTradeOrderInput,
): Promise<CreateTradeOrderResult> {
  await delay(400)

  if (isSplitGroupInProgress() || (activeTrade && !isTerminalStatus(activeTrade.status))) {
    throw new Error('ACTIVE_TRADE_LIMIT')
  }

  const shouldSplit = input.splitMode === 'AUTO' || input.splitMode === 'CUSTOM'
  const splitPlan =
    input.splitMode === 'CUSTOM' && input.unitAmountKrw != null
      ? buildSplitPlanWithUnit(input.amountKrw, input.unitAmountKrw)
      : input.splitMode === 'AUTO'
        ? buildSplitPlan(input.amountKrw)
        : null
  if (shouldSplit && splitPlan && splitPlan.legCount > 1) {
    return createSplitTradeOrder(input, splitPlan)
  }

  const now = new Date().toISOString()
  const trade = createTradeRecord({
    id: generateTradeId(),
    side: input.side,
    amountKrw: input.amountKrw,
    now,
  })

  tradesById.set(trade.id, trade)
  setActiveTrade(trade)
  notify()
  startMatchingForTrade(trade)
  return { trade }
}

export async function reportPayment(tradeId: string, version: number): Promise<TradeRecord> {
  if (shouldUseTradesHttpApi()) {
    const dto = await reportPaymentHttp(tradeId)
    const updated = serverResponseToTradeRecord(dto)
    setTradeRecord(updated)
    notify()
    return updated
  }

  await delay(300)
  assertTrade(tradeId, version, 'PAYMENT_PENDING')

  const now = new Date().toISOString()
  const updated: TradeRecord = {
    ...activeTrade!,
    status: 'PAYMENT_REPORTED',
    version: activeTrade!.version + 1,
    updatedAt: now,
    reportedAt: now,
    sellerConfirmDeadline: addMinutes(now, SELLER_CONFIRM_DEADLINE_MINUTES),
  }
  setTradeRecord(updated)
  notify()
  devHooks.onPaymentReported?.(updated.id, updated.version, confirmPayment)
  return updated
}

export async function denyPayment(tradeId: string, version: number): Promise<TradeRecord> {
  // HTTP 모드: 판매자 "못 받았어요" = 분쟁 요청 (mark-unpaid 또는 서버 정책에 따라)
  // 현재 서버에서는 판매자가 WAITING_SELLER_CONFIRMATION 에서만 DENY할 수 있으므로
  // 프론트에서는 입금 전/후 상태를 구분해 적절한 API를 호출한다.
  // PAYMENT_REPORTED(=WAITING_SELLER_CONFIRMATION) 상태에서 deny = 분쟁으로 전환
  // 서버에는 직접적인 deny API가 없으므로 로컬 상태 변경으로 처리 후 dispute 화면 표시
  if (shouldUseTradesHttpApi()) {
    // WAITING_SELLER_CONFIRMATION 상태에서 판매자가 "못 받았어요" 하면
    // cancellation-request (쌍방취소 시작)을 하거나 dispute로 넘어감
    // MVP에서는 로컬 DISPUTED 전환 후 분쟁 안내 표시
    const currentTrade = tradesById.get(tradeId) ?? activeTrade
    if (!currentTrade) throw new Error('TRADE_NOT_FOUND')
    const updated: TradeRecord = {
      ...currentTrade,
      status: 'DISPUTED',
      version: currentTrade.version + 1,
      updatedAt: new Date().toISOString(),
    }
    setTradeRecord(updated)
    notify()
    return updated
  }

  devHooks.clearSimulation?.(tradeId)
  await delay(300)
  assertTrade(tradeId, version, 'PAYMENT_REPORTED')

  const now = new Date().toISOString()
  const updated: TradeRecord = {
    ...activeTrade!,
    status: 'DISPUTED',
    version: activeTrade!.version + 1,
    updatedAt: now,
  }
  setTradeRecord(updated)
  notify()
  return updated
}

export async function confirmPayment(tradeId: string, version: number): Promise<TradeRecord> {
  if (shouldUseTradesHttpApi()) {
    const dto = await confirmPaymentHttp(tradeId)
    const updated = serverResponseToTradeRecord(dto)
    setTradeRecord(updated)
    notify()
    // COIN_TRANSFERRING 상태면 완료가 아직 아님 — 폴링에서 COMPLETED로 전환
    if (updated.status === 'COMPLETED') {
      if (activeSplitGroup) {
        advanceSplitAfterLegComplete(tradeId)
      }
      emitTradeCompleted({ side: updated.side, coinAmount: updated.coinAmount })
    }
    return updated
  }

  devHooks.clearSimulation?.(tradeId)
  await delay(400)
  assertTrade(tradeId, version, 'PAYMENT_REPORTED')

  const now = new Date().toISOString()
  const completedTradeId = activeTrade!.id
  const updated: TradeRecord = {
    ...activeTrade!,
    status: 'COMPLETED',
    version: activeTrade!.version + 1,
    updatedAt: now,
    completedAt: now,
  }
  setTradeRecord(updated)
  notify()

  if (activeSplitGroup) {
    advanceSplitAfterLegComplete(completedTradeId)
  }

  emitTradeCompleted({ side: updated.side, coinAmount: updated.coinAmount })

  return updated
}

export async function cancelTrade(tradeId: string, version: number, reason?: string): Promise<TradeRecord> {
  if (shouldUseTradesHttpApi()) {
    const dto = await cancelTradeHttp(tradeId, reason)
    const updated = serverResponseToTradeRecord(dto)
    setTradeRecord(updated)
    setActiveTrade(updated)
    clearSplitGroup()
    notify()
    return updated
  }

  // MVP mock: leg 단위 취소가 아니라 세션 전체(split·tradesById)를 초기화함.
  await delay(300)
  if (!activeTrade || activeTrade.id !== tradeId) {
    throw new Error('TRADE_NOT_FOUND')
  }
  if (activeTrade.version !== version) {
    throw new Error('TRADE_STATE_CONFLICT')
  }
  if (!['MATCHING', 'PAYMENT_PENDING'].includes(activeTrade.status)) {
    throw new Error('TRADE_STATE_CONFLICT')
  }

  devHooks.clearSimulation?.()
  clearMatchingSession()
  clearSplitGroup()
  tradesById.clear()

  const now = new Date().toISOString()
  const updated: TradeRecord = {
    ...activeTrade,
    status: 'CANCELLED',
    version: activeTrade.version + 1,
    updatedAt: now,
  }
  setActiveTrade(updated)
  notify()
  return updated
}

export async function requestCancellation(tradeId: string, reason?: string): Promise<TradeRecord> {
  if (shouldUseTradesHttpApi()) {
    const dto = await requestCancellationHttp(tradeId, reason)
    const updated = serverResponseToTradeRecord(dto)
    setTradeRecord(updated)
    notify()
    return updated
  }
  throw new Error('NOT_IMPLEMENTED_IN_MOCK')
}

export async function agreeCancellation(tradeId: string): Promise<TradeRecord> {
  if (shouldUseTradesHttpApi()) {
    const dto = await agreeCancellationHttp(tradeId)
    const updated = serverResponseToTradeRecord(dto)
    setTradeRecord(updated)
    notify()
    return updated
  }
  throw new Error('NOT_IMPLEMENTED_IN_MOCK')
}

export async function reportRefund(tradeId: string): Promise<TradeRecord> {
  if (shouldUseTradesHttpApi()) {
    const dto = await reportRefundHttp(tradeId)
    const updated = serverResponseToTradeRecord(dto)
    setTradeRecord(updated)
    notify()
    return updated
  }
  throw new Error('NOT_IMPLEMENTED_IN_MOCK')
}

export async function confirmRefund(tradeId: string): Promise<TradeRecord> {
  if (shouldUseTradesHttpApi()) {
    const dto = await confirmRefundHttp(tradeId)
    const updated = serverResponseToTradeRecord(dto)
    setTradeRecord(updated)
    notify()
    return updated
  }
  throw new Error('NOT_IMPLEMENTED_IN_MOCK')
}

export async function markUnpaid(tradeId: string): Promise<TradeRecord> {
  if (shouldUseTradesHttpApi()) {
    const dto = await markUnpaidHttp(tradeId)
    const updated = serverResponseToTradeRecord(dto)
    setTradeRecord(updated)
    notify()
    return updated
  }
  throw new Error('NOT_IMPLEMENTED_IN_MOCK')
}

export function focusSplitLegTrade(tradeId: string) {
  const trade = tradesById.get(tradeId)
  if (!trade) return

  const wasFocused = activeTrade?.id === tradeId
  setActiveTrade(trade)

  if (trade.status === 'MATCHING') {
    const session = getMatchingSession()
    if (session?.tradeId !== tradeId) {
      startMatchingForTrade(trade)
      notify()
    } else if (!wasFocused) {
      notify()
    }
    return
  }

  if (!wasFocused) {
    notify()
  }
}
