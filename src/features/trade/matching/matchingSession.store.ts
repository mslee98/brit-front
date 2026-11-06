import {
  MATCH_APPROVAL_TIMEOUT_MS,
  MATCH_COUNTERPARTY_ACCEPT_DELAY_MS,
} from '../constants'
import type { MatchingCandidate, MatchingSession } from './types'

type Listener = () => void

type MatchConfirmedHandler = (payload: { tradeId: string; amountKrw: number }) => void

type MatchingCandidateFactory = (requestedAmountKrw: number) => MatchingCandidate[]

const listeners = new Set<Listener>()
let session: MatchingSession | null = null
let approvalTimeoutId: ReturnType<typeof setTimeout> | null = null
let counterpartyAcceptTimerId: ReturnType<typeof setTimeout> | null = null
let onMatchConfirmed: MatchConfirmedHandler | null = null
let candidateFactory: MatchingCandidateFactory = () => []

/** DEV/mock — 후보 생성기 주입. 미주입 시 빈 목록. */
export function setMatchingCandidateFactory(factory: MatchingCandidateFactory) {
  candidateFactory = factory
}

function notify() {
  listeners.forEach((listener) => listener())
}

function clearApprovalTimers() {
  if (approvalTimeoutId !== null) {
    clearTimeout(approvalTimeoutId)
    approvalTimeoutId = null
  }
  if (counterpartyAcceptTimerId !== null) {
    clearTimeout(counterpartyAcceptTimerId)
    counterpartyAcceptTimerId = null
  }
}

function clearAllTimers() {
  clearApprovalTimers()
}

function isQueueLocked(): boolean {
  return session?.phase === 'PENDING_APPROVAL'
}

function resumeBrowsing() {
  if (!session) return

  session = {
    ...session,
    phase: 'BROWSING',
    pendingMatch: null,
    suggestion: null,
  }
  revealAllCandidates()
}

function dismissCandidate(candidateId: string) {
  if (!session) return
  if (session.dismissedCandidateIds.includes(candidateId)) return

  session = {
    ...session,
    dismissedCandidateIds: [...session.dismissedCandidateIds, candidateId],
  }
}

/** 제안 건너뛰기 — 목록에서 제외하고 탐색 계속 */
export function skipCandidate(candidateId: string) {
  if (!session) return
  dismissCandidate(candidateId)
  if (session.suggestion?.candidateId === candidateId) {
    session = { ...session, suggestion: null }
  }
  notify()
}

function tryConfirmMatch() {
  if (!session?.pendingMatch) return

  const { myApprovedAt, counterpartyApprovedAt } = session.pendingMatch
  if (!myApprovedAt || !counterpartyApprovedAt) return

  const candidate = session.candidates.find((c) => c.id === session!.pendingMatch!.candidateId)
  if (!candidate) return

  const tradeId = session.tradeId
  const amountKrw = candidate.amountKrw

  clearAllTimers()
  onMatchConfirmed?.({ tradeId, amountKrw })
}

function scheduleCounterpartyAccept() {
  clearApprovalTimers()

  counterpartyAcceptTimerId = setTimeout(() => {
    counterpartyAcceptTimerId = null
    if (!session?.pendingMatch) return

    session = {
      ...session,
      pendingMatch: {
        ...session.pendingMatch,
        counterpartyApprovedAt: new Date().toISOString(),
      },
    }
    notify()
    tryConfirmMatch()
  }, MATCH_COUNTERPARTY_ACCEPT_DELAY_MS)

  approvalTimeoutId = setTimeout(() => {
    approvalTimeoutId = null
    if (!session?.pendingMatch) return
    releasePendingMatch('timeout')
  }, MATCH_APPROVAL_TIMEOUT_MS)
}

function releasePendingMatch(_reason: 'timeout' | 'withdraw' | 'reject') {
  if (!session?.pendingMatch) return

  const candidateId = session.pendingMatch.candidateId
  clearApprovalTimers()
  dismissCandidate(candidateId)
  resumeBrowsing()
}

