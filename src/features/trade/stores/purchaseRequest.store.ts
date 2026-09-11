/**
 * @deprecated sellFlow.store 사용. 구 purchaseRequest 큐 API 호환 래퍼.
 */
import type { TradeRequestDto } from '../../orders/types'
import {
  clearSellFlow,
  clearSellFlowPending,
  getSellFlowState,
  setSellFlowActing,
  setSellFlowAllowDismiss,
  setSellFlowSnapshot,
  subscribeSellFlow,
  useSellFlowState,
} from './sellFlow.store'

export function getPurchaseRequestState() {
  const s = getSellFlowState()
  return {
    queue: s.pendingRequest ? [s.pendingRequest] : [],
    isActing: s.isActing,
    allowDismiss: s.allowDismiss,
  }
}

export function getCurrentPurchaseRequest(): TradeRequestDto | null {
  return getSellFlowState().pendingRequest
}

export function setPurchaseRequestQueue(requests: TradeRequestDto[]) {
  const next = requests.find((r) => r.buyer != null) ?? null
  setSellFlowSnapshot({
    sellOrder: getSellFlowState().sellOrder,
    pendingRequest: next,
  })
}

export function removePurchaseRequest(_requestId: string) {
  clearSellFlowPending()
}

export function setPurchaseRequestActing(isActing: boolean) {
  setSellFlowActing(isActing)
}

export function setPurchaseRequestAllowDismiss(allowDismiss: boolean) {
  setSellFlowAllowDismiss(allowDismiss)
}

export function clearPurchaseRequestQueue() {
  clearSellFlow()
}

export function usePurchaseRequestState() {
  const s = useSellFlowState()
  return {
    queue: s.pendingRequest ? [s.pendingRequest] : [],
    isActing: s.isActing,
    allowDismiss: s.allowDismiss,
  }
}

export function useCurrentPurchaseRequest(): TradeRequestDto | null {
  return useSellFlowState().pendingRequest
}

export function subscribePurchaseRequest(listener: () => void) {
  return subscribeSellFlow(listener)
}
