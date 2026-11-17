import { httpGet, httpPost } from '../../shared/api/httpClient'

export type EmbedPaymentIntentStatus =
  | 'CREATED'
  | 'USER_AUTHORIZED'
  | 'PAYMENT_PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'

export interface EmbedPaymentIntent {
  intentId: string
  partnerName: string
  partnerCode: string
  partnerUserKeyMasked: string
  chargeAmountMs: string | null
  feeAmountMs: string | null
  totalDebitMs: string | null
  assetCode: string | null
  /** 충전 가능 잔액 (현행 nonSellable) */
  nonSellableBalanceMs: string | null
  /** true면 Embed에서 금액 선택·lock 필요 (D26) */
  needsAmount: boolean
  status: EmbedPaymentIntentStatus
  returnOrigin: string
  expiresAt: string
  productName: string | null
  canAuthorize: boolean
  blockReason: string | null
}

export interface EmbedPaymentIntentStatusResult {
  intentId: string
  status: EmbedPaymentIntentStatus
  returnOrigin: string
  partnerExchangeId: string | null
  failureCode: string | null
  failureMessage: string | null
}

const base = (id: string) => `/v1/embed/intents/${encodeURIComponent(id)}`

export function fetchPaymentIntent(intentId: string): Promise<EmbedPaymentIntent> {
  return httpGet<EmbedPaymentIntent>(base(intentId))
}

export function lockPaymentIntentAmount(
  intentId: string,
  amount: string,
): Promise<EmbedPaymentIntent> {
  return httpPost(base(intentId) + '/lock', { amount })
}

export function authorizePaymentIntent(
  intentId: string,
  pin: string,
): Promise<EmbedPaymentIntentStatusResult> {
  return httpPost(base(intentId) + '/authorize', { pin })
}

export function fetchPaymentIntentStatus(
  intentId: string,
): Promise<EmbedPaymentIntentStatusResult> {
  return httpGet(base(intentId) + '/status')
}

export function cancelPaymentIntent(
  intentId: string,
): Promise<EmbedPaymentIntentStatusResult> {
  return httpPost(base(intentId) + '/cancel')
}
