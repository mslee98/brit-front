/**
 * SellOrderCancelSheet — 판매 등록 취소 확인.
 */
import { useRef } from 'react'
import { useActivityZIndexBase } from '@seed-design/stackflow'
import { Portal, Text, VStack } from '@seed-design/react'
import { useLoading } from 'react-simplikit'
import {
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetFooter,
  BottomSheetRoot,
} from 'seed-design/ui/bottom-sheet'

import { useLayoutOverlay } from '../../../app/layouts/useLayoutOverlay'
import { BottomActionButton } from '../../../shared/ui/BottomActionButton'
import type { SellOrderDto } from '../types'
import { buildSellOrderCancelCopy } from '../utils/sellOrderDetailCopy'

interface SellOrderCancelSheetProps {
  open: boolean
  order: SellOrderDto | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
}

export function SellOrderCancelSheet({
  open,
  order,
  onOpenChange,
  onConfirm,
}: SellOrderCancelSheetProps) {
  const portalContainerRef = useRef<HTMLElement | null>(
    typeof document !== 'undefined' ? document.getElementById('app-frame-portal') : null,
  )
  const layerIndex = useActivityZIndexBase({ activityOffset: 2 })
  const [loading, startLoading] = useLoading()
  useLayoutOverlay(open)

  if (!order) return null

  const copy = buildSellOrderCancelCopy(order)

  const handleConfirm = () => {
    void startLoading(Promise.resolve(onConfirm()))
  }

  return (
    <BottomSheetRoot open={open} onOpenChange={onOpenChange}>
      <Portal container={portalContainerRef}>
        <BottomSheetContent
          title={copy.title}
          layerIndex={layerIndex}
          showHandle
          aria-describedby={undefined}
        >
          <BottomSheetBody>
            <VStack gap="x2" width="full">
              {copy.description.split('\n').map((line) => (
                <Text key={line} textStyle="t5Regular" color="fg.neutralMuted">
                  {line}
                </Text>
              ))}
            </VStack>
          </BottomSheetBody>
          <BottomSheetFooter>
            <VStack gap="x2" width="full">
              <BottomActionButton
                size="large"
                variant="criticalSolid"
                loading={loading}
                disabled={loading}
                onClick={handleConfirm}
              >
                판매 등록 취소
              </BottomActionButton>
              <BottomActionButton
                size="large"
                variant="neutralWeak"
                disabled={loading}
                onClick={() => onOpenChange(false)}
              >
                계속 판매하기
              </BottomActionButton>
            </VStack>
          </BottomSheetFooter>
        </BottomSheetContent>
      </Portal>
    </BottomSheetRoot>
  )
}
