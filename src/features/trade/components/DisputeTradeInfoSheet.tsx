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
import { getDisputeChatInfoSheetTitle } from '../copy'
import type { TradeRecord } from '../types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  trade: TradeRecord | null
}

export function DisputeTradeInfoSheet({ open, onOpenChange, trade }: Props) {
  const portalContainerRef = useRef<HTMLElement | null>(
    typeof document !== 'undefined' ? document.getElementById('app-frame-portal') : null,
  )
  const layerIndex = useActivityZIndexBase({ activityOffset: 2 })
  useLayoutOverlay(open)

  const nickname = trade?.counterpartyNickname
  const counterpartyLabel = nickname
    ? nickname.endsWith('님')
      ? nickname
      : `${nickname}님`
    : '상대방'

  return (
    <BottomSheetRoot open={open} onOpenChange={onOpenChange}>
      <Portal container={portalContainerRef}>
        <BottomSheetContent
          title={getDisputeChatInfoSheetTitle()}
          layerIndex={layerIndex}
          showHandle
          aria-describedby={undefined}
          className="bottom-sheet-scroll-content"
        >
          <BottomSheetBody className="bottom-sheet-scroll-body">
            <BottomSheetScrollArea>
              <VStack gap="x3" width="full" pb="x4">
                {trade ? (
                  <>
                    <Text textStyle="t6Bold" color="fg.neutral" className="tabular-nums">
                      {formatAmount(trade.amountKrw)}
                    </Text>
                    <Text
                      textStyle="t4Regular"
                      color="fg.neutralMuted"
                      className="tabular-nums"
                    >
                      {`${formatCoinUnit(trade.coinAmount)} · ${counterpartyLabel}`}
                    </Text>
                    {trade.payment ? (
                      <Text textStyle="t4Regular" color="fg.neutralMuted">
                        {`${trade.payment.bankName} ${trade.payment.accountNumber}`}
                      </Text>
                    ) : null}
                  </>
                ) : (
                  <Text textStyle="t4Regular" color="fg.neutralSubtle">
                    거래 정보를 불러오지 못했어요.
                  </Text>
                )}
              </VStack>
            </BottomSheetScrollArea>
          </BottomSheetBody>
        </BottomSheetContent>
      </Portal>
    </BottomSheetRoot>
  )
}
