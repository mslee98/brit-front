/**
 * MatchingSellerRowList — matching 후보 → SellOrderList 어댑터.
 */
import { Text } from '@seed-design/react'

import { SellOrderList } from '../../orders/components/SellOrderList'
import { MATCHING_TYPOGRAPHY } from '../constants/matchingTypography'
import { getMatchingProposalSellerDetail } from '../copy'
import type { MatchingCandidate } from '../matching/types'
import { formatNearAmountDelta } from '../utils/formatAmountDelta'

interface MatchingSellerRowListProps {
  candidates: MatchingCandidate[]
  requestedAmountKrw: number
  animate: boolean
  disabled?: boolean
  /** 신규 후보 id — 「새 제안」 badge */
  newCandidateIds?: ReadonlySet<string>
  emptyMessage?: string
  onSelect?: (candidate: MatchingCandidate) => void
}

export function MatchingSellerRowList({
  candidates,
  requestedAmountKrw,
  animate,
  disabled,
  newCandidateIds,
  emptyMessage = '아직 후보가 없어요. 계속 찾고 있어요.',
  onSelect,
}: MatchingSellerRowListProps) {
  if (candidates.length === 0) {
    return (
      <Text textStyle={MATCHING_TYPOGRAPHY.helper} color="fg.neutralMuted" style={{ padding: '16px 0' }}>
        {emptyMessage}
      </Text>
    )
  }

  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]))

  return (
    <SellOrderList
      mode="matching"
      animate={animate}
      disabled={disabled}
      emptyMessage={emptyMessage}
      onSelect={(id) => {
        const candidate = byId.get(id)
        if (candidate) onSelect?.(candidate)
      }}
      items={candidates.map((candidate) => ({
        id: candidate.id,
        nickname: candidate.nickname,
        completedTradeCount: candidate.tradeCount,
        completionRatePct: candidate.completionRatePct,
        trustDetail: getMatchingProposalSellerDetail(
          candidate.tradeCount,
          candidate.completionRatePct,
        ),
        amountKrw: candidate.amountKrw,
        differenceLabel:
          candidate.matchType === 'NEAR'
            ? formatNearAmountDelta(requestedAmountKrw, candidate.amountKrw)
            : null,
        isNew: newCandidateIds?.has(candidate.id) ?? false,
      }))}
    />
  )
}
