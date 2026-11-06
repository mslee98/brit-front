/**
 * 분쟁 채팅 Socket.IO 클라이언트 (namespace /disputes).
 * 쓰기는 REST, 수신만 소켓.
 */
import { io, type Socket } from 'socket.io-client'

import {
  getAccessToken,
  subscribeAccessTokenRefresh,
} from '../../auth/stores/authSession.store'
import { trackRealtimeSocket, untrackRealtimeSocket } from './realtimeSync'

export const DISPUTE_WS_EVENTS = {
  JOIN: 'dispute.join',
  LEAVE: 'dispute.leave',
  MESSAGE_CREATED: 'dispute.message.created',
  OPENED: 'dispute.opened',
  UPDATED: 'dispute.updated',
  RESOLVED: 'dispute.resolved',
} as const

export type DisputeRealtimeMessage = {
  id: string
  actionType: 'MESSAGE' | 'INTERNAL_NOTE' | 'EVIDENCE'
  isInternal: boolean
  actorUserId: string | null
  actorRole: 'SYSTEM' | 'BUYER' | 'SELLER' | 'ADMIN'
  body: string
  imageUrl?: string | null
  createdAt: string
}

export type DisputeMessageCreatedPayload = {
  disputeId: string
  message: DisputeRealtimeMessage
}

export type DisputeQueueEventPayload = {
  disputeId: string
  tradeId: string
  status: string
}

function getSocketOrigin(): string {
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''
  return base.replace(/\/v1$/, '') || window.location.origin
}

let shared: Socket | null = null

export function getDisputeSocket(): Socket {
  if (shared?.connected) return shared
  if (shared) {
    shared.connect()
    return shared
  }
  shared = io(`${getSocketOrigin()}/disputes`, {
    autoConnect: true,
    reconnection: true,
    transports: import.meta.env.DEV ? ['websocket', 'polling'] : ['websocket'],
    // 재연결마다 최신 토큰을 읽는다
    auth: (cb) => cb({ token: getAccessToken() ?? '' }),
  })
  trackRealtimeSocket('disputes', shared)
  return shared
}

export function disconnectDisputeSocket(): void {
  if (!shared) return
  shared.disconnect()
  shared = null
  untrackRealtimeSocket('disputes')
}

export function refreshDisputeSocketAuth(): void {
  if (!shared) return
  if (!shared.connected) {
    shared.connect()
  }
}

subscribeAccessTokenRefresh(() => {
  refreshDisputeSocketAuth()
})
