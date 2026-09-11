/**
 * Trade domain types — source of truth for side/status/split.
 */

// ─────────────────────────────────────────────
// 서버 응답 타입 (brit-api TradeResponseDto 기준)
// ─────────────────────────────────────────────

/** 서버 trade_status enum 값 */
export type ServerTradeStatus =
  | 'WAITING_BUYER_PAYMENT'
  | 'PAYMENT_TIMEOUT'
  | 'WAITING_SELLER_CONFIRMATION'
  | 'COIN_TRANSFERRING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED'

export interface ServerTradeActions {
  canReportPayment: boolean
  canConfirmPayment: boolean
  canCancel: boolean
  canRequestCancellation: boolean
  canAgreeCancellation: boolean
  canReportRefund: boolean
  canConfirmRefund: boolean
  canMarkUnpaid: boolean
  canOpenDispute: boolean
}

export interface ServerTradePayment {
  /** banks.code — 구버전 응답에는 없을 수 있음 */
  bankCode?: string
  bankName: string
  iconUrl?: string | null
  accountNumber: string
  accountHolderName: string
  dueAt: string
}

export interface ServerTradeCounterparty {
  nickname: string
}

export interface ServerTradeResponse {
  tradeId: string
  tradeNumber: string
  role: 'BUYER' | 'SELLER'
  status: ServerTradeStatus
  coinAmount: string
  paymentAmount: string
  payment: ServerTradePayment | null
  counterparty?: ServerTradeCounterparty
  actions: ServerTradeActions
  buyerPaymentDueAt: string
  sellerConfirmationDueAt: string | null
  createdAt: string
  alreadyReported?: boolean
  alreadyConfirmed?: boolean
  alreadyCancelled?: boolean
}

export interface ServerTradeListItem {
  tradeId: string
  tradeNumber: string
  role: 'BUYER' | 'SELLER'
  status: ServerTradeStatus
  coinAmount: string
  createdAt: string
}

/** 목록 API 응답 → TradeRecord (홈 리스트·hydration용 최소 필드) */
export function serverListItemToTradeRecord(dto: ServerTradeListItem): TradeRecord {
  const status = serverStatusToClientStatus(dto.status)
  const coinAmount = Number(dto.coinAmount)
  return {
    id: dto.tradeId,
    tradeId: dto.tradeId,
    tradeNumber: dto.tradeNumber,
    side: dto.role === 'BUYER' ? 'BUY' : 'SELL',
    role: dto.role,
    status,
    serverStatus: dto.status,
    coinAmount,
    paymentAmount: coinAmount,
    amountKrw: coinAmount,
    version: Date.now(),
    matchingStartedAt: dto.createdAt,
    updatedAt: dto.createdAt,
    createdAt: dto.createdAt,
  }
}

/**
 * 서버 상태 → 프론트 TradeStatus 매핑
 * COIN_TRANSFERRING은 아직 완료가 아니므로 PAYMENT_REPORTED로 표시 (판매자가 확인함 = 이전 중)
 */
export function serverStatusToClientStatus(serverStatus: ServerTradeStatus): TradeStatus {
  switch (serverStatus) {
    case 'WAITING_BUYER_PAYMENT':
      return 'PAYMENT_PENDING'
    case 'PAYMENT_TIMEOUT':
      return 'PAYMENT_TIMEOUT'
    case 'WAITING_SELLER_CONFIRMATION':
      return 'PAYMENT_REPORTED'
    case 'COIN_TRANSFERRING':
      return 'COIN_TRANSFERRING'
    case 'COMPLETED':
      return 'COMPLETED'
    case 'CANCELLED':
      return 'CANCELLED'
    case 'DISPUTED':
      return 'DISPUTED'
  }
}

/** 서버 actions → 프론트 TradeAction[] 매핑 */
export function serverActionsToClientActions(actions: ServerTradeActions): TradeAction[] {
  const result: TradeAction[] = []
  if (actions.canReportPayment) result.push('REPORT_PAYMENT')
  if (actions.canConfirmPayment) result.push('CONFIRM_PAYMENT')
  if (actions.canCancel) result.push('CANCEL')
  if (actions.canMarkUnpaid) result.push('MARK_UNPAID')
  if (actions.canRequestCancellation) result.push('REQUEST_CANCELLATION')
  if (actions.canAgreeCancellation) result.push('AGREE_CANCELLATION')
  if (actions.canReportRefund) result.push('REPORT_REFUND')
  if (actions.canConfirmRefund) result.push('CONFIRM_REFUND')
  return result
}

