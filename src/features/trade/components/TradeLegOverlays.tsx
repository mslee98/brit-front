import { MatchingAcceptBottomSheet } from './MatchingAcceptBottomSheet'
import { TradePaymentBottomSheet } from './TradePaymentBottomSheet'
import type { MatchingCandidate } from '../matching/types'

interface TradeLegOverlaysProps {
  paymentSheetTradeId: string | null
  acceptOpen: boolean
  acceptCandidate: MatchingCandidate | null
  onAcceptOpenChange: (open: boolean) => void
  onAcceptConfirm: (candidateId: string) => void | Promise<void>
  onAcceptSkip: (candidateId: string) => void
  onPaymentOpenChange: (open: boolean) => void
}

export function TradeLegOverlays({
  paymentSheetTradeId,
  acceptOpen,
  acceptCandidate,
  onAcceptOpenChange,
  onAcceptConfirm,
  onAcceptSkip,
  onPaymentOpenChange,
}: TradeLegOverlaysProps) {
  return (
    <>
      <MatchingAcceptBottomSheet
        open={acceptOpen}
        onOpenChange={onAcceptOpenChange}
        candidate={acceptCandidate}
        onConfirm={onAcceptConfirm}
        onSkip={onAcceptSkip}
      />
      <TradePaymentBottomSheet
        open={paymentSheetTradeId !== null}
        onOpenChange={onPaymentOpenChange}
        tradeId={paymentSheetTradeId}
      />
    </>
  )
}
