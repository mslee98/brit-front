/**
 * TradePaymentSentConfirmSheet — 실제 송금 완료를 확정할 때만 여는 결정 시트.
 */
import { useRef } from 'react'
import { IconExclamationmarkCircleLine } from '@karrotmarket/react-monochrome-icon'
import { useActivityZIndexBase } from '@seed-design/stackflow'
import { HStack, Portal, Text, VStack } from '@seed-design/react'
import { Callout } from 'seed-design/ui/callout'
import {
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetFooter,
  BottomSheetRoot,
} from 'seed-design/ui/bottom-sheet'

import { useLayoutOverlay } from '../../../app/layouts/useLayoutOverlay'
import { BottomActionButton } from '../../../shared/ui/BottomActionButton'
import { BottomSheetBottomCTA } from '../../../shared/ui/BottomSheetBottomCTA'
import { formatAmount } from '../../../shared/utils/formatAmount'
import {
  PAYMENT_SENT_CONFIRM_BACK,
  PAYMENT_SENT_CONFIRM_DESCRIPTION,
  PAYMENT_SENT_CONFIRM_SUBMIT,
  PAYMENT_SENT_CONFIRM_TITLE,
  PAYMENT_SENT_CONFIRM_WARNING,
} from '../copy'
import { formatAccountNumberDisplay } from '../utils/formatAccountNumber'
import { BankIcon } from '../../../shared/ui/BankIcon'

interface TradePaymentSentConfirmSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bankName: string
  accountNumber: string
  accountHolder: string
  amountKrw: number
  iconUrl?: string | null
  confirmLoading?: boolean
  onConfirm: () => void | Promise<void>
}

function SummaryRow({
  label,
  value,
  emphasize,
}: {
  label: string
  value: string
  emphasize?: boolean
}) {
  return (
    <HStack justify="space-between" align="center" width="full" gap="x3">
      <Text textStyle="t4Regular" color="fg.neutralMuted">
        {label}
      </Text>
      <Text
        textStyle={emphasize ? 't5Bold' : 't4Medium'}
        color="fg.neutral"
        className="tabular-nums"
      >
        {value}
      </Text>
    </HStack>
  )
}

export function TradePaymentSentConfirmSheet({
  open,
  onOpenChange,
  bankName,
  accountNumber,
  accountHolder,
  amountKrw,
  iconUrl,
  confirmLoading = false,
  onConfirm,
}: TradePaymentSentConfirmSheetProps) {
  const portalContainerRef = useRef<HTMLElement | null>(
    typeof document !== 'undefined' ? document.getElementById('app-frame-portal') : null,
  )
  const layerIndex = useActivityZIndexBase({ activityOffset: 2 })
  useLayoutOverlay(open)

  const accountDisplay = formatAccountNumberDisplay(accountNumber)
  const amountLabel = formatAmount(amountKrw)

  const handleConfirm = () => {
    void Promise.resolve(onConfirm()).catch(() => {
      // 실패 시 시트 유지 — 호출부에서 스낵바 처리
    })
  }

  return (
    <BottomSheetRoot open={open} onOpenChange={onOpenChange}>
      <Portal container={portalContainerRef}>
        <BottomSheetContent
          title={PAYMENT_SENT_CONFIRM_TITLE}
          description={PAYMENT_SENT_CONFIRM_DESCRIPTION}
          layerIndex={layerIndex}
          showHandle
          showCloseButton
        >
          <BottomSheetBody>
            <VStack gap="x4" width="full" pt="x2">
              <VStack
                gap="x3"
                width="full"
                p="x4"
                bg="bg.neutralWeak"
                borderRadius="r4"
                align="stretch"
              >
                <HStack gap="x2" align="center">
                  <BankIcon bankName={bankName} iconUrl={iconUrl} size={42} />
                  <Text textStyle="t4Medium" color="fg.neutral">
                    {bankName}
                  </Text>
                </HStack>
                <SummaryRow label="계좌번호" value={accountDisplay} />
                <SummaryRow label="예금주" value={accountHolder} />
                <SummaryRow label="입금 금액" value={amountLabel} emphasize />
              </VStack>
              <Callout
                tone="warning"
                prefixIcon={<IconExclamationmarkCircleLine />}
                description={PAYMENT_SENT_CONFIRM_WARNING}
              />
            </VStack>
          </BottomSheetBody>
          <BottomSheetFooter>
            <BottomSheetBottomCTA behavior="fixed">
              <VStack gap="x2" width="full">
                <BottomActionButton
                  size="large"
                  variant="brandSolid"
                  flexGrow
                  loading={confirmLoading}
                  disabled={confirmLoading}
                  onClick={handleConfirm}
                >
                  {PAYMENT_SENT_CONFIRM_SUBMIT}
                </BottomActionButton>
                <BottomActionButton
                  size="large"
                  variant="neutralWeak"
                  flexGrow
                  disabled={confirmLoading}
                  onClick={() => onOpenChange(false)}
                >
                  {PAYMENT_SENT_CONFIRM_BACK}
                </BottomActionButton>
              </VStack>
            </BottomSheetBottomCTA>
          </BottomSheetFooter>
        </BottomSheetContent>
      </Portal>
    </BottomSheetRoot>
  )
}
