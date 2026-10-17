import { VStack } from '@seed-design/react'
import { BottomActionButton } from '../../../shared/ui/BottomActionButton'

import type { MatchingCandidate } from '../matching/types'
import { getDisputeChatContinueLabel } from '../copy'
import type { TradeDetailViewModel } from '../types'
import { TradeCancelledResultScreen } from './TradeCancelledResultScreen'
import { TradeLegMatchingScreen } from './TradeLegMatchingScreen'
import { TradePaymentBuyerPendingScreen } from './TradePaymentBuyerPendingScreen'
import { TradePaymentBuyerWaitingScreen } from './TradePaymentBuyerWaitingScreen'
import { TradePaymentSellerConfirmScreen } from './TradePaymentSellerConfirmScreen'
import { TradePaymentSellerWaitingScreen } from './TradePaymentSellerWaitingScreen'
import { TradeRoomPanel } from './TradeRoomPanel'

interface TradeRoomScreenProps {
  trade: TradeDetailViewModel
  onContinueTrade?: () => void
  onGoHome: () => void
  onOpenTransactions?: () => void
  onSelectMatchingCandidate?: (candidate: MatchingCandidate) => void
  onChangeMatchingConditions?: () => void | Promise<void>
  onStopMatching?: () => void | Promise<void>
  onDensityChange?: (density: import('../hooks/useMatchingDensity').MatchingDensity) => void
  onBrowseStore?: () => void
  onBrowseCommunity?: () => void
  onCopyAccount?: () => void
  onCopyFailed?: () => void
  onContactSupport?: () => void
  onOpenDispute?: () => void | Promise<void>
  onPaymentDenied?: (updated: { dispute?: { id: string } | null }) => void
  onPaymentDenyStart?: () => void
  onPaymentDenyAborted?: () => void
}

function getContinueTradeLabel(trade: TradeDetailViewModel): string | null {
  if (trade.status === 'PAYMENT_TIMEOUT' && trade.role === 'SELLER') return '처리하기'
  if (trade.status === 'DISPUTED') return getDisputeChatContinueLabel()
  return null
}

export function TradeRoomScreen({
  trade,
  onContinueTrade,
  onGoHome,
  onOpenTransactions,
  onSelectMatchingCandidate,
  onChangeMatchingConditions,
  onStopMatching,
  onDensityChange,
  onCopyAccount,
  onCopyFailed,
  onContactSupport,
  onOpenDispute,
  onPaymentDenied,
  onPaymentDenyStart,
  onPaymentDenyAborted,
}: TradeRoomScreenProps) {
  if (trade.status === 'MATCHING') {
    return (
      <TradeLegMatchingScreen
        trade={trade}
        onSelectCandidate={onSelectMatchingCandidate}
        onChangeConditions={onChangeMatchingConditions}
        onStopMatching={onStopMatching}
        onDensityChange={onDensityChange}
      />
    )
  }

  if (trade.status === 'CANCELLED') {
    return (
      <TradeCancelledResultScreen
        trade={trade}
        onConfirm={onGoHome}
        onOpenTransactions={onOpenTransactions ?? onContactSupport ?? onGoHome}
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
  const isSellerWaitingDeposit =
    trade.status === 'PAYMENT_PENDING' && trade.role === 'SELLER'
  const isSellerConfirmDeposit =
    trade.status === 'PAYMENT_REPORTED' && trade.role === 'SELLER'
  const isBuyerPendingDeposit =
    trade.status === 'PAYMENT_PENDING' && trade.role === 'BUYER'
  const isBuyerWaiting = trade.status === 'PAYMENT_REPORTED' && trade.role === 'BUYER'

  if (isSellerWaitingDeposit) {
    return <TradePaymentSellerWaitingScreen trade={trade} />
  }

  if (isSellerConfirmDeposit) {
    return (
      <TradePaymentSellerConfirmScreen
        trade={trade}
        onDenied={onPaymentDenied}
        onDenyStart={onPaymentDenyStart}
        onDenyAborted={onPaymentDenyAborted}
      />
    )
  }

  if (isBuyerPendingDeposit) {
    return <TradePaymentBuyerPendingScreen trade={trade} />
  }

  if (isBuyerWaiting) {
    return (
      <TradePaymentBuyerWaitingScreen
        trade={trade}
        onOpenDispute={onOpenDispute}
      />
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
