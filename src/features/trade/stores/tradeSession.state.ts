/**
 * tradeSession 내부 상태 — actions/split/store가 공유.
 * UI는 tradeSession.store 공개 API만 사용.
 */
import { krwToCoin } from '../../../shared/utils/formatAmount'
import type {
  CreateTradeOrderInput,
  SplitGroup,
  TradeAction,
  TradeDetailViewModel,
  TradeRecord,
  TradeRole,
} from '../types'
import { serverActionsToClientActions } from '../types'

function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber
  const visible = accountNumber.slice(-4)
  const masked = accountNumber.slice(0, -4).replace(/\d/g, '*')
  return masked + visible
}

type Listener = () => void

export const listeners = new Set<Listener>()
export let activeTrade: TradeRecord | null = null
export let activeSplitGroup: SplitGroup | null = null
export const tradesById = new Map<string, TradeRecord>()
export const tradeDetailCache = new Map<string, { version: number; detail: TradeDetailViewModel }>()
export let sessionVersion = 0
export let onMatchedCallback: ((tradeId: string) => void) | null = null
export let onTradeCompletedCallback:
  | ((input: { side: TradeRecord['side']; coinAmount: number }) => void)
  | null = null

export function setOnMatchedCallback(callback: ((tradeId: string) => void) | null) {
  onMatchedCallback = callback
}

export function setOnTradeCompletedCallback(
  callback: ((input: { side: TradeRecord['side']; coinAmount: number }) => void) | null,
) {
  onTradeCompletedCallback = callback
}

let tradeIdSeq = 0

export const MOCK_SELLER_ACCOUNT = {
  bankCode: '090',
  bankName: '카카오뱅크',
  iconUrl: '/assets/banks/icn-bank-kakao.svg',
  accountNumber: '3333012345673',
  accountNumberMasked: '3333-**-******3',
  holderName: '김브릿',
}

export type TradeSessionDevHooks = {
  onPaymentReported?: (
    tradeId: string,
    version: number,
    confirmPayment: (tradeId: string, version: number) => Promise<unknown>,
  ) => void
  clearSimulation?: (tradeId?: string) => void
}

export let devHooks: TradeSessionDevHooks = {}

export function setTradeSessionDevHooks(hooks: TradeSessionDevHooks) {
  devHooks = hooks
}

export function generateTradeId(): string {
  tradeIdSeq += 1
  return `trade-${Date.now()}-${tradeIdSeq}`
}

export function roleFromSide(side: CreateTradeOrderInput['side']): TradeRole {
  return side === 'BUY' ? 'BUYER' : 'SELLER'
}

export function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString()
}

export function getActionsForTrade(trade: TradeRecord): TradeAction[] {
  if (trade.status === 'MATCHING') {
    return ['CANCEL']
  }
  if (trade.status === 'PAYMENT_PENDING') {
    return trade.role === 'BUYER' ? ['REPORT_PAYMENT', 'CANCEL'] : ['CANCEL']
  }
  if (trade.status === 'PAYMENT_TIMEOUT') {
    return trade.role === 'SELLER' ? ['MARK_UNPAID'] : []
  }
  if (trade.status === 'PAYMENT_REPORTED') {
    return trade.role === 'SELLER'
      ? ['CONFIRM_PAYMENT', 'DENY_PAYMENT', 'REQUEST_CANCELLATION']
      : ['REQUEST_CANCELLATION']
  }
  if (trade.status === 'COIN_TRANSFERRING') {
    return []
  }
  if (trade.status === 'DISPUTED') {
    return []
  }
  if (trade.status === 'COMPLETED' || trade.status === 'CANCELLED' || trade.status === 'EXPIRED') {
    return []
  }
  return ['CONTINUE']
}

export function buildTradeDetailViewModel(trade: TradeRecord): TradeDetailViewModel {
  // HTTP 모드에서는 서버 actions 기반으로 변환
  const actions = trade.serverActions
    ? serverActionsToClientActions(trade.serverActions)
    : getActionsForTrade(trade)

  // 계좌 정보: 서버에서 받은 payment 우선, 없으면 mock
  let sellerAccount: TradeDetailViewModel['sellerAccount']
  if (trade.payment) {
    sellerAccount = {
      bankCode: trade.payment.bankCode,
      bankName: trade.payment.bankName,
      iconUrl: trade.payment.iconUrl ?? null,
      accountNumber: trade.payment.accountNumber,
      accountNumberMasked: maskAccountNumber(trade.payment.accountNumber),
      holderName: trade.payment.accountHolderName,
    }
  } else if (trade.role === 'BUYER' && trade.status !== 'MATCHING') {
    sellerAccount = MOCK_SELLER_ACCOUNT
  }

  const counterpartyNickname =
    trade.counterpartyNickname ?? (trade.role === 'BUYER' ? '판매자' : '구매자')

  return {
    ...trade,
    actions,
    counterpartyNickname,
    sellerAccount,
  }
}

