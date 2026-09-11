/**
 * PurchaseRequestRejectBody — 거절 사유 선택.
 */
import { Text, VStack } from '@seed-design/react'
import { Chip } from 'seed-design/ui/chip'

import { MotionChipButton } from '../../../../shared/motion'
import type { TradeRequestRejectionReason } from '../../../orders/types'
import { REJECT_REASONS } from './constants'

interface PurchaseRequestRejectBodyProps {
  reasonCode: TradeRequestRejectionReason
  onReasonChange: (code: TradeRequestRejectionReason) => void
}

export function PurchaseRequestRejectBody({
  reasonCode,
  onReasonChange,
}: PurchaseRequestRejectBodyProps) {
  return (
    <VStack gap="x5" width="full" pt="x2">
      <VStack gap="x2" align="flex-start" width="full">
        <Text as="h2" textStyle="t7Bold" color="fg.neutral">
          이번 요청을 거절할까요?
        </Text>
        <Text textStyle="t4Regular" color="fg.neutralMuted">
          거절 사유를 선택해 주세요.
        </Text>
      </VStack>
      <VStack gap="x2" width="full" align="flex-start">
        {REJECT_REASONS.map((reason) => (
          <MotionChipButton
            key={reason.code}
            size="medium"
            variant={reasonCode === reason.code ? 'solid' : 'outlineWeak'}
            onClick={() => onReasonChange(reason.code)}
          >
            <Chip.Label>{reason.label}</Chip.Label>
          </MotionChipButton>
        ))}
      </VStack>
    </VStack>
  )
}
