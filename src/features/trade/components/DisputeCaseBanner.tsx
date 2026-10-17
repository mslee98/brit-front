import { VStack } from '@seed-design/react'
import { ActionButton } from 'seed-design/ui/action-button'
import { PageBanner } from 'seed-design/ui/page-banner'

import {
  getDisputeChatBannerDescription,
  getDisputeChatBannerTitle,
  getDisputeChatClosedBannerDescription,
  getDisputeChatClosedBannerTitle,
  getDisputeChatViewTradeLabel,
} from '../copy'
import type { TradeRole } from '../types'

type Props = {
  canChat: boolean
  role: TradeRole | null
  onViewTrade: () => void
}

export function DisputeCaseBanner({ canChat, role, onViewTrade }: Props) {
  return (
    <VStack gap="x2" width="full">
      <PageBanner
        tone="warning"
        variant="weak"
        title={
          canChat
            ? getDisputeChatBannerTitle()
            : getDisputeChatClosedBannerTitle()
        }
        description={
          canChat
            ? getDisputeChatBannerDescription(role)
            : getDisputeChatClosedBannerDescription()
        }
      />
      <ActionButton
        size="small"
        variant="neutralWeak"
        style={{ width: '100%' }}
        onClick={onViewTrade}
      >
        {getDisputeChatViewTradeLabel()}
      </ActionButton>
    </VStack>
  )
}