export function invalidateTradeDetailCache(tradeId?: string) {
  if (tradeId) {
    tradeDetailCache.delete(tradeId)
    return
  }
  tradeDetailCache.clear()
}

export function setTradeRecord(trade: TradeRecord) {
  tradesById.set(trade.id, trade)
  invalidateTradeDetailCache(trade.id)
  if (activeTrade?.id === trade.id || !activeTrade) {
    activeTrade = trade
  }
}

export function setActiveTrade(trade: TradeRecord | null) {
  activeTrade = trade
  notify()
}

/** 서버 hydration 후 DISPUTED/terminal 등 stale local active 제거 */
export function clearActiveTrade() {
  if (activeTrade === null) return
  activeTrade = null
  notify()
}

export function setActiveSplitGroup(group: SplitGroup | null) {
  activeSplitGroup = group
}

export function notify() {
  sessionVersion += 1
  listeners.forEach((listener) => listener())
}

export function createTradeRecord(input: {
  id: string
  side: CreateTradeOrderInput['side']
  amountKrw: number
  now: string
  splitGroupId?: string
  splitLegIndex?: number
  splitTotalLegs?: number
}): TradeRecord {
  return {
    id: input.id,
    side: input.side,
    role: roleFromSide(input.side),
    status: 'MATCHING',
    amountKrw: input.amountKrw,
    coinAmount: krwToCoin(input.amountKrw),
    version: 1,
    matchingStartedAt: input.now,
    updatedAt: input.now,
    splitGroupId: input.splitGroupId,
    splitLegIndex: input.splitLegIndex,
    splitTotalLegs: input.splitTotalLegs,
  }
}

export function emitTradeCompleted(input: {
  side: TradeRecord['side']
  coinAmount: number
}) {
  onTradeCompletedCallback?.(input)
}

export function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export function isTerminalStatus(status: TradeRecord['status']): boolean {
  return status === 'COMPLETED' || status === 'CANCELLED' || status === 'EXPIRED'
}

/** 홈 「진행 중」·일반 진행 카드 — 실제로 이어갈 수 있는 상태만 */
export function isActionableInProgressTrade(status: TradeRecord['status']): boolean {
  return (
    status === 'MATCHING' ||
    status === 'PAYMENT_PENDING' ||
    status === 'PAYMENT_REPORTED' ||
    status === 'COIN_TRANSFERRING'
  )
}

export function isDisputeTrade(status: TradeRecord['status']): boolean {
  return status === 'DISPUTED'
}

export function isPaymentTimeoutTrade(status: TradeRecord['status']): boolean {
  return status === 'PAYMENT_TIMEOUT'
}

/**
 * 신규 TradeCompose 차단 여부.
 * DISPUTED는 제외(별도 카드만). 판매자 PAYMENT_TIMEOUT은 reserved 유지를 위해 차단.
 */
export function blocksNewTradeCompose(trade: Pick<TradeRecord, 'status' | 'role'>): boolean {
  if (isDisputeTrade(trade.status)) return false
  if (isPaymentTimeoutTrade(trade.status)) return trade.role === 'SELLER'
  return isActionableInProgressTrade(trade.status)
}

export function getTradeOrThrow(tradeId: string): TradeRecord {
  const trade = tradesById.get(tradeId) ?? (activeTrade?.id === tradeId ? activeTrade : null)
  if (!trade) {
    throw new Error('TRADE_NOT_FOUND')
  }
  activeTrade = trade
  return trade
}

export function assertTrade(
  tradeId: string,
  version: number,
  expectedStatus: TradeRecord['status'],
) {
  const trade = getTradeOrThrow(tradeId)
  if (trade.version !== version) {
    throw new Error('TRADE_STATE_CONFLICT')
  }
  if (trade.status === expectedStatus) {
    return
  }
  if (expectedStatus === 'PAYMENT_PENDING' && trade.status === 'PAYMENT_REPORTED') {
    return
  }
  if (expectedStatus === 'PAYMENT_REPORTED' && trade.status === 'COMPLETED') {
    return
  }
  throw new Error('TRADE_STATE_CONFLICT')
}
