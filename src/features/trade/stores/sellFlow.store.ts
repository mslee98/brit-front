/**
 * sellFlow.store — 1인 1활성 판매 흐름 (Sell + pending Request 공유).
 * 비즈니스 상태 머신이 아니라 API 조합 결과의 단일 SoT.
 */
import { useSyncExternalStore } from 'react'

import type { SellOrderDto, TradeRequestDto } from '../../orders/types'

export type SellFlowUiState =
  | 'IDLE'
  | 'WAITING_BUYER'
  | 'PURCHASE_REQUEST'
  | 'TRADE_IN_PROGRESS'

type Listener = () => void

interface SellFlowState {
  sellOrder: SellOrderDto | null
  pendingRequest: TradeRequestDto | null
  /** 판매자 역할 비종료 Trade가 있으면 true (tradeSession에서 주입) */
  hasSellerActiveTrade: boolean
  isLoading: boolean
  isActing: boolean
  allowDismiss: boolean
  /**
   * 홈 카드 등에서 Sheet 재오픈 요청.
   * pending이 있으면 Host가 open=true로 두고, 처리 후 소비한다.
   */
  sheetReopenNonce: number
}

const listeners = new Set<Listener>()

let state: SellFlowState = {
  sellOrder: null,
  pendingRequest: null,
  hasSellerActiveTrade: false,
  isLoading: false,
  isActing: false,
  allowDismiss: false,
  sheetReopenNonce: 0,
}

function notify() {
  listeners.forEach((listener) => listener())
}

function setState(patch: Partial<SellFlowState>) {
  state = { ...state, ...patch }
  notify()
}

export function subscribeSellFlow(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSellFlowState(): SellFlowState {
  return state
}

export function getSellFlowUiState(): SellFlowUiState {
  if (state.hasSellerActiveTrade) return 'TRADE_IN_PROGRESS'
  if (state.pendingRequest?.buyer) return 'PURCHASE_REQUEST'
  if (state.sellOrder) return 'WAITING_BUYER'
  return 'IDLE'
}

/** 단계별 표시 금액 (KRW/Coin 동일 단위 가정) */
export function getSellFlowDisplayAmountKrw(): number | null {
  const ui = getSellFlowUiState()
  if (ui === 'PURCHASE_REQUEST' && state.pendingRequest) {
    return Number(state.pendingRequest.match.coinAmount)
  }
  if (ui === 'WAITING_BUYER' && state.sellOrder) {
    const remaining = Number(state.sellOrder.amount.remaining)
    if (remaining > 0) return remaining
    return Number(state.sellOrder.amount.original)
  }
  return null
}

export function setSellFlowSnapshot(input: {
  sellOrder: SellOrderDto | null
  pendingRequest: TradeRequestDto | null
  hasSellerActiveTrade?: boolean
}) {
  setState({
    sellOrder: input.sellOrder,
    pendingRequest: input.pendingRequest,
    ...(input.hasSellerActiveTrade !== undefined
      ? { hasSellerActiveTrade: input.hasSellerActiveTrade }
      : {}),
    isLoading: false,
  })
}

export function setSellFlowHasSellerActiveTrade(hasSellerActiveTrade: boolean) {
  if (state.hasSellerActiveTrade === hasSellerActiveTrade) return
  setState({ hasSellerActiveTrade })
}

export function setSellFlowLoading(isLoading: boolean) {
  setState({ isLoading })
}

export function setSellFlowActing(isActing: boolean) {
  setState({ isActing })
}

export function setSellFlowAllowDismiss(allowDismiss: boolean) {
  setState({ allowDismiss })
}

export function clearSellFlow() {
  setState({
    sellOrder: null,
    pendingRequest: null,
    hasSellerActiveTrade: false,
    isLoading: false,
    isActing: false,
    allowDismiss: false,
  })
}

export function clearSellFlowPending() {
  setState({ pendingRequest: null, allowDismiss: false })
}

/** 홈 등에서 PurchaseRequestSheet 재오픈 */
export function openPurchaseRequestSheet() {
  if (!state.pendingRequest?.buyer) return
  setState({ sheetReopenNonce: state.sheetReopenNonce + 1 })
}

export function useSellFlowState(): SellFlowState {
  return useSyncExternalStore(subscribeSellFlow, getSellFlowState, getSellFlowState)
}

export function useSellFlowUiState(): SellFlowUiState {
  return useSyncExternalStore(subscribeSellFlow, getSellFlowUiState, () => 'IDLE')
}
