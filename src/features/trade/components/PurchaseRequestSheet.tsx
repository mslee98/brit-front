/**
 * PurchaseRequestSheet — 판매자 구매요청 의사결정 UI (non-dismissible).
 * decide → reject 인시트 전환. X/handle/outside dismiss 없음.
 */
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
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
  /** true일 때만 onOpenChange(false) 허용. 성공 처리 후 부모가 닫을 때 사용 */
  allowDismiss?: boolean
  onOpenChange?: (open: boolean) => void
  layerIndex?: number
}

export function PurchaseRequestSheet({
  open,
  request,
  onAccept,
  onReject,
  allowDismiss = false,
  onOpenChange,
  layerIndex = GLOBAL_SHEET_LAYER_INDEX,
}: PurchaseRequestSheetProps) {
  // Seed Portal은 container ref 객체 identity 변경 시에만 current를 다시 읽음.
  // 첫 페인트에 #app-frame-portal이 없을 수 있어 layout 이후 state로 주입한다.
  const [portalContainerRef, setPortalContainerRef] = useState<
    RefObject<HTMLElement | null> | null
  >(null)
  const [loading, startLoading] = useLoading()
  const [mode, setMode] = useState<PurchaseRequestSheetMode>('decide')
  const [reasonCode, setReasonCode] = useState<TradeRequestRejectionReason>(
    'NOT_AVAILABLE_NOW',
  )
  const allowDismissRef = useRef(allowDismiss)
  allowDismissRef.current = allowDismiss

  useLayoutEffect(() => {
    const el = document.getElementById('app-frame-portal')
    if (!el) return
    setPortalContainerRef({ current: el })
  }, [])

  useLayoutOverlay(open)

  useEffect(() => {
    if (!open) {
      setMode('decide')
      setReasonCode('NOT_AVAILABLE_NOW')
    }
  }, [open])

  useEffect(() => {
    setMode('decide')
    setReasonCode('NOT_AVAILABLE_NOW')
  }, [request?.id])

  // portal 준비 전엔 마운트하지 않아 document.body fallback을 막는다
  if (!request?.buyer || !portalContainerRef) return null

  const amountKrw = Number(request.match.coinAmount)
  const coinLabel = formatCoinAmount(amountKrw)
  const amountLabel = formatAmount(amountKrw)
  const nickname = request.buyer.nicknameMasked
  const ariaLabel =
    mode === 'decide' ? `${coinLabel}을 판매할까요?` : '이번 요청을 거절할까요?'

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !allowDismissRef.current) return
    onOpenChange?.(nextOpen)
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
      closeOnInteractOutside={false}
      closeOnEscape={false}
      dismissible={false}
    >
      <Portal container={portalContainerRef}>
        <BottomSheetContent
          layerIndex={layerIndex}
          showHandle={false}
          showCloseButton={false}
          aria-label={ariaLabel}
          aria-describedby={undefined}
        >
          <BottomSheetBody>
            {mode === 'decide' ? (
              <VStack gap="x5" width="full" pt="x2">
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
