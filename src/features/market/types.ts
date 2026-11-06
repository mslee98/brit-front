/** Nest Market API (GET /v1/market/*) + FE 확장 필드(후속 API) */

export interface MarketSummaryDto {
  availableSellOrderCount: number
  availableCoinAmount: string
}

export interface MarketSellerDto {
  nickname: string
  /** API 보강 필드. 구버전/누락 시 통계 한 줄 숨김 */
  completedTradeCount?: number
  /** settled 이력 없으면 API null — 완료율 문구 생략 */
  completionRatePct?: number | null
  disputeCount?: number
  isNewSeller?: boolean
  /** viewer 기준 — 후속(인증 컨텍스트) */
  hasTradedBefore?: boolean
}

export interface MarketSellOrderItemDto {
  sellOrderId: string
  seller: MarketSellerDto
  remainingCoinAmount: string
  minimumTradeAmount: string
  createdAt: string
}

export interface MarketPaginationMeta {
  page: number
  size: number
  totalItems: number
  totalPages: number
}

export interface MarketSellOrderListDto {
  items: MarketSellOrderItemDto[]
  pagination: MarketPaginationMeta
}

/** 거래소 목록에서 고른 매도글 (확인 시트용) */
export interface MarketListing {
  sellOrderId: string
  seller: MarketSellerDto
  /** 거래소는 잔량 전체를 EXACT로 요청 — 최소 거래 단위는 구매자에게 의미 없음 */
  remainingCoinAmount: number
}

export type MarketMode = 'buy' | 'sell'

export type MarketSortId =
  | 'recommended'
  | 'amountAsc'
  | 'amountDesc'
  | 'recent'
