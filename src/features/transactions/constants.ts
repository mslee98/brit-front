import type { HistoryKind, StatusFilterId } from './types'

export const HISTORY_KINDS: HistoryKind[] = [
  'USER_PURCHASE',
  'USER_SALE',
  'MERCHANT_CHARGE',
  'MERCHANT_REDEEM',
]

export const HISTORY_KIND_LABEL: Record<HistoryKind, string> = {
  USER_PURCHASE: '사용자 구매',
  USER_SALE: '사용자 판매',
  MERCHANT_CHARGE: '업체 충전',
  MERCHANT_REDEEM: '업체 환전',
}

export const HISTORY_KIND_CHIP_LABEL: Record<HistoryKind, string> = {
  USER_PURCHASE: '구매',
  USER_SALE: '판매',
  MERCHANT_CHARGE: '충전',
  MERCHANT_REDEEM: '환전',
}

export const STATUS_FILTERS: { id: StatusFilterId; label: string }[] = [
  { id: 'COMPLETED', label: '완료' },
  { id: 'PROCESSING', label: '처리 중' },
  { id: 'CANCELLED', label: '취소' },
  { id: 'FAILED', label: '실패' },
]

export const ALL_STATUS_FILTERS: StatusFilterId[] = STATUS_FILTERS.map((item) => item.id)
