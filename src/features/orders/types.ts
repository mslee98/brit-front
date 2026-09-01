/** Nest P0-4/P0-5 Browse+Select + Apply/Accept 주문·매칭 응답 타입 */

export type BuyOrderStatus =
  | 'MATCHING'
  | 'REQUEST_PENDING'
  | 'MATCHED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'

export type SellOrderStatus =
  | 'OPEN'
  | 'PARTIALLY_MATCHED'
  | 'FULLY_RESERVED'
  | 'COMPLETED'
  | 'CANCELLED'

export type BuyMatchType = 'EXACT' | 'NEAR'

export type TradeRequestStatus =
  | 'PENDING_SELLER'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED_BY_BUYER'

export type TradeRequestRejectionReason =
  | 'NOT_AVAILABLE_NOW'
  | 'AMOUNT_NOT_PREFERRED'
  | 'OTHER'

export interface BuyOrderDto {
  id: string
  orderNumber: string
  coinAmount: string
  matchedCoinAmount: string | null
  matchType: BuyMatchType | null
  status: BuyOrderStatus
  rematchCount: number
  nextMatchableAt: string | null
  createdAt: string
  matchedAt: string | null
  completedAt: string | null
  cancelledAt: string | null
}

export interface MatchingStatusCandidateSummaryDto {
  exactCount: number
  nearCount: number
}

export interface MatchingStatusTradeRequestDto {
  id: string
  status: TradeRequestStatus
  expiresAt: string
}

export interface MatchingStatusDto {
  buyOrderId: string
  orderId: string
  status: BuyOrderStatus
  attemptCount: number
  matched: boolean
  tradeId: string | null
  candidateSummary: MatchingStatusCandidateSummaryDto | null
  tradeRequest?: MatchingStatusTradeRequestDto | null
}

export interface MatchingCandidateSellerDto {
  nicknameMasked: string
  completedTradeCount: number
}

export interface MatchingCandidateItemDto {
  sellOrderId: string
  matchType: BuyMatchType
  coinAmount: string
  differenceAmount: string
  seller: MatchingCandidateSellerDto
  createdAt: string
}

export interface MatchingCandidatesDto {
  buyOrder: {
    id: string
    status: BuyOrderStatus
    requestedCoinAmount: string
  }
  summary: {
    exactCount: number
    nearCount: number
    updatedAt: string
  }
  candidates: MatchingCandidateItemDto[]
  nextCursor: string | null
}

/** Apply / match 공통 요청 body */
export interface ApplyBuyOrderRequest {
  sellOrderId: string
  expectedMatchType: BuyMatchType
  expectedCoinAmount: string
}

/** @deprecated Front는 applyBuyOrder 사용. 타입만 호환 유지 */
export type MatchBuyOrderRequest = ApplyBuyOrderRequest

export interface ApplyBuyOrderResponseDto {
  tradeRequestId: string
  buyOrderId: string
  status: TradeRequestStatus
  expiresAt: string
  match: {
    type: BuyMatchType
    coinAmount: string
  }
}

/** @deprecated */
export interface MatchBuyOrderResponseDto {
  buyOrderId: string
  tradeId: string
  match: {
    type: BuyMatchType
    coinAmount: string
  }
  tradeStatus: string
}

export interface TradeRequestDto {
  id: string
  buyOrderId: string
  sellOrderId: string
  status: TradeRequestStatus
  match: {
    type: BuyMatchType
    coinAmount: string
  }
  expiresAt: string
  tradeId: string | null
  rejectionReasonCode: TradeRequestRejectionReason | null
}

export interface AcceptTradeRequestResponseDto {
  tradeRequestId: string
  tradeId: string
  tradeStatus: string
  match: {
    type: BuyMatchType
    coinAmount: string
  }
}

export interface RejectTradeRequestRequest {
  reasonCode: TradeRequestRejectionReason
}

export interface SellOrderAmountDto {
  original: string
  remaining: string
  reserved: string
  completed: string
  cancelled: string
  minimumTrade: string
}

export interface SellOrderDto {
  id: string
  orderNumber: string
  status: SellOrderStatus
  amount: SellOrderAmountDto
  policy: { minSplitRatio: number }
  createdAt: string
  completedAt: string | null
  cancelledAt: string | null
}

export interface PaginationMetaDto {
  page: number
  size: number
  totalItems: number
  totalPages: number
}

export interface PaginatedResponseDto<T> {
  items: T[]
  pagination: PaginationMetaDto
}

export interface ListMyBuyOrdersParams {
  status?: BuyOrderStatus
  page?: number
  size?: number
  signal?: AbortSignal
}

export interface ListMySellOrdersParams {
  status?: SellOrderStatus
  page?: number
  size?: number
  signal?: AbortSignal
}
