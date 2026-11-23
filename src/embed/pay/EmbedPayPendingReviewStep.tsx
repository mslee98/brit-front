/**
 * 폴링 한도 초과·장기 불명 — 실패가 아니라 확인 중.
 * 느린 soft-poll로 터미널 상태를 계속 따라가고, 수동 재확인도 제공한다.
 * 창을 닫아도 서버 SoT(PAYMENT_PROCESSING)는 유지된다.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActionButton } from 'seed-design/ui/action-button'

import { ApngPlayer } from '../../shared/components/ApngPlayer'
import { EmbedShell } from '../EmbedShell'
import {
  fetchPaymentIntentStatus,
  type EmbedPaymentIntent,
} from './embedPay.api'

/** pendingReview 중 백그라운드 재조회 간격 */
const SOFT_POLL_INTERVAL_MS = 10_000

type StatusResult = Awaited<ReturnType<typeof fetchPaymentIntentStatus>>

type EmbedPayPendingReviewStepProps = {
  intent: EmbedPaymentIntent
  onCompleted: (status: StatusResult) => void
  onFailed: (status: StatusResult) => void
  onClose: () => void
}

export function EmbedPayPendingReviewStep({
  intent,
  onCompleted,
  onFailed,
  onClose,
}: EmbedPayPendingReviewStepProps) {
  const [checking, setChecking] = useState(false)
  const onCompletedRef = useRef(onCompleted)
  const onFailedRef = useRef(onFailed)
  onCompletedRef.current = onCompleted
  onFailedRef.current = onFailed

  const checkOnce = useCallback(async (): Promise<boolean> => {
    try {
      const status = await fetchPaymentIntentStatus(intent.intentId)
      if (status.status === 'COMPLETED') {
        onCompletedRef.current(status)
        return true
      }
      if (status.status === 'FAILED') {
        onFailedRef.current(status)
        return true
      }
    } catch {
      // 일시 오류 — soft-poll 유지
    }
    return false
  }, [intent.intentId])

  useEffect(() => {
    let cancelled = false
    let timer: number | undefined
    const tick = async () => {
      const done = await checkOnce()
      if (cancelled || done) return
      timer = window.setTimeout(() => void tick(), SOFT_POLL_INTERVAL_MS)
    }
    timer = window.setTimeout(() => void tick(), SOFT_POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [checkOnce])

  const handleRecheck = async () => {
    if (checking) return
    setChecking(true)
    try {
      await checkOnce()
    } finally {
      setChecking(false)
    }
  }

  return (
    <EmbedShell
      onClose={onClose}
      stickyFooter
      footer={
        <>
          <ActionButton
            size="large"
            variant="neutralWeak"
            loading={checking}
            onClick={() => void handleRecheck()}
          >
            상태 다시 확인
          </ActionButton>
          <button type="button" className="embed-text-link" onClick={onClose}>
            닫기
          </button>
        </>
      }
    >
      <div className="embed-processing">
        <ApngPlayer
          className="embed-processing__apng"
          src="/apng/document-magnifier-area-apng.png"
          size={160}
          alt=""
        />
        <div className="embed-hero embed-processing__copy">
          <h1 className="embed-hero__title">아직 확인하고 있어요</h1>
          <p className="embed-hero__subtitle">
            잔액은 잠긴 상태예요. 창을 닫아도 처리는 이어지고, 결과는{' '}
            {intent.partnerName}·BRIT에서 확인할 수 있어요.
          </p>
        </div>
      </div>
    </EmbedShell>
  )
}
