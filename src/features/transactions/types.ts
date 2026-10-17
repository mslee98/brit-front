export type HistoryKind =
  | 'USER_PURCHASE'
  | 'USER_SALE'
  | 'MERCHANT_CHARGE'
  | 'MERCHANT_REDEEM'

export type CoinDirection = 'IN' | 'OUT'

/** CHECKING은 대사 확인. 필터에서는 처리 중에 포함한다. */
export type HistoryStatus = 'COMPLETED' | 'PROCESSING' | 'CHECKING' | 'CANCELLED' | 'FAILED'

export type StatusFilterId = 'COMPLETED' | 'PROCESSING' | 'CANCELLED' | 'FAILED'

export type HistoryKindFilter = HistoryKind | 'ALL'

export interface YearMonth {
  year: number
  month: number
}

export interface HistoryTransaction {
  id: string
  kind: HistoryKind
  status: HistoryStatus
  /** 절대값. 부호는 kind의 Coin 방향으로 정한다. */
  coinAmount: number
  cashAmount?: number
  pointAmount?: number
  counterpartyName?: string
  pointName?: string
  bankName?: string
  accountMask?: string
  /** `YYYY-MM-DDTHH:mm:ss+09:00`. 날짜는 문자열 기준으로 자른다. */
  occurredAt: string
  tradeNumber: string
}
