/**
 * BRIT 충전 승인 팝업 — 업체가 Intent payUrl로 연다.
 *
 * 로그인 → (금액 미확정 시) 금액 입력 → 확인 → lock → 거래 PIN → B4 잠금.
 * lock은 「충전 승인하기」 직전으로 미뤄, 확인 화면에서 금액으로 돌아갈 수 있게 한다.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActionButton } from 'seed-design/ui/action-button'
import { PinField } from 'seed-design/ui/pin-field'

import { LOTTIE_ASSETS } from '../../assets/lottie/lottieRegistry'
import { NumericKeypad } from '../../features/auth/components/NumericKeypad'
import {
  clearSession,
  useAuthStatus,
  useAuthUser,
} from '../../features/auth/stores/authSession.store'
import { ApiError } from '../../shared/api/errors'
import { ApngPlayer } from '../../shared/components/ApngPlayer'
import { LottiePlayer } from '../../shared/components/LottiePlayer'
import { RESULT_HERO_LOTTIE_SIZE } from '../../shared/constants/motion'
import { EmbedAccountSwitchLink } from '../EmbedAccountSwitchLink'
import { EmbedLoginForm } from '../EmbedLoginForm'
import { EmbedShell } from '../EmbedShell'
import { EmbedPayAmountStep } from './EmbedPayAmountStep'
import { EmbedPayConfirmStep } from './EmbedPayConfirmStep'
import { EmbedPayPendingReviewStep } from './EmbedPayPendingReviewStep'
import {
  authorizePaymentIntent,
  cancelPaymentIntent,
  fetchPaymentIntent,
  fetchPaymentIntentStatus,
  lockPaymentIntentAmount,
  type EmbedPaymentIntent,
} from './embedPay.api'
import { formatAmount, isAmountWithinBalance } from './embedPayFormat'
import { forgetIntentId, postPayResult } from './payResultMessage'

type View =
  | { kind: 'loading' }
  | { kind: 'login' }
  | {
      kind: 'amount'
      intent: EmbedPaymentIntent
      amount: string
      error: string | null
    }
  | {
      kind: 'confirm'
      intent: EmbedPaymentIntent
      /** lock 전 초안. 이미 서버 lock된 Intent면 null */
      draftAmount: string | null
    }
  | {
      kind: 'pin'
      intent: EmbedPaymentIntent
      pin: string
      error: string | null
      /** PIN_LOCKED — 키패드만 막고 화면은 유지 */
      locked: boolean
    }
  | { kind: 'processing'; intent: EmbedPaymentIntent }
  | { kind: 'pendingReview'; intent: EmbedPaymentIntent }
  | { kind: 'blocked'; intent: EmbedPaymentIntent }
  | { kind: 'finished'; title: string; message: string }
  | { kind: 'error'; message: string }

const PIN_LEN = 6
/** ~90초. 초과 시 실패가 아니라 pendingReview (§8.4) */
const DEFAULT_POLL_MAX_TICKS = 60
const POLL_INTERVAL_MS = 1500

/** 로컬 스모크용. 프로덕션 번들에서는 무시한다. */
function resolvePollMaxTicks(): number {
  if (!import.meta.env.DEV) return DEFAULT_POLL_MAX_TICKS
  try {
    const raw = window.sessionStorage.getItem('brit-embed-poll-max')
    const n = raw ? Number(raw) : NaN
    if (Number.isFinite(n) && n >= 1 && n <= 120) return Math.floor(n)
  } catch {
    // ignore
  }
  return DEFAULT_POLL_MAX_TICKS
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError && error.message) return error.message
  return '잠시 후 다시 시도해 주세요.'
}

function closeSoon() {
  window.setTimeout(() => window.close(), 700)
}

