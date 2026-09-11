/**
 * TradeRequestPendingScreen — 판매자 응답 대기 (WaitingState A).
 */
import { useState } from 'react'
import { useLoading } from 'react-simplikit'

import { ApngPlayer } from '../../../shared/components/ApngPlayer'
import { formatAmount, formatCoinAmount } from '../../../shared/utils/formatAmount'
import {
  formatMatchingCountdown,
  getTradeRequestPendingDescriptionLines,
  getTradeRequestPendingTitle,
  TRADE_REQUEST_PENDING_AUTO_REMATCH,
  TRADE_REQUEST_PENDING_CANCEL_CTA,
} from '../copy'
import { useMatchingNow } from '../hooks/useMatchingNow'
import type { MatchingCandidate } from '../matching/types'
import { TradeRequestCancelSheet } from './TradeRequestCancelSheet'
import { UserSummary } from './UserSummary'
import { WaitingStateLayout } from './WaitingStateLayout'

const HERO_APNG_SRC = '/apng/coin-exchange-usd-apng.png'
const HERO_SIZE = 140

interface TradeRequestPendingScreenProps {
  candidate: MatchingCandidate | null
  expiresAt: string | null
  countdownPaused?: boolean
  cancelLoading?: boolean
  /** AppBar X 등과 시트를 공유할 때 */
  cancelSheetOpen?: boolean
  onCancelSheetOpenChange?: (open: boolean) => void
  onCancelConfirm: () => void | Promise<void>
}

export function TradeRequestPendingScreen({
  candidate,
  expiresAt,
  countdownPaused = false,
  cancelLoading = false,
  cancelSheetOpen: cancelSheetOpenProp,
  onCancelSheetOpenChange,
  onCancelConfirm,
}: TradeRequestPendingScreenProps) {
  const [cancelSheetOpenInternal, setCancelSheetOpenInternal] = useState(false)
  const cancelSheetOpen = cancelSheetOpenProp ?? cancelSheetOpenInternal
  const setCancelSheetOpen = onCancelSheetOpenChange ?? setCancelSheetOpenInternal

  const [loading, startLoading] = useLoading()
  const nowMs = useMatchingNow(!countdownPaused)
  const nickname = candidate?.nickname ?? '판매자'
  const amountKrw = candidate?.amountKrw ?? 0
  const amountLine =
    amountKrw > 0
      ? `${formatCoinAmount(amountKrw)} · ${formatAmount(amountKrw)}`
      : null

  const clock = expiresAt ? formatMatchingCountdown(expiresAt, nowMs) : null
  const remainSec = expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - nowMs) / 1000))
    : 0
  const countdownLabel = clock ? `${clock} 남음` : null
  const isUrgent = remainSec > 0 && remainSec <= 60

  const handleConfirmCancel = () => {
    void startLoading(Promise.resolve(onCancelConfirm()))
  }

  return (
    <>
      <WaitingStateLayout
        illustration={<ApngPlayer src={HERO_APNG_SRC} size={HERO_SIZE} alt="" />}
        title={getTradeRequestPendingTitle()}
        descriptionLines={getTradeRequestPendingDescriptionLines(nickname)}
        countdownLabel={countdownLabel}
        countdownTone={isUrgent || remainSec === 0 ? 'warning' : 'informative'}
        timeoutCaption={TRADE_REQUEST_PENDING_AUTO_REMATCH}
        counterparty={
          <UserSummary
            nicknameMasked={nickname}
            completedTradeCount={candidate?.tradeCount ?? 0}
            completionRate={candidate?.completionRatePct ?? 0}
          />
        }
        amountLine={amountLine}
        cancelLabel={TRADE_REQUEST_PENDING_CANCEL_CTA}
        cancelDisabled={cancelLoading || loading || countdownPaused}
        onCancel={() => setCancelSheetOpen(true)}
      />

      <TradeRequestCancelSheet
        open={cancelSheetOpen}
        sellerNickname={nickname}
        onOpenChange={setCancelSheetOpen}
        onConfirmCancel={handleConfirmCancel}
      />
    </>
  )
}
