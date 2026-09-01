/**
 * TradeRequestActionSheet — 판매자 수락 확인 / 거절 사유 (MatchingAccept 대칭).
 */
import { useRef, useState } from 'react'
import { useActivityZIndexBase } from '@seed-design/stackflow'
import { Portal, Text, VStack } from '@seed-design/react'
import { useLoading } from 'react-simplikit'
import {
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetFooter,
  BottomSheetRoot,
} from 'seed-design/ui/bottom-sheet'
import { List, ListDivider, ListItem } from 'seed-design/ui/list'

import { useLayoutOverlay } from '../../../app/layouts/useLayoutOverlay'
import { TextLinkButton } from '../../../shared/components/TextLinkButton'
import { MotionChipButton } from '../../../shared/motion'
import { BottomActionButton } from '../../../shared/ui/BottomActionButton'
import { formatAmount, formatCoinAmount } from '../../../shared/utils/formatAmount'
import { Chip } from 'seed-design/ui/chip'
import type { TradeRequestDto, TradeRequestRejectionReason } from '../../orders/types'

export type TradeRequestSheetMode = 'accept' | 'reject' | null

const REJECT_REASONS: Array<{
  code: TradeRequestRejectionReason
  label: string
}> = [
  { code: 'NOT_AVAILABLE_NOW', label: '지금은 어려워요' },
  { code: 'AMOUNT_NOT_PREFERRED', label: '금액이 안 맞아요' },
  { code: 'OTHER', label: '기타' },
]

interface TradeRequestActionSheetProps {
  open: boolean
  mode: TradeRequestSheetMode
  request: TradeRequestDto | null
  onOpenChange: (open: boolean) => void
  onAccept: () => void | Promise<void>
  onReject: (reasonCode: TradeRequestRejectionReason) => void | Promise<void>
}

export function TradeRequestActionSheet({
  open,
  mode,
  request,
  onOpenChange,
  onAccept,
  onReject,
}: TradeRequestActionSheetProps) {
  const portalContainerRef = useRef<HTMLElement | null>(
    typeof document !== 'undefined' ? document.getElementById('app-frame-portal') : null,
  )
  const layerIndex = useActivityZIndexBase({ activityOffset: 2 })
  const [loading, startLoading] = useLoading()
  const [reasonCode, setReasonCode] = useState<TradeRequestRejectionReason>(
    'NOT_AVAILABLE_NOW',
  )

  useLayoutOverlay(open)

  if (!request || !mode) return null

  const amountKrw = Number(request.match.coinAmount)
  const coinLabel = formatCoinAmount(amountKrw)
  const amountLabel = formatAmount(amountKrw)
  const matchLabel = request.match.type === 'EXACT' ? '정확 매칭' : '비슷한 금액'

  const handleAccept = () => {
    void startLoading(Promise.resolve(onAccept()))
  }

  const handleReject = () => {
    void startLoading(Promise.resolve(onReject(reasonCode)))
  }

  const title = mode === 'accept' ? '거래 요청 수락' : '거래 요청 거절'

  return (
    <BottomSheetRoot open={open} onOpenChange={onOpenChange}>
      <Portal container={portalContainerRef}>
        <BottomSheetContent
          title={title}
          layerIndex={layerIndex}
          showHandle
          aria-describedby={undefined}
        >
          <BottomSheetBody>
            <VStack gap="x4" width="full">
              <VStack gap="x2" align="flex-start" width="full">
                <Text textStyle="t7Bold" color="fg.neutral">
                  {title}
                </Text>
                <Text textStyle="t4Medium" color="fg.neutralMuted">
                  {matchLabel} · {coinLabel}
                </Text>
              </VStack>

              <List width="full" aria-label="신청 조건 요약">
                <ListItem title="거래 금액" detail={amountLabel} />
                <ListDivider />
                <ListItem title="Coin" detail={coinLabel} />
              </List>

              {mode === 'reject' && (
                <VStack gap="x2" width="full" align="flex-start">
                  <Text textStyle="t4Medium" color="fg.neutral">
                    거절 사유
                  </Text>
                  <VStack gap="x2" width="full" align="flex-start">
                    {REJECT_REASONS.map((reason) => (
                      <MotionChipButton
                        key={reason.code}
                        size="medium"
                        variant={
                          reasonCode === reason.code ? 'solid' : 'outlineWeak'
                        }
                        onClick={() => setReasonCode(reason.code)}
                      >
                        <Chip.Label>{reason.label}</Chip.Label>
                      </MotionChipButton>
                    ))}
                  </VStack>
                </VStack>
              )}

              {mode === 'accept' && (
                <Text textStyle="t4Regular" color="fg.neutralSubtle">
                  수락하면 구매자가 입금할 수 있어요. 예약된 Coin은 이미 잡혀 있어요.
                </Text>
              )}
            </VStack>
          </BottomSheetBody>
          <BottomSheetFooter>
            <VStack gap="x3" width="full" align="center">
              {mode === 'accept' ? (
                <BottomActionButton
                  size="large"
                  variant="brandSolid"
                  flexGrow
                  loading={loading}
                  disabled={loading}
                  onClick={handleAccept}
                >
                  수락하고 거래 시작
                </BottomActionButton>
              ) : (
                <BottomActionButton
                  size="large"
                  variant="criticalSolid"
                  flexGrow
                  loading={loading}
                  disabled={loading}
                  onClick={handleReject}
                >
                  거절하기
                </BottomActionButton>
              )}
              <TextLinkButton disabled={loading} onClick={() => onOpenChange(false)}>
                닫기
              </TextLinkButton>
            </VStack>
          </BottomSheetFooter>
        </BottomSheetContent>
      </Portal>
    </BottomSheetRoot>
  )
}
