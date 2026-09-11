/**
 * SellOrderPurchaseRequestSection — empty / pending 1건.
 */
import { IconDocumentMagnifyingglassLine } from '@karrotmarket/react-monochrome-icon'
import { Badge, Icon, Text, VStack } from '@seed-design/react'

import { PressableScale } from '../../../shared/ui/PressableScale'
import { formatAmount, formatCoinAmount } from '../../../shared/utils/formatAmount'
import { PushEnableCard } from '../../pwa/components/PushEnableCard'
import {
  PUSH_ENABLE_SELL_EMPTY_COPY,
  PUSH_ENABLE_SELL_PENDING_COPY,
} from '../../pwa/constants/pushNotificationCopy'
import { usePushNotification } from '../../pwa/hooks/usePushNotification'
import type { TradeRequestDto } from '../types'

interface SellOrderPurchaseRequestSectionProps {
  pending: TradeRequestDto | null
  remainingSec: number
  onOpenPending?: () => void
}

function formatCountdown(remainSec: number): string {
  const minutes = Math.floor(remainSec / 60)
  const seconds = remainSec % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function SellOrderPurchaseRequestSection({
  pending,
  remainingSec,
  onOpenPending,
}: SellOrderPurchaseRequestSectionProps) {
  const { eligibility, requestPermission } = usePushNotification()
  const canOpenPending = pending != null && onOpenPending != null

  return (
    <VStack gap="x3" align="flex-start" width="full">
      <Text textStyle="t5Bold" color="fg.neutral">
        {pending ? '구매 요청 1건' : '구매 요청'}
      </Text>

      {pending ? (
        <PressableScale
          aria-label="구매 요청 확인"
          onClick={() => onOpenPending?.()}
          style={{ width: '100%' }}
        >
          <VStack
            gap="x3"
            width="full"
            align="flex-start"
            p="x4"
            borderRadius="r3"
            borderWidth={1}
            borderColor="stroke.neutralMuted"
            bg="bg.layerDefault"
          >
            <VStack gap="x1" align="flex-start" width="full">
              <Badge tone="brand" variant="weak" size="medium">
                구매 요청
              </Badge>
              <Text textStyle="t6Bold" color="fg.neutral">
                {formatCoinAmount(Number(pending.match.coinAmount))} 요청
              </Text>
              <Text textStyle="t4Regular" color="fg.neutralMuted">
                {pending.match.type === 'EXACT' ? '정확 매칭' : '비슷한 금액'} ·{' '}
                {formatAmount(Number(pending.match.coinAmount))}
              </Text>
            </VStack>
            <Text textStyle="t5Medium" color="fg.neutral" className="tabular-nums">
              남은 시간 {formatCountdown(remainingSec)}
            </Text>
            {canOpenPending ? (
              <Text textStyle="t3Regular" color="fg.brand">
                탭해서 요청 확인
              </Text>
            ) : null}
          </VStack>
        </PressableScale>
      ) : (
        <VStack
          gap="x3"
          width="full"
          align="center"
          p="x6"
          borderRadius="r3"
          borderWidth={1}
          borderColor="stroke.neutralMuted"
          bg="bg.layerDefault"
        >
          <Icon
            svg={<IconDocumentMagnifyingglassLine />}
            size="x10"
            color="fg.neutralSubtle"
          />
          <VStack gap="x1" align="center" width="full">
            <Text textStyle="t5Bold" color="fg.neutral" style={{ textAlign: 'center' }}>
              아직 구매 요청이 없어요
            </Text>
            <Text textStyle="t4Regular" color="fg.neutralMuted" style={{ textAlign: 'center' }}>
              요청이 오면 여기에서 확인할 수 있어요.
            </Text>
          </VStack>
        </VStack>
      )}

      <PushEnableCard
        eligibility={eligibility}
        onRequestPermission={requestPermission}
        copy={pending ? PUSH_ENABLE_SELL_PENDING_COPY : PUSH_ENABLE_SELL_EMPTY_COPY}
      />
    </VStack>
  )
}
