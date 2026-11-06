import { formatAmountNumber } from '../../../shared/utils/formatAmount'

export type AmountDeltaDirection = 'more' | 'less'

export interface AmountDelta {
  label: string
  direction: AmountDeltaDirection
}

/** 많으면 빨강, 적으면 파랑 — 국내 금융 화면의 오름/내림 관례 */
export const AMOUNT_DELTA_COLOR = {
  more: 'fg.critical',
  less: 'fg.informative',
} as const satisfies Record<AmountDeltaDirection, string>

/** 후보 금액이 내 요청과 다를 때 — `요청보다 10,000원 많아요` / `요청보다 5,000원 적어요` */
export function getAmountDelta(
  requestedAmountKrw: number,
  candidateAmountKrw: number,
): AmountDelta | null {
  const delta = candidateAmountKrw - requestedAmountKrw
  if (delta === 0) return null
  if (delta < 0) {
    return { label: `요청보다 ${formatAmountNumber(-delta)}원 적어요`, direction: 'less' }
  }
  return { label: `요청보다 ${formatAmountNumber(delta)}원 많아요`, direction: 'more' }
}

export const MATCHING_EXACT_MATCH_LABEL = '정확히 일치'
