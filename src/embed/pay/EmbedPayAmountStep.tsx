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
  digitsOnly,
  formatBalanceAfter,
  formatMsAmount,
  isAmountWithinBalance,
} from './embedPayFormat'

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
            다음
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
        <h1 className="embed-hero__title">충전할 금액</h1>
        <p className="embed-hero__subtitle">
          {intent.partnerName} 포인트로 전환해요
        </p>
      </div>

      <div className="embed-balance-card">
        <p className="embed-balance-card__label">충전 가능 잔액</p>
        <p className="embed-balance-card__value">
          {formatMsAmount(balance)}
          <span className="embed-balance-card__unit">MS</span>
        </p>
        <p className="embed-balance-card__hint">
          판매 가능 MS는 충전에 쓰이지 않아요.
        </p>
      </div>

      <label className="embed-amount-label" htmlFor="embed-charge-amount">
        금액 (MS)
      </label>
      <input
        id="embed-charge-amount"
        className="embed-amount-input"
        inputMode="numeric"
        autoComplete="off"
        placeholder="0"
        value={amount}
        disabled={submitting}
        onChange={(e) => onAmountChange(digitsOnly(e.target.value))}
      />

      <div className="embed-preset-row">
        {AMOUNT_PRESETS.map((preset) => {
          const overBalance =
            balance != null && !isAmountWithinBalance(String(preset), balance)
          return (
            <button
              key={preset}
              type="button"
              className={
                amount === String(preset)
                  ? 'embed-preset-btn embed-preset-btn--on'
                  : 'embed-preset-btn'
              }
              disabled={submitting || overBalance}
              onClick={() => onAmountChange(String(preset))}
            >
              {preset.toLocaleString('ko-KR')}
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

      <p className="embed-muted embed-amount-after">
        차감 후 예상 {amount ? formatBalanceAfter(balance, amount) : '-'}
      </p>
      {error ? <p className="embed-pin-wrap__error">{error}</p> : null}

      <div className="embed-amount-expiry">
        <LinkExpiryBar expiresAt={intent.expiresAt} label="승인 기한" />
      </div>
    </EmbedShell>
  )
}
