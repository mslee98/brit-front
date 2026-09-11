import type { BuyOrderDto } from '../../orders/types'
import type { MatchingSession } from '../../trade/matching/types'
import type { SplitGroup, TradeRecord, TradeRole, TradeStatus } from '../../trade/types'
import { formatAmount, formatCoinUnit } from '../../../shared/utils/formatAmount'
import { getHomeActiveTradeCopy, getPaymentSellerWaitingHomeDetail } from '../../trade/copy'
import {
  isActionableInProgressTrade,
  isDisputeTrade,
  isPaymentTimeoutTrade,
  isTerminalStatus,
} from '../../trade/stores/tradeSession.store'
import { HOME_PROGRESS_COPY } from '../copy/homeProgress'
import type { HomeProgressSellOrder } from '../types'

export type HomeTradeListKind = 'attention' | 'inProgress'

export type HomeAttentionAction =
  | 'deposit'
  | 'confirm'
  | 'matching'
  | 'mark_unpaid'
  | 'dispute'

export type HomeMetaSecondaryTone = 'warning' | 'muted' | 'brand'

export interface HomeTradeListItem {
  id: string
  kind: HomeTradeListKind
  title: string
  /** 단일 문자열 폴백 (검색·접근성) */
  meta: string
  /** 유형 라벨 — 예: 구매 거래 */
  metaPrimary?: string
  /** 상태·기한 — 예: 8분 남음 */
  metaSecondary?: string
  metaSecondaryTone?: HomeMetaSecondaryTone
  detail?: string
  badge?: string
  attentionAction?: HomeAttentionAction
  /** 진행 중 행 leading 아이콘 방향 */
  progressSide?: 'BUY' | 'SELL'
  tradeId?: string
  splitGroupId?: string
  sellOrderId?: string
  buyOrderId?: string
  requestedAmountKrw?: number
}

function isAttentionTrade(
  status: TradeStatus,
  role: TradeRole,
  matchingSession: MatchingSession | null,
  tradeId: string,
): boolean {
  if (role === 'BUYER' && status === 'PAYMENT_PENDING') return true
  if (role === 'SELLER' && status === 'PAYMENT_REPORTED') return true
  if (
    status === 'MATCHING' &&
    matchingSession?.suggestion != null &&
    matchingSession.tradeId === tradeId
  ) {
    return true
  }
  return false
}

function formatRemainingMinutes(deadline?: string): string | null {
  if (!deadline) return null
  const ms = new Date(deadline).getTime() - Date.now()
  if (Number.isNaN(ms)) return null
  if (ms <= 0) return '기한이 지났어요'
  const minutes = Math.max(1, Math.ceil(ms / 60_000))
  return `${minutes}분 남음`
}

function sideLabel(role: TradeRole): string {
  return role === 'BUYER' ? '구매 거래' : '판매 거래'
}

function joinMeta(primary: string, secondary?: string | null): string {
  return secondary ? `${primary} · ${secondary}` : primary
}

function shortSideLabel(role: TradeRole): string {
  return role === 'BUYER' ? '구매' : '판매'
}

function buildAttentionCopy(trade: TradeRecord, matchingSession: MatchingSession | null) {
  const amount = formatAmount(trade.amountKrw)
  const remaining = formatRemainingMinutes(trade.paymentDeadline)

  if (trade.role === 'BUYER' && trade.status === 'PAYMENT_PENDING') {
    return {
      title: '입금이 필요해요',
      meta: joinMeta(amount, remaining),
      metaPrimary: amount,
      metaSecondary: remaining ?? undefined,
      metaSecondaryTone: remaining ? ('warning' as const) : undefined,
      detail: '입금하면 바로 다음 단계로 진행돼요',
      attentionAction: 'deposit' as const,
    }
  }

  if (trade.role === 'SELLER' && trade.status === 'PAYMENT_REPORTED') {
    return {
      title: '입금 확인이 필요해요',
      meta: joinMeta(amount, '구매자 입금 완료'),
      metaPrimary: amount,
      metaSecondary: '구매자 입금 완료',
      metaSecondaryTone: 'muted' as const,
      detail: '확인 후 Coin 이전이 진행돼요',
      attentionAction: 'confirm' as const,
    }
  }

  const fallback = getHomeActiveTradeCopy({
    status: trade.status,
    role: trade.role,
    matchingSession:
      trade.status === 'MATCHING' && matchingSession?.tradeId === trade.id
        ? matchingSession
        : null,
  })

  return {
    title: fallback.title,
    meta: joinMeta(sideLabel(trade.role), fallback.badge),
    metaPrimary: sideLabel(trade.role),
    metaSecondary: fallback.badge,
    metaSecondaryTone: 'brand' as const,
    detail: fallback.description,
    attentionAction: 'matching' as const,
  }
}

