/**
 * GlobalSheetHost — App Root 강제 BottomSheet 레이어.
 * 이번 PR: PURCHASE_REQUEST만 실장. Sheet open 기준은 PENDING_SELLER(pending) 존재.
 */
import { useCurrentSellFlow } from '../hooks/useCurrentSellFlow'
import { usePurchaseRequestActions } from '../hooks/usePurchaseRequestActions'
import { PurchaseRequestSheet } from './PurchaseRequestSheet'

export type GlobalSheetType = 'PURCHASE_REQUEST'

export function GlobalSheetHost() {
  const flow = useCurrentSellFlow({ poll: true })
  const { handleAccept, handleReject } = usePurchaseRequestActions()

  const open =
    flow.uiState === 'PURCHASE_REQUEST' && flow.pendingRequest?.buyer != null

  return (
    <PurchaseRequestSheet
      key={flow.pendingRequest?.id ?? `reopen-${flow.sheetReopenNonce}`}
      open={open}
      request={flow.pendingRequest}
      allowDismiss={flow.allowDismiss}
      onAccept={handleAccept}
      onReject={handleReject}
    />
  )
}
