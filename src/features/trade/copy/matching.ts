import { formatCoinAmount } from '../../../shared/utils/formatAmount'
import type { TradeRole, TradeRecord } from '../types'

interface MatchingCopy {
  title: string
  description: string
  matchedTitle: string
  matchedDescription: string
}

const COPY_BY_ROLE: Record<TradeRole, MatchingCopy> = {
  BUYER: {
    title: '거래 찾기',
    description: '조건에 맞는 판매자가 나타나면 바로 보여드릴게요.',
    matchedTitle: '매칭됐어요',
    matchedDescription: '이제 입금을 진행해 주세요.',
  },
  SELLER: {
    title: '판매 등록 중이에요',
    description: '코인이 잠겨 있어요. 구매자가 나타나면 알려드릴게요.',
    matchedTitle: '구매자를 찾았어요',
    matchedDescription: '구매자 입금을 기다려 주세요.',
  },
}

export function getMatchingCopy(trade: Pick<TradeRecord, 'role' | 'status'>): MatchingCopy {
  const base = COPY_BY_ROLE[trade.role]
  if (trade.status !== 'MATCHING') {
    return base
  }
  return base
}

export function getMatchedDockCopy(
  trade: Pick<TradeRecord, 'role'>,
): Pick<MatchingCopy, 'matchedTitle' | 'matchedDescription'> {
  return COPY_BY_ROLE[trade.role]
}

/** MatchingFeed 히어로 파생 모드 — 세션 phase와 별개 */
export type MatchingUiMode = 'SEARCHING' | 'RESULT_EXACT' | 'RESULT_NEAR' | 'PENDING'

export function getMatchingUiMode(params: {
  queueLocked: boolean
  revealedCount: number
  hasExact: boolean
}): MatchingUiMode {
  if (params.queueLocked) return 'PENDING'
  if (params.revealedCount === 0) return 'SEARCHING'
  if (params.hasExact) return 'RESULT_EXACT'
  return 'RESULT_NEAR'
}

export function getMatchingStatusBadgeLabel(mode: MatchingUiMode): string {
  switch (mode) {
    case 'PENDING':
      return '승인 대기 중'
    case 'SEARCHING':
      return '찾는 중'
    case 'RESULT_EXACT':
      return '정확히 일치'
    case 'RESULT_NEAR':
      return '비슷한 상대'
  }
}

export interface MatchingHeroCopy {
  title: string
  description?: string
}

export const MATCHING_LEAVE_OK_HINT =
  '화면을 나가도 찾기는 계속돼요. 새 제안이 오면 알려드릴게요.'

export const MATCHING_EXACT_PRIORITY_HINT =
  '정확 매칭을 우선으로 찾아요. 비슷한 조건도 함께 볼 수 있어요.'

/** Empty searching — 히어로 아래 보조 카피 */
export const MATCHING_EMPTY_SEARCHING_TITLE = '아직 조건에 맞는 판매자가 없어요'
export const MATCHING_EMPTY_SEARCHING_DESCRIPTION =
  '새 판매자가 등록되면 이 화면에 바로 나타나요.'

export const MATCHING_SEARCHING_STATUS_LINE = '판매자를 찾는 중이에요'

export const MATCHING_EMPTY_EXACT_TAB = '아직 정확한 금액의 판매자가 없어요'
export const MATCHING_EMPTY_NEAR_TAB = '아직 가까운 금액의 판매자가 없어요'

export const MATCHING_NEW_CANDIDATE_BANNER = '새로운 판매자가 등록됐어요'

export const MATCHING_FIRST_EXACT_BANNER = '정확한 금액의 판매자를 찾았어요'
export const MATCHING_FIRST_EXACT_CTA = '정확 매칭 보기'

export const MATCHING_APPLY_STALE_CANDIDATE =
  '이 판매 건은 방금 다른 거래로 연결됐어요'

