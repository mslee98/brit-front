/**
 * PartnerLinkRevokeAlertDialog — 연결 해제 최종 확인.
 */
import { useRef } from 'react'
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

type PartnerLinkRevokeAlertDialogProps = {
  open: boolean
  partnerName: string
  loading?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function PartnerLinkRevokeAlertDialog({
  open,
  partnerName,
  loading = false,
  onOpenChange,
  onConfirm,
}: PartnerLinkRevokeAlertDialogProps) {
  const portalContainerRef = useRef<HTMLElement | null>(
    typeof document !== 'undefined'
      ? document.getElementById('app-frame-portal')
      : null,
  )
  const layerIndex = useActivityZIndexBase({ activityOffset: 3 })

  return (
    <AlertDialogRoot open={open} onOpenChange={onOpenChange}>
      <Portal container={portalContainerRef}>
        <AlertDialogContent layerIndex={layerIndex}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {partnerName} 연결을 해제할까요?
            </AlertDialogTitle>
            <AlertDialogDescription>
              이후 이 업체에서 충전·환전하려면 다시 연결해야 해요. 지난 전환
              내역은 그대로 남아요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <ResponsivePair gap="x2" width="full">
              <AlertDialogAction
                variant="neutralWeak"
                disabled={loading}
                onClick={() => onOpenChange(false)}
              >
                취소
              </AlertDialogAction>
              <AlertDialogAction
                variant="criticalSolid"
                disabled={loading}
                onClick={onConfirm}
              >
                연결 해제
              </AlertDialogAction>
            </ResponsivePair>
          </AlertDialogFooter>
        </AlertDialogContent>
      </Portal>
    </AlertDialogRoot>
  )
}
