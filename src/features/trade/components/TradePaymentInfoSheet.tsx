/**
 * TradePaymentInfoSheet — 입금 대기/확인 거래 정보 + Stepper (role × status).
 */
import { useRef } from 'react'
import { useActivityZIndexBase } from '@seed-design/stackflow'
import { Portal, Text, VStack } from '@seed-design/react'
import {
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetRoot,
} from 'seed-design/ui/bottom-sheet'

import { useLayoutOverlay } from '../../../app/layouts/useLayoutOverlay'
import { BottomSheetScrollArea } from '../../../shared/ui/BottomSheetScrollArea'
import { formatAmount, formatCoinUnit } from '../../../shared/utils/formatAmount'
import {
  buildBuyerPaymentReportedSteps,
  buildSellerPaymentPendingSteps,
  buildSellerPaymentReportedSteps,
  getPaymentBuyerWaitingInfoSheetTitle,
  getPaymentSellerWaitingInfoSheetTitle,
} from '../copy'
import { usePaymentCountdown } from '../hooks/usePaymentCountdown'
import type { TradeDetailViewModel } from '../types'
import { TradeStep, TradeStepper } from './TradeStepper'

interface TradePaymentInfoSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trade: TradeDetailViewModel
}

function resolveInfoSheetModel(trade: TradeDetailViewModel) {
  const amountLabel = formatAmount(trade.amountKrw)
  const isSeller = trade.role === 'SELLER'
  const isReported = trade.status === 'PAYMENT_REPORTED'
  const deadline = isReported ? trade.sellerConfirmDeadline : trade.paymentDeadline

  return {
    amountLabel,
    coinUnitLabel: formatCoinUnit(trade.coinAmount),
    deadline,
    isReported,
    title: isSeller
      ? getPaymentSellerWaitingInfoSheetTitle()
      : getPaymentBuyerWaitingInfoSheetTitle(),
    expiredLabel: isReported ? '확인 시간이 지났어요' : '입금 시간이 지났어요',
    buildSteps: (remainingMeta: string | null) => {
      if (isSeller && isReported) {
        return buildSellerPaymentReportedSteps(amountLabel, remainingMeta)
      }
      if (isSeller) {
        return buildSellerPaymentPendingSteps(amountLabel, remainingMeta)
      }
      return buildBuyerPaymentReportedSteps(amountLabel, remainingMeta)
    },
  }
}

export function TradePaymentInfoSheet({
  open,
  onOpenChange,
  trade,
}: TradePaymentInfoSheetProps) {
  const portalContainerRef = useRef<HTMLElement | null>(
    typeof document !== 'undefined' ? document.getElementById('app-frame-portal') : null,
  )
  const layerIndex = useActivityZIndexBase({ activityOffset: 2 })
  useLayoutOverlay(open)

  const model = resolveInfoSheetModel(trade)
  const countdown = usePaymentCountdown(model.deadline)
  const counterpartyLabel = trade.counterpartyNickname.endsWith('님')
    ? trade.counterpartyNickname
    : `${trade.counterpartyNickname}님`

  const remainingMeta = model.deadline
    ? countdown.isExpired
      ? model.expiredLabel
      : `${countdown.remainingLabel} 남음`
    : null

  const steps = model.buildSteps(remainingMeta)

  return (
    <BottomSheetRoot open={open} onOpenChange={onOpenChange}>
      <Portal container={portalContainerRef}>
        <BottomSheetContent
          title={model.title}
          layerIndex={layerIndex}
          showHandle
          aria-describedby={undefined}
          className="bottom-sheet-scroll-content"
        >
          <BottomSheetBody className="bottom-sheet-scroll-body">
            <BottomSheetScrollArea>
              <VStack gap="x5" width="full" pb="x4">
                <VStack gap="x1" width="full" align="flex-start">
                  <Text textStyle="t6Bold" color="fg.neutral" className="tabular-nums">
                    {model.amountLabel}
                  </Text>
                  <Text textStyle="t4Regular" color="fg.neutralMuted" className="tabular-nums">
                    {`${model.coinUnitLabel} · ${counterpartyLabel}`}
                  </Text>
                </VStack>

                <TradeStepper>
                  {steps.map((step) => (
                    <TradeStep
                      key={step.stepNumber}
                      status={step.status}
                      stepNumber={step.stepNumber}
                      title={step.title}
                      description={step.description}
                      meta={step.meta}
                    />
                  ))}
                </TradeStepper>
              </VStack>
            </BottomSheetScrollArea>
          </BottomSheetBody>
        </BottomSheetContent>
      </Portal>
    </BottomSheetRoot>
  )
}
