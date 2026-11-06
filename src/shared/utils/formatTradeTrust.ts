export interface TradeTrustStats {
  completedTradeCount?: number | null
  completionRatePct?: number | null
  disputeCount?: number | null
}

export const TRADE_TRUST_EMPTY = '거래 이력 없음'

const count = (value: number) => value.toLocaleString('ko-KR')

/**
 * 거래 상대 신뢰 요약 한 줄 — `완료 거래 N건 · 완료율 N% · 분쟁 N건`.
 * 완료율은 완료 거래가 있을 때만 (0건 + 100% 금지). 보여 줄 이력이 없으면 null.
 */
export function formatTradeTrustLine({
  completedTradeCount,
  completionRatePct,
  disputeCount,
}: TradeTrustStats): string | null {
  const completed = completedTradeCount ?? 0
  const disputes = disputeCount ?? 0
  if (completed <= 0 && disputes <= 0) return null

  const parts = [`완료 거래 ${count(completed)}건`]
  if (completed > 0 && typeof completionRatePct === 'number') {
    parts.push(`완료율 ${completionRatePct}%`)
  }
  if (typeof disputeCount === 'number') {
    parts.push(`분쟁 ${count(disputeCount)}건`)
  }
  return parts.join(' · ')
}