/** TradeRequestPending — 수락 대기 Activity */
export const TRADE_REQUEST_PENDING_APP_TITLE = '거래 요청'
/** @deprecated WaitingState — getTradeRequestPendingTitle 사용 */
export const TRADE_REQUEST_PENDING_TITLE = '판매자의 응답을 기다리고 있어요'
export const TRADE_REQUEST_PENDING_WAITING_STATUS = '응답 기다리는 중'
export const TRADE_REQUEST_PENDING_AUTO_REMATCH =
  '응답이 없으면\n다른 판매자를 자동으로 찾아드려요'
export const TRADE_REQUEST_PENDING_SECTION_TITLE = '요청한 거래'
export const TRADE_REQUEST_PENDING_CANCEL_CTA = '요청 취소'
export const TRADE_REQUEST_PENDING_FEE_NONE = '없음'
export const TRADE_REQUEST_PENDING_CONNECTED = '거래가 연결됐어요'
export const TRADE_REQUEST_PENDING_ACCEPTED_RACE =
  '판매자가 방금 거래를 수락했어요. 거래 화면으로 이동할게요.'
export const TRADE_REQUEST_PENDING_NO_RESPONSE =
  '응답이 없었어요. 다른 판매자를 찾고 있어요.'

export function getTradeRequestPendingTitle(): string {
  return '판매자의 응답을 기다리고 있어요'
}

export function getTradeRequestPendingDescriptionLines(nickname: string): readonly [string, string] {
  const name = nickname.endsWith('님') ? nickname : `${nickname}님`
  return [`${name}이 거래 요청을 확인하고 있어요.`, '응답이 오면 바로 알려드릴게요.']
}

/** @deprecated getTradeRequestPendingDescriptionLines 사용 */
export function getTradeRequestPendingDescription(nickname: string): string {
  return getTradeRequestPendingDescriptionLines(nickname).join(' ')
}

/** 취소 확인 Bottom Sheet */
export const TRADE_REQUEST_CANCEL_SHEET_TITLE = '거래 요청을 취소할까요?'
export const TRADE_REQUEST_CANCEL_SHEET_KEEP_WAITING = '계속 기다리기'
export const TRADE_REQUEST_CANCEL_SHEET_CONFIRM = '요청 취소'

export function getTradeRequestCancelSheetDescriptionLines(nickname: string): [string, string] {
  return [
    `${nickname}님의 응답을 더 이상 기다리지 않아요.`,
    '취소하면 다시 거래를 찾아야 해요.',
  ]
}

/** @deprecated 2줄 분리용 getTradeRequestCancelSheetDescriptionLines 사용 */
export function getTradeRequestCancelSheetDescription(nickname: string): string {
  return getTradeRequestCancelSheetDescriptionLines(nickname).join(' ')
}

/** 취소 완료 화면 */
export const TRADE_REQUEST_CANCELLED_TITLE = '거래 요청이 취소되었어요'
export const TRADE_REQUEST_CANCELLED_DESCRIPTION = '다른 판매자를 찾아볼까요?'
export const TRADE_REQUEST_CANCELLED_HINT_SEARCH = '다른 판매자를 찾아볼 수 있어요'
export const TRADE_REQUEST_CANCELLED_HINT_SEARCH_DETAIL =
  '기존 조건을 그대로 유지해서 바로 찾아볼게요.'
export const TRADE_REQUEST_CANCELLED_FIND_SELLERS = '다른 판매자 찾기'
export const TRADE_REQUEST_CANCELLED_BROWSE_MARKET = '거래소 둘러보기'

/** 광고 placeholder */
export const TRADE_REQUEST_AD_LABEL = '광고'
export const TRADE_REQUEST_AD_TITLE = 'Brit 제휴 이벤트'
export const TRADE_REQUEST_AD_DESCRIPTION = 'Coin 전환 시 수수료 혜택을 받아보세요'
export const TRADE_REQUEST_AD_CTA = '자세히 보기'
export const TRADE_REQUEST_AD_SNACKBAR = '제휴 이벤트 상세는 곧 확인할 수 있어요'

