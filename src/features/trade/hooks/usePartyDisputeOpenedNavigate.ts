import { useEffect } from 'react'

import { useAuthStatus } from '../../auth/stores/authSession.store'
import { shouldUseTradesHttpApi } from '../api/trades.api'
import {
  DISPUTE_WS_EVENTS,
  getDisputeSocket,
  type DisputeQueueEventPayload,
} from '../realtime/disputeSocket'
import { openDisputeChatById } from '../utils/openDisputeChat'

/**
 * 당사자 어디서든 상대/워커 분쟁 개설을 채팅으로 연다.
 * 이미 그 방이 맨 위면 openDisputeChatById가 no-op.
 */
export function usePartyDisputeOpenedNavigate(): void {
  const authStatus = useAuthStatus()

  useEffect(() => {
    if (authStatus !== 'authenticated' || !shouldUseTradesHttpApi()) return

    const socket = getDisputeSocket()
    const onOpened = (payload: DisputeQueueEventPayload) => {
      if (!payload.disputeId) return
      openDisputeChatById(payload.disputeId)
    }

    socket.on(DISPUTE_WS_EVENTS.OPENED, onOpened)
    if (!socket.connected) socket.connect()

    return () => {
      socket.off(DISPUTE_WS_EVENTS.OPENED, onOpened)
    }
  }, [authStatus])
}
