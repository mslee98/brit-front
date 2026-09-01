import { IconCheckmarkShieldFill } from '@karrotmarket/react-monochrome-icon'
import { Callout } from 'seed-design/ui/callout'

import { TRADE_COMPOSE_COPY } from '../constants/tradeCompose'
import type { TradeSide } from '../types'

interface TradeInfoBannerProps {
  side: TradeSide
}

/** 거래 규칙 안내 배너 */
export function TradeInfoBanner({ side }: TradeInfoBannerProps) {
  return (
    <Callout
      tone="informative"
      prefixIcon={<IconCheckmarkShieldFill />}
      description={TRADE_COMPOSE_COPY[side].info}
    />
  )
}