export function setOnMatchConfirmed(handler: MatchConfirmedHandler | null) {
  onMatchConfirmed = handler
}

/** @deprecated use setOnMatchConfirmed */
export function setOnCandidateAccepted(handler: MatchConfirmedHandler | null) {
  setOnMatchConfirmed(handler)
}

export function subscribeMatchingSession(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getMatchingSession(): MatchingSession | null {
  return session
}

export function getRevealedCandidates(): MatchingCandidate[] {
  if (!session) return []
  const revealed = new Set(session.revealedCandidateIds)
  const dismissed = new Set(session.dismissedCandidateIds)
  return session.candidates.filter(
    (candidate) => revealed.has(candidate.id) && !dismissed.has(candidate.id),
  )
}

export function consumeSuggestion() {
  if (!session?.suggestion) return
  session = { ...session, suggestion: null }
  notify()
}

export function startMatchingSession(input: {
  tradeId: string
  amountKrw: number
}): MatchingSession {
  clearAllTimers()
  session = {
    tradeId: input.tradeId,
    requestedAmountKrw: input.amountKrw,
    phase: 'BROWSING',
    candidates: candidateFactory(input.amountKrw),
    revealedCandidateIds: [],
    dismissedCandidateIds: [],
    pendingMatch: null,
    suggestion: null,
    startedAt: new Date().toISOString(),
  }
  revealAllCandidates()
  return session
}

/**
 * Browse+Select HTTP: 서버 후보로 세션을 시작/갱신.
 * 받은 후보는 바로 공개한다.
 */
export function startBrowseMatchingSession(input: {
  buyOrderId: string
  amountKrw: number
}): MatchingSession {
  clearAllTimers()
  session = {
    tradeId: input.buyOrderId,
    requestedAmountKrw: input.amountKrw,
    phase: 'BROWSING',
    candidates: [],
    revealedCandidateIds: [],
    dismissedCandidateIds: [],
    pendingMatch: null,
    suggestion: null,
    startedAt: new Date().toISOString(),
  }
  notify()
  return session
}

/**
 * 서버 후보 전체로 목록을 맞춘다. 이미 보이던 후보는 자리를 유지하고,
 * 서버에 없는 후보(다른 구매자가 가져간 판매 등)는 빠지고, 새 후보는 뒤에 붙는다.
 */
export function syncBrowseCandidates(candidates: MatchingCandidate[]) {
  if (!session || session.phase === 'PENDING_APPROVAL') return

  const nextById = new Map(candidates.map((c) => [c.id, c]))
  const kept = session.candidates.flatMap((c) => {
    const next = nextById.get(c.id)
    return next ? [next] : []
  })
  const keptIds = new Set(kept.map((c) => c.id))
  session = {
    ...session,
    candidates: [...kept, ...candidates.filter((c) => !keptIds.has(c.id))],
  }
  revealAllCandidates()
}

export type BrowseCandidateChange = { sellOrderId: string; remaining: string }

/**
 * `matching.changed`에 실린 판매 잔량 변경을 반영한다.
 * 후보가 아니게 된 판매(잔량 0)는 GET 없이 바로 뺀다.
 * @returns 새 후보이거나 금액이 바뀌어 다시 조회해야 하면 true
 */
export function applyBrowseCandidateChanges(changes: BrowseCandidateChange[]): boolean {
  if (!session || session.phase === 'PENDING_APPROVAL') return true

  const removed = new Set<string>()
  let needsRefetch = false
  for (const change of changes) {
    const remaining = Number(change.remaining)
    const current = session.candidates.find((c) => c.id === change.sellOrderId)
    if (!(remaining > 0)) {
      if (current) removed.add(change.sellOrderId)
    } else if (!current || current.amountKrw !== remaining) {
      needsRefetch = true
    }
  }
  if (removed.size > 0) {
    session = {
      ...session,
      candidates: session.candidates.filter((c) => !removed.has(c.id)),
    }
    revealAllCandidates()
  }
  return needsRefetch
}

export function proposeMatch(candidateId: string) {
  if (!session || isQueueLocked()) return

  const candidate = session.candidates.find((item) => item.id === candidateId)
  if (!candidate || session.dismissedCandidateIds.includes(candidateId)) return

  session = {
    ...session,
    phase: 'PENDING_APPROVAL',
    suggestion: null,
    pendingMatch: {
      candidateId,
      proposedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + MATCH_APPROVAL_TIMEOUT_MS).toISOString(),
      myApprovedAt: new Date().toISOString(),
    },
  }
  notify()
  scheduleCounterpartyAccept()
}

