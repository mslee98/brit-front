/**
 * LoginFindAccountSheet — 아이디 찾기 / 비밀번호 재설정 선택
 */
import { useRef } from 'react'
import { useActivityZIndexBase } from '@seed-design/stackflow'
import { Portal } from '@seed-design/react'
import {
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetRoot,
} from 'seed-design/ui/bottom-sheet'
import { List, ListButtonItem } from 'seed-design/ui/list'

import { useLayoutOverlay } from '../../../app/layouts/useLayoutOverlay'

interface LoginFindAccountSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFindLoginId: () => void
  onResetPassword: () => void
}

export function LoginFindAccountSheet({
  open,
  onOpenChange,
  onFindLoginId,
  onResetPassword,
}: LoginFindAccountSheetProps) {
  const portalContainerRef = useRef<HTMLElement | null>(
    typeof document !== 'undefined' ? document.getElementById('app-frame-portal') : null,
  )
  const layerIndex = useActivityZIndexBase({ activityOffset: 1 })
  useLayoutOverlay(open)

  return (
    <BottomSheetRoot open={open} onOpenChange={onOpenChange}>
      <Portal container={portalContainerRef}>
        <BottomSheetContent
          title="아이디·비밀번호 찾기"
          layerIndex={layerIndex}
          showHandle
          aria-describedby={undefined}
        >
          <BottomSheetBody>
            <List>
              <ListButtonItem
                title="아이디 찾기"
                detail="본인인증으로 가입한 아이디를 확인할게요"
                onClick={onFindLoginId}
              />
              <ListButtonItem
                title="비밀번호 재설정"
                detail="본인인증 후 새 비밀번호를 설정해요"
                onClick={onResetPassword}
              />
            </List>
          </BottomSheetBody>
        </BottomSheetContent>
      </Portal>
    </BottomSheetRoot>
  )
}
