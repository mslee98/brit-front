import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ScrollFog, Text, VStack } from '@seed-design/react'

import { TextLinkButton } from '../../../shared/components/TextLinkButton'
import { formatCoinAmount } from '../../../shared/utils/formatAmount'
import {
  useMatchingSession,
  useMatchingSessionActions,
} from '../matching/hooks/useMatchingSession'
import type { MatchingCandidate } from '../matching/types'
import {
  getVisibleRevealedCandidates,
  hasRevealedExact,
  isQueueLocked,
} from '../matching/utils/matchingPhase'
import type { TradeRecord } from '../types'
import {
  formatMatchingCountdown,
  getMatchingHeroCopy,
  getMatchingLiveAnnounce,
  getMatchingUiMode,
  MATCHING_EMPTY_SEARCHING_DESCRIPTION,
  MATCHING_EMPTY_SEARCHING_TITLE,
} from '../copy'
import { MATCHING_TYPOGRAPHY } from '../constants/matchingTypography'
import { useMatchingDensity } from '../hooks/useMatchingDensity'
import type { MatchingDensity } from '../hooks/useMatchingDensity'
import { useMatchingHeroMode } from '../hooks/useMatchingHeroMode'
import { useMatchingNow } from '../hooks/useMatchingNow'
import { useMatchingPendingReveal } from '../hooks/useMatchingPendingReveal'
import { sortMatchingCandidates } from '../utils/sortMatchingCandidates'
import { MatchingAdaptiveHero } from './MatchingAdaptiveHero'
import { MatchingCandidateHeader } from './MatchingCandidateHeader'
import { MatchingCompactCondition } from './MatchingCompactCondition'
import { MatchingNewCandidatesPill } from './MatchingNewCandidatesPill'
import { MatchingSearchSummary } from './MatchingSearchSummary'
import { MatchingSellerRowList } from './MatchingSellerRow'
import { MatchingBottomActions } from './MatchingBottomActions'
import { TradeCancelAlertDialog } from './TradeCancelAlertDialog'

const NEW_BADGE_MS = 4500
const SCROLL_FOG_MIN_CANDIDATES = 3

interface MatchingFeedProps {
  trade: TradeRecord
  onSelectCandidate?: (candidate: MatchingCandidate) => void
  onChangeConditions?: () => void | Promise<void>
  onStopMatching?: () => void | Promise<void>
  onDensityChange?: (density: MatchingDensity) => void
  /** Activity fixedBottom에서 CTA를 렌더할 때 true */
  hideStopCta?: boolean
  onRequestStopMatching?: () => void
}

