import { useActivityZIndexBase } from '@seed-design/stackflow'
import { Portal, ResponsivePair } from '@seed-design/react'

import {
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogRoot,
  AlertDialogTitle,
} from 'seed-design/ui/alert-dialog'

import { MATCHING_LEAVE_OK_HINT } from '../copy'

interface MatchingLeaveAlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmLeave: () => void
}

/** X 닫기 — 매칭은 유지하고 화면만 이탈 */
export function MatchingLeaveAlertDialog({
  open,
  onOpenChange,
  onConfirmLeave,
}: MatchingLeaveAlertDialogProps) {
  const layerIndex = useActivityZIndexBase({ activityOffset: 2 })

  return (
    <AlertDialogRoot open={open} onOpenChange={onOpenChange}>
      <Portal>
        <AlertDialogContent layerIndex={layerIndex}>
          <AlertDialogHeader>
            <AlertDialogTitle>화면을 나갈까요?</AlertDialogTitle>
            <AlertDialogDescription>{MATCHING_LEAVE_OK_HINT}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <ResponsivePair gap="x2" width="full">
              <AlertDialogAction variant="neutralWeak" onClick={() => onOpenChange(false)}>
                닫기
              </AlertDialogAction>
              <AlertDialogAction
                variant="neutralSolid"
                onClick={() => {
                  onConfirmLeave()
                  onOpenChange(false)
                }}
              >
                홈으로
              </AlertDialogAction>
            </ResponsivePair>
          </AlertDialogFooter>
        </AlertDialogContent>
      </Portal>
    </AlertDialogRoot>
  )
}
