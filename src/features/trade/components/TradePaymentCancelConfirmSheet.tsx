/**
 * TradePaymentCancelConfirmSheet — 입금 전 거래 취소 재확인.
 */
import { useRef } from 'react'
import { IconExclamationmarkCircleLine } from '@karrotmarket/react-monochrome-icon'
import { useActivityZIndexBase } from '@seed-design/stackflow'
import { Icon, Portal, Text, VStack } from '@seed-design/react'
import { useLoading } from 'react-simplikit'
import {
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetFooter,
  BottomSheetRoot,
} from 'seed-design/ui/bottom-sheet'

import { useLayoutOverlay } from '../../../app/layouts/useLayoutOverlay'
import { BottomActionButton } from '../../../shared/ui/BottomActionButton'
import {
  PAYMENT_CANCEL_CONFIRM_CANCEL,
  PAYMENT_CANCEL_CONFIRM_LINE1,
  PAYMENT_CANCEL_CONFIRM_LINE2,
  PAYMENT_CANCEL_CONFIRM_REPORT,
  PAYMENT_CANCEL_CONFIRM_TITLE,
} from '../copy'

interface TradePaymentCancelConfirmSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReportPayment: () => void
  onConfirmCancel: () => void | Promise<void>
}

export function TradePaymentCancelConfirmSheet({
  open,
  onOpenChange,
  onReportPayment,
  onConfirmCancel,
}: TradePaymentCancelConfirmSheetProps) {
  const portalContainerRef = useRef<HTMLElement | null>(
    typeof document !== 'undefined' ? document.getElementById('app-frame-portal') : null,
  )
  const layerIndex = useActivityZIndexBase({ activityOffset: 2 })
  const [loading, startLoading] = useLoading()
  useLayoutOverlay(open)

  const handleReport = () => {
    onOpenChange(false)
    onReportPayment()
  }

  const handleConfirmCancel = () => {
    void startLoading(Promise.resolve(onConfirmCancel()))
  }

  return (
    <BottomSheetRoot open={open} onOpenChange={onOpenChange}>
      <Portal container={portalContainerRef}>
        <BottomSheetContent
          layerIndex={layerIndex}
          showHandle
          showCloseButton={false}
          aria-label={PAYMENT_CANCEL_CONFIRM_TITLE}
          aria-describedby={undefined}
        >
          <BottomSheetBody>
            <VStack gap="x3" width="full" align="center" pt="x3" px="x2">
              <Icon
                svg={<IconExclamationmarkCircleLine />}
                size="x9"
                color="fg.warning"
              />
              <VStack gap="x2" width="full" align="center" style={{ maxWidth: 280 }}>
                <Text
                  as="h2"
                  textStyle="t7Bold"
                  color="fg.neutral"
                  style={{ textAlign: 'center' }}
                >
                  {PAYMENT_CANCEL_CONFIRM_TITLE}
                </Text>
                <VStack gap="x1" width="full" align="center">
                  <Text
                    textStyle="t4Regular"
                    color="fg.neutralMuted"
                    style={{ textAlign: 'center' }}
                  >
                    {PAYMENT_CANCEL_CONFIRM_LINE1}
                  </Text>
                  <Text
                    textStyle="t4Regular"
                    color="fg.neutralMuted"
                    style={{ textAlign: 'center' }}
                  >
                    {PAYMENT_CANCEL_CONFIRM_LINE2}
                  </Text>
                </VStack>
              </VStack>
            </VStack>
          </BottomSheetBody>
          <BottomSheetFooter>
            <VStack gap="x2" width="full">
              <BottomActionButton
                size="large"
                variant="brandSolid"
                flexGrow
                disabled={loading}
                onClick={handleReport}
              >
                {PAYMENT_CANCEL_CONFIRM_REPORT}
              </BottomActionButton>
              <BottomActionButton
                size="large"
                variant="neutralOutline"
                flexGrow
                loading={loading}
                onClick={handleConfirmCancel}
              >
                {PAYMENT_CANCEL_CONFIRM_CANCEL}
              </BottomActionButton>
            </VStack>
          </BottomSheetFooter>
        </BottomSheetContent>
      </Portal>
    </BottomSheetRoot>
  )
}
