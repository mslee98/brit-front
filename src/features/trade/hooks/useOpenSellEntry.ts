import { useFlow } from '@stackflow/react'
import { useCallback } from 'react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { showSnackbar } from '../../../shared/utils/showSnackbar'
import { SELL_ACTIVE_ORDER_NOTICE } from '../../orders/utils/sellOrderDetailCopy'
import { getSellFlowState } from '../stores/sellFlow.store'

/**
 * 「판매하기」 공통 진입 — 1인 1활성 판매.
 * 활성 판매가 있으면 작성 화면 대신 내 판매로 보낸다. 서버도 ACTIVE_SELL_ORDER_EXISTS로 막는다.
 */
export function useOpenSellEntry() {
  const { push } = useFlow()
  const snackbar = useSnackbarAdapter()

  return useCallback(() => {
    const { sellOrder } = getSellFlowState()
    if (sellOrder) {
      showSnackbar(snackbar, SELL_ACTIVE_ORDER_NOTICE)
      push(
        'SellOrderDetail',
        { sellOrderId: sellOrder.id, entryContext: 'history' },
        { animate: true },
      )
      return
    }
    push('TradeCompose', { side: 'SELL' }, { animate: true })
  }, [push, snackbar])
}
