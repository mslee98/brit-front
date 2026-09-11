/**
 * @deprecated GlobalSheetHost + useCurrentSellFlow + usePurchaseRequestActions 사용.
 */
import { useCurrentSellFlow } from './useCurrentSellFlow'
import { usePurchaseRequestActions } from './usePurchaseRequestActions'

export function useGlobalPurchaseRequestSheet() {
  const flow = useCurrentSellFlow({ poll: true })
  const actions = usePurchaseRequestActions()

  return {
    open: flow.uiState === 'PURCHASE_REQUEST' && flow.pendingRequest != null,
    request: flow.pendingRequest,
    isActing: flow.isActing,
    allowDismiss: flow.allowDismiss,
    handleAccept: actions.handleAccept,
    handleReject: actions.handleReject,
    refreshQueue: flow.refresh,
  }
}
