/**
 * useMatchingWaitingScreen — candidates 폴링 + Apply + 수락 대기.
 */
import { useActivityParams, useFlow, useStack } from '@stackflow/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { ApiError } from '../../../shared/api/errors'
import { showSnackbar } from '../../../shared/utils/showSnackbar'
import { navigateToRootHome } from '../../../stackflow/navigateToRootHome'
import {
  applyBuyOrder,
  cancelBuyOrder,
  cancelTradeRequest,
  createIdempotencyKey,
  getBuyOrderCandidates,
  getBuyOrderMatchingStatus,
  getTradeRequest,
  shouldUseOrdersHttpApi,
} from '../../orders/api/orders.api'
import type {
  BuyOrderStatus,
  MatchingCandidateItemDto,
  MatchingStatusDto,
} from '../../orders/types'
import { useMatchingAcceptSheet } from '../../trade/hooks/useMatchingAcceptSheet'
import type { MatchingDensity } from '../../trade/hooks/useMatchingDensity'
import { isListFocusedDensity } from '../../trade/hooks/useMatchingDensity'
import {
  beginTradeRequestPending,
  clearMatchingSession,
  endTradeRequestPending,
  getMatchingSession,
  skipCandidate,
  startBrowseMatchingSession,
  startMatchingSession,
  syncBrowseCandidates,
  withdrawProposal,
} from '../../trade/matching/matchingSession.store'
import {
  MATCHING_APPLY_STALE_CANDIDATE,
  TRADE_REQUEST_PENDING_ACCEPTED_RACE,
  TRADE_REQUEST_PENDING_CONNECTED,
  TRADE_REQUEST_PENDING_NO_RESPONSE,
} from '../../trade/copy'
import { useMatchingSession } from '../../trade/matching/hooks/useMatchingSession'
import type { MatchingCandidate } from '../../trade/matching/types'
import { getPendingCandidate } from '../../trade/matching/utils/matchingPhase'
import type { TradeRecord } from '../../trade/types'
import { useTradeSession } from '../../trade/hooks/useTradeSession'
import { cancelTrade, getTradeDetail } from '../../trade/stores/tradeSession.store'

const CANDIDATE_POLL_MS = 2500
const REQUEST_POLL_MS = 2000
const ACCEPT_FEEDBACK_MS = 700

export type MatchingWaitingPhase =
  | 'searching'
  | 'requestPending'
  | 'requestCancelled'
  | 'matched'
  | 'expired'
  | 'cancelled'

function resolvePhase(
  status: BuyOrderStatus,
  matched: boolean,
): MatchingWaitingPhase {
  if (matched || status === 'MATCHED') return 'matched'
  if (status === 'REQUEST_PENDING') return 'requestPending'
  if (status === 'EXPIRED') return 'expired'
  if (status === 'CANCELLED') return 'cancelled'
  return 'searching'
}

function mapCandidate(dto: MatchingCandidateItemDto): MatchingCandidate {
  return {
    id: dto.sellOrderId,
    nickname: dto.seller.nicknameMasked,
    amountKrw: Number(dto.coinAmount),
    rating: 0,
    tradeCount: dto.seller.completedTradeCount,
    mannerTemperature: 0,
    matchType: dto.matchType,
    completionRatePct: 0,
    avgResponseSec: 0,
  }
}

function buildBrowseTradeStub(buyOrderId: string, amountKrw: number): TradeRecord {
  const now = new Date().toISOString()
  return {
    id: buyOrderId,
    tradeId: buyOrderId,
    side: 'BUY',
    role: 'BUYER',
    status: 'MATCHING',
    amountKrw,
    coinAmount: amountKrw,
    version: 1,
    matchingStartedAt: now,
    updatedAt: now,
    createdAt: now,
  }
}

function toIsoExpiresAt(value: string | Date): string {
  return typeof value === 'string' ? value : new Date(value).toISOString()
}

