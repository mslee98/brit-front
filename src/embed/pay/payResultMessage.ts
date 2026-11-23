/**
 * 업체 창(window.opener)에 충전 Intent 결과를 알린다.
 * targetOrigin은 Intent 생성 시 등록한 returnOrigin만 쓴다.
 */
/** PROCESSING = 처리·확인 중 닫기. 실패/취소가 아님 (§8.4). */
export type PayResultStatus = 'COMPLETED' | 'CANCELLED' | 'ERROR' | 'PROCESSING'

export interface PayResultMessage {
  type: 'BRIT_PAY_RESULT'
  status: PayResultStatus
  intentId?: string
  errorCode?: string
}

export function postPayResult(
  returnOrigin: string,
  message: Omit<PayResultMessage, 'type'>,
): boolean {
  const opener = window.opener as Window | null
  if (!opener || opener.closed) return false
  const payload: PayResultMessage = { type: 'BRIT_PAY_RESULT', ...message }
  opener.postMessage(payload, returnOrigin)
  return true
}

const INTENT_STORAGE_KEY = 'brit-embed-pay-intent'

/**
 * 팝업 URL의 `#intent=` id를 읽고 주소창에서 지운다.
 */
export function takeIntentIdFromHash(): string | null {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const fromHash = params.get('intent')?.trim() || null
  if (fromHash) {
    window.sessionStorage.setItem(INTENT_STORAGE_KEY, fromHash)
    window.history.replaceState(null, '', window.location.pathname)
    return fromHash
  }
  return window.sessionStorage.getItem(INTENT_STORAGE_KEY)
}

export function forgetIntentId() {
  window.sessionStorage.removeItem(INTENT_STORAGE_KEY)
}
