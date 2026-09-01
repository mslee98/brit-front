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

/** Near row용 — `13,000 Coin 적음` / `10,000 Coin 많음` */
export function formatNearAmountDelta(
  requestedAmountKrw: number,
  candidateAmountKrw: number,
): string | null {
  const delta = candidateAmountKrw - requestedAmountKrw
  if (delta === 0) return null
  if (delta < 0) {
    return `${formatCoinAmount(-delta)} 적음`
  }
  return `${formatCoinAmount(delta)} 많음`
}