function buildInProgressCopy(trade: TradeRecord) {
  const side = shortSideLabel(trade.role)
  const progressSide = trade.role === 'BUYER' ? ('BUY' as const) : ('SELL' as const)

  if (trade.role === 'BUYER' && trade.status === 'PAYMENT_REPORTED') {
    return {
      title: `${side} · 확인 대기`,
      meta: `${formatCoinUnit(trade.coinAmount)} 받을 예정`,
      detail: '상대방의 확인을 기다려요',
      progressSide,
    }
  }

  if (trade.status === 'MATCHING') {
    return {
      title: `${side} · 매칭 중`,
      meta: formatAmount(trade.amountKrw),
      detail: trade.role === 'BUYER' ? '판매자를 찾고 있어요' : '구매자를 찾고 있어요',
      progressSide,
    }
  }

  if (trade.role === 'SELLER' && trade.status === 'PAYMENT_PENDING') {
    const remaining = formatRemainingMinutes(trade.paymentDeadline)
    const nickname = trade.counterpartyNickname
    return {
      title: `${side} · 입금 대기`,
      meta: joinMeta(formatAmount(trade.amountKrw), remaining),
      metaPrimary: formatAmount(trade.amountKrw),
      metaSecondary: remaining ?? undefined,
      metaSecondaryTone: remaining ? ('warning' as const) : undefined,
      detail: nickname
        ? getPaymentSellerWaitingHomeDetail(nickname)
        : '구매자 입금을 기다리고 있어요',
      progressSide,
    }
  }

  return {
    title: `${side} · 진행 중`,
    meta: formatAmount(trade.amountKrw),
    detail: sideLabel(trade.role),
    progressSide,
  }
}

function buildSplitInProgressItem(splitGroup: SplitGroup): HomeTradeListItem {
  const side = splitGroup.side === 'BUY' ? '구매' : '판매'
  return {
    id: `split-${splitGroup.id}`,
    kind: 'inProgress',
    title: `${side} · 진행 중`,
    meta: `${formatAmount(splitGroup.totalAmountKrw)} · ${splitGroup.completedLegs}/${splitGroup.totalLegs}건 완료`,
    detail: `${side} ${splitGroup.totalLegs}건으로 나눠 진행해요`,
    progressSide: splitGroup.side,
    splitGroupId: splitGroup.id,
  }
}

function buildSellOrderAttentionItem(entry: HomeProgressSellOrder): HomeTradeListItem {
  const pending = entry.pendingRequest
  const amountKrw = pending
    ? Number(pending.match.coinAmount)
    : Number(entry.order.amount.remaining) > 0
      ? Number(entry.order.amount.remaining)
      : Number(entry.order.amount.original)
  const amountLabel = formatCoinUnit(amountKrw)
  const buyerLine = pending?.buyer
    ? `${pending.buyer.nicknameMasked.endsWith('님') ? pending.buyer.nicknameMasked : `${pending.buyer.nicknameMasked}님`} · 거래 ${pending.buyer.completedTradeCount.toLocaleString('ko-KR')}회`
    : HOME_PROGRESS_COPY.sellPendingAttention.detail

  return {
    id: `sell-${entry.order.id}`,
    kind: 'attention',
    title: HOME_PROGRESS_COPY.sellPendingAttention.title,
    meta: joinMeta(amountLabel, '구매 요청'),
    metaPrimary: amountLabel,
    metaSecondary: '구매 요청',
    metaSecondaryTone: 'brand',
    detail: buyerLine,
    attentionAction: 'confirm',
    progressSide: 'SELL',
    sellOrderId: entry.order.id,
  }
}

