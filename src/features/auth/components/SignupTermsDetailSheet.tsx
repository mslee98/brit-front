import { useRef } from 'react'
import { useActivityZIndexBase } from '@seed-design/stackflow'
import { Portal, Text, VStack } from '@seed-design/react'
import {
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetFooter,
  BottomSheetRoot,
} from 'seed-design/ui/bottom-sheet'

import type { SignupTermsItem } from '../constants'
import { BottomActionButton } from '../../../shared/ui/BottomActionButton'
import { useLayoutOverlay } from '../../../app/layouts/useLayoutOverlay'

interface SignupTermsDetailSheetProps {
  item: SignupTermsItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignupTermsDetailSheet({
  item,
  open,
  onOpenChange,
}: SignupTermsDetailSheetProps) {
  const portalContainerRef = useRef<HTMLElement | null>(
    typeof document !== 'undefined' ? document.getElementById('app-frame-portal') : null,
  )
  const layerIndex = useActivityZIndexBase({ activityOffset: 1 })
  useLayoutOverlay(open)

  return (
    <BottomSheetRoot open={open} onOpenChange={onOpenChange}>
      <Portal container={portalContainerRef}>
        <BottomSheetContent
          title={item?.detailTitle ?? '약관'}
          layerIndex={layerIndex}
          showHandle
          aria-describedby={undefined}
        >
          <BottomSheetBody>
            <VStack gap="x3" width="full">
              <Text textStyle="t4Regular" color="fg.neutral">
                {item?.detailBody}
              </Text>
            </VStack>
          </BottomSheetBody>
          <BottomSheetFooter>
            <BottomActionButton
              size="large"
              variant="brandSolid"
              onClick={() => onOpenChange(false)}
            >
              닫기
            </BottomActionButton>
          </BottomSheetFooter>
        </BottomSheetContent>
      </Portal>
    </BottomSheetRoot>
  )
}
