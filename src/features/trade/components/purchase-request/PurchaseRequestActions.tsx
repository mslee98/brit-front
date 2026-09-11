/**
 * PurchaseRequestActions — decide / reject 푸터 CTA.
 */
import { VStack } from '@seed-design/react'

import { TextLinkButton } from '../../../../shared/components/TextLinkButton'
import { BottomActionButton } from '../../../../shared/ui/BottomActionButton'
import type { PurchaseRequestSheetMode } from './types'

interface PurchaseRequestActionsProps {
  mode: PurchaseRequestSheetMode
  loading: boolean
  onAccept: () => void
  onOpenReject: () => void
  onConfirmReject: () => void
  onBackToDecide: () => void
}

export function PurchaseRequestActions({
  mode,
  loading,
  onAccept,
  onOpenReject,
  onConfirmReject,
  onBackToDecide,
}: PurchaseRequestActionsProps) {
  if (mode === 'decide') {
    return (
      <VStack gap="x2" width="full" align="stretch">
        <BottomActionButton
          size="large"
          variant="brandSolid"
          flexGrow
          loading={loading}
          disabled={loading}
          onClick={onAccept}
        >
          판매하기
        </BottomActionButton>
        <VStack align="center" width="full" py="x1">
          <TextLinkButton tone="neutral" disabled={loading} onClick={onOpenReject}>
            이번 요청 거절
          </TextLinkButton>
        </VStack>
      </VStack>
    )
  }

  return (
    <VStack gap="x2" width="full" align="stretch">
      <BottomActionButton
        size="large"
        variant="criticalSolid"
        flexGrow
        loading={loading}
        disabled={loading}
        onClick={onConfirmReject}
      >
        요청 거절
      </BottomActionButton>
      <VStack align="center" width="full" py="x1">
        <TextLinkButton tone="neutral" disabled={loading} onClick={onBackToDecide}>
          돌아가기
        </TextLinkButton>
      </VStack>
    </VStack>
  )
}
