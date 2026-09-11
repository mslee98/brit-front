/**
 * TradeRequestCancelSheet — 거래 요청 취소 확인.
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
  getTradeRequestCancelSheetDescriptionLines,
  TRADE_REQUEST_CANCEL_SHEET_CONFIRM,
  TRADE_REQUEST_CANCEL_SHEET_KEEP_WAITING,
  TRADE_REQUEST_CANCEL_SHEET_TITLE,
} from '../copy'

interface TradeRequestCancelSheetProps {
  open: boolean
  sellerNickname: string
  onOpenChange: (open: boolean) => void
  onConfirmCancel: () => void | Promise<void>
}

export function TradeRequestCancelSheet({
  open,
  sellerNickname,
  onOpenChange,
  onConfirmCancel,
}: TradeRequestCancelSheetProps) {
  const portalContainerRef = useRef<HTMLElement | null>(
    typeof document !== 'undefined' ? document.getElementById('app-frame-portal') : null,
  )
  const layerIndex = useActivityZIndexBase({ activityOffset: 2 })
  const [loading, startLoading] = useLoading()
  useLayoutOverlay(open)

  const [descriptionLine1, descriptionLine2] =
    getTradeRequestCancelSheetDescriptionLines(sellerNickname)

  const handleKeepWaiting = () => {
    onOpenChange(false)
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
          aria-label={TRADE_REQUEST_CANCEL_SHEET_TITLE}
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
                  {TRADE_REQUEST_CANCEL_SHEET_TITLE}
                </Text>
                <VStack gap="x1" width="full" align="center">
                  <Text
                    textStyle="t4Regular"
                    color="fg.neutralMuted"
                    style={{ textAlign: 'center' }}
                  >
                    {descriptionLine1}
                  </Text>
                  <Text
                    textStyle="t4Regular"
                    color="fg.neutralMuted"
                    style={{ textAlign: 'center' }}
                  >
                    {descriptionLine2}
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
                disabled={loading}
                onClick={handleKeepWaiting}
              >
                {TRADE_REQUEST_CANCEL_SHEET_KEEP_WAITING}
              </BottomActionButton>
              <BottomActionButton
                size="large"
                variant="neutralOutline"
                loading={loading}
                disabled={loading}
                onClick={handleConfirmCancel}
              >
                {TRADE_REQUEST_CANCEL_SHEET_CONFIRM}
              </BottomActionButton>
            </VStack>
          </BottomSheetFooter>
        </BottomSheetContent>
      </Portal>
    </BottomSheetRoot>
  )
}
