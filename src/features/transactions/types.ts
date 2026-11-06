/** 서버 `TransactionKind`. 원본 테이블 1곳에 대응한다. */
export type TransactionKind =
  | 'P2P_BUY'
  | 'P2P_SELL'
  | 'BRIT_PURCHASE'
  | 'PARTNER_CHARGE'
  | 'PARTNER_REDEEM'
  | 'ADMIN_ADJUSTMENT'

export type CoinDirection = 'IN' | 'OUT'

/** CHECKING은 분쟁·업체 대사 확인. 필터에서는 처리 중에 포함한다. */
export type TransactionStatus = 'COMPLETED' | 'PROCESSING' | 'CHECKING' | 'CANCELLED' | 'FAILED'

export type StatusFilterId = 'COMPLETED' | 'PROCESSING' | 'CANCELLED' | 'FAILED'

/** 칩 단위. BUY는 P2P 구매와 Brit 구매를 함께 본다. */
export type TransactionTypeFilter = 'ALL' | 'BUY' | 'SELL' | 'CHARGE' | 'REDEEM'

export type TransactionView = 'list' | 'calendar'

export interface YearMonth {
  year: number
  month: number
}

/** 금액은 서버 string bigint를 number로 바꾼 값 */
export interface TransactionItem {
  /** `trade-<uuid>` 처럼 출처 접두어가 붙는다 */
  id: string
  kind: TransactionKind
  direction: CoinDirection
  status: TransactionStatus
  coinAmount: number
  cashAmount: number | null
  pointAmount: number | null
  /** 끝난 시각. 진행 중이면 시작 시각 */
  occurredAt: string
  requestedAt: string
  completedAt: string | null
  referenceNumber: string | null
  tradeId: string | null
  counterpartyNickname: string | null
  partnerName: string | null
  assetName: string | null
}

export type TransactionTimelineStep =
  | 'REQUESTED'
  | 'PAYMENT_REPORTED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'

export interface TransactionDetail extends TransactionItem {
  bankName: string | null
  accountNumberMasked: string | null
  exchangeRate: { numerator: number; denominator: number } | null
  timeline: { step: TransactionTimelineStep; at: string }[]
}

export interface TransactionDaySummary {
  date: string
  inflow: number
  outflow: number
  net: number
  count: number
  hasOpen: boolean
}

export interface TransactionSummary {
  inflow: number
  outflow: number
  net: number
  count: number
  openCount: number
  byKind: Record<TransactionKind, number>
  byDay: TransactionDaySummary[]
}

export interface TransactionFilter {
  type: TransactionTypeFilter
  statuses: StatusFilterId[]
}
