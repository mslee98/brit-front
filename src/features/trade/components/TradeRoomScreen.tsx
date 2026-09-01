import { VStack } from '@seed-design/react'
import { BottomActionButton } from '../../../shared/ui/BottomActionButton'

import type { MatchingCandidate } from '../matching/types'
import type { TradeDetailViewModel } from '../types'
import { TradeLegMatchingScreen } from './TradeLegMatchingScreen'
import { TradePaymentBuyerWaitingPanel } from './TradePaymentBuyerWaitingPanel'
import { TradeRoomPanel } from './TradeRoomPanel'

interface TradeRoomScreenProps {
  trade: TradeDetailViewModel
  onContinueTrade?: () => void
  onGoHome: () => void
  onSelectMatchingCandidate?: (candidate: MatchingCandidate) => void
  onChangeMatchingConditions?: () => void | Promise<void>
  onStopMatching?: () => void | Promise<void>
  onBrowseStore?: () => void
  onBrowseCommunity?: () => void
  onCopyAccount?: () => void
  onCopyFailed?: () => void
  onContactSupport?: () => void
  onOpenDispute?: () => void
}

function getContinueTradeLabel(trade: TradeDetailViewModel): string | null {
  if (trade.status === 'PAYMENT_PENDING' && trade.role === 'BUYER') return '입금하기'
  if (trade.status === 'PAYMENT_REPORTED' && trade.role === 'SELLER') return '입금 확인하기'
  if (trade.status === 'PAYMENT_TIMEOUT' && trade.role === 'SELLER') return '처리하기'
  if (trade.status === 'DISPUTED') return '분쟁 안내 보기'
  return null
}

export function TradeRoomScreen({
  trade,
  onContinueTrade,
  onGoHome,
  onSelectMatchingCandidate,
  onChangeMatchingConditions,
  onStopMatching,
  onCopyAccount,
  onCopyFailed,
  onContactSupport,
  onOpenDispute,
}: TradeRoomScreenProps) {
  if (trade.status === 'MATCHING') {
    return (
      <TradeLegMatchingScreen
        trade={trade}
        onSelectCandidate={onSelectMatchingCandidate}
        onChangeConditions={onChangeMatchingConditions}
        onStopMatching={onStopMatching}
      />
    )
  }

  if (trade.status === 'COMPLETED') {
    return (
      <VStack
        flexGrow
        minHeight="full"
        px="spacingX.globalGutter"
        pt="spacingY.navToTitle"
        pb="spacingY.screenBottom"
        gap="x6"
      >
        <TradeRoomPanel trade={trade} />
        <VStack gap="x3" flexGrow justify="flex-end">
          <BottomActionButton size="large" variant="brandSolid" onClick={onGoHome}>
            홈으로
          </BottomActionButton>
        </VStack>
      </VStack>
    )
  }

  const continueLabel = getContinueTradeLabel(trade)
  const isBuyerWaiting = trade.status === 'PAYMENT_REPORTED' && trade.role === 'BUYER'

  if (isBuyerWaiting) {
    return (
      <VStack
        flexGrow
        minHeight="full"
        px="spacingX.globalGutter"
        pt="spacingY.navToTitle"
        pb="spacingY.screenBottom"
        gap="x6"
      >
        <TradePaymentBuyerWaitingPanel
          trade={trade}
          onAccountCopied={onCopyAccount}
          onCopyFailed={onCopyFailed}
          onContactSupport={onContactSupport}
          onOpenDispute={onOpenDispute}
        />
        <VStack gap="x2" flexGrow justify="flex-end">
          {onCopyAccount && (
            <BottomActionButton size="large" variant="neutralWeak" onClick={onCopyAccount}>
              입금 정보 보기
            </BottomActionButton>
          )}
          {onContactSupport && (
            <BottomActionButton size="large" variant="neutralOutline" onClick={onContactSupport}>
              문제가 있나요?
            </BottomActionButton>
          )}
        </VStack>
      </VStack>
    )
  }

  return (
    <VStack
      flexGrow
      minHeight="full"
      px="spacingX.globalGutter"
      pt="spacingY.navToTitle"
      pb="spacingY.screenBottom"
      gap="x6"
    >
      <TradeRoomPanel
        trade={trade}
        onAccountCopied={onCopyAccount}
        onCopyFailed={onCopyFailed}
      />
      {continueLabel && onContinueTrade && (
        <VStack gap="x3" flexGrow justify="flex-end">
          <BottomActionButton size="large" variant="brandSolid" onClick={onContinueTrade}>
            {continueLabel}
          </BottomActionButton>
        </VStack>
      )}
    </VStack>
  )
}
