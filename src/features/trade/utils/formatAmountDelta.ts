import { formatAmountNumber, formatCoinAmount } from '../../../shared/utils/formatAmount'

export function formatAmountDelta(
  requestedAmountKrw: number,
  candidateAmountKrw: number,
): string | null {
  const delta = requestedAmountKrw - candidateAmountKrw
  if (delta === 0) return null
  if (delta > 0) {
    return `내 요청보다 ${formatAmountNumber(delta)}원 낮아요`
  }
  return `내 요청보다 ${formatAmountNumber(-delta)}원 높아요`
}

/** Near row용 — `요청보다 20,000 적어요` / `요청보다 5,000 많아요` */
export function formatNearAmountDelta(
  requestedAmountKrw: number,
  candidateAmountKrw: number,
): string | null {
  const delta = candidateAmountKrw - requestedAmountKrw
  if (delta === 0) return null
  if (delta < 0) {
    return `요청보다 ${formatCoinAmount(-delta)} 적어요`
  }
  return `요청보다 ${formatCoinAmount(delta)} 많아요`
}

export const MATCHING_EXACT_MATCH_LABEL = '정확히 일치'
