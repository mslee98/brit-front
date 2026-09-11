import { useCallback, useEffect, useRef, useState } from 'react'

import {
  useMatchingSession,
  useMatchingSessionActions,
} from '../matching/hooks/useMatchingSession'
import { isQueueLocked } from '../matching/utils/matchingPhase'
import type { MatchingCandidate } from '../matching/types'

interface UseMatchingAcceptSheetOptions {
  enabled: boolean
  tradeId: string | null
  /** false면 Exact 자동 오픈을 미룸. 행 탭 오픈은 유지. 기본 true */
  autoOpenReady?: boolean
}

/**
 * 매칭 확인 시트 — Exact 최초 suggestion만 자동 오픈.
 * 닫기 = 목록 유지 / 건너뛰기 = dismiss.
 */
export function useMatchingAcceptSheet({
  enabled,
  tradeId,
  autoOpenReady = true,
}: UseMatchingAcceptSheetOptions) {
  const matchingSession = useMatchingSession()
  const { proposeMatch, consumeSuggestion, skipCandidate } = useMatchingSessionActions()
  const [open, setOpen] = useState(false)
  const [candidate, setCandidate] = useState<MatchingCandidate | null>(null)
  const blockedAutoOpenIdsRef = useRef<Set<string>>(new Set())
  const lastAutoOpenedIdRef = useRef<string | null>(null)

  const queueLocked = isQueueLocked(matchingSession)

  const resolveExactSuggestionCandidate = useCallback(() => {
    if (!matchingSession?.suggestion || queueLocked) return null
    if (matchingSession.suggestion.reason !== 'EXACT_REVEALED') return null
    if (tradeId && matchingSession.tradeId !== tradeId) return null

    const next =
      matchingSession.candidates.find(
        (item) => item.id === matchingSession.suggestion?.candidateId,
      ) ?? null

    if (!next || next.matchType !== 'EXACT') return null
    if (blockedAutoOpenIdsRef.current.has(next.id)) return null
    return next
  }, [matchingSession, queueLocked, tradeId])

  const openAcceptForCandidate = useCallback(
    (nextCandidate: MatchingCandidate) => {
      if (queueLocked) return
      setCandidate(nextCandidate)
      setOpen(true)
    },
    [queueLocked],
  )

  useEffect(() => {
    if (!enabled || !autoOpenReady || queueLocked) return

    const suggestionId = matchingSession?.suggestion?.candidateId
    if (!suggestionId) return
    if (lastAutoOpenedIdRef.current === suggestionId) return

    const nextCandidate = resolveExactSuggestionCandidate()
    if (!nextCandidate) return

    lastAutoOpenedIdRef.current = suggestionId
    setCandidate(nextCandidate)
    setOpen(true)
  }, [
    autoOpenReady,
    enabled,
    matchingSession?.suggestion,
    queueLocked,
    resolveExactSuggestionCandidate,
  ])

  useEffect(() => {
    if (enabled) return
    setOpen(false)
    setCandidate(null)
    lastAutoOpenedIdRef.current = null
    blockedAutoOpenIdsRef.current = new Set()
  }, [enabled])

  const closeSheet = useCallback(() => {
    if (candidate) {
      blockedAutoOpenIdsRef.current.add(candidate.id)
    }
    consumeSuggestion()
    setCandidate(null)
    setOpen(false)
  }, [candidate, consumeSuggestion])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setOpen(true)
        return
      }
      closeSheet()
    },
    [closeSheet],
  )

  const handleConfirm = useCallback(
    async (candidateId: string) => {
      proposeMatch(candidateId)
      consumeSuggestion()
      blockedAutoOpenIdsRef.current.add(candidateId)
      setCandidate(null)
      setOpen(false)
    },
    [consumeSuggestion, proposeMatch],
  )

  const handleSkip = useCallback(
    (candidateId: string) => {
      skipCandidate(candidateId)
      blockedAutoOpenIdsRef.current.add(candidateId)
      setCandidate(null)
      setOpen(false)
    },
    [skipCandidate],
  )

  return {
    acceptOpen: open,
    acceptCandidate: candidate,
    onAcceptOpenChange: handleOpenChange,
    onAcceptConfirm: handleConfirm,
    onAcceptSkip: handleSkip,
    openAcceptForCandidate,
  }
}
