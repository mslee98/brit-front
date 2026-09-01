import { useEffect } from 'react'

import {
  getActiveSplitGroup,
  getTradeDetail,
} from '../../trade/stores/tradeSession.store'
import {
  BRIT_PUSH_CLICK_MESSAGE,
  TRADE_PUSH_OPEN_EVENT,
  type TradePushNavigationDetail,
} from '../services/pushNotificationService'
import { actions } from '../../../stackflow/stackflow'

function navigateFromPush(detail: TradePushNavigationDetail) {
  if (detail.sellOrderId) {
    actions.push('SellOrderDetail', { sellOrderId: detail.sellOrderId }, { animate: true })
    return
  }

  if (detail.buyOrderId) {
    actions.push('MatchingWaiting', { buyOrderId: detail.buyOrderId }, { animate: true })
    return
  }

  const tradeId = detail.tradeId
  if (!tradeId) return

  const trade = getTradeDetail(tradeId)
  const splitGroupId = trade?.splitGroupId ?? getActiveSplitGroup()?.id

  if (splitGroupId) {
    actions.push(
      'Trade',
      {
        splitGroupId,
        ...(trade?.splitLegIndex ? { focusLeg: String(trade.splitLegIndex) } : {}),
      },
      { animate: true },
    )
    return
  }

  actions.push('Trade', { tradeId }, { animate: true })
}

/**
 * Web Push / 브라우저 Notification 클릭 → 거래 화면 deep link.
 * 클릭 후 payload 상태는 믿지 않고, 화면이 GET으로 최신을 그립니다.
 */
export function useTradePushNavigation() {
  useEffect(() => {
    const handleOpenTrade = (event: Event) => {
      const detail = (event as CustomEvent<TradePushNavigationDetail>).detail
      if (!detail) return
      navigateFromPush(detail)
    }

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const data = event.data as TradePushNavigationDetail & { type?: string }
      if (data?.type !== BRIT_PUSH_CLICK_MESSAGE) return
      navigateFromPush(data)
    }

    window.addEventListener(TRADE_PUSH_OPEN_EVENT, handleOpenTrade)
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage)
    return () => {
      window.removeEventListener(TRADE_PUSH_OPEN_EVENT, handleOpenTrade)
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage)
    }
  }, [])
}
