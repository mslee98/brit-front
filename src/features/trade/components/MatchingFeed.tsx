import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ScrollFog, Text, VStack } from '@seed-design/react'
import { Callout } from 'seed-design/ui/callout'

import { BottomCTA } from '../../../shared/ui/BottomCTA'
import { TextLinkButton } from '../../../shared/components/TextLinkButton'
import { formatCoinAmount } from '../../../shared/utils/formatAmount'
import { usePushNotification } from '../../pwa/hooks/usePushNotification'
import { PushEnableCard } from '../../pwa/components/PushEnableCard'
import { PUSH_ENABLE_PENDING_COPY } from '../../pwa/constants/pushNotificationCopy'
import {
  useMatchingSession,
  useMatchingSessionActions,
} from '../matching/hooks/useMatchingSession'
import type { MatchingCandidate } from '../matching/types'
import {
  getVisibleRevealedCandidates,
  hasRevealedExact,
  isQueueLocked,
  partitionRevealedCandidates,
} from '../matching/utils/matchingPhase'
import type { TradeRecord } from '../types'
import {
  formatMatchingCountdown,
  getMatchingHeroCopy,
  getMatchingLiveAnnounce,
  getMatchingUiMode,
  MATCHING_EMPTY_EXACT_TAB,
  MATCHING_EMPTY_NEAR_TAB,
  MATCHING_EMPTY_SEARCHING_DESCRIPTION,
  MATCHING_EMPTY_SEARCHING_TITLE,
  MATCHING_FIRST_EXACT_BANNER,
  MATCHING_FIRST_EXACT_CTA,
  MATCHING_LEAVE_OK_HINT,
  MATCHING_NEW_CANDIDATE_BANNER,
} from '../copy'
import { MATCHING_TYPOGRAPHY } from '../constants/matchingTypography'
import { useMatchingHeroMode } from '../hooks/useMatchingHeroMode'
import { useMatchingNow } from '../hooks/useMatchingNow'
import { useMatchingPendingReveal } from '../hooks/useMatchingPendingReveal'
import { MatchingAdaptiveHero } from './MatchingAdaptiveHero'
import { MatchingBottomActions } from './MatchingBottomActions'
import { MatchingCompactCondition } from './MatchingCompactCondition'
import { MatchingNewCandidatesPill } from './MatchingNewCandidatesPill'
import {
  MatchingResultTabPanel,
  MatchingResultTabs,
  useMatchingResultTab,
} from './MatchingResultTabs'
import { MatchingSellerRowList } from './MatchingSellerRow'
import { TradeCancelAlertDialog } from './TradeCancelAlertDialog'

const SCROLL_FOG_CANDIDATE_THRESHOLD = 5
const NEW_BANNER_MS = 1800
const NEW_BADGE_MS = 4500
const FIRST_EXACT_BANNER_MS = 8000

interface MatchingFeedProps {
  trade: TradeRecord
  onSelectCandidate?: (candidate: MatchingCandidate) => void
  onChangeConditions?: () => void | Promise<void>
  onStopMatching?: () => void | Promise<void>
  /** HTTP Apply 대기 중 철회 — 없으면 로컬 withdraw만 */
  onCancelRequest?: () => void | Promise<void>
}

