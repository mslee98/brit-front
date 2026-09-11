import { Badge, Text, VStack } from '@seed-design/react'
import { Callout } from 'seed-design/ui/callout'
import { PageBanner } from 'seed-design/ui/page-banner'
import { ResultSection } from 'seed-design/ui/result-section'

import { formatAmount, formatCoinAmount, formatCoinUnit } from '../../../shared/utils/formatAmount'
import type { TradeDetailViewModel } from '../types'
import { TradeHeroMotion } from './TradeHeroMotion'
import { TradeMotion } from './TradeMotion'

interface TradeRoomPanelProps {
  trade: TradeDetailViewModel
  motionMountWhen?: boolean
  onAccountCopied?: () => void
  onCopyFailed?: () => void
}

export function TradeRoomPanel({
  trade,
  motionMountWhen = true,
}: TradeRoomPanelProps) {
  const sideLabel = trade.side === 'BUY' ? '구매' : '판매'
  const isTerminal =
    trade.status === 'COMPLETED' ||
    trade.status === 'CANCELLED' ||
    trade.status === 'EXPIRED' ||
    trade.status === 'PAYMENT_TIMEOUT'

  const legLabel =
    trade.splitLegIndex && trade.splitTotalLegs
      ? `${trade.splitLegIndex}건 · ${formatAmount(trade.amountKrw)}`
      : formatAmount(trade.amountKrw)

  const statusBadgeLabel = isTerminal ? '종료' : '진행 중'

  if (trade.status === 'COMPLETED') {
    return (
      <VStack align="center" width="full" py="x2">
        <ResultSection
          asset={<TradeHeroMotion variant="completed" mountWhen={motionMountWhen} />}
          title="거래가 완료됐어요"
          description={`${formatCoinAmount(trade.amountKrw)} ${sideLabel}`}
        />
      </VStack>
    )
  }

  if (trade.status === 'COIN_TRANSFERRING') {
    return (
      <VStack align="center" width="full" py="x2">
        <ResultSection
          asset={<TradeHeroMotion variant="completed" mountWhen={motionMountWhen} />}
          title="코인을 이전하고 있어요"
          description="잠시만 기다려 주세요."
        />
      </VStack>
    )
  }

  if (trade.status === 'PAYMENT_TIMEOUT') {
    return (
      <VStack gap="x4" width="full" align="center">
        <Badge tone="warning" variant="weak" size="medium">
          입금 시간 초과
        </Badge>
        <Text textStyle="t6Bold" color="fg.neutral" className="tabular-nums">
          {legLabel}
        </Text>
        <Callout
          tone="warning"
          description={
            trade.role === 'SELLER'
              ? '입금 시간이 지났어요. 실제로 입금이 없으면 미입금 확정 버튼을 눌러주세요.'
              : '입금 시간이 지났어요. 실제로 입금했다면 판매자에게 확인을 요청해 주세요.'
          }
        />
      </VStack>
    )
  }

  if (trade.status === 'DISPUTED') {
    return (
      <VStack gap="x4" width="full" align="center">
        <Badge tone="critical" variant="weak" size="medium">
          분쟁 검토 중
        </Badge>
        <Text textStyle="t6Bold" color="fg.neutral" className="tabular-nums">
          {legLabel}
        </Text>
        <TradeMotion variant="disputed" size={96} mountWhen={motionMountWhen} />
        <Callout
          tone="warning"
          description="입금 확인이 맞지 않아 검토 중이에요. 다른 leg 거래는 계속할 수 있어요."
        />
      </VStack>
    )
  }

  return (
    <VStack gap="x5" width="full">
      <VStack gap="spacingY.betweenText">
        <Badge tone={isTerminal ? 'neutral' : 'warning'} variant="weak" size="medium">
          {statusBadgeLabel}
        </Badge>
        <Text textStyle="t6Bold" color="fg.neutral" className="tabular-nums">
          {legLabel} {sideLabel}
        </Text>
        <Text textStyle="t3Regular" color="fg.neutralMuted" className="tabular-nums">
          {formatCoinUnit(trade.coinAmount)}
        </Text>
      </VStack>

      {trade.status === 'PAYMENT_REPORTED' && trade.role === 'SELLER' && (
        <PageBanner
          tone="informative"
          variant="weak"
          title="구매자가 입금했다고 알려왔어요"
          description="계좌 입금 내역을 확인해 주세요."
        />
      )}
    </VStack>
  )
}
