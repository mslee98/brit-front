import type { TradeRequestRejectionReason } from '../../../orders/types'

export const REJECT_REASONS: Array<{
  code: TradeRequestRejectionReason
  label: string
}> = [
  { code: 'NOT_AVAILABLE_NOW', label: '지금 거래하기 어려워요' },
  { code: 'AMOUNT_NOT_PREFERRED', label: '다른 요청을 기다릴게요' },
  { code: 'OTHER', label: '기타' },
]

/** App Root 전역 시트용 — Activity z-index와 무관하게 최상단 */
export const GLOBAL_SHEET_LAYER_INDEX = 80
