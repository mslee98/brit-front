export function formatPaymentDeadline(iso: string): string {
  const time = formatPaymentDeadlineTime(iso)
  if (!time) return ''
  return `${time}까지 입금`
}

/** `오후 3:51까지` — 메인/시트 한 줄 요약용 */
export function formatPaymentDeadlineTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const time = date.toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return `${time}까지`
}

/** MM:SS countdown clock */
export function formatPaymentRemainingClock(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
