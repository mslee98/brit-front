/**
 * 거래 상태 Socket.IO 클라이언트 (namespace /trades).
 * 쓰기는 REST. 상태 변경 알림만 받아 상세를 다시 조회한다.
 */
import { io, type Socket } from 'socket.io-client'

import {
  getAccessToken,
  subscribeAccessTokenRefresh,
} from '../../auth/stores/authSession.store'

export const TRADE_WS_EVENTS = {
  UPDATED: 'trade.updated',
} as const

export type TradeUpdatedPayload = {
  tradeId: string
  status: string
  buyerUserId: string
  sellerUserId: string
}

function getSocketOrigin(): string {
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''
  return base.replace(/\/v1$/, '') || window.location.origin
}

let shared: Socket | null = null

export function getTradeSocket(): Socket {
  if (shared?.connected) return shared
  if (shared) {
    shared.connect()
    return shared
  }
  const token = getAccessToken()
  shared = io(`${getSocketOrigin()}/trades`, {
    autoConnect: true,
    reconnection: true,
    transports: import.meta.env.DEV ? ['websocket', 'polling'] : ['websocket'],
    auth: { token: token ?? '' },
  })
  return shared
}

export function disconnectTradeSocket(): void {
  if (!shared) return
  shared.disconnect()
  shared = null
}

export function refreshTradeSocketAuth(): void {
  if (!shared) return
  shared.auth = { token: getAccessToken() ?? '' }
  if (!shared.connected) {
    shared.connect()
  }
}

subscribeAccessTokenRefresh(() => {
  refreshTradeSocketAuth()
})