function ProcessingPoll({
  intent,
  onCompleted,
  onFailed,
  onPendingReview,
  onDismiss,
}: {
  intent: EmbedPaymentIntent
  onCompleted: (
    status: Awaited<ReturnType<typeof fetchPaymentIntentStatus>>,
  ) => void
  onFailed: (
    status: Awaited<ReturnType<typeof fetchPaymentIntentStatus>>,
  ) => void
  onPendingReview: () => void
  onDismiss: () => void
}) {
  const onCompletedRef = useRef(onCompleted)
  const onFailedRef = useRef(onFailed)
  const onPendingReviewRef = useRef(onPendingReview)
  onCompletedRef.current = onCompleted
  onFailedRef.current = onFailed
  onPendingReviewRef.current = onPendingReview

  useEffect(() => {
    let cancelled = false
    let ticks = 0
    let timer: number | undefined
    const maxTicks = resolvePollMaxTicks()
    const poll = async () => {
      try {
        const status = await fetchPaymentIntentStatus(intent.intentId)
        if (cancelled) return
        if (status.status === 'COMPLETED') {
          onCompletedRef.current(status)
          return
        }
        if (status.status === 'FAILED') {
          onFailedRef.current(status)
          return
        }
      } catch {
        // 일시 오류는 다음 폴링
      }
      ticks += 1
      if (cancelled) return
      if (ticks >= maxTicks) {
        onPendingReviewRef.current()
        return
      }
      timer = window.setTimeout(() => void poll(), POLL_INTERVAL_MS)
    }
    void poll()
    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [intent.intentId])

  return (
    <EmbedShell onClose={onDismiss}>
      <div className="embed-processing">
        <ApngPlayer
          className="embed-processing__apng"
          src="/apng/document-magnifier-area-apng.png"
          size={160}
          alt=""
        />
        <div className="embed-hero embed-processing__copy">
          <h1 className="embed-hero__title">포인트 지급 확인 중</h1>
          <p className="embed-hero__subtitle">
            잔액을 잠갔어요. 확정이 끝나면 안내해 드릴게요.
          </p>
        </div>
      </div>
    </EmbedShell>
  )
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
      if (intent.status === 'PAYMENT_PROCESSING') {
        setView({ kind: 'processing', intent })
        return
      }
      if (intent.needsAmount) {
        setView({ kind: 'amount', intent, amount: '', error: null })
        return
      }
      if (!intent.canAuthorize) {
        setView({ kind: 'blocked', intent })
        return
      }
      setView({ kind: 'confirm', intent, draftAmount: null })
    } catch (error) {
      setView({ kind: 'error', message: errorMessage(error) })
    }
  }, [finish, intentId])

  /** 금액 입력 → 확인(아직 lock 안 함). 뒤로가기로 금액 수정 가능. */
  const goConfirmFromAmount = (
    intent: EmbedPaymentIntent,
    amount: string,
  ) => {
    if (!isAmountWithinBalance(amount, intent.nonSellableBalanceMs)) {
      setView({
        kind: 'amount',
        intent,
        amount,
        error: '충전 가능 잔액이 부족해요. 금액을 바꿔 주세요.',
      })
      return
    }
    setView({ kind: 'confirm', intent, draftAmount: amount })
  }

  /** 확인 → lock → PIN */
  const approveConfirm = async (
    intent: EmbedPaymentIntent,
    draftAmount: string | null,
  ) => {
    if (submitting) return
    const amountToLock =
      draftAmount ?? intent.totalDebitMs ?? intent.chargeAmountMs
    if (!amountToLock) {
      setView({
        kind: 'error',
        message: '충전 금액을 확인할 수 없어요. 다시 시작해 주세요.',
      })
      return
    }
    if (draftAmount != null) {
      if (!isAmountWithinBalance(draftAmount, intent.nonSellableBalanceMs)) {
        setView({
          kind: 'amount',
          intent,
          amount: draftAmount,
          error: '충전 가능 잔액이 부족해요. 금액을 바꿔 주세요.',
        })
        return
      }
      setSubmitting(true)
      try {
        const locked = await lockPaymentIntentAmount(
          intent.intentId,
          draftAmount,
        )
        if (!locked.canAuthorize) {
          setView({ kind: 'blocked', intent: locked })
          return
        }
        setView({
          kind: 'pin',
          intent: locked,
          pin: '',
          error: null,
          locked: false,
        })
      } catch (error) {
        // lock 실패 시 금액 단계에서 수정할 수 있게 되돌림
        setView({
          kind: 'amount',
          intent,
          amount: draftAmount,
          error: errorMessage(error),
        })
      } finally {
        setSubmitting(false)
      }
      return
    }
    startPin(intent)
  }

  useEffect(() => {
    if (authStatus !== 'authenticated' || !intentId) return
    void loadIntent()
  }, [authStatus, intentId, loadIntent])

  const startPin = (intent: EmbedPaymentIntent) => {
    setView({ kind: 'pin', intent, pin: '', error: null, locked: false })
  }

  const handleDigit = (digit: string) => {
    setView((prev) => {
      if (
        prev.kind !== 'pin' ||
        prev.locked ||
        prev.pin.length >= PIN_LEN ||
        submitting
      ) {
        return prev
      }
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
      prev.kind === 'pin' && !submitting && !prev.locked
        ? { ...prev, pin: prev.pin.slice(0, -1), error: null }
        : prev,
    )
  }

  const submitPin = async (intent: EmbedPaymentIntent, pin: string) => {
    if (submitting) return
    setSubmitting(true)
    try {
      const result = await authorizePaymentIntent(intent.intentId, pin)
      if (result.status === 'COMPLETED') {
        finish(
          result.returnOrigin,
          { status: 'COMPLETED', intentId: result.intentId },
          '충전했어요',
          `${intent.partnerName} 포인트로 전환했어요.`,
        )
        return
      }
      if (result.status === 'FAILED') {
        setView({
          kind: 'error',
          message: result.failureMessage ?? '충전에 실패했어요.',
        })
        if (result.returnOrigin) {
          postPayResult(result.returnOrigin, {
            status: 'ERROR',
            intentId: result.intentId,
            errorCode: result.failureCode ?? 'PARTNER_PAYMENT_FAILED',
          })
        }
        return
      }
      if (result.status === 'PAYMENT_PROCESSING') {
        setView({
          kind: 'processing',
          intent: { ...intent, status: result.status },
        })
        return
      }
      setView({
        kind: 'error',
        message: result.failureMessage ?? '충전을 완료하지 못했어요.',
      })
    } catch (error) {
      const code = error instanceof ApiError ? error.code : null
      if (code === 'PIN_INCORRECT' || code === 'PIN_LOCKED' || code === 'INVALID_PIN') {
        // 같은 PIN 화면 유지 — 로그인으로 쫓아내지 않음. 업체 ERROR postMessage도 안 보냄.
        setView({
          kind: 'pin',
          intent,
          pin: '',
          error: errorMessage(error),
          locked: code === 'PIN_LOCKED',
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

  /** 처리·확인 중 닫기 — 실패/취소가 아님. 부모에 PROCESSING 신호. */
  const dismissWhileProcessing = (intent: EmbedPaymentIntent) => {
    if (finishedRef.current) return
    finishedRef.current = true
    forgetIntentId()
    if (intent.returnOrigin) {
      postPayResult(intent.returnOrigin, {
        status: 'PROCESSING',
        intentId: intent.intentId,
      })
    }
    window.close()
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
    if (view.kind === 'amount' || view.kind === 'confirm') {
      void cancel(view.intent)
      return
    }
    if (view.kind === 'pin') {
      setView({ kind: 'confirm', intent: view.intent, draftAmount: null })
      return
    }
    if (view.kind === 'blocked') {
      closeBlocked(view.intent)
      return
    }
    if (view.kind === 'processing' || view.kind === 'pendingReview') {
      dismissWhileProcessing(view.intent)
      return
    }
    window.close()
  }

  if (view.kind === 'login') {
    return (
      <EmbedLoginForm
        subtitle="충전에 사용할 BRIT 계정으로 로그인해 주세요."
        pendingMessage="가입 승인이 끝난 계정만 충전할 수 있어요."
        onClose={() => window.close()}
      />
    )
  }

  if (view.kind === 'loading') {
    return (
      <EmbedShell onClose={() => window.close()}>
        <p className="embed-loading">충전 요청을 확인하고 있어요…</p>
      </EmbedShell>
    )
  }

  if (view.kind === 'amount') {
    return (
      <EmbedPayAmountStep
        intent={view.intent}
        amount={view.amount}
        error={view.error}
        submitting={submitting}
        onAmountChange={(amount) =>
          setView({
            kind: 'amount',
            intent: view.intent,
            amount,
            error: null,
          })
        }
        onSubmit={() => goConfirmFromAmount(view.intent, view.amount)}
        onCancel={() => void cancel(view.intent)}
        onClose={handleClose}
      />
    )
  }

  if (view.kind === 'confirm') {
    const debitMs =
      view.draftAmount ??
      view.intent.totalDebitMs ??
      view.intent.chargeAmountMs ??
      ''
    return (
      <EmbedPayConfirmStep
        intent={view.intent}
        debitMs={debitMs}
        submitting={submitting}
        onApprove={() => void approveConfirm(view.intent, view.draftAmount)}
        onBack={
          view.draftAmount != null
            ? () =>
                setView({
                  kind: 'amount',
                  intent: view.intent,
                  amount: view.draftAmount!,
                  error: null,
                })
            : undefined
        }
        onClose={handleClose}
      />
    )
  }

  if (view.kind === 'pin') {
    return (
      <EmbedShell
        title="거래 PIN"
        onBack={() =>
          setView({
            kind: 'confirm',
            intent: view.intent,
            draftAmount: null,
          })
        }
        backDisabled={submitting || view.locked}
        onClose={handleClose}
        closeDisabled={submitting}
        closeLabel="닫기"
      >
        <div className="embed-pin-wrap">
          <div className="embed-hero">
            <h1 className="embed-hero__title">거래 PIN 입력</h1>
            <p className="embed-hero__subtitle">
              {formatAmount(view.intent.totalDebitMs)}을 차감해요.
            </p>
          </div>
          <div className="embed-pin-wrap__dots">
            <PinField
              length={PIN_LEN}
              value={view.pin}
              invalid={Boolean(view.error)}
              aria-label="거래 PIN"
            />
          </div>
          <p
            className="embed-pin-wrap__error"
            role={view.error ? 'alert' : undefined}
            aria-live="polite"
          >
            {view.error ?? '\u00a0'}
          </p>
          <div className="embed-pin-wrap__keypad">
            <NumericKeypad
              onDigit={handleDigit}
              onBackspace={handleBackspace}
              disabled={submitting || view.locked}
            />
          </div>
        </div>
      </EmbedShell>
    )
  }

  if (view.kind === 'processing') {
    return (
      <ProcessingPoll
        intent={view.intent}
        onCompleted={(status) =>
          finish(
            status.returnOrigin,
            { status: 'COMPLETED', intentId: status.intentId },
            '충전했어요',
            `${view.intent.partnerName} 포인트로 전환했어요.`,
          )
        }
        onFailed={(status) => {
          setView({
            kind: 'error',
            message: status.failureMessage ?? '충전에 실패했어요.',
          })
          if (status.returnOrigin) {
            postPayResult(status.returnOrigin, {
              status: 'ERROR',
              intentId: status.intentId,
              errorCode: status.failureCode ?? 'PARTNER_PAYMENT_FAILED',
            })
          }
        }}
        onPendingReview={() =>
          setView({ kind: 'pendingReview', intent: view.intent })
        }
        onDismiss={() => dismissWhileProcessing(view.intent)}
      />
    )
  }

  if (view.kind === 'pendingReview') {
    return (
      <EmbedPayPendingReviewStep
        intent={view.intent}
        onCompleted={(status) =>
          finish(
            status.returnOrigin,
            { status: 'COMPLETED', intentId: status.intentId },
            '충전했어요',
            `${view.intent.partnerName} 포인트로 전환했어요.`,
          )
        }
        onFailed={(status) => {
          setView({
            kind: 'error',
            message: status.failureMessage ?? '충전에 실패했어요.',
          })
          if (status.returnOrigin) {
            postPayResult(status.returnOrigin, {
              status: 'ERROR',
              intentId: status.intentId,
              errorCode: status.failureCode ?? 'PARTNER_PAYMENT_FAILED',
            })
          }
        }}
        onClose={() => dismissWhileProcessing(view.intent)}
      />
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
            <EmbedAccountSwitchLink onConfirmSwitch={switchAccount} />
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
        <div className="embed-processing">
          <LottiePlayer
            animationData={LOTTIE_ASSETS.success}
            size={RESULT_HERO_LOTTIE_SIZE}
          />
          <div className="embed-hero embed-processing__copy">
            <h1 className="embed-hero__title">{view.title}</h1>
            <p className="embed-hero__subtitle">{view.message}</p>
          </div>
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
