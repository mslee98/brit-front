import { useCallback, useEffect, useRef, useState } from 'react'

import type { MatchingCandidate } from '../matching/types'

const NEAR_TOP_SCROLL_Y = 80

/**
 * 스크롤 중 새 후보는 pending에 쌓고, 상단 근처면 즉시 노출.
 * V2 스냅샷/infinite query 자리 예약용 훅.
 */
export function useMatchingPendingReveal(params: {
  revealedCandidates: MatchingCandidate[]
  scrollY: number
}) {
  const [pendingRevealIds, setPendingRevealIds] = useState<string[]>([])
  const knownIdsRef = useRef<Set<string>>(new Set())
  const scrollYRef = useRef(params.scrollY)
  scrollYRef.current = params.scrollY

  useEffect(() => {
    const known = knownIdsRef.current
    const freshIds: string[] = []

    for (const candidate of params.revealedCandidates) {
      if (known.has(candidate.id)) continue
      known.add(candidate.id)
      freshIds.push(candidate.id)
    }

    if (freshIds.length === 0) return

    if (scrollYRef.current <= NEAR_TOP_SCROLL_Y) return

    setPendingRevealIds((prev) => [...prev, ...freshIds])
  }, [params.revealedCandidates])

  const visibleCandidates = params.revealedCandidates.filter(
    (candidate) => !pendingRevealIds.includes(candidate.id),
  )

  const applyPending = useCallback(() => {
    setPendingRevealIds([])
  }, [])

  const pendingCount = pendingRevealIds.length
  const pendingExactCount = params.revealedCandidates.filter(
    (candidate) =>
      pendingRevealIds.includes(candidate.id) && candidate.matchType === 'EXACT',
  ).length
  const pendingNearCount = pendingCount - pendingExactCount

  return {
    visibleCandidates,
    pendingRevealIds,
    pendingCount,
    pendingExactCount,
    pendingNearCount,
    applyPending,
  }
}
