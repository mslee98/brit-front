import { useActivityZIndexBase } from '@seed-design/stackflow'
import { Box, Portal, VStack } from '@seed-design/react'
import { BottomActionButton } from '../../../shared/ui/BottomActionButton'
import {
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetFooter,
  BottomSheetRoot,
} from 'seed-design/ui/bottom-sheet'

import { BottomSheetScrollArea } from '../../../shared/ui/BottomSheetScrollArea'
import { BottomSheetBottomCTA } from '../../../shared/ui/BottomSheetBottomCTA'
import { useTradePaymentSheet } from '../hooks/useTradePaymentSheet'
import type { TradeDetailViewModel } from '../types'
import { DisputePlaceholderBottomSheet } from './DisputePlaceholderBottomSheet'
import { TradeCancelAlertDialog } from './TradeCancelAlertDialog'
import { TradeRoomPanel } from './TradeRoomPanel'

interface TradePaymentBottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tradeId: string | null
}

function getSheetTitle(status: string | undefined, role: string | undefined): string {
  if (status === 'COMPLETED') return '거래 완료'
  if (status === 'COIN_TRANSFERRING') return '코인 이전 중'
  if (status === 'DISPUTED') return '분쟁 검토 중'
  if (status === 'PAYMENT_TIMEOUT') return '입금 시간 초과'
  if (status === 'PAYMENT_REPORTED' && role === 'SELLER') return '입금 확인'
  if (status === 'PAYMENT_REPORTED' && role === 'BUYER') return '입금 확인 중'
  return '거래 진행'
}

function isBuyerCompactSheet(trade: TradeDetailViewModel): boolean {
  return trade.status === 'COIN_TRANSFERRING' || trade.status === 'PAYMENT_TIMEOUT'
}

function isPaymentFullPageStatus(status: string | undefined): boolean {
  return status === 'PAYMENT_PENDING' || status === 'PAYMENT_REPORTED'
}

function renderSheetPanel(
  trade: TradeDetailViewModel,
  callbacks: {
    onAccountCopied: () => void
    onCopyFailed: () => void
  },
  motionMountWhen: boolean,
) {
  // 입금 대기/지시·확인은 TradeRoomScreen 풀페이지 — 시트 본문 없음
  if (isPaymentFullPageStatus(trade.status)) {
    return null
  }
  return <TradeRoomPanel trade={trade} motionMountWhen={motionMountWhen} {...callbacks} />
}

interface TradeActionButtonsProps {
  trade: TradeDetailViewModel
  loading: boolean
  onRequestCancel: () => void
  onMarkUnpaid: () => void
}

function TradeActionButtons({
  trade,
  loading,
  onRequestCancel,
  onMarkUnpaid,
}: TradeActionButtonsProps) {
  const isPaymentTimeout = trade.status === 'PAYMENT_TIMEOUT'

  return (
    <VStack gap="x2" width="full">
      {isPaymentTimeout && trade.role === 'SELLER' && trade.actions.includes('MARK_UNPAID') && (
        <BottomActionButton
          size="large"
          variant="neutralWeak"
          flexGrow
          loading={loading}
          onClick={onMarkUnpaid}
        >
          미입금 확정
        </BottomActionButton>
      )}

      {!isPaymentTimeout && trade.actions.includes('CANCEL') && (
        <BottomActionButton
          size="medium"
          variant="neutralWeak"
          flexGrow
          loading={loading}
          onClick={onRequestCancel}
        >
          거래 취소
        </BottomActionButton>
      )}
    </VStack>
  )
}

export function TradePaymentBottomSheet({
  open,
  onOpenChange,
  tradeId,
}: TradePaymentBottomSheetProps) {
  const layerIndex = useActivityZIndexBase({ activityOffset: 1 })
  const sheet = useTradePaymentSheet({ open, onOpenChange, tradeId })

  if (!sheet.mountedTradeId) return null

  // 입금 대기/지시·확인은 풀페이지 — 시트 렌더 안 함
  if (isPaymentFullPageStatus(sheet.trade?.status)) {
    return null
  }

  const title = getSheetTitle(sheet.trade?.status, sheet.trade?.role)
  const useCompactLayout = sheet.trade ? isBuyerCompactSheet(sheet.trade) : false

  return (
    <>
      <BottomSheetRoot open={open} onOpenChange={sheet.handleSheetOpenChange}>
        <Portal container={sheet.portalContainerRef}>
          <BottomSheetContent
            title={title}
            layerIndex={layerIndex}
            showHandle
            aria-describedby={undefined}
            className={useCompactLayout ? undefined : 'bottom-sheet-scroll-content'}
          >
            <BottomSheetBody className={useCompactLayout ? undefined : 'bottom-sheet-scroll-body'}>
              {sheet.trade ? (
                useCompactLayout ? (
                  renderSheetPanel(sheet.trade, sheet.copyCallbacks, open)
                ) : (
                  <Box className="bottom-sheet-scroll-viewport" width="full">
                    <BottomSheetScrollArea>
                      {renderSheetPanel(sheet.trade, sheet.copyCallbacks, open)}
                    </BottomSheetScrollArea>
                  </Box>
                )
              ) : null}
            </BottomSheetBody>
            {sheet.showActionFooter && sheet.trade && (
              <BottomSheetFooter>
                <BottomSheetBottomCTA behavior="fixed">
                  <TradeActionButtons
                    trade={sheet.trade}
                    loading={sheet.loading}
                    onRequestCancel={sheet.openCancelDialog}
                    onMarkUnpaid={sheet.handleMarkUnpaid}
                  />
                </BottomSheetBottomCTA>
              </BottomSheetFooter>
            )}
            {sheet.trade?.status === 'DISPUTED' && (
              <BottomSheetFooter>
                <BottomSheetBottomCTA behavior="fixed">
                  <BottomActionButton
                    size="large"
                    variant="brandSolid"
                    flexGrow
                    onClick={sheet.openDisputeSheet}
                  >
                    분쟁 안내 보기
                  </BottomActionButton>
                </BottomSheetBottomCTA>
              </BottomSheetFooter>
            )}
            {(sheet.trade?.status === 'COMPLETED' || sheet.trade?.status === 'COIN_TRANSFERRING') && (
              <BottomSheetFooter>
                <BottomSheetBottomCTA behavior="fixed">
                  <BottomActionButton
                    size="large"
                    variant="brandSolid"
                    flexGrow
                    onClick={() => sheet.handleSheetOpenChange(false)}
                  >
                    확인
                  </BottomActionButton>
                </BottomSheetBottomCTA>
              </BottomSheetFooter>
            )}
          </BottomSheetContent>
        </Portal>
      </BottomSheetRoot>

      <TradeCancelAlertDialog
        open={sheet.cancelDialogOpen}
        onOpenChange={(nextOpen) => (nextOpen ? sheet.openCancelDialog() : sheet.closeCancelDialog())}
        variant="trade"
        splitContext={
          sheet.trade?.splitLegIndex && sheet.trade.splitTotalLegs
            ? { legIndex: sheet.trade.splitLegIndex, totalLegs: sheet.trade.splitTotalLegs }
            : undefined
        }
        onConfirm={sheet.handleConfirmCancel}
      />

      <DisputePlaceholderBottomSheet
        open={sheet.disputeOpen}
        onOpenChange={(nextOpen) =>
          nextOpen ? sheet.openDisputeSheet() : sheet.closeDisputeSheet()
        }
        legIndex={sheet.trade?.splitLegIndex}
        amountKrw={sheet.trade?.amountKrw}
      />
    </>
  )
}
