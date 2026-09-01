/**
 * coins.api — Nest 지갑 조회.
 */
import { httpGet } from '../../../shared/api/httpClient'
import { shouldUseHttpApi } from '../../../shared/api/apiMode'

export interface CoinWalletDto {
  totalBalance: string
  availableBalance: string
  lockedBalance: string
  sellableBalance: string
  nonSellableBalance: string
  lockedSellableBalance: string
  lockedNonSellableBalance: string
  pendingSellableBalance: string
}

export async function getCoinWallet(signal?: AbortSignal): Promise<CoinWalletDto> {
  return httpGet<CoinWalletDto>('/v1/coins/wallet', signal)
}

export function shouldUseCoinsHttpApi(): boolean {
  return shouldUseHttpApi()
}
