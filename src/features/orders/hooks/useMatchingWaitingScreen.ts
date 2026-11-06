/**
 * useMatchingWaitingScreen — candidates 소켓 + Apply + 수락 대기.
 */
import { useActivityParams, useFlow, useStack } from '@stackflow/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { ApiError } from '../../../shared/api/errors'
import { showSnackbar } from '../../../shared/utils/showSnackbar'
import { navigateToRootHome } from '../../../stackflow/navigateToRootHome'
import { exitTo } from '../../../stackflow/navigation'
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
  applyBrowseCandidateChanges,
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
  TRADE_REQUEST_MARKET_CANCELLED,
  TRADE_REQUEST_MARKET_NOT_CONNECTED,
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
import {
  bindBuyOrderRoom,
  getOrderSocket,
  ORDER_WS_EVENTS,
  type MatchingChangedPayload,
  type TradeRequestUpdatedPayload,
} from '../../trade/realtime/orderSocket'
import {
  getTradeSocket,
  TRADE_WS_EVENTS,
  type TradeUpdatedPayload,
} from '../../trade/realtime/tradeSocket'
import {
  DEADLINE_RECHECK_GRACE_MS,
  subscribeRealtimeResync,
} from '../../trade/realtime/realtimeSync'

const ACCEPT_FEEDBACK_MS = 700
const CANDIDATE_REFETCH_MIN_DELAY_MS = 150
const CANDIDATE_REFETCH_JITTER_MS = 350

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
    if (params.initialPhase === 'requestPending') return 'requestPending'
    return 'searching'
  })
  const [tradeId, setTradeId] = useState<string | null>(params.tradeId ?? null)
  const [tradeRequestId, setTradeRequestId] = useState<string | null>(
    () => params.tradeRequestId ?? null,
  )
  const [requestedAmountKrw, setRequestedAmountKrw] = useState(
    () => params.requestedAmountKrw ?? 0,
  )
  const [isCancelling, setIsCancelling] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [countdownPaused, setCountdownPaused] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const applyStatusRef = useRef<(dto: MatchingStatusDto) => Promise<void>>(
    async () => undefined,
  )
  const requestedAmountKrwRef = useRef(0)
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
    autoOpenReady: useHttp ? false : isListFocusedDensity(matchingDensity),
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

  /** 거래소 Apply 직후 진입 — browse 세션을 만든 뒤 requestPending을 복원 */
  useEffect(() => {
    if (params.initialPhase !== 'requestPending') return
    if (!params.tradeRequestId || !params.tradeRequestExpiresAt) return

    const amountKrw = params.requestedAmountKrw ?? requestedAmountKrw
    if (useHttp && amountKrw > 0 && !sessionStartedRef.current) {
      startBrowseMatchingSession({
        buyOrderId: params.buyOrderId,
        amountKrw,
      })
      sessionStartedRef.current = true
    }

    enterRequestPending({
      tradeRequestId: params.tradeRequestId,
      candidateId: params.targetSellOrderId,
      expiresAt: params.tradeRequestExpiresAt,
    })
  }, [
    enterRequestPending,
    params.buyOrderId,
    params.initialPhase,
    params.requestedAmountKrw,
    params.targetSellOrderId,
    params.tradeRequestExpiresAt,
    params.tradeRequestId,
    requestedAmountKrw,
    useHttp,
  ])

  const isMarketOriginRef = useRef(params.origin === 'market')

  const resumeSearching = useCallback((message?: string) => {
    setTradeRequestId(null)
    applyIdempotencyRef.current = null
    setCountdownPaused(false)
    endTradeRequestPending()
    setPhase('searching')
    if (message) showSnackbar(snackbar, message)
  }, [snackbar])

  /** 거래소 출처 요청 종료 — 서버가 BuyOrder를 CANCELLED로 닫았으므로 목록으로 복귀 */
  const returnToMarket = useCallback(
    (message: string) => {
      setTradeRequestId(null)
      applyIdempotencyRef.current = null
      setCountdownPaused(false)
      endTradeRequestPending()
      clearMatchingSession()
      setPhase('cancelled')
      showSnackbar(snackbar, message)
      exitTo('Market')
    },
    [snackbar],
  )

  /** 요청 종료 시 출처별 분기: 거래소는 목록 복귀, 매칭은 탐색 재개 */
  const handleRequestEnded = useCallback(
    (kind: 'notConnected' | 'cancelled') => {
      if (isMarketOriginRef.current) {
        returnToMarket(
          kind === 'cancelled'
            ? TRADE_REQUEST_MARKET_CANCELLED
            : TRADE_REQUEST_MARKET_NOT_CONNECTED,
        )
        return true
      }
      return false
    },
    [returnToMarket],
  )

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

      if (phase === 'requestPending' && (next === 'searching' || next === 'cancelled')) {
        if (handleRequestEnded('notConnected')) return
        if (next === 'searching') {
          resumeSearching(TRADE_REQUEST_PENDING_NO_RESPONSE)
          return
        }
      }

      setPhase(next)
    },
    [
      enterRequestPending,
      goToTradeAfterAccept,
      handleRequestEnded,
      phase,
      resumeSearching,
    ],
  )
  applyStatusRef.current = applyStatus
  requestedAmountKrwRef.current = requestedAmountKrw

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

  // 후보 — 진입 시 한 번. 이후 잔량 변경 신호만 짧게 모아 다시 조회한다.
  useEffect(() => {
    if (!useHttp) return
    if (phase !== 'searching') return

    let cancelled = false
    let debounceTimer: number | null = null

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
        if (!requestedAmountKrwRef.current) {
          setRequestedAmountKrw(Number(exact.buyOrder.requestedCoinAmount))
        }
        if (exact.buyOrder.status === 'REQUEST_PENDING') {
          const status = await getBuyOrderMatchingStatus(params.buyOrderId)
          if (!cancelled) await applyStatusRef.current(status)
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
            if (!cancelled) await applyStatusRef.current(status)
          } catch {
            // ignore
          }
        }
      }
    }

    // 이미 예약돼 있으면 미루지 않는다(신호가 계속 와도 주기적으로 갱신).
    // 지터로 같은 신호를 받은 구매자들의 GET이 한 순간에 몰리지 않게 한다.
    const schedulePoll = () => {
      if (debounceTimer != null) return
      debounceTimer = window.setTimeout(() => {
        debounceTimer = null
        void pollCandidates()
      }, CANDIDATE_REFETCH_MIN_DELAY_MS + Math.random() * CANDIDATE_REFETCH_JITTER_MS)
    }

    void pollCandidates()
    const unbind = bindBuyOrderRoom(params.buyOrderId)
    const orders = getOrderSocket()
    const trades = getTradeSocket()
    const onMatching = (payload: MatchingChangedPayload) => {
      if (payload.buyOrderId !== params.buyOrderId) return
      // 빠지기만 한 변경은 목록에서 바로 지우고 GET을 생략한다
      if (payload.changes && !applyBrowseCandidateChanges(payload.changes)) return
      schedulePoll()
    }
    const onTrade = (payload: TradeUpdatedPayload) => {
      if (payload.status !== 'CANCELLED' && payload.status !== 'COMPLETED') return
      schedulePoll()
    }
    orders.on(ORDER_WS_EVENTS.MATCHING_CHANGED, onMatching)
    trades.on(TRADE_WS_EVENTS.UPDATED, onTrade)
    const unsubscribeResync = subscribeRealtimeResync(schedulePoll)

    return () => {
      cancelled = true
      if (debounceTimer != null) window.clearTimeout(debounceTimer)
      unsubscribeResync()
      unbind()
      orders.off(ORDER_WS_EVENTS.MATCHING_CHANGED, onMatching)
      trades.off(TRADE_WS_EVENTS.UPDATED, onTrade)
      abortRef.current?.abort()
    }
  }, [params.buyOrderId, phase, useHttp])

  // 신청 상태 — 최초 조회 + trade-request.updated
  useEffect(() => {
    if (!useHttp) return
    if (phase !== 'requestPending' || !tradeRequestId) return

    let cancelled = false
    let deadlineTimer: number | null = null

    const pollRequest = async () => {
      try {
        const request = await getTradeRequest(tradeRequestId)
        if (cancelled) return
        if (request.origin === 'MARKET') isMarketOriginRef.current = true

        if (request.status === 'PENDING_SELLER') {
          // 만료는 서버 배치가 처리하므로 마감 직후 한 번 확인한다
          if (deadlineTimer != null) window.clearTimeout(deadlineTimer)
          const dueInMs = new Date(request.expiresAt).getTime() - Date.now()
          deadlineTimer = window.setTimeout(
            () => void pollRequest(),
            Math.max(0, dueInMs) + DEADLINE_RECHECK_GRACE_MS,
          )
          return
        }

        if (request.status === 'ACCEPTED' && request.tradeId) {
          goToTradeAfterAccept(request.tradeId)
          return
        }

        if (request.status === 'REJECTED' || request.status === 'EXPIRED') {
          if (handleRequestEnded('notConnected')) return
          resumeSearching(TRADE_REQUEST_PENDING_NO_RESPONSE)
          return
        }

        if (request.status === 'CANCELLED_BY_BUYER') {
          if (handleRequestEnded('cancelled')) return
          setTradeRequestId(null)
          applyIdempotencyRef.current = null
          setCountdownPaused(false)
          endTradeRequestPending()
          setPhase('requestCancelled')
        }
      } catch {
        // 재연결·앱 복귀 resync 때 다시 조회
      }
    }

    void pollRequest()
    const orders = getOrderSocket()
    const onRequest = (payload: TradeRequestUpdatedPayload) => {
      if (payload.requestId !== tradeRequestId) return
      void pollRequest()
    }
    orders.on(ORDER_WS_EVENTS.REQUEST_UPDATED, onRequest)
    const unsubscribeResync = subscribeRealtimeResync(() => void pollRequest())

    return () => {
      cancelled = true
      if (deadlineTimer != null) window.clearTimeout(deadlineTimer)
      unsubscribeResync()
      orders.off(ORDER_WS_EVENTS.REQUEST_UPDATED, onRequest)
    }
  }, [
    goToTradeAfterAccept,
    handleRequestEnded,
    phase,
    resumeSearching,
    tradeRequestId,
    useHttp,
  ])

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
      const cancelledRequest = await cancelTradeRequest(tradeRequestId)
      if (cancelledRequest.origin === 'MARKET') isMarketOriginRef.current = true
      if (handleRequestEnded('cancelled')) return
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
            if (request.origin === 'MARKET') isMarketOriginRef.current = true
            if (handleRequestEnded('notConnected')) return
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
    handleRequestEnded,
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

  const handleBrowseMarket = useCallback(() => {
    exitTo('Market')
  }, [])

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
    handleBrowseMarket,
    handleGoToTrade,
  }
}
