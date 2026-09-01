import type { TradeSide } from '../../trade/types'

export interface HomeWallet {
  /** 총 보유 = availableCoin + escrowCoin */
  coinBalance: number
  estimatedKrwValue: number
  availableCoin: number
  escrowCoin: number
}

export interface PendingBalanceReplay {
  from: number
  to: number
}

const EMPTY_WALLET: HomeWallet = {
  coinBalance: 0,
  estimatedKrwValue: 0,
  availableCoin: 0,
  escrowCoin: 0,
}

type Listener = () => void

let wallet: HomeWallet = { ...EMPTY_WALLET }
let pendingBalanceReplay: PendingBalanceReplay | null = null
const listeners = new Set<Listener>()

function notify() {
  listeners.forEach((listener) => listener())
}

function syncTotals() {
  const coinBalance = wallet.availableCoin + wallet.escrowCoin
  wallet = {
    ...wallet,
    coinBalance,
    estimatedKrwValue: coinBalance,
  }
}

export function getHomeWallet(): HomeWallet {
  return wallet
}

export function subscribeHomeWallet(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Home 재진입 시 breeze replay용. consume 후 null이 됩니다. */
export function consumePendingBalanceReplay(): PendingBalanceReplay | null {
  const pending = pendingBalanceReplay
  pendingBalanceReplay = null
  return pending
}

export function setPendingBalanceReplay(replay: PendingBalanceReplay | null) {
  pendingBalanceReplay = replay
}

/** mock 세션 전용 — HTTP API 없을 때만 사용 */
export function applyCompletedTrade(input: { side: TradeSide; coinAmount: number }) {
  const from = wallet.availableCoin
  const delta = input.side === 'BUY' ? input.coinAmount : -input.coinAmount
  const to = Math.max(0, from + delta)
  wallet = {
    ...wallet,
    availableCoin: to,
  }
  if (from !== to) {
    pendingBalanceReplay = { from, to }
  }
  syncTotals()
  notify()
}

export function resetHomeWallet() {
  wallet = { ...EMPTY_WALLET }
  pendingBalanceReplay = null
  notify()
}

/** Nest GET /coins/wallet → 홈 지갑 스토어 동기화 */
export function setHomeWalletFromApi(input: {
  availableBalance: string
  lockedBalance: string
}) {
  const available = Number(input.availableBalance)
  const locked = Number(input.lockedBalance)
  if (!Number.isFinite(available) || !Number.isFinite(locked)) {
    return
  }
  wallet = {
    availableCoin: available,
    escrowCoin: locked,
    coinBalance: available + locked,
    estimatedKrwValue: available + locked,
  }
  notify()
}
