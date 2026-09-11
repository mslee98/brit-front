import type { MatchingCandidate } from '../matching/types'

/** Exact 우선 → 완료 거래 수 내림차순 → reveal 순서 유지 */
export function sortMatchingCandidates(candidates: MatchingCandidate[]): MatchingCandidate[] {
  return candidates
    .map((candidate, index) => ({ candidate, index }))
    .sort((a, b) => {
      const aExact = a.candidate.matchType === 'EXACT' ? 0 : 1
      const bExact = b.candidate.matchType === 'EXACT' ? 0 : 1
      if (aExact !== bExact) return aExact - bExact
      if (b.candidate.tradeCount !== a.candidate.tradeCount) {
        return b.candidate.tradeCount - a.candidate.tradeCount
      }
      return a.index - b.index
    })
    .map(({ candidate }) => candidate)
}