export function MatchingFeed({
  trade,
  onSelectCandidate,
  onChangeConditions,
  onStopMatching,
  onCancelRequest,
}: MatchingFeedProps) {
  const matchingSession = useMatchingSession()
  const { withdrawProposal } = useMatchingSessionActions()
  const { eligibility, requestPermission } = usePushNotification()
  const [stopDialogOpen, setStopDialogOpen] = useState(false)
  const [actionPending, setActionPending] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [liveAnnounce, setLiveAnnounce] = useState('')
  const [newBannerVisible, setNewBannerVisible] = useState(false)
  const [firstExactBannerVisible, setFirstExactBannerVisible] = useState(false)
  const [newCandidateIds, setNewCandidateIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  )
  const seenExactCountRef = useRef(0)
  const seenVisibleIdsRef = useRef<Set<string>>(new Set())
  const initialVisibleSyncRef = useRef(true)
  const newBannerTimerRef = useRef<number | null>(null)
  const firstExactTimerRef = useRef<number | null>(null)
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
    pendingExactCount,
    pendingNearCount,
    applyPending,
  } = useMatchingPendingReveal({
    revealedCandidates,
    scrollY,
  })

  const hasExact = hasRevealedExact(matchingSession)
  const { exact, near } = useMemo(
    () => partitionRevealedCandidates(visibleCandidates, trade.amountKrw),
    [visibleCandidates, trade.amountKrw],
  )
  const revealedExactCount = useMemo(
    () =>
      partitionRevealedCandidates(revealedCandidates, trade.amountKrw).exact.length,
    [revealedCandidates, trade.amountKrw],
  )

  const uiMode = getMatchingUiMode({
    queueLocked,
    revealedCount: revealedCandidates.length,
    hasExact,
  })

  const isPending = uiMode === 'PENDING'
  const isSearching = uiMode === 'SEARCHING'
  const totalVisible = exact.length + near.length
  const showTabs = !isPending && totalVisible > 0

  const heroMode = useMatchingHeroMode({
    exactCount: exact.length,
    nearCount: near.length,
    scrollY,
    isPending,
  })

  const heroCopy = getMatchingHeroCopy({
    mode: uiMode,
    role: trade.role,
    exactCount: exact.length,
    nearCount: near.length,
    amountKrw: trade.amountKrw,
  })

  const { tab, setTab } = useMatchingResultTab({
    exactCount: exact.length,
    nearCount: near.length,
  })

  const clearNewBannerTimer = useCallback(() => {
    if (newBannerTimerRef.current != null) {
      window.clearTimeout(newBannerTimerRef.current)
      newBannerTimerRef.current = null
    }
  }, [])

  const clearFirstExactTimer = useCallback(() => {
    if (firstExactTimerRef.current != null) {
      window.clearTimeout(firstExactTimerRef.current)
      firstExactTimerRef.current = null
    }
  }, [])

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

  const showNewCandidateBanner = useCallback(() => {
    clearNewBannerTimer()
    setNewBannerVisible(true)
    newBannerTimerRef.current = window.setTimeout(() => {
      setNewBannerVisible(false)
      newBannerTimerRef.current = null
    }, NEW_BANNER_MS)
  }, [clearNewBannerTimer])

  const showFirstExactBanner = useCallback(() => {
    clearFirstExactTimer()
    setFirstExactBannerVisible(true)
    firstExactTimerRef.current = window.setTimeout(() => {
      setFirstExactBannerVisible(false)
      firstExactTimerRef.current = null
    }, FIRST_EXACT_BANNER_MS)
  }, [clearFirstExactTimer])

  useEffect(() => {
    return () => {
      clearNewBannerTimer()
      clearFirstExactTimer()
      for (const timer of newBadgeTimersRef.current.values()) {
        window.clearTimeout(timer)
      }
      newBadgeTimersRef.current.clear()
    }
  }, [clearFirstExactTimer, clearNewBannerTimer])

  // 리스트에 새로 보이는 후보 → 「새 제안」 badge + 인라인 배너 (자동 스크롤 없음)
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
    markCandidatesAsNew(fresh)
    showNewCandidateBanner()
  }, [isPending, markCandidatesAsNew, showNewCandidateBanner, visibleCandidates])

  const [exactTabNotification, setExactTabNotification] = useState(false)
  const [nearTabNotification, setNearTabNotification] = useState(false)
  const prevExactCountRef = useRef(exact.length)
  const prevNearCountRef = useRef(near.length)

  useEffect(() => {
    if (exact.length > prevExactCountRef.current && tab !== 'exact') {
      setExactTabNotification(true)
    }
    if (near.length > prevNearCountRef.current && tab !== 'near') {
      setNearTabNotification(true)
    }
    prevExactCountRef.current = exact.length
    prevNearCountRef.current = near.length
  }, [exact.length, near.length, tab])

  useEffect(() => {
    if (tab === 'exact') setExactTabNotification(false)
    if (tab === 'near') setNearTabNotification(false)
  }, [tab])

  // 첫 Exact: Near 탭이면 강제 전환 없이 인라인 배너만
  useEffect(() => {
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
    if (tab === 'near') {
      showFirstExactBanner()
    }
  }, [revealedCandidates, revealedExactCount, showFirstExactBanner, tab])

  const listCandidates = useMemo(() => {
    if (!isPending) return visibleCandidates
    if (!pendingCandidateId) return []
    return visibleCandidates.filter((candidate) => candidate.id === pendingCandidateId)
  }, [isPending, pendingCandidateId, visibleCandidates])

  const showScrollFog = listCandidates.length >= SCROLL_FOG_CANDIDATE_THRESHOLD

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

  return (
    <VStack
      gap="x1"
      width="full"
      className={`matching-feed matching-feed--${heroMode}`}
      flexGrow
      minHeight="full"
      style={{ position: 'relative' }}
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

      <div className="matching-feed-scroll-host">
        <ScrollFog
          ref={scrollRef}
          placement={showScrollFog ? ['bottom'] : []}
          onScroll={(event) => {
            setScrollY((event.currentTarget as HTMLDivElement).scrollTop)
          }}
          className="matching-feed-scroll"
        >
          <VStack gap="x4" width="full" pb="spacingY.screenBottom">
            <MatchingAdaptiveHero
              heroMode={heroMode}
              title={heroCopy.title}
              description={heroCopy.description}
              amountKrw={trade.amountKrw}
              exactCount={exact.length}
              nearCount={near.length}
              isPending={isPending}
              countdownLabel={
                pendingExpiresAt
                  ? formatMatchingCountdown(pendingExpiresAt, nowMs)
                  : undefined
              }
            />

            {isSearching ? (
              <VStack
                px="spacingX.globalGutter"
                width="full"
                gap="x2"
                align="center"
                pt="x2"
              >
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

            {showTabs ? (
              <VStack width="full" gap="x3">
                {newBannerVisible ? (
                  <VStack px="spacingX.globalGutter" width="full">
                    <Callout
                      tone="informative"
                      description={MATCHING_NEW_CANDIDATE_BANNER}
                    />
                  </VStack>
                ) : null}

                {firstExactBannerVisible && tab === 'near' ? (
                  <VStack px="spacingX.globalGutter" width="full">
                    <Callout
                      tone="informative"
                      description={MATCHING_FIRST_EXACT_BANNER}
                      linkProps={{
                        children: MATCHING_FIRST_EXACT_CTA,
                        onClick: () => {
                          setFirstExactBannerVisible(false)
                          clearFirstExactTimer()
                          setTab('exact')
                        },
                      }}
                    />
                  </VStack>
                ) : null}

                <MatchingResultTabs
                  exactCount={exact.length}
                  nearCount={near.length}
                  value={tab}
                  onValueChange={(next) => {
                    if (next === 'exact') {
                      setFirstExactBannerVisible(false)
                      clearFirstExactTimer()
                    }
                    setTab(next)
                  }}
                  exactNotification={exactTabNotification || pendingExactCount > 0}
                  nearNotification={nearTabNotification || pendingNearCount > 0}
                >
                  <MatchingResultTabPanel value="exact">
                    <VStack px="spacingX.globalGutter" width="full">
                      <MatchingSellerRowList
                        candidates={exact}
                        requestedAmountKrw={trade.amountKrw}
                        animate
                        disabled={queueLocked}
                        newCandidateIds={newCandidateIds}
                        emptyMessage={MATCHING_EMPTY_EXACT_TAB}
                        onSelect={handleSelect}
                      />
                    </VStack>
                  </MatchingResultTabPanel>
                  <MatchingResultTabPanel value="near">
                    <VStack px="spacingX.globalGutter" width="full">
                      <MatchingSellerRowList
                        candidates={near}
                        requestedAmountKrw={trade.amountKrw}
                        animate
                        disabled={queueLocked}
                        newCandidateIds={newCandidateIds}
                        emptyMessage={MATCHING_EMPTY_NEAR_TAB}
                        onSelect={handleSelect}
                      />
                    </VStack>
                  </MatchingResultTabPanel>
                </MatchingResultTabs>
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
                <TextLinkButton
                  onClick={() => {
                    if (onCancelRequest) {
                      void onCancelRequest()
                      return
                    }
                    withdrawProposal()
                  }}
                >
                  요청 취소
                </TextLinkButton>
              </VStack>
            ) : null}

            <VStack px="spacingX.globalGutter" width="full" gap="x4">
              <MatchingCompactCondition
                trade={trade}
                onChangeConditions={
                  onChangeConditions && !isPending ? handleChangeConditions : undefined
                }
              />

              {isSearching ? (
                <Text textStyle={MATCHING_TYPOGRAPHY.helper} color="fg.neutralMuted">
                  {MATCHING_LEAVE_OK_HINT}
                </Text>
              ) : null}

              {isSearching || isPending ? (
                <PushEnableCard
                  eligibility={eligibility}
                  onRequestPermission={requestPermission}
                  copy={isPending ? PUSH_ENABLE_PENDING_COPY : undefined}
                />
              ) : null}
            </VStack>
          </VStack>
        </ScrollFog>
      </div>

      {onStopMatching && !isPending ? (
        <BottomCTA behavior="keyboardAdaptive" variant="inline">
          <MatchingBottomActions
            disabled={actionPending}
            onStopMatching={() => setStopDialogOpen(true)}
          />
        </BottomCTA>
      ) : null}

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
    </VStack>
  )
}
