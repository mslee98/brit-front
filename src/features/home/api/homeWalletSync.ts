import { getCoinWallet, shouldUseCoinsHttpApi } from '../../coins/api/coins.api'
import {
  applyCompletedTrade,
  getHomeWallet,
  setHomeWalletFromApi,
  setPendingBalanceReplay,
} from '../stores/homeWallet.store'
import type { TradeSide } from '../../trade/types'

/** Nest GET /coins/wallet → 홈 지갑 스토어. 잔액 변화 시 replay 예약. */
export async function syncHomeWalletFromApi(): Promise<void> {
  if (!shouldUseCoinsHttpApi()) return

  const from = getHomeWallet().availableCoin
  const walletDto = await getCoinWallet()
  setHomeWalletFromApi({
    availableBalance: walletDto.availableBalance,
    lockedBalance: walletDto.lockedBalance,
  })
  const to = getHomeWallet().availableCoin
  if (from !== to) {
    setPendingBalanceReplay({ from, to })
  }
}

/** 거래 완료 후 지갑 갱신 — API 모드는 서버, mock 모드는 로컬 optimistic */
export async function handleTradeCompletedWallet(input: {
  side: TradeSide
  coinAmount: number
}): Promise<void> {
  if (shouldUseCoinsHttpApi()) {
    await syncHomeWalletFromApi()
    return
  }
  applyCompletedTrade(input)
}
