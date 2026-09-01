import { HStack, Text } from '@seed-design/react'

import coinRateBadge from '../../../assets/home/coin-rate-badge.png'
import { formatAmountNumber } from '../../../shared/utils/formatAmount'
import { TRADE_COMPOSE_COPY } from '../constants/tradeCompose'
import { TRADE_COMPOSE_TYPOGRAPHY } from '../constants/tradeComposeTypography'
import type { TradeSide } from '../types'

interface TradeBalanceSummaryProps {
  side: TradeSide
  availableCoin: number
  escrowCoin: number
}

const t = TRADE_COMPOSE_TYPOGRAPHY

/** 사용/판매 가능 · 거래 보류 한 줄 요약 */
export function TradeBalanceSummary({
  side,
  availableCoin,
  escrowCoin,
}: TradeBalanceSummaryProps) {
  const availableLabel = TRADE_COMPOSE_COPY[side].balanceLabel

  return (
    <HStack gap="x1" align="center" width="full" className="trade-balance-summary">
      <img
        src={coinRateBadge}
        alt=""
        aria-hidden
        className="trade-balance-summary__icon"
      />
      <Text textStyle={t.balance} color="fg.neutralMuted" className="tabular-nums">
        {availableLabel}{' '}
        <Text as="span" textStyle="t4Medium" color="fg.brand" className="tabular-nums">
          {formatAmountNumber(availableCoin)} Coin
        </Text>
        {' · 거래 보류 '}
        <Text as="span" textStyle="t4Medium" color="fg.brand" className="tabular-nums">
          {formatAmountNumber(escrowCoin)} Coin
        </Text>
      </Text>
    </HStack>
  )
}
