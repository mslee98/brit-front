import type {
  StatusFilterId,
  TransactionKind,
  TransactionStatus,
  TransactionTypeFilter,
} from './types'

export const TRANSACTION_KINDS: TransactionKind[] = [
  'P2P_BUY',
  'P2P_SELL',
  'BRIT_PURCHASE',
  'PARTNER_CHARGE',
  'PARTNER_REDEEM',
  'ADMIN_ADJUSTMENT',
]

/** 분석·상세 머리말용 종류 이름 */
export const TRANSACTION_KIND_LABEL: Record<TransactionKind, string> = {
  P2P_BUY: '구매',
  P2P_SELL: '판매',
  BRIT_PURCHASE: 'Brit 구매',
  PARTNER_CHARGE: '포인트 충전',
  PARTNER_REDEEM: '포인트 환전',
  ADMIN_ADJUSTMENT: 'Coin 조정',
}

export const TRANSACTION_TYPE_FILTERS: { id: TransactionTypeFilter; label: string }[] = [
  { id: 'ALL', label: '전체' },
  { id: 'BUY', label: '구매' },
  { id: 'SELL', label: '판매' },
  { id: 'CHARGE', label: '충전' },
  { id: 'REDEEM', label: '환전' },
]

export const TYPE_FILTER_KINDS: Record<Exclude<TransactionTypeFilter, 'ALL'>, TransactionKind[]> = {
  BUY: ['P2P_BUY', 'BRIT_PURCHASE'],
  SELL: ['P2P_SELL'],
  CHARGE: ['PARTNER_CHARGE'],
  REDEEM: ['PARTNER_REDEEM'],
}

export const STATUS_FILTERS: { id: StatusFilterId; label: string }[] = [
  { id: 'COMPLETED', label: '완료' },
  { id: 'PROCESSING', label: '처리 중' },
  { id: 'CANCELLED', label: '취소' },
  { id: 'FAILED', label: '실패' },
]

export const ALL_STATUS_FILTERS: StatusFilterId[] = STATUS_FILTERS.map((item) => item.id)

export const OPEN_STATUSES: TransactionStatus[] = ['PROCESSING', 'CHECKING']

export const TRANSACTION_PAGE_SIZE = 30