export function useMatchingWaitingScreen() {
  const params = useActivityParams<'MatchingWaiting'>()
  const { replace } = useFlow()
  const { activities } = useStack()
  const snackbar = useSnackbarAdapter()
  const useHttp = shouldUseOrdersHttpApi()

  const [phase, setPhase] = useState<MatchingWaitingPhase>(() => {
    if (params.initialPhase === 'matched') return 'matched'
    if (params.initialPhase === 'expired') return 'expired'
    return 'searching'
  })
  const [tradeId, setTradeId] = useState<string | null>(params.tradeId ?? null)
  const [tradeRequestId, setTradeRequestId] = useState<string | null>(null)
  const [requestedAmountKrw, setRequestedAmountKrw] = useState(
    () => params.requestedAmountKrw ?? 0,
  )
  const [isCancelling, setIsCancelling] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [countdownPaused, setCountdownPaused] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const sessionStartedRef = useRef(false)
  const applyIdempotencyRef = useRef<string | null>(null)
  const navigatedToTradeRef = useRef(false)
  const acceptNavigateTimerRef = useRef<number | null>(null)

  const [matchingDensity, setMatchingDensity] = useState<MatchingDensity>('empty')
  const matchingSession = useMatchingSession()
  const pendingCandidate = useMemo(
    () => getPendingCandidate(matchingSession),
    [matchingSession],
  )
  const pendingExpiresAt = matchingSession?.pendingMatch?.expiresAt ?? null
  const pendingRequestedAt = matchingSession?.pendingMatch?.proposedAt ?? null

  const acceptSheet = useMatchingAcceptSheet({
    enabled: phase === 'searching',
    tradeId: params.buyOrderId,
    autoOpenReady: isListFocusedDensity(matchingDensity),
  })

  const selectMockTrade = useCallback(
    (version: number) => {
      void version
      if (useHttp) return null
      return getTradeDetail(params.buyOrderId)
    },
    [params.buyOrderId, useHttp],
  )
  const mockTrade = useTradeSession(selectMockTrade)

  const browseTrade = useMemo(
    () =>
      requestedAmountKrw > 0
        ? buildBrowseTradeStub(params.buyOrderId, requestedAmountKrw)
        : null,
    [params.buyOrderId, requestedAmountKrw],
  )

  const enterRequestPending = useCallback(
    (input: { tradeRequestId: string; candidateId?: string; expiresAt: string }) => {
      setTradeRequestId(input.tradeRequestId)
      setCountdownPaused(false)
      setPhase('requestPending')
      beginTradeRequestPending({
        candidateId: input.candidateId,
        expiresAt: toIsoExpiresAt(input.expiresAt),
      })
    },
    [],
  )

  const resumeSearching = useCallback((message?: string) => {
    setTradeRequestId(null)
    applyIdempotencyRef.current = null
    setCountdownPaused(false)
    endTradeRequestPending()
    setPhase('searching')
    if (message) showSnackbar(snackbar, message)
  }, [snackbar])

  const goToTrade = useCallback(
    (nextTradeId: string, message?: string) => {
      if (navigatedToTradeRef.current) return
      navigatedToTradeRef.current = true
      if (acceptNavigateTimerRef.current != null) {
        window.clearTimeout(acceptNavigateTimerRef.current)
        acceptNavigateTimerRef.current = null
      }
      clearMatchingSession()
      setTradeId(nextTradeId)
      setPhase('matched')
      setCountdownPaused(false)
      if (message) showSnackbar(snackbar, message)
      replace('Trade', { tradeId: nextTradeId }, { animate: true })
    },
    [replace, snackbar],
  )

  /** Accept 직후 짧은 Success Feedback 뒤 Trade로 이동 */
  const goToTradeAfterAccept = useCallback(
    (nextTradeId: string, message = TRADE_REQUEST_PENDING_CONNECTED) => {
      if (navigatedToTradeRef.current) return
      if (acceptNavigateTimerRef.current != null) return
      setCountdownPaused(true)
      showSnackbar(snackbar, message)
      acceptNavigateTimerRef.current = window.setTimeout(() => {
        acceptNavigateTimerRef.current = null
        goToTrade(nextTradeId)
      }, ACCEPT_FEEDBACK_MS)
    },
    [goToTrade, snackbar],
  )

  useEffect(() => {
    return () => {
      if (acceptNavigateTimerRef.current != null) {
        window.clearTimeout(acceptNavigateTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (useHttp || !mockTrade) return
    if (mockTrade.status === 'PAYMENT_PENDING') {
      goToTrade(mockTrade.id)
    }
  }, [goToTrade, mockTrade, useHttp])

  useEffect(() => {
    if (useHttp || requestedAmountKrw > 0) return
    if (mockTrade?.amountKrw) {
      setRequestedAmountKrw(mockTrade.amountKrw)
    }
  }, [mockTrade, requestedAmountKrw, useHttp])

  const applyStatus = useCallback(
    async (dto: MatchingStatusDto) => {
      if (dto.tradeId) {
        goToTradeAfterAccept(dto.tradeId)
        return
      }

      const next = resolvePhase(dto.status, dto.matched)
      if (next === 'requestPending' && dto.tradeRequest) {
        enterRequestPending({
          tradeRequestId: dto.tradeRequest.id,
          expiresAt: toIsoExpiresAt(dto.tradeRequest.expiresAt),
        })
        return
      }

      if (phase === 'requestPending' && next === 'searching') {
        resumeSearching(TRADE_REQUEST_PENDING_NO_RESPONSE)
        return
      }

      setPhase(next)
    },
    [enterRequestPending, goToTradeAfterAccept, phase, resumeSearching],
  )

  useEffect(() => {
    if (!requestedAmountKrw) return
    if (sessionStartedRef.current) return

    if (!useHttp) {
      const existing = getMatchingSession()
      if (existing?.tradeId !== params.buyOrderId) {
        startMatchingSession({
          tradeId: params.buyOrderId,
          amountKrw: requestedAmountKrw,
        })
      }
      sessionStartedRef.current = true
      return
    }

    startBrowseMatchingSession({
      buyOrderId: params.buyOrderId,
      amountKrw: requestedAmountKrw,
    })
    sessionStartedRef.current = true
  }, [params.buyOrderId, requestedAmountKrw, useHttp])

  useEffect(() => {
    return () => {
      if (useHttp) {
        clearMatchingSession()
      }
      sessionStartedRef.current = false
    }
  }, [params.buyOrderId, useHttp])

  // 후보 폴링 — searching만 (HTTP)
  useEffect(() => {
    if (!useHttp) return
    if (phase !== 'searching') return

    let cancelled = false

    const pollCandidates = async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const [exact, near] = await Promise.all([
          getBuyOrderCandidates(params.buyOrderId, {
            type: 'EXACT',
            limit: 20,
            signal: controller.signal,
          }),
          getBuyOrderCandidates(params.buyOrderId, {
            type: 'NEAR',
            limit: 20,
            signal: controller.signal,
          }),
        ])
        if (cancelled) return
        if (!requestedAmountKrw) {
          setRequestedAmountKrw(Number(exact.buyOrder.requestedCoinAmount))
        }
        if (exact.buyOrder.status === 'REQUEST_PENDING') {
          const status = await getBuyOrderMatchingStatus(params.buyOrderId)
          if (!cancelled) await applyStatus(status)
          return
        }
        const mapped = [
          ...exact.candidates.map(mapCandidate),
          ...near.candidates.map(mapCandidate),
        ]
        syncBrowseCandidates(mapped)
      } catch (error) {
        if (
          cancelled ||
          (error instanceof DOMException && error.name === 'AbortError')
        ) {
          return
        }
        if (
          error instanceof ApiError &&
          (error.code === 'MATCHING_BUY_ORDER_NOT_MATCHABLE' ||
            error.code === 'BUY_ORDER_REQUEST_PENDING')
        ) {
          try {
            const status = await getBuyOrderMatchingStatus(params.buyOrderId)
            if (!cancelled) await applyStatus(status)
          } catch {
            // ignore
          }
        }
      }
    }

    void pollCandidates()
    const candidateTimer = window.setInterval(() => {
      void pollCandidates()
    }, CANDIDATE_POLL_MS)

    return () => {
      cancelled = true
      window.clearInterval(candidateTimer)
      abortRef.current?.abort()
    }
  }, [applyStatus, params.buyOrderId, phase, requestedAmountKrw, useHttp])

  // trade-request 상세 폴링 — requestPending
  useEffect(() => {
    if (!useHttp) return
    if (phase !== 'requestPending' || !tradeRequestId) return

    let cancelled = false

    const pollRequest = async () => {
      try {
        const request = await getTradeRequest(tradeRequestId)
        if (cancelled) return

        if (request.status === 'ACCEPTED' && request.tradeId) {
          goToTradeAfterAccept(request.tradeId)
          return
        }

        if (request.status === 'REJECTED' || request.status === 'EXPIRED') {
          resumeSearching(TRADE_REQUEST_PENDING_NO_RESPONSE)
          return
        }

        if (request.status === 'CANCELLED_BY_BUYER') {
          setTradeRequestId(null)
          applyIdempotencyRef.current = null
          setCountdownPaused(false)
          endTradeRequestPending()
          setPhase('requestCancelled')
        }
      } catch {
        // 다음 폴링
      }
    }

    void pollRequest()
    const timer = window.setInterval(() => {
      void pollRequest()
    }, REQUEST_POLL_MS)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [goToTradeAfterAccept, phase, resumeSearching, tradeRequestId, useHttp])

  const submitApply = useCallback(
    async (candidate: MatchingCandidate) => {
      if (isApplying || phase !== 'searching') return
      setIsApplying(true)
      const idempotencyKey = applyIdempotencyRef.current ?? createIdempotencyKey()
      applyIdempotencyRef.current = idempotencyKey
      try {
        const result = await applyBuyOrder(
          params.buyOrderId,
          {
            sellOrderId: candidate.id,
            expectedMatchType: candidate.matchType,
            expectedCoinAmount: String(candidate.amountKrw),
          },
          idempotencyKey,
        )
        enterRequestPending({
          tradeRequestId: result.tradeRequestId,
          candidateId: candidate.id,
          expiresAt: toIsoExpiresAt(result.expiresAt),
        })
        showSnackbar(snackbar, '거래 요청을 보냈어요.')
      } catch (error) {
        const isUnauthorized =
          error instanceof ApiError &&
          (error.code === 'UNAUTHORIZED' || error.status === 401)
        if (isUnauthorized) {
          showSnackbar(snackbar, '다시 로그인해 주세요.')
          replace('Login', {}, { animate: true })
          return
        }

        applyIdempotencyRef.current = null
        const code = error instanceof ApiError ? error.code : null
        if (
          code === 'SELL_ORDER_UNAVAILABLE' ||
          code === 'CANDIDATE_CHANGED' ||
          code === 'SELL_ORDER_PENDING_REQUEST' ||
          code === 'BUY_ORDER_PENDING_REQUEST'
        ) {
          // 이미 체결·충돌 → 해당 row 제거 후 검색 계속
          skipCandidate(candidate.id)
          showSnackbar(snackbar, MATCHING_APPLY_STALE_CANDIDATE)
          return
        }

        showSnackbar(
          snackbar,
          error instanceof ApiError
            ? error.message
            : '요청에 실패했어요. 잠시 후 다시 시도해 주세요.',
        )
      } finally {
        setIsApplying(false)
      }
    },
    [enterRequestPending, isApplying, params.buyOrderId, phase, replace, snackbar],
  )

  const handleSelectCandidate = useCallback(
    (candidate: MatchingCandidate) => {
      acceptSheet.openAcceptForCandidate(candidate)
    },
    [acceptSheet],
  )

  const handleAcceptConfirm = useCallback(
    async (candidateId: string) => {
      if (!useHttp) {
        await acceptSheet.onAcceptConfirm(candidateId)
        return
      }

      const candidate =
        acceptSheet.acceptCandidate?.id === candidateId
          ? acceptSheet.acceptCandidate
          : null
      if (!candidate) return
      acceptSheet.onAcceptOpenChange(false)
      await submitApply(candidate)
    },
    [acceptSheet, submitApply, useHttp],
  )

  const handleCancelTradeRequest = useCallback(async () => {
    if (!useHttp) {
      withdrawProposal()
      setPhase('requestCancelled')
      return
    }

    if (isCancelling || phase !== 'requestPending' || !tradeRequestId) return
    setIsCancelling(true)
    try {
      await cancelTradeRequest(tradeRequestId)
      setTradeRequestId(null)
      applyIdempotencyRef.current = null
      setCountdownPaused(false)
      endTradeRequestPending()
      setPhase('requestCancelled')
    } catch (error) {
      const isUnauthorized =
        error instanceof ApiError &&
        (error.code === 'UNAUTHORIZED' || error.status === 401)

      if (isUnauthorized) {
        showSnackbar(snackbar, '다시 로그인해 주세요.')
        replace('Login', {}, { animate: true })
        return
      }

      const code = error instanceof ApiError ? error.code : null
      if (
        code === 'TRADE_REQUEST_NOT_PENDING' ||
        code === 'TRADE_REQUEST_EXPIRED'
      ) {
        try {
          const request = await getTradeRequest(tradeRequestId)
          if (request.status === 'ACCEPTED' && request.tradeId) {
            goToTradeAfterAccept(
              request.tradeId,
              TRADE_REQUEST_PENDING_ACCEPTED_RACE,
            )
            return
          }
          const status = await getBuyOrderMatchingStatus(params.buyOrderId)
          if (status.tradeId) {
            goToTradeAfterAccept(
              status.tradeId,
              TRADE_REQUEST_PENDING_ACCEPTED_RACE,
            )
            return
          }
          if (
            request.status === 'REJECTED' ||
            request.status === 'EXPIRED' ||
            request.status === 'CANCELLED_BY_BUYER'
          ) {
            resumeSearching(TRADE_REQUEST_PENDING_NO_RESPONSE)
            return
          }
        } catch {
          // fall through
        }
      }

      showSnackbar(
        snackbar,
        error instanceof ApiError
          ? error.message
          : '요청을 철회하지 못했어요. 잠시 후 다시 시도해 주세요.',
      )
    } finally {
      setIsCancelling(false)
    }
  }, [
    goToTradeAfterAccept,
    isCancelling,
    params.buyOrderId,
    phase,
    replace,
    resumeSearching,
    snackbar,
    tradeRequestId,
    useHttp,
  ])

  const handleRetrySearch = useCallback(() => {
    resumeSearching()
  }, [resumeSearching])

  const handleCancelMatching = useCallback(async () => {
    if (isCancelling || phase !== 'searching') return
    setIsCancelling(true)
    try {
      if (!useHttp) {
        const trade = getTradeDetail(params.buyOrderId)
        if (trade) {
          await cancelTrade(trade.id, trade.version)
        } else {
          clearMatchingSession()
        }
        setPhase('cancelled')
        showSnackbar(snackbar, '매칭을 취소했어요.')
        return
      }

      await cancelBuyOrder(params.buyOrderId)
      clearMatchingSession()
      setPhase('cancelled')
      showSnackbar(snackbar, '매칭을 취소했어요.')
    } catch (error) {
      const isUnauthorized =
        error instanceof ApiError &&
        (error.code === 'UNAUTHORIZED' || error.status === 401)

      if (isUnauthorized) {
        showSnackbar(snackbar, '다시 로그인해 주세요.')
        replace('Login', {}, { animate: true })
        return
      }

      const message =
        error instanceof ApiError
          ? error.message
          : '매칭을 취소하지 못했어요. 잠시 후 다시 시도해 주세요.'
      showSnackbar(snackbar, message)
    } finally {
      setIsCancelling(false)
    }
  }, [isCancelling, params.buyOrderId, phase, replace, snackbar, useHttp])

  const handleRetry = useCallback(() => {
    replace('TradeCompose', { side: 'BUY' }, { animate: true })
  }, [replace])

  const handleGoHome = useCallback(() => {
    navigateToRootHome(activities.length)
  }, [activities.length])

  const handleGoToTrade = useCallback(() => {
    if (!tradeId) return
    replace('Trade', { tradeId }, { animate: true })
  }, [replace, tradeId])

  const handleChangeConditions = useCallback(async () => {
    await handleCancelMatching()
    replace('TradeCompose', { side: 'BUY' }, { animate: true })
  }, [handleCancelMatching, replace])

  const handleDensityChange = useCallback((density: MatchingDensity) => {
    setMatchingDensity(density)
  }, [])

  return {
    buyOrderId: params.buyOrderId,
    phase,
    tradeId,
    tradeRequestId,
    browseTrade,
    pendingCandidate,
    pendingExpiresAt,
    pendingRequestedAt,
    countdownPaused,
    isCancelling,
    isMatching: isApplying,
    acceptSheet: {
      acceptOpen: acceptSheet.acceptOpen,
      acceptCandidate: acceptSheet.acceptCandidate,
      onAcceptOpenChange: acceptSheet.onAcceptOpenChange,
      onAcceptConfirm: handleAcceptConfirm,
      onAcceptSkip: acceptSheet.onAcceptSkip,
    },
    handleSelectCandidate,
    handleCancelMatching,
    handleCancelTradeRequest,
    handleChangeConditions,
    handleDensityChange,
    handleRetry,
    handleRetrySearch,
    handleGoHome,
    handleGoToTrade,
  }
}