/** 요청 시각 — proposedAt → 오후 2:35 */
export function formatTradeRequestTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function getMatchingHeroCopy(params: {
  mode: MatchingUiMode
  role: TradeRole
  exactCount?: number
  nearCount?: number
  amountKrw?: number
}): MatchingHeroCopy {
  return getMatchingResultHeroCopy({
    mode: params.mode,
    role: params.role,
    exactCount: params.exactCount ?? 0,
    nearCount: params.nearCount ?? 0,
    amountKrw: params.amountKrw,
  })
}

export function formatMatchingElapsed(startedAt: string, nowMs: number): string {
  const elapsedSec = Math.max(0, Math.floor((nowMs - new Date(startedAt).getTime()) / 1000))
  const minutes = Math.floor(elapsedSec / 60)
  const seconds = elapsedSec % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function formatMatchingCountdown(expiresAt: string, nowMs: number): string {
  const remainSec = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - nowMs) / 1000))
  const minutes = Math.floor(remainSec / 60)
  const seconds = remainSec % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export const MATCHING_PROPOSAL_START_NOTICE_LINE1 = '상대방이 수락하면 거래가 시작돼요.'
export const MATCHING_PROPOSAL_START_NOTICE_LINE2 =
  '수락 전에는 현금과 Coin이 이동하지 않아요.'

/** @deprecated Callout은 LINE1/LINE2 사용. 하위 호환용 단문. */
export const MATCHING_PROPOSAL_START_NOTICE = `${MATCHING_PROPOSAL_START_NOTICE_LINE1} ${MATCHING_PROPOSAL_START_NOTICE_LINE2}`

export const MATCHING_PROPOSAL_SKIP_LABEL = '이 판매자 건너뛰기'

export function getMatchingProposalMatchBadge(matchType: 'EXACT' | 'NEAR'): string {
  return matchType === 'EXACT' ? '정확 매칭' : '비슷한 금액'
}

export function getMatchingProposalTitle(coinLabel: string): string {
  return `${coinLabel} 거래`
}

export function getMatchingProposalSellerDetail(
  tradeCount: number,
  completionRatePct?: number,
): string {
  if (tradeCount <= 0) return '거래 이력 없음'
  if (typeof completionRatePct === 'number' && completionRatePct > 0) {
    return `완료 거래 ${tradeCount}건 · 완료율 ${completionRatePct}%`
  }
  return `완료 거래 ${tradeCount}건`
}

export function getMatchingProposalCtaLabel(coinLabel: string): string {
  return `${coinLabel} 거래 요청`
}

export function getMatchingResultHeroCopy(params: {
  mode: MatchingUiMode
  exactCount: number
  nearCount: number
  role: TradeRole
  amountKrw?: number
}): MatchingHeroCopy {
  const counterparty = params.role === 'BUYER' ? '판매자' : '구매자'
  const coinLabel =
    typeof params.amountKrw === 'number' ? formatCoinAmount(params.amountKrw) : null

  if (params.mode === 'PENDING') {
    return {
      title: '거래 요청을 보냈어요',
      description: '상대방의 응답을 기다리고 있어요. 응답이 없으면 자동으로 다시 찾아드릴게요.',
    }
  }

  if (params.mode === 'SEARCHING') {
    return {
      title: coinLabel
        ? `${coinLabel}에 맞는 ${counterparty}를 찾고 있어요`
        : `조건에 맞는 ${counterparty}를 찾고 있어요`,
      description: '새 제안이 생기면 바로 알려드릴게요.',
    }
  }

  // Adaptive Hero — 결과가 있어도 "계속 찾는 중" 톤 유지
  return {
    title: coinLabel
      ? `${coinLabel}에 맞는 ${counterparty}를 찾고 있어요`
      : `조건에 맞는 ${counterparty}를 찾고 있어요`,
    description:
      params.exactCount + params.nearCount > 0
        ? `정확 ${params.exactCount}명 · 가까운 금액 ${params.nearCount}명`
        : '더 좋은 조건도 계속 찾고 있어요',
  }
}

export function getMatchingLiveAnnounce(params: {
  exactCount: number
  coinLabel: string
}): string {
  return `정확 매칭 한 건을 찾았습니다. 금액은 ${params.coinLabel}입니다.`
}
