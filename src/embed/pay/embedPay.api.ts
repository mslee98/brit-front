import { httpGet, httpPost } from '../../shared/api/httpClient'

export type EmbedPaymentIntentStatus =
  | 'CREATED'
  | 'USER_AUTHORIZED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'

export interface EmbedPaymentIntent {
  intentId: string
  partnerName: string
  partnerCode: string
  partnerUserKeyMasked: string
  chargeAmountMs: string
  feeAmountMs: string
  totalDebitMs: string
  assetCode: string | null
  nonSellableBalanceMs: string | null
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

export function authorizePaymentIntent(
  intentId: string,
  pin: string,
): Promise<EmbedPaymentIntentStatusResult> {
  return httpPost(base(intentId) + '/authorize', { pin })
}

export function cancelPaymentIntent(
  intentId: string,
): Promise<EmbedPaymentIntentStatusResult> {
  return httpPost(base(intentId) + '/cancel')
}