/** 서버 응답 → TradeRecord 변환 */
export function serverResponseToTradeRecord(dto: ServerTradeResponse): TradeRecord {
  const status = serverStatusToClientStatus(dto.status)
  return {
    id: dto.tradeId,
    tradeId: dto.tradeId,
    tradeNumber: dto.tradeNumber,
    side: dto.role === 'BUYER' ? 'BUY' : 'SELL',
    role: dto.role,
    status,
    serverStatus: dto.status,
    coinAmount: Number(dto.coinAmount),
    paymentAmount: Number(dto.paymentAmount),
    amountKrw: Number(dto.paymentAmount),
    // version은 서버에서 내려오지 않으므로 타임스탬프 기반으로 단조 증가
    version: Date.now(),
    matchingStartedAt: dto.createdAt,
    updatedAt: new Date().toISOString(),
    createdAt: dto.createdAt,
    paymentDeadline: dto.buyerPaymentDueAt ?? undefined,
    sellerConfirmDeadline: dto.sellerConfirmationDueAt ?? undefined,
    payment: dto.payment ?? undefined,
    counterpartyNickname: dto.counterparty?.nickname,
    serverActions: dto.actions,
  }
}

export type TradeSide = 'BUY' | 'SELL'

export type TradeStatus =
  | 'MATCHING'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_TIMEOUT'
  | 'PAYMENT_REPORTED'
  | 'COIN_TRANSFERRING'
  | 'DISPUTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'

export type SplitMode = 'AUTO' | 'CUSTOM' | 'NONE'

export type TradeRole = 'BUYER' | 'SELLER'

export type TradeAction =
  | 'REPORT_PAYMENT'
  | 'CONFIRM_PAYMENT'
  | 'DENY_PAYMENT'
  | 'CANCEL'
  | 'MARK_UNPAID'
  | 'REQUEST_CANCELLATION'
  | 'AGREE_CANCELLATION'
  | 'REPORT_REFUND'
  | 'CONFIRM_REFUND'
  | 'CONTINUE'

export type SplitLegStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

export interface SplitLeg {
  index: number
  tradeId: string
  amountKrw: number
  status: SplitLegStatus
}

export interface SplitGroup {
  id: string
  side: TradeSide
  totalAmountKrw: number
  unitAmountKrw: number
  totalLegs: number
  completedLegs: number
  legs: SplitLeg[]
  createdAt: string
}

export interface TradeRecord {
  id: string
  /** 서버에서 받은 tradeId (id와 동일, 명시적으로 보관) */
  tradeId?: string
  tradeNumber?: string
  side: TradeSide
  role: TradeRole
  status: TradeStatus
  /** 서버 원본 status (COIN_TRANSFERRING 등 클라이언트 매핑 전) */
  serverStatus?: ServerTradeStatus
  amountKrw: number
  coinAmount: number
  paymentAmount?: number
  version: number
  matchingStartedAt: string
  updatedAt: string
  createdAt?: string
  paymentDeadline?: string
  /** 구매자 입금 보고 후 판매자 확인 기한 */
  sellerConfirmDeadline?: string
  reportedAt?: string
  completedAt?: string
  splitGroupId?: string
  splitLegIndex?: number
  splitTotalLegs?: number
  /** 서버에서 받은 입금 계좌 정보 (구매자용) */
  payment?: ServerTradePayment
  /** 상대방 닉네임 (서버 응답) */
  counterpartyNickname?: string
  /** 서버 actions 원본 */
  serverActions?: ServerTradeActions
}

export interface TradeDetailViewModel extends TradeRecord {
  actions: TradeAction[]
  counterpartyNickname: string
  sellerAccount?: {
    bankCode?: string
    bankName: string
    iconUrl?: string | null
    accountNumber: string
    accountNumberMasked: string
    holderName: string
  }
  /** 서버 actions 원본 (세부 분기용) */
  serverActions?: ServerTradeActions
}

export interface CreateTradeOrderInput {
  side: TradeSide
  amountKrw: number
  splitMode?: SplitMode
  /** splitMode CUSTOM일 때 한 거래당 단위 금액 */
  unitAmountKrw?: number
}

export interface CreateTradeOrderResult {
  trade: TradeRecord
  splitGroupId?: string
}
