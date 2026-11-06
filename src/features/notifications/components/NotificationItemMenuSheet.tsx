/**
 * NotificationItemMenuSheet — 알림 한 건 관리 (보관).
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
import type { NotificationInboxItem } from '../api/notifications.api'

interface NotificationItemMenuSheetProps {
  item: NotificationInboxItem | null
  onOpenChange: (open: boolean) => void
  onArchive: () => Promise<void>
}

export function NotificationItemMenuSheet({
  item,
  onOpenChange,
  onArchive,
}: NotificationItemMenuSheetProps) {
  const portalContainerRef = useRef<HTMLElement | null>(
    typeof document !== 'undefined' ? document.getElementById('app-frame-portal') : null,
  )
  const layerIndex = useActivityZIndexBase({ activityOffset: 2 })
  const [loading, startLoading] = useLoading()
  const open = item !== null
  useLayoutOverlay(open)

  return (
    <BottomSheetRoot open={open} onOpenChange={onOpenChange}>
      <Portal container={portalContainerRef}>
        <BottomSheetContent
          title="알림을 보관할까요?"
          layerIndex={layerIndex}
          showHandle
          aria-describedby={undefined}
        >
          <BottomSheetBody>
            <VStack gap="x1" width="full">
              <Text textStyle="t5Bold" color="fg.neutral">
                {item?.title}
              </Text>
              <Text textStyle="t4Regular" color="fg.neutralMuted">
                보관한 알림은 목록에서 사라져요. 거래 내용은 그대로 남아요.
              </Text>
            </VStack>
          </BottomSheetBody>
          <BottomSheetFooter>
            <VStack gap="x2" width="full">
              <BottomActionButton
                size="large"
                variant="neutralSolid"
                loading={loading}
                disabled={loading}
                onClick={() => void startLoading(onArchive())}
              >
                보관하기
              </BottomActionButton>
              <BottomActionButton
                size="large"
                variant="neutralWeak"
                disabled={loading}
                onClick={() => onOpenChange(false)}
              >
                닫기
              </BottomActionButton>
            </VStack>
          </BottomSheetFooter>
        </BottomSheetContent>
      </Portal>
    </BottomSheetRoot>
  )
}