export function MatchingFeed({
  trade,
  onSelectCandidate,
  onChangeConditions,
  onStopMatching,
  onDensityChange,
  hideStopCta = false,
  onRequestStopMatching,
}: MatchingFeedProps) {
  const matchingSession = useMatchingSession()
  const { withdrawProposal } = useMatchingSessionActions()
  const [stopDialogOpen, setStopDialogOpen] = useState(false)
  const [actionPending, setActionPending] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [liveAnnounce, setLiveAnnounce] = useState('')
  const [newCandidateIds, setNewCandidateIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  )
  const seenExactCountRef = useRef(0)
  const seenVisibleIdsRef = useRef<Set<string>>(new Set())
  const initialVisibleSyncRef = useRef(true)
  const newBadgeTimersRef = useRef<Map<string, number>>(new Map())
  const scrollRef = useRef<HTMLDivElement>(null)

  const queueLocked = isQueueLocked(matchingSession)
  const pendingCandidateId = matchingSession?.pendingMatch?.candidateId ?? null
  const pendingExpiresAt = matchingSession?.pendingMatch?.expiresAt

  const nowMs = useMatchingNow(true)

  const revealedCandidates = useMemo(
    () => getVisibleRevealedCandidates(matchingSession),
    [matchingSession],
  )

  const {
    visibleCandidates,
    pendingCount,
    applyPending,
  } = useMatchingPendingReveal({
    revealedCandidates,
    scrollY,
  })

  const hasExact = hasRevealedExact(matchingSession)

  const uiMode = getMatchingUiMode({
    queueLocked,
    revealedCount: revealedCandidates.length,
    hasExact,
  })

  const isPending = uiMode === 'PENDING'
  const isSearching = uiMode === 'SEARCHING'
  const totalVisible = visibleCandidates.length
  const density = useMatchingDensity(isPending ? 0 : totalVisible)

  const heroMode = useMatchingHeroMode({
    density,
    scrollY,
    isPending,
  })

  const sortedCandidates = useMemo(
    () => sortMatchingCandidates(visibleCandidates),
    [visibleCandidates],
  )

  const listCandidates = useMemo(() => {
    if (!isPending) return sortedCandidates
    if (!pendingCandidateId) return []
    return sortedCandidates.filter((candidate) => candidate.id === pendingCandidateId)
  }, [isPending, pendingCandidateId, sortedCandidates])

  const showScrollFog =
    !isPending && totalVisible >= SCROLL_FOG_MIN_CANDIDATES && listCandidates.length > 0

  useLayoutEffect(() => {
    onDensityChange?.(density)
  }, [density, onDensityChange])

  const heroCopy = getMatchingHeroCopy({
    mode: uiMode,
    role: trade.role,
    exactCount: visibleCandidates.filter((c) => c.matchType === 'EXACT').length,
    nearCount: visibleCandidates.filter((c) => c.matchType === 'NEAR').length,
    amountKrw: trade.amountKrw,
  })

  const markCandidatesAsNew = useCallback((ids: string[]) => {
    if (ids.length === 0) return
    setNewCandidateIds((prev) => {
      const next = new Set(prev)
      for (const id of ids) next.add(id)
      return next
    })
    for (const id of ids) {
      const existing = newBadgeTimersRef.current.get(id)
      if (existing != null) window.clearTimeout(existing)
      const timer = window.setTimeout(() => {
        setNewCandidateIds((prev) => {
          if (!prev.has(id)) return prev
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        newBadgeTimersRef.current.delete(id)
      }, NEW_BADGE_MS)
      newBadgeTimersRef.current.set(id, timer)
    }
  }, [])

  useEffect(() => {
    return () => {
      for (const timer of newBadgeTimersRef.current.values()) {
        window.clearTimeout(timer)
      }
      newBadgeTimersRef.current.clear()
    }
  }, [])

  useEffect(() => {
    if (isPending) return
    const visibleIds = visibleCandidates.map((candidate) => candidate.id)
    if (initialVisibleSyncRef.current) {
      for (const id of visibleIds) seenVisibleIdsRef.current.add(id)
      initialVisibleSyncRef.current = false
      return
    }
    const fresh = visibleIds.filter((id) => !seenVisibleIdsRef.current.has(id))
    for (const id of visibleIds) seenVisibleIdsRef.current.add(id)
    if (fresh.length === 0) return
    if (density !== 'listFocused') {
      markCandidatesAsNew(fresh)
    }
  }, [density, isPending, markCandidatesAsNew, visibleCandidates])

  useEffect(() => {
    const revealedExactCount = revealedCandidates.filter(
      (candidate) => candidate.matchType === 'EXACT',
    ).length
    if (revealedExactCount === 0) return
    if (seenExactCountRef.current > 0) {
      seenExactCountRef.current = revealedExactCount
      return
    }
    seenExactCountRef.current = revealedExactCount
    const firstExact = revealedCandidates.find(
      (candidate) => candidate.matchType === 'EXACT',
    )
    if (firstExact) {
      setLiveAnnounce(
        getMatchingLiveAnnounce({
          exactCount: revealedExactCount,
          coinLabel: formatCoinAmount(firstExact.amountKrw),
        }),
      )
    }
  }, [revealedCandidates])

  const handleSelect = (candidate: MatchingCandidate) => {
    if (isPending || queueLocked) return
    onSelectCandidate?.(candidate)
  }

  const handleApplyPending = () => {
    applyPending()
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    setScrollY(0)
  }

  const runAction = async (action?: () => void | Promise<void>) => {
    if (!action || actionPending) return
    setActionPending(true)
    try {
      await action()
    } finally {
      setActionPending(false)
    }
  }

  const handleChangeConditions = () => {
    void runAction(onChangeConditions)
  }

  const handleStopClick = () => {
    if (onRequestStopMatching) {
      onRequestStopMatching()
      return
    }
    setStopDialogOpen(true)
  }

  const showEmptyCopy = isSearching && totalVisible === 0 && density === 'empty'
  const showCandidateList = !isPending && totalVisible > 0

  return (
    <VStack
      gap="x0"
      width="full"
      className={`matching-feed matching-feed--${density}`}
      flexGrow
      minHeight="full"
      style={{ position: 'relative', minHeight: 0 }}
    >
      <span
        aria-live="polite"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
        }}
      >
        {liveAnnounce}
      </span>

      <MatchingNewCandidatesPill count={pendingCount} onClick={handleApplyPending} />

      <div className="matching-feed-fixed-top">
        {!isPending ? (
          <MatchingSearchSummary amountKrw={trade.amountKrw} />
        ) : null}

        <VStack px="spacingX.globalGutter" width="full" pb="x2" gap="x3">
          {!isPending ? (
            <MatchingCompactCondition
              onChangeConditions={
                onChangeConditions ? handleChangeConditions : undefined
              }
            />
          ) : null}

          <MatchingAdaptiveHero
            heroMode={heroMode}
            isPending={isPending}
            pendingTitle={heroCopy.title}
            pendingDescription={heroCopy.description}
            countdownLabel={
              pendingExpiresAt
                ? formatMatchingCountdown(pendingExpiresAt, nowMs)
                : undefined
            }
          />

          {showEmptyCopy ? (
            <VStack width="full" gap="x2" align="center" pb="x2">
              <Text
                textStyle={MATCHING_TYPOGRAPHY.rowTitle}
                color="fg.neutral"
                style={{ textAlign: 'center' }}
              >
                {MATCHING_EMPTY_SEARCHING_TITLE}
              </Text>
              <Text
                textStyle={MATCHING_TYPOGRAPHY.helper}
                color="fg.neutralMuted"
                style={{ textAlign: 'center' }}
              >
                {MATCHING_EMPTY_SEARCHING_DESCRIPTION}
              </Text>
            </VStack>
          ) : null}

          {showCandidateList ? (
            <MatchingCandidateHeader count={totalVisible} density={density} />
          ) : null}
        </VStack>
      </div>

      <div className="matching-feed-candidate-scroll-host">
        <ScrollFog
          ref={scrollRef}
          placement={showScrollFog ? ['top', 'bottom'] : []}
          onScroll={(event) => {
            setScrollY((event.currentTarget as HTMLDivElement).scrollTop)
          }}
          className="matching-feed-candidate-scroll"
        >
          <div className="matching-feed-candidate-scroll-inner">
            {showCandidateList ? (
              <VStack px="spacingX.globalGutter" width="full">
                <MatchingSellerRowList
                  candidates={listCandidates}
                  requestedAmountKrw={trade.amountKrw}
                  animate
                  disabled={queueLocked}
                  newCandidateIds={newCandidateIds}
                  onSelect={handleSelect}
                />
              </VStack>
            ) : null}

            {isPending ? (
              <VStack px="spacingX.globalGutter" width="full" gap="x3">
                {listCandidates.length > 0 ? (
                  <MatchingSellerRowList
                    candidates={listCandidates}
                    requestedAmountKrw={trade.amountKrw}
                    animate
                    disabled
                  />
                ) : null}
                <TextLinkButton onClick={() => withdrawProposal()}>요청 취소</TextLinkButton>
              </VStack>
            ) : null}
          </div>
        </ScrollFog>
      </div>

      {!hideStopCta && onStopMatching && !isPending ? (
        <div className="matching-feed-fixed-bottom">
          <MatchingBottomActions
            disabled={actionPending}
            onStopMatching={handleStopClick}
          />
        </div>
      ) : null}

      {!onRequestStopMatching ? (
        <TradeCancelAlertDialog
          open={stopDialogOpen}
          onOpenChange={setStopDialogOpen}
          variant="matching"
          onConfirm={() => void runAction(onStopMatching)}
          splitContext={
            trade.splitLegIndex && trade.splitTotalLegs
              ? { legIndex: trade.splitLegIndex, totalLegs: trade.splitTotalLegs }
              : undefined
          }
        />
      ) : null}
    </VStack>
  )
}
