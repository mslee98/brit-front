import { useEffect, useState } from 'react'

import {
  formatPaymentDeadline,
  formatPaymentDeadlineTime,
  formatPaymentRemainingClock,
} from '../utils/formatPaymentDeadline'

export const PAYMENT_COUNTDOWN_WARNING_MS = 3 * 60 * 1000
/** 메인 타이머 텍스트 색 — 60초 이하만 warning */
export const PAYMENT_COUNTDOWN_URGENT_MS = 60 * 1000

export type PaymentCountdownTone = 'informative' | 'warning' | 'critical'

function formatRemainingLabel(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes > 0) {
    return `${minutes}분 ${seconds}초`
  }
  return `${seconds}초`
}

function resolveTone(remainingMs: number): PaymentCountdownTone {
  if (remainingMs <= 0) return 'critical'
  if (remainingMs <= PAYMENT_COUNTDOWN_WARNING_MS) return 'warning'
  return 'informative'
}

export function usePaymentCountdown(paymentDeadline?: string) {
  const [remainingMs, setRemainingMs] = useState(() => {
    if (!paymentDeadline) return 0
    return Math.max(0, new Date(paymentDeadline).getTime() - Date.now())
  })

  useEffect(() => {
    if (!paymentDeadline) {
      setRemainingMs(0)
      return
    }

    const deadlineMs = new Date(paymentDeadline).getTime()
    if (Number.isNaN(deadlineMs)) {
      setRemainingMs(0)
      return
    }

    const tick = () => {
      setRemainingMs(Math.max(0, deadlineMs - Date.now()))
    }

    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [paymentDeadline])

  const isExpired = remainingMs <= 0
  const tone = resolveTone(remainingMs)
  const remainingLabel = formatRemainingLabel(remainingMs)
  const remainingClockLabel = formatPaymentRemainingClock(remainingMs)
  const deadlineLabel = paymentDeadline ? formatPaymentDeadline(paymentDeadline) : ''
  const deadlineTimeLabel = paymentDeadline
    ? formatPaymentDeadlineTime(paymentDeadline)
    : ''
  const isUrgent = remainingMs > 0 && remainingMs <= PAYMENT_COUNTDOWN_URGENT_MS

  return {
    remainingMs,
    remainingLabel,
    remainingClockLabel,
    deadlineLabel,
    deadlineTimeLabel,
    tone,
    isExpired,
    isUrgent,
  }
}
