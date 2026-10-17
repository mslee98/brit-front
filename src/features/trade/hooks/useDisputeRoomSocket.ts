import { useEffect, useRef } from 'react'

import {
  DISPUTE_WS_EVENTS,
  getDisputeSocket,
  type DisputeMessageCreatedPayload,
  type DisputeQueueEventPayload,
} from '../realtime/disputeSocket'

type Handlers = {
  onMessageCreated?: (payload: DisputeMessageCreatedPayload) => void
  onResolved?: (payload: DisputeQueueEventPayload) => void
}

/**
 * 분쟁 방 join + 메시지/해결 이벤트 구독.
 */
export function useDisputeRoomSocket(
  disputeId: string | undefined,
  enabled: boolean,
  handlers: Handlers,
): void {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!disputeId || !enabled) return

    const socket = getDisputeSocket()

    const onMessage = (payload: DisputeMessageCreatedPayload) => {
      if (payload.disputeId !== disputeId) return
      if (payload.message.isInternal) return
      handlersRef.current.onMessageCreated?.(payload)
    }
    const onResolved = (payload: DisputeQueueEventPayload) => {
      if (payload.disputeId !== disputeId) return
      handlersRef.current.onResolved?.(payload)
    }

    const join = () => {
      socket.emit(DISPUTE_WS_EVENTS.JOIN, { disputeId })
    }

    socket.on(DISPUTE_WS_EVENTS.MESSAGE_CREATED, onMessage)
    socket.on(DISPUTE_WS_EVENTS.RESOLVED, onResolved)
    socket.on('connect', join)
    if (socket.connected) {
      join()
    } else {
      socket.connect()
    }

    return () => {
      socket.emit(DISPUTE_WS_EVENTS.LEAVE, { disputeId })
      socket.off(DISPUTE_WS_EVENTS.MESSAGE_CREATED, onMessage)
      socket.off(DISPUTE_WS_EVENTS.RESOLVED, onResolved)
      socket.off('connect', join)
    }
  }, [disputeId, enabled])
}
