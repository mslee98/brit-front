import { useEffect } from 'react'

import { getMyTrade, shouldUseTradesHttpApi } from '../api/trades.api'
import {
  DISPUTE_WS_EVENTS,
  getDisputeSocket,
  type DisputeQueueEventPayload,
} from '../realtime/disputeSocket'
import { notify, setTradeRecord } from '../stores/tradeSession.state'
import { serverResponseToTradeRecord } from '../types'

/**
 * Trade 화면에 있는 당사자가 상대/워커 분쟁 개설을 폴링 없이 스토어에 반영한다.
 * 채팅 입장은 usePartyDisputeOpenedNavigate (전역).
 */
export function usePartyDisputeOpenedSync(
  tradeIds: string[],
  enabled: boolean,
): void {
  const key = tradeIds.join(',')

  useEffect(() => {
    if (!enabled || !shouldUseTradesHttpApi() || !key) return

    const watched = new Set(key.split(',').filter(Boolean))
    const socket = getDisputeSocket()

    const onOpened = (payload: DisputeQueueEventPayload) => {
      if (!watched.has(payload.tradeId)) return
      void getMyTrade(payload.tradeId)
        .then((dto) => {
          setTradeRecord(serverResponseToTradeRecord(dto))
          notify()
        })
        .catch(() => undefined)
    }

    socket.on(DISPUTE_WS_EVENTS.OPENED, onOpened)
    if (!socket.connected) socket.connect()

    return () => {
      socket.off(DISPUTE_WS_EVENTS.OPENED, onOpened)
    }
  }, [enabled, key])
}
