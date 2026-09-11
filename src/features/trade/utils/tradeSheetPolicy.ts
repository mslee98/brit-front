import type { TradeRecord } from '../types'

/** bootstrapServerTrade 임시 레코드 — 역할이 확정되기 전 */
export function isBootstrapTradePlaceholder(
  trade: Pick<TradeRecord, 'version' | 'amountKrw'>,
): boolean {
  return trade.version === 0 && trade.amountKrw === 0
}

/** 판매자 입금 대기 — 풀페이지만 사용, 결제 시트 미사용 */
export function isSellerPaymentPendingWaiting(
  trade: Pick<TradeRecord, 'status' | 'role'>,
): boolean {
  return trade.status === 'PAYMENT_PENDING' && trade.role === 'SELLER'
}

/** 구매자 입금 지시 — 풀페이지만 사용, 결제 시트 미사용 */
export function isBuyerPaymentPendingInstruction(
  trade: Pick<TradeRecord, 'status' | 'role'>,
): boolean {
  return trade.status === 'PAYMENT_PENDING' && trade.role === 'BUYER'
}

/** 입금 대기/지시는 풀페이지 — 결제 시트 자동 오픈 금지 */
export function isPaymentPendingFullPage(
  trade: Pick<TradeRecord, 'status' | 'role'>,
): boolean {
  return isSellerPaymentPendingWaiting(trade) || isBuyerPaymentPendingInstruction(trade)
}

/** 판매자 입금 확인 — 풀페이지만 사용, 결제 시트 미사용 */
export function isSellerPaymentReportedConfirm(
  trade: Pick<TradeRecord, 'status' | 'role'>,
): boolean {
  return trade.status === 'PAYMENT_REPORTED' && trade.role === 'SELLER'
}

/** 구매자 입금 확인 대기 — 풀페이지만 사용, 결제 시트 미사용 */
export function isBuyerPaymentReportedWaiting(
  trade: Pick<TradeRecord, 'status' | 'role'>,
): boolean {
  return trade.status === 'PAYMENT_REPORTED' && trade.role === 'BUYER'
}

/** 입금 확인(판매자·구매자) 풀페이지 */
export function isPaymentReportedFullPage(
  trade: Pick<TradeRecord, 'status' | 'role'>,
): boolean {
  return isSellerPaymentReportedConfirm(trade) || isBuyerPaymentReportedWaiting(trade)
}

/** 결제 관련 풀페이지 — 시트 자동 오픈·잔존 시트 금지 */
export function isPaymentFullPage(
  trade: Pick<TradeRecord, 'status' | 'role'>,
): boolean {
  return isPaymentPendingFullPage(trade) || isPaymentReportedFullPage(trade)
}

/** 입금·확인 시트를 열 가치가 있는 상태인지 (타임아웃·분쟁) */
export function shouldOpenPaymentSheet(
  trade: Pick<TradeRecord, 'status' | 'role' | 'version' | 'amountKrw'>,
): boolean {
  // placeholder는 BUYER로 박혀 있어 판매자 진입 시 빈 「입금 대기」 시트가 뜨는 원인
  if (isBootstrapTradePlaceholder(trade)) return false
  if (isPaymentFullPage(trade)) return false
  if (trade.status === 'PAYMENT_TIMEOUT') return trade.role === 'SELLER'
  if (trade.status === 'DISPUTED') return true
  return false
}

export function getPaymentSheetAutoOpenKey(trade: Pick<TradeRecord, 'id' | 'status' | 'role'>): string {
  return `${trade.id}:${trade.status}:${trade.role}`
}
