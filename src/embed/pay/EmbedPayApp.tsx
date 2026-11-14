/**
 * BRIT 충전 승인 팝업 — 업체가 Intent payUrl로 연다. (B3)
 *
 * 로그인 → 금액 확인 → 거래 PIN → 동기 CHARGE → postMessage(BRIT_PAY_RESULT)
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActionButton } from 'seed-design/ui/action-button'
import { PinField } from 'seed-design/ui/pin-field'

import { NumericKeypad } from '../../features/auth/components/NumericKeypad'
import {
  clearSession,
  useAuthStatus,
  useAuthUser,
} from '../../features/auth/stores/authSession.store'
import { ApiError } from '../../shared/api/errors'
import { EmbedLoginForm } from '../EmbedLoginForm'
import { EmbedShell } from '../EmbedShell'
import { LinkExpiryBar } from '../LinkExpiryBar'
import {
  authorizePaymentIntent,
  cancelPaymentIntent,
  fetchPaymentIntent,
  type EmbedPaymentIntent,
} from './embedPay.api'
import { forgetIntentId, postPayResult } from './payResultMessage'

type View =
  | { kind: 'loading' }
  | { kind: 'login' }
  | { kind: 'confirm'; intent: EmbedPaymentIntent }
  | { kind: 'pin'; intent: EmbedPaymentIntent; pin: string; error: string | null }
  | { kind: 'blocked'; intent: EmbedPaymentIntent }
  | { kind: 'finished'; title: string; message: string }
  | { kind: 'error'; message: string }

const PIN_LEN = 6

function errorMessage(error: unknown): string {
  if (error instanceof ApiError && error.message) return error.message
  return '잠시 후 다시 시도해 주세요.'
}

function formatMsAmount(raw: string | null | undefined): string {
  if (!raw) return '-'
  try {
    return BigInt(raw).toLocaleString('ko-KR')
  } catch {
    return raw
  }
}

function formatMs(raw: string | null | undefined): string {
  const n = formatMsAmount(raw)
  return n === '-' ? '-' : `${n} MS`
}

function closeSoon() {
  window.setTimeout(() => window.close(), 700)
}

export function EmbedPayApp({ intentId }: { intentId: string | null }) {
  const authStatus = useAuthStatus()
  const user = useAuthUser()
  const [currentView, setView] = useState<View>({ kind: 'loading' })
  const [submitting, setSubmitting] = useState(false)
  const finishedRef = useRef(false)

  const finish = useCallback(
    (
      returnOrigin: string,
      result: Parameters<typeof postPayResult>[1],
      title: string,
      message: string,
    ) => {
      if (finishedRef.current) return
      finishedRef.current = true
      forgetIntentId()
      const delivered = postPayResult(returnOrigin, result)
      setView({
        kind: 'finished',
        title,
        message: delivered
          ? message
          : `${message} 이 창을 닫고 업체 화면으로 돌아가 주세요.`,
      })
      if (delivered) closeSoon()
    },
    [],
  )

  const loadIntent = useCallback(async () => {
    if (!intentId) return
    setView({ kind: 'loading' })
    try {
      const intent = await fetchPaymentIntent(intentId)
      if (intent.status === 'COMPLETED') {
        finish(
          intent.returnOrigin,
          { status: 'COMPLETED', intentId: intent.intentId },
          '이미 완료됐어요',
          '업체 화면으로 돌아가요.',
        )
        return
      }
      if (!intent.canAuthorize) {
        setView({ kind: 'blocked', intent })
        return
      }
      setView({ kind: 'confirm', intent })
    } catch (error) {
      setView({ kind: 'error', message: errorMessage(error) })
    }
  }, [finish, intentId])

  useEffect(() => {
    if (authStatus !== 'authenticated' || !intentId) return
    void loadIntent()
  }, [authStatus, intentId, loadIntent])

  const startPin = (intent: EmbedPaymentIntent) => {
    setView({ kind: 'pin', intent, pin: '', error: null })
  }

  const handleDigit = (digit: string) => {
    setView((prev) => {
      if (prev.kind !== 'pin' || prev.pin.length >= PIN_LEN || submitting) return prev
      const next = prev.pin + digit
      const nextView = { ...prev, pin: next, error: null }
      if (next.length === PIN_LEN) {
        queueMicrotask(() => void submitPin(prev.intent, next))
      }
      return nextView
    })
  }

  const handleBackspace = () => {
    setView((prev) =>
      prev.kind === 'pin' && !submitting
        ? { ...prev, pin: prev.pin.slice(0, -1), error: null }
        : prev,
    )
  }

  const submitPin = async (intent: EmbedPaymentIntent, pin: string) => {
    if (submitting) return
    setSubmitting(true)
    try {
      const result = await authorizePaymentIntent(intent.intentId, pin)
      finish(
        result.returnOrigin,
        { status: 'COMPLETED', intentId: result.intentId },
        '충전했어요',
        `${intent.partnerName} 포인트로 전환했어요.`,
      )
    } catch (error) {
      const code = error instanceof ApiError ? error.code : null
      if (code === 'PIN_INCORRECT' || code === 'PIN_LOCKED' || code === 'INVALID_PIN') {
        setView({
          kind: 'pin',
          intent,
          pin: '',
          error: errorMessage(error),
        })
      } else {
        setView({ kind: 'error', message: errorMessage(error) })
        if (intent.returnOrigin) {
          postPayResult(intent.returnOrigin, {
            status: 'ERROR',
            intentId: intent.intentId,
            errorCode: code ?? 'PARTNER_PAYMENT_FAILED',
          })
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  const cancel = async (intent: EmbedPaymentIntent) => {
    setSubmitting(true)
    try {
      const result = await cancelPaymentIntent(intent.intentId)
      finish(
        result.returnOrigin,
        { status: 'CANCELLED', intentId: result.intentId },
        '취소했어요',
        '업체 화면으로 돌아가요.',
      )
    } catch (error) {
      setView({ kind: 'error', message: errorMessage(error) })
    } finally {
      setSubmitting(false)
    }
  }

  const closeBlocked = (intent: EmbedPaymentIntent) => {
    finish(
      intent.returnOrigin,
      {
        status: 'ERROR',
        intentId: intent.intentId,
        errorCode: intent.status === 'EXPIRED' ? 'PARTNER_PAYMENT_INTENT_EXPIRED' : 'BLOCKED',
      },
      '진행할 수 없어요',
      intent.blockReason ?? '업체 화면으로 돌아가요.',
    )
  }

  const switchAccount = () => {
    finishedRef.current = false
    setView({ kind: 'loading' })
    clearSession()
  }

  const view: View = !intentId
    ? {
        kind: 'error',
        message: '충전 요청 정보가 없어요. 업체 화면에서 다시 시도해 주세요.',
      }
    : authStatus === 'authenticated'
      ? currentView
      : { kind: 'login' }

  const handleClose = () => {
    if (submitting || finishedRef.current) return
    if (view.kind === 'confirm') {
      void cancel(view.intent)
      return
    }
    if (view.kind === 'pin') {
      setView({ kind: 'confirm', intent: view.intent })
      return
    }
    if (view.kind === 'blocked') {
      closeBlocked(view.intent)
      return
    }
    window.close()
  }

  if (view.kind === 'login') {
    return (
      <EmbedShell onClose={() => window.close()}>
        <EmbedLoginForm
          subtitle="충전에 사용할 BRIT 계정으로 로그인해 주세요."
          pendingMessage="가입 승인이 끝난 계정만 충전할 수 있어요."
        />
      </EmbedShell>
    )
  }

  if (view.kind === 'loading') {
    return (
      <EmbedShell onClose={() => window.close()}>
        <p className="embed-loading">충전 요청을 확인하고 있어요…</p>
      </EmbedShell>
    )
  }

  if (view.kind === 'confirm') {
    const subtitle =
      view.intent.productName ??
      `${view.intent.partnerName} 포인트로 전환해요`
    return (
      <EmbedShell
        onClose={handleClose}
        closeDisabled={submitting}
        closeLabel="취소"
        stickyFooter
        footer={
          <>
            <ActionButton
              size="large"
              variant="brandSolid"
              loading={submitting}
              onClick={() => startPin(view.intent)}
            >
              PIN으로 승인
            </ActionButton>
            <button
              type="button"
              className="embed-text-link"
              disabled={submitting}
              onClick={() => void cancel(view.intent)}
            >
              취소
            </button>
            <button
              type="button"
              className="embed-text-link"
              disabled={submitting}
              onClick={switchAccount}
            >
              다른 계정으로 로그인
            </button>
          </>
        }
      >
        <div className="embed-hero">
          <p className="embed-hero__amount">
            {formatMsAmount(view.intent.totalDebitMs)}
            <span style={{ fontSize: 20, fontWeight: 700, marginLeft: 6 }}>MS</span>
          </p>
          <p className="embed-hero__subtitle">{subtitle}</p>
        </div>

        <dl className="embed-rows">
          <div>
            <dt>업체</dt>
            <dd>{view.intent.partnerName}</dd>
          </div>
          <div>
            <dt>업체 회원</dt>
            <dd>{view.intent.partnerUserKeyMasked}</dd>
          </div>
          <div>
            <dt>잔액</dt>
            <dd>{formatMs(view.intent.nonSellableBalanceMs)}</dd>
          </div>
          <div>
            <dt>계정</dt>
            <dd>{user?.nickname ?? user?.loginId ?? '-'}</dd>
          </div>
        </dl>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
          <LinkExpiryBar expiresAt={view.intent.expiresAt} label="승인 기한" />
        </div>
      </EmbedShell>
    )
  }

  if (view.kind === 'pin') {
    return (
      <EmbedShell onClose={handleClose} closeDisabled={submitting} closeLabel="뒤로">
        <div className="embed-pin-wrap">
          <div className="embed-hero">
            <h1 className="embed-hero__title">거래 PIN 입력</h1>
            <p className="embed-hero__subtitle">
              {formatMs(view.intent.totalDebitMs)}을 차감해요.
            </p>
          </div>
          <div className="embed-pin-wrap__dots">
            <PinField length={PIN_LEN} value={view.pin} aria-label="거래 PIN" />
          </div>
          {view.error ? (
            <p className="embed-pin-wrap__error">{view.error}</p>
          ) : null}
          <div className="embed-pin-wrap__keypad">
            <NumericKeypad
              onDigit={handleDigit}
              onBackspace={handleBackspace}
              disabled={submitting}
            />
          </div>
        </div>
      </EmbedShell>
    )
  }

  if (view.kind === 'blocked') {
    return (
      <EmbedShell
        onClose={handleClose}
        stickyFooter
        footer={
          <>
            <ActionButton
              size="large"
              variant="brandSolid"
              onClick={() => closeBlocked(view.intent)}
            >
              확인
            </ActionButton>
            <button type="button" className="embed-text-link" onClick={switchAccount}>
              다른 계정으로 로그인
            </button>
          </>
        }
      >
        <div className="embed-hero">
          <h1 className="embed-hero__title">진행할 수 없어요</h1>
          <p className="embed-hero__subtitle">
            {view.intent.blockReason ?? '업체 화면에서 다시 시도해 주세요.'}
          </p>
        </div>
      </EmbedShell>
    )
  }

  if (view.kind === 'finished') {
    return (
      <EmbedShell>
        <div className="embed-hero">
          <h1 className="embed-hero__title">{view.title}</h1>
          <p className="embed-hero__subtitle">{view.message}</p>
        </div>
      </EmbedShell>
    )
  }

  return (
    <EmbedShell
      onClose={() => window.close()}
      stickyFooter
      footer={
        <ActionButton size="large" variant="neutralWeak" onClick={() => window.close()}>
          닫기
        </ActionButton>
      }
    >
      <div className="embed-hero">
        <h1 className="embed-hero__title">충전하지 못했어요</h1>
        <p className="embed-hero__subtitle">{view.message}</p>
      </div>
    </EmbedShell>
  )
}
