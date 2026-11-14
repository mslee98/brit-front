/**
 * 남은 시간에 비례해 얇은 막대가 줄어든다.
 * 마운트 시점의 남은 시간을 100%로 두고 expiresAt까지 감소한다.
 */
import { useEffect, useRef, useState } from 'react'

function formatRemain(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function LinkExpiryBar({
  expiresAt,
  onExpired,
  label = '남은 시간',
}: {
  expiresAt: string
  onExpired?: () => void
  label?: string
}) {
  const endMs = new Date(expiresAt).getTime()
  const startMsRef = useRef(Date.now())
  const expiredNotifiedRef = useRef(false)
  const [now, setNow] = useState(() => Date.now())
  const totalMs = Math.max(1, endMs - startMsRef.current)

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(id)
  }, [])

  const remain = endMs - now
  const ratio = Math.max(0, Math.min(1, remain / totalMs))

  useEffect(() => {
    if (remain > 0 || expiredNotifiedRef.current) return
    expiredNotifiedRef.current = true
    onExpired?.()
  }, [onExpired, remain])

  return (
    <div className="embed-expiry">
      <div className="embed-expiry__meta">
        <span>{label}</span>
        <span className="embed-expiry__time">{formatRemain(remain)}</span>
      </div>
      <div
        className="embed-expiry__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(ratio * 100)}
        aria-label={label}
      >
        <div
          className="embed-expiry__fill"
          style={{ transform: `scaleX(${ratio})` }}
        />
      </div>
    </div>
  )
}
