/**
 * 충전 확인 — 시안형 요약 후 PIN 승인으로 이어짐.
 * 수수료는 사용자 Embed에 표시하지 않음 (merchant §6.4).
 */
import { IconArrowRightArrowLeftLine } from '@karrotmarket/react-monochrome-icon'
import { ActionButton } from 'seed-design/ui/action-button'

import { EmbedShell } from '../EmbedShell'
import { LinkExpiryBar } from '../LinkExpiryBar'
import type { EmbedPaymentIntent } from './embedPay.api'
import {
  formatAmount,
  formatPartnerPoints,
} from './embedPayFormat'

const EXPIRY_VISIBLE_WITHIN_MS = 120_000

type EmbedPayConfirmStepProps = {
  intent: EmbedPaymentIntent
  /** lock 전 초안 금액(needsAmount 경로). 이미 lock된 Intent면 charge/totalDebit 사용 */
  debitMs: string
  submitting: boolean
  onApprove: () => void
  onBack?: () => void
  onClose: () => void
}

export function EmbedPayConfirmStep({
  intent,
  debitMs,
  submitting,
  onApprove,
  onBack,
  onClose,
}: EmbedPayConfirmStepProps) {
  return (
    <EmbedShell
      title="충전 확인"
      onBack={onBack}
      backDisabled={submitting}
      onClose={onClose}
      closeDisabled={submitting}
      closeLabel="닫기"
      stickyFooter
      footer={
        <ActionButton
          size="large"
          variant="brandSolid"
          loading={submitting}
          onClick={onApprove}
        >
          충전 승인하기
        </ActionButton>
      }
    >
      <div className="embed-confirm-hero">
        <div className="embed-confirm-hero__icon" aria-hidden>
          <IconArrowRightArrowLeftLine width={28} height={28} />
        </div>
        <h2 className="embed-confirm-hero__title">
          {formatPartnerPoints(debitMs)}를 충전할까요?
        </h2>
        <p className="embed-confirm-hero__subtitle">
          Brit 잔액이 차감되고 {intent.partnerName} 포인트가 지급돼요.
        </p>
      </div>

      <dl className="embed-confirm-rows">
        <div>
          <dt>충전할 곳</dt>
          <dd>{intent.partnerName}</dd>
        </div>
        <div>
          <dt>Brit 차감</dt>
          <dd>{formatAmount(debitMs)}</dd>
        </div>
        <div className="embed-confirm-rows__result">
          <dt>받을 포인트</dt>
          <dd>{formatPartnerPoints(debitMs)}</dd>
        </div>
      </dl>

      <div className="embed-amount-expiry">
        <LinkExpiryBar
          expiresAt={intent.expiresAt}
          label="승인 기한"
          visibleWithinMs={EXPIRY_VISIBLE_WITHIN_MS}
        />
      </div>
    </EmbedShell>
  )
}
