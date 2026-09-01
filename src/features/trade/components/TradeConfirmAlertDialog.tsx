import { useRef, useState } from 'react'
import { useActivityZIndexBase } from '@seed-design/stackflow'
import { Portal, ResponsivePair } from '@seed-design/react'
import { useLoading } from 'react-simplikit'

import { useLayoutOverlay } from '../../../app/layouts/useLayoutOverlay'
import { BottomActionButton } from '../../../shared/ui/BottomActionButton'
import { formatAmount } from '../../../shared/utils/formatAmount'
import type { TradeSide } from '../types'
import {
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogRoot,
  AlertDialogTitle,
} from 'seed-design/ui/alert-dialog'

interface TradeConfirmAlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  side: TradeSide
  amountKrw: number
  onConfirm: () => Promise<void>
}

function getConfirmDescription(side: TradeSide): string {
  if (side === 'SELL') {
    return '한 명의 구매자와 전체 금액으로 매칭을 시작할게요.'
  }
  return '한 명의 판매자와 전체 금액으로 매칭을 시작할게요.'
}

/**
 * TradeCompose 거래 시작 확인 — AlertDialog (닫기 / 매칭 시작하기).
 * 단건 전체 금액 매칭만 안내합니다.
 */
export function TradeConfirmAlertDialog({
  open,
  onOpenChange,
  side,
  amountKrw,
  onConfirm,
}: TradeConfirmAlertDialogProps) {
  const portalContainerRef = useRef<HTMLElement | null>(
    typeof document !== 'undefined' ? document.getElementById('app-frame-portal') : null,
  )
  const layerIndex = useActivityZIndexBase({ activityOffset: 2 })
  const [loading, startLoading] = useLoading()
  const [error, setError] = useState<string | null>(null)

  useLayoutOverlay(open)

  const title =
    side === 'BUY'
      ? `${formatAmount(amountKrw)} 구매할까요?`
      : `${formatAmount(amountKrw)} 판매 등록할까요?`

  const description = error ?? getConfirmDescription(side)

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && loading) return
    if (nextOpen) setError(null)
    onOpenChange(nextOpen)
  }

  const handleConfirm = () => {
    setError(null)
    void startLoading(
      onConfirm()
        .then(() => onOpenChange(false))
        .catch((err: unknown) => {
          if (err instanceof Error && err.message === 'ACTIVE_TRADE_LIMIT') {
            setError('이미 진행 중인 거래가 있어요.')
            return
          }
          setError('거래를 시작하지 못했어요. 다시 시도해 주세요.')
        }),
    )
  }

  return (
    <AlertDialogRoot open={open} onOpenChange={handleOpenChange}>
      <Portal container={portalContainerRef}>
        <AlertDialogContent layerIndex={layerIndex}>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <ResponsivePair gap="x2" width="full">
              <BottomActionButton
                size="large"
                variant="neutralWeak"
                flexGrow
                disabled={loading}
                onClick={() => handleOpenChange(false)}
              >
                닫기
              </BottomActionButton>
              <BottomActionButton
                size="large"
                variant="brandSolid"
                flexGrow
                loading={loading}
                disabled={loading}
                onClick={handleConfirm}
              >
                매칭 시작하기
              </BottomActionButton>
            </ResponsivePair>
          </AlertDialogFooter>
        </AlertDialogContent>
      </Portal>
    </AlertDialogRoot>
  )
}
