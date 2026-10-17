import { useActivityZIndexBase } from '@seed-design/stackflow'
import { Portal, ResponsivePair } from '@seed-design/react'
import { BottomActionButton } from '../../../shared/ui/BottomActionButton'

import {
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogRoot,
  AlertDialogTitle,
} from 'seed-design/ui/alert-dialog'

const COPY = {
  report: {
    title: '입금했어요를 누를까요?',
    description: '아직 입금하지 않았다면 판매자 확인이 지연될 수 있어요.',
    confirm: '입금했어요',
  },
  confirm: {
    title: '입금을 확인할까요?',
    description: '계좌 입금 내역을 확인했을 때만 눌러 주세요.',
    confirm: '돈 받았어요',
  },
  deny: {
    title: '입금을 못 받으셨나요?',
    description:
      '분쟁이 시작되면 이 거래는 잠시 중단되고 Brit 분쟁조정팀이 확인해요. 앱에서 되돌릴 수 없어요.',
    confirm: '못 받았어요',
  },
  openDispute: {
    title: '입금 문제를 신고할까요?',
    description:
      '분쟁이 시작되면 이 거래는 잠시 중단되고 Brit 분쟁조정팀이 확인해요. 앱에서 되돌릴 수 없어요.',
    confirm: '신고하기',
  },
  withdraw: {
    title: '입금 신고를 취소할까요?',
    description:
      '아직 판매자가 확인하지 않았을 때만 취소할 수 있어요. 취소하면 다시 입금 안내 화면으로 돌아가요.',
    confirm: '신고 취소',
  },
} as const

interface TradePaymentConfirmAlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  variant: keyof typeof COPY
  onConfirm: () => void | Promise<void>
  /** true면 Dialog.Action 자동 닫힘 없이 onConfirm이 닫기까지 책임 (async report 등) */
  deferCloseToConfirm?: boolean
  confirmLoading?: boolean
}

export function TradePaymentConfirmAlertDialog({
  open,
  onOpenChange,
  variant,
  onConfirm,
  deferCloseToConfirm = false,
  confirmLoading = false,
}: TradePaymentConfirmAlertDialogProps) {
  const layerIndex = useActivityZIndexBase({ activityOffset: 3 })
  const copy = COPY[variant]
  const confirmVariant =
    variant === 'deny' || variant === 'withdraw' || variant === 'openDispute'
      ? 'criticalSolid'
      : 'brandSolid'

  const handleDismiss = () => {
    onOpenChange(false)
  }

  const handleDeferredConfirm = () => {
    void Promise.resolve(onConfirm()).catch(() => {
      // 실패 시 닫기·스낵바는 호출부에서 처리
    })
  }

  const handleImmediateConfirm = () => {
    void Promise.resolve(onConfirm())
      .then(() => onOpenChange(false))
      .catch(() => {
        // 실패 시 다이얼로그 유지 — 호출부에서 스낵바 처리
      })
  }

  return (
    <AlertDialogRoot open={open} onOpenChange={onOpenChange}>
      <Portal>
        <AlertDialogContent layerIndex={layerIndex}>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.title}</AlertDialogTitle>
            <AlertDialogDescription>{copy.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {deferCloseToConfirm ? (
              <ResponsivePair gap="x2" width="full">
                <BottomActionButton size="large" variant="neutralWeak" flexGrow onClick={handleDismiss}>
                  닫기
                </BottomActionButton>
                <BottomActionButton
                  size="large"
                  variant={confirmVariant}
                  flexGrow
                  loading={confirmLoading}
                  disabled={confirmLoading}
                  onClick={handleDeferredConfirm}
                >
                  {copy.confirm}
                </BottomActionButton>
              </ResponsivePair>
            ) : (
              <ResponsivePair gap="x2" width="full">
                <AlertDialogAction variant="neutralWeak" onClick={handleDismiss}>
                  닫기
                </AlertDialogAction>
                <AlertDialogAction variant={confirmVariant} onClick={handleImmediateConfirm}>
                  {copy.confirm}
                </AlertDialogAction>
              </ResponsivePair>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </Portal>
    </AlertDialogRoot>
  )
}
