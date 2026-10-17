/**
 * 로그인 세션 동안 /trades·/orders 소켓을 한 번만 연다.
 * 화면은 이벤트를 구독하고 기존 GET으로 다시 읽는다.
 */
import { useEffect } from 'react'

import { useAuthStatus } from '../../auth/stores/authSession.store'
import { disconnectOrderSocket, getOrderSocket } from './orderSocket'
import { disconnectTradeSocket, getTradeSocket } from './tradeSocket'

export function RealtimeBootstrap() {
  const authStatus = useAuthStatus()

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      disconnectTradeSocket()
      disconnectOrderSocket()
      return
    }
    getTradeSocket()
    getOrderSocket()
  }, [authStatus])

  return null
}
