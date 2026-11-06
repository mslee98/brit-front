/**
 * PurchaseRequestSheet — 판매자 구매요청 의사결정 UI.
 * decide → reject 인시트 전환. 닫기는 결정 보류이며, 내 판매·홈에서 다시 열 수 있다.
 */
import { useMemo, useState } from 'react'
import { Divider, Portal, VStack } from '@seed-design/react'
import { useLoading } from 'react-simplikit'
import {
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetFooter,
  BottomSheetRoot,
} from 'seed-design/ui/bottom-sheet'

import { useLayoutOverlay } from '../../../app/layouts/useLayoutOverlay'
import { formatAmount, formatCoinAmount } from '../../../shared/utils/formatAmount'
import type { TradeRequestDto, TradeRequestRejectionReason } from '../../orders/types'
import { UserSummary } from './UserSummary'
import { GLOBAL_SHEET_LAYER_INDEX } from './purchase-request/constants'
import { PurchaseRequestActions } from './purchase-request/PurchaseRequestActions'
import { PurchaseRequestAmount } from './purchase-request/PurchaseRequestAmount'
import { PurchaseRequestHeader } from './purchase-request/PurchaseRequestHeader'
import { PurchaseRequestNotice } from './purchase-request/PurchaseRequestNotice'
import { PurchaseRequestRejectBody } from './purchase-request/PurchaseRequestRejectBody'
import type { PurchaseRequestSheetMode } from './purchase-request/types'

export type { PurchaseRequestSheetMode } from './purchase-request/types'

interface PurchaseRequestSheetProps {
  open: boolean
  request: TradeRequestDto | null
  onAccept: () => void | Promise<void>
  onReject: (reasonCode: TradeRequestRejectionReason) => void | Promise<void>
  /** 사용자가 손잡이·닫기·바깥 탭으로 닫을 때. 수락/거절 처리 중에는 닫히지 않는다 */
  onDismiss?: () => void
  layerIndex?: number
}

export function PurchaseRequestSheet({
  open,
  request,
  onAccept,
  onReject,
  onDismiss,
  layerIndex = GLOBAL_SHEET_LAYER_INDEX,
}: PurchaseRequestSheetProps) {
  const [loading, startLoading] = useLoading()
  const [mode, setMode] = useState<PurchaseRequestSheetMode>('decide')
  const [reasonCode, setReasonCode] = useState<TradeRequestRejectionReason>(
    'NOT_AVAILABLE_NOW',
  )

  // 앱 루트에 먼저 마운트되어 첫 렌더에는 #app-frame-portal이 없을 수 있다.
  // 렌더마다 다시 찾고, Seed Portal이 ref identity로 갱신을 감지하므로 요소별로 고정한다.
  const portalEl = document.getElementById('app-frame-portal')
  const portalContainerRef = useMemo(
    () => (portalEl ? { current: portalEl } : null),
    [portalEl],
  )

  useLayoutOverlay(open)

  // portal 준비 전엔 마운트하지 않아 document.body fallback을 막는다
  if (!request?.buyer || !portalContainerRef) return null

  const amountKrw = Number(request.match.coinAmount)
  const coinLabel = formatCoinAmount(amountKrw)
  const amountLabel = formatAmount(amountKrw)
  const nickname = request.buyer.nicknameMasked
  const ariaLabel =
    mode === 'decide' ? `${coinLabel}을 판매할까요?` : '이번 요청을 거절할까요?'

  const dismissible = !loading && onDismiss != null

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen || !dismissible) return
    setMode('decide')
    setReasonCode('NOT_AVAILABLE_NOW')
    onDismiss()
  }

  const handleAccept = () => {
    void startLoading(Promise.resolve(onAccept()))
  }

  const handleRejectConfirm = () => {
    void startLoading(Promise.resolve(onReject(reasonCode)))
  }

  return (
    <BottomSheetRoot
      open={open}
      onOpenChange={handleOpenChange}
      closeOnInteractOutside={dismissible}
      closeOnEscape={dismissible}
      dismissible={dismissible}
    >
      <Portal container={portalContainerRef}>
        <BottomSheetContent
          layerIndex={layerIndex}
          showHandle
          showCloseButton={dismissible}
          aria-label={ariaLabel}
          aria-describedby={undefined}
        >
          <BottomSheetBody>
            {mode === 'decide' ? (
              <VStack gap="x5" width="full">
                <PurchaseRequestHeader
                  coinLabel={coinLabel}
                  nicknameMasked={nickname}
                  matchType={request.match.type}
                />

                <UserSummary
                  nicknameMasked={nickname}
                  completedTradeCount={request.buyer.completedTradeCount}
                  completionRate={request.buyer.completionRate}
                />

                <Divider />

                <PurchaseRequestAmount
                  coinLabel={coinLabel}
                  amountLabel={amountLabel}
                />

                <PurchaseRequestNotice />
              </VStack>
            ) : (
              <PurchaseRequestRejectBody
                reasonCode={reasonCode}
                onReasonChange={setReasonCode}
              />
            )}
          </BottomSheetBody>
          <BottomSheetFooter>
            <PurchaseRequestActions
              mode={mode}
              loading={loading}
              onAccept={handleAccept}
              onOpenReject={() => setMode('reject')}
              onConfirmReject={handleRejectConfirm}
              onBackToDecide={() => setMode('decide')}
            />
          </BottomSheetFooter>
        </BottomSheetContent>
      </Portal>
    </BottomSheetRoot>
  )
}