function buildSellOrderInProgressItem(entry: HomeProgressSellOrder): HomeTradeListItem {
  const remaining = Number(entry.order.amount.remaining)
  const amountKrw =
    remaining > 0 ? remaining : Number(entry.order.amount.original)
  const amountLabel = formatCoinUnit(amountKrw)
  return {
    id: `sell-${entry.order.id}`,
    kind: 'inProgress',
    title: HOME_PROGRESS_COPY.sellWaiting.title,
    meta: amountLabel,
    detail: HOME_PROGRESS_COPY.sellWaiting.detail,
    progressSide: 'SELL',
    sellOrderId: entry.order.id,
  }
}

function buildBuyOrderAttentionItem(order: BuyOrderDto): HomeTradeListItem {
  const amountKrw = Number(order.coinAmount)
  const amountLabel = formatCoinUnit(amountKrw)
  return {
    id: `buy-${order.id}`,
    kind: 'attention',
    title: HOME_PROGRESS_COPY.buyRequestPending.title,
    meta: joinMeta(amountLabel, '수락 대기'),
    metaPrimary: amountLabel,
    metaSecondary: '수락 대기',
    metaSecondaryTone: 'warning',
    detail: HOME_PROGRESS_COPY.buyRequestPending.detail,
    attentionAction: 'matching',
    progressSide: 'BUY',
    buyOrderId: order.id,
    requestedAmountKrw: amountKrw,
  }
}

function buildBuyOrderInProgressItem(order: BuyOrderDto): HomeTradeListItem {
  const amountKrw = Number(order.coinAmount)
  const amountLabel = formatCoinUnit(amountKrw)
  return {
    id: `buy-${order.id}`,
    kind: 'inProgress',
    title: HOME_PROGRESS_COPY.buyMatching.title,
    meta: amountLabel,
    detail: HOME_PROGRESS_COPY.buyMatching.detail,
    progressSide: 'BUY',
    buyOrderId: order.id,
    requestedAmountKrw: amountKrw,
  }
}

function appendServerOrderItems(
  attentionItems: HomeTradeListItem[],
  inProgressItems: HomeTradeListItem[],
  input: {
    sellOrders: HomeProgressSellOrder[]
    buyOrders: BuyOrderDto[]
    /** 판매자 활성 Trade가 있으면 Sell 대기/요청 카드 중복 생략 */
    skipSellOrders?: boolean
  },
): { hydratedBuyOrderIds: Set<string>; hydratedSellOrderIds: Set<string> } {
  const hydratedBuyOrderIds = new Set<string>()
  const hydratedSellOrderIds = new Set<string>()

  if (!input.skipSellOrders) {
    for (const entry of input.sellOrders) {
      hydratedSellOrderIds.add(entry.order.id)
      if (entry.hasPendingRequest) {
        attentionItems.push(buildSellOrderAttentionItem(entry))
      } else {
        inProgressItems.push(buildSellOrderInProgressItem(entry))
      }
    }
  }

  for (const order of input.buyOrders) {
    hydratedBuyOrderIds.add(order.id)
    if (order.status === 'REQUEST_PENDING') {
      attentionItems.push(buildBuyOrderAttentionItem(order))
    } else if (order.status === 'MATCHING') {
      inProgressItems.push(buildBuyOrderInProgressItem(order))
    }
  }

  return { hydratedBuyOrderIds, hydratedSellOrderIds }
}

function buildDisputeAttentionItem(trade: TradeRecord): HomeTradeListItem {
  const amountLabel = formatAmount(trade.amountKrw)
  return {
    id: trade.id,
    kind: 'attention',
    title: HOME_PROGRESS_COPY.disputeAttention.title,
    meta: joinMeta(amountLabel, '분쟁'),
    metaPrimary: amountLabel,
    metaSecondary: '분쟁',
    metaSecondaryTone: 'warning',
    detail: HOME_PROGRESS_COPY.disputeAttention.detail,
    attentionAction: 'dispute',
    progressSide: trade.role === 'BUYER' ? 'BUY' : 'SELL',
    tradeId: trade.id,
  }
}