/**
 * HTTP Apply 성공 후 — mock 상대 수락 타이머 없이 PENDING UI만 잠금.
 */
export function beginTradeRequestPending(input: {
  candidateId?: string
  expiresAt: string
}) {
  if (!session) return

  let candidateId =
    input.candidateId ??
    session.pendingMatch?.candidateId ??
    session.revealedCandidateIds[0] ??
    session.candidates[0]?.id

  if (!candidateId) {
    candidateId = input.candidateId ?? 'pending-request'
    const stub: MatchingCandidate = {
      id: candidateId,
      nickname: '판매자',
      amountKrw: session.requestedAmountKrw,
      rating: 0,
      tradeCount: 0,
      mannerTemperature: 0,
      matchType: 'EXACT',
      completionRatePct: 0,
      avgResponseSec: 0,
    }
    session = {
      ...session,
      candidates: [stub],
      revealedCandidateIds: [stub.id],
    }
  } else if (
    input.candidateId &&
    !session.candidates.some((c) => c.id === input.candidateId)
  ) {
    const stub: MatchingCandidate = {
      id: input.candidateId,
      nickname: '판매자',
      amountKrw: session.requestedAmountKrw,
      rating: 0,
      tradeCount: 0,
      mannerTemperature: 0,
      matchType: 'EXACT',
      completionRatePct: 0,
      avgResponseSec: 0,
    }
    session = {
      ...session,
      candidates: [...session.candidates, stub],
      revealedCandidateIds: session.revealedCandidateIds.includes(stub.id)
        ? session.revealedCandidateIds
        : [...session.revealedCandidateIds, stub.id],
    }
    candidateId = stub.id
  }

  clearAllTimers()
  session = {
    ...session,
    phase: 'PENDING_APPROVAL',
    suggestion: null,
    pendingMatch: {
      candidateId,
      proposedAt: new Date().toISOString(),
      expiresAt: input.expiresAt,
      myApprovedAt: new Date().toISOString(),
    },
  }
  notify()
}

/** HTTP Reject/Expire/Cancel 후 탐색 재개 */
export function endTradeRequestPending() {
  if (!session?.pendingMatch) return
  clearApprovalTimers()
  resumeBrowsing()
}

export function withdrawProposal() {
  if (!session?.pendingMatch) return
  releasePendingMatch('withdraw')
}

/** @deprecated use proposeMatch */
export function acceptCandidate(candidateId: string) {
  proposeMatch(candidateId)
}

export function clearMatchingSession() {
  clearAllTimers()
  session = null
  notify()
}

/** 받은 후보를 바로 공개한다. 숨긴 후보는 제외하고 확인 시트는 열지 않는다. */
export function revealAllCandidates() {
  if (!session || isQueueLocked()) return

  const dismissed = new Set(session.dismissedCandidateIds)
  session = {
    ...session,
    revealedCandidateIds: session.candidates
      .filter((candidate) => !dismissed.has(candidate.id))
      .map((candidate) => candidate.id),
    suggestion: null,
  }
  notify()
}
