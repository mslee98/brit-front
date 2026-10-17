/**
 * 주문·매칭 Socket.IO 클라이언트 (namespace /orders).
 * 쓰기는 REST. 신호만 받아 기존 GET을 다시 친다.
 */
import { io, type Socket } from 'socket.io-client'

import {
  getAccessToken,
  subscribeAccessTokenRefresh,
} from '../../auth/stores/authSession.store'

export const ORDER_WS_EVENTS = {
  JOIN_BUY_ORDER: 'buy-order.join',
  LEAVE_BUY_ORDER: 'buy-order.leave',
  BUY_UPDATED: 'buy-order.updated',
  SELL_UPDATED: 'sell-order.updated',
  REQUEST_UPDATED: 'trade-request.updated',
  MATCHING_CHANGED: 'matching.changed',
} as const

export type BuyOrderUpdatedPayload = { buyOrderId: string; status: string }
export type SellOrderUpdatedPayload = { sellOrderId: string; status: string }
export type TradeRequestUpdatedPayload = {
  requestId: string
  sellOrderId: string
  buyOrderId: string
  status: string
}
export type MatchingChangedPayload = { buyOrderId: string }

function getSocketOrigin(): string {
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''
  return base.replace(/\/v1$/, '') || window.location.origin
}

let shared: Socket | null = null

export function getOrderSocket(): Socket {
  if (shared?.connected) return shared
  if (shared) {
    shared.connect()
    return shared
  }
  const token = getAccessToken()
  shared = io(`${getSocketOrigin()}/orders`, {
    autoConnect: true,
    reconnection: true,
    transports: import.meta.env.DEV ? ['websocket', 'polling'] : ['websocket'],
    auth: { token: token ?? '' },
  })
  return shared
}

export function disconnectOrderSocket(): void {
  if (!shared) return
  shared.disconnect()
  shared = null
}

export function refreshOrderSocketAuth(): void {
  if (!shared) return
  shared.auth = { token: getAccessToken() ?? '' }
  if (!shared.connected) {
    shared.connect()
  }
}

export function bindBuyOrderRoom(buyOrderId: string): () => void {
  const socket = getOrderSocket()
  const join = () => {
    socket.emit(ORDER_WS_EVENTS.JOIN_BUY_ORDER, { buyOrderId })
  }
  socket.on('connect', join)
  if (socket.connected) join()
  return () => {
    socket.off('connect', join)
    socket.emit(ORDER_WS_EVENTS.LEAVE_BUY_ORDER, { buyOrderId })
  }
}

subscribeAccessTokenRefresh(() => {
  refreshOrderSocketAuth()
})