function buildPaymentTimeoutAttentionItem(trade: TradeRecord): HomeTradeListItem {
  const amountLabel = formatAmount(trade.amountKrw)
  return {
    id: trade.id,
    kind: 'attention',
    title: HOME_PROGRESS_COPY.paymentTimeoutAttention.title,
    meta: joinMeta(amountLabel, '입금 기한 만료'),
    metaPrimary: amountLabel,
    metaSecondary: '입금 기한 만료',
    metaSecondaryTone: 'warning',
    detail: HOME_PROGRESS_COPY.paymentTimeoutAttention.detail,
    attentionAction: 'mark_unpaid',
    progressSide: trade.role === 'BUYER' ? 'BUY' : 'SELL',
    tradeId: trade.id,
  }
}

/**
 * 홈 「지금 필요한 활동」/「진행 중인 거래」리스트 파생.
 * 한 거래는 attention XOR inProgress — 동시에 양쪽에 넣지 않습니다.
 */
export function buildHomeTradeLists(input: {
  activeTrades: TradeRecord[]
  splitGroup: SplitGroup | null
  matchingSession: MatchingSession | null
  sellOrders?: HomeProgressSellOrder[]
  buyOrders?: BuyOrderDto[]
  /** 판매자 활성 Trade 있으면 Sell 카드 생략 (Trade 카드가 Entry) */
  skipSellOrders?: boolean
}): { attentionItems: HomeTradeListItem[]; inProgressItems: HomeTradeListItem[] } {
  const attentionItems: HomeTradeListItem[] = []
  const inProgressItems: HomeTradeListItem[] = []

  if (input.splitGroup) {
    inProgressItems.push(buildSplitInProgressItem(input.splitGroup))
  }

  const { hydratedBuyOrderIds } = appendServerOrderItems(attentionItems, inProgressItems, {
    sellOrders: input.sellOrders ?? [],
    buyOrders: input.buyOrders ?? [],
    skipSellOrders: input.skipSellOrders === true,
  })

  for (const trade of input.activeTrades) {
    if (trade.splitGroupId) continue
    if (isTerminalStatus(trade.status)) continue
    if (hydratedBuyOrderIds.has(trade.id)) continue

    if (isDisputeTrade(trade.status)) {
      attentionItems.push(buildDisputeAttentionItem(trade))
      continue
    }

    if (isPaymentTimeoutTrade(trade.status)) {
      attentionItems.push(buildPaymentTimeoutAttentionItem(trade))
      continue
    }

    if (!isActionableInProgressTrade(trade.status)) continue

    const needsAttention = isAttentionTrade(
      trade.status,
      trade.role,
      input.matchingSession,
      trade.id,
    )

    if (needsAttention) {
      const copy = buildAttentionCopy(trade, input.matchingSession)
      attentionItems.push({
        id: trade.id,
        kind: 'attention',
        title: copy.title,
        meta: copy.meta,
        metaPrimary: copy.metaPrimary,
        metaSecondary: copy.metaSecondary,
        metaSecondaryTone: copy.metaSecondaryTone,
        detail: copy.detail,
        attentionAction: copy.attentionAction,
        tradeId: trade.id,
        ...(trade.status === 'MATCHING' && trade.role === 'BUYER'
          ? { buyOrderId: trade.id, requestedAmountKrw: trade.amountKrw }
          : {}),
      })
    } else {
      const copy = buildInProgressCopy(trade)
      inProgressItems.push({
        id: trade.id,
        kind: 'inProgress',
        title: copy.title,
        meta: copy.meta,
        detail: copy.detail,
        progressSide: copy.progressSide,
        tradeId: trade.id,
        ...(trade.status === 'MATCHING' && trade.role === 'BUYER'
          ? { buyOrderId: trade.id, requestedAmountKrw: trade.amountKrw }
          : {}),
      })
    }
  }

  return { attentionItems, inProgressItems }
}
