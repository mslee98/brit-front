import type { SellOrderDto } from '../orders/types'
import type { TradeSide, TradeStatus } from '../trade/types'

export interface HomeProgressSellOrder {
  order: SellOrderDto
  hasPendingRequest: boolean
}

export interface HomeViewModel {
  user: {
    id: string
    nickname: string
    isVerified: boolean
  }
  wallet: {
    coinBalance: number
    estimatedKrwValue: number
    availableCoin: number
    escrowCoin: number
  }
  unreadNotificationCount: number
  activeTrade?: {
    id: string
    role: 'BUYER' | 'SELLER'
    status: TradeStatus
    amountKrw: number
    coinAmount: number
    updatedAt: string
  }
  recentTrades: Array<{
    id: string
    type: TradeSide
    status: 'COMPLETED' | 'CANCELLED' | 'EXPIRED'
    amountKrw: number
    coinAmount: number
    completedAt: string
  }>
}
