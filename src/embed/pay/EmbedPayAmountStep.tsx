/**
 * D26 — 충전 가능 잔액 확인 후 금액 선택.
 * lock은 부모가 담당한다.
 */
import { ActionButton } from 'seed-design/ui/action-button'

import { EmbedShell } from '../EmbedShell'
import { LinkExpiryBar } from '../LinkExpiryBar'
import type { EmbedPaymentIntent } from './embedPay.api'
import {
  AMOUNT_PRESETS,
  addAmountPreset,
  canAddAmountPreset,
  digitsOnly,
  formatAmount,
  formatAmountInput,
  formatBalanceAfter,
  formatPartnerPoints,
  formatPresetLabel,
  isAmountWithinBalance,
} from './embedPayFormat'

/** Intent 만료 임박 시에만 타이머 노출 (2분) */
const EXPIRY_VISIBLE_WITHIN_MS = 120_000

type EmbedPayAmountStepProps = {
  intent: EmbedPaymentIntent
  amount: string
  error: string | null
  submitting: boolean
  onAmountChange: (amount: string) => void
  onSubmit: () => void
  onCancel: () => void
  onClose: () => void
}

export function EmbedPayAmountStep({
  intent,
  amount,
  error,
  submitting,
  onAmountChange,
  onSubmit,
  onCancel,
  onClose,
}: EmbedPayAmountStepProps) {
  const balance = intent.nonSellableBalanceMs
  const canNext = isAmountWithinBalance(amount, balance)
  const partnerLabel = intent.partnerName

  return (
    <EmbedShell
      onClose={onClose}
      closeDisabled={submitting}
      closeLabel="취소"
      stickyFooter
      footer={
        <>
          <ActionButton
            size="large"
            variant="brandSolid"
            loading={submitting}
            disabled={!canNext}
            onClick={onSubmit}
          >
            충전 내용 확인하기
          </ActionButton>
          <button
            type="button"
            className="embed-text-link"
            disabled={submitting}
            onClick={onCancel}
          >
            취소
          </button>
        </>
      }
    >
      <div className="embed-hero">
        <h1 className="embed-hero__title">얼마를 충전할까요?</h1>
        <p className="embed-hero__subtitle">
          Brit 잔액으로 {partnerLabel} 포인트를 충전해요.
        </p>
      </div>

      <div className="embed-balance-inline">
        <span className="embed-balance-inline__label">충전 가능 잔액</span>
        <span className="embed-balance-inline__value">
          {formatAmount(balance)}
        </span>
      </div>
      <p className="embed-muted embed-balance-inline__hint">
        판매용 잔액은 충전에 쓰이지 않아요.
      </p>

      <label className="embed-amount-label" htmlFor="embed-charge-amount">
        충전할 금액
      </label>
      <div className="embed-amount-field">
        <input
          id="embed-charge-amount"
          className="embed-amount-input"
          inputMode="numeric"
          autoComplete="off"
          placeholder="0"
          value={formatAmountInput(amount)}
          disabled={submitting}
          onChange={(e) => onAmountChange(digitsOnly(e.target.value))}
        />
      </div>

      <div className="embed-preset-row">
        {AMOUNT_PRESETS.map((preset) => {
          const canAdd = canAddAmountPreset(amount, preset, balance)
          return (
            <button
              key={preset}
              type="button"
              className="embed-preset-btn"
              disabled={submitting || !canAdd}
              onClick={() => {
                const next = addAmountPreset(amount, preset, balance)
                if (next != null) onAmountChange(next)
              }}
            >
              {formatPresetLabel(preset)}
            </button>
          )
        })}
        <button
          type="button"
          className="embed-preset-btn"
          disabled={submitting || !balance}
          onClick={() => onAmountChange(balance ?? '')}
        >
          전액
        </button>
      </div>

      <dl className="embed-preview">
        <div>
          <dt>충전 후 Brit 잔액</dt>
          <dd>{amount ? formatBalanceAfter(balance, amount) : '-'}</dd>
        </div>
        <div>
          <dt>받을 {partnerLabel} 포인트</dt>
          <dd className="embed-preview__emphasis">
            {amount ? formatPartnerPoints(amount) : '-'}
          </dd>
        </div>
      </dl>
      <p className="embed-muted embed-preview__note">
        입력한 금액과 같은 포인트가 지급돼요.
      </p>
      {error ? <p className="embed-pin-wrap__error">{error}</p> : null}

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
