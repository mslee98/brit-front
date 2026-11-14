/** 로그인 세션 표시용 짧은 기기 이름. */
export function guessDeviceName(userAgent?: string | null): string {
  const ua = userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '')
  if (!ua) return '알 수 없는 기기'

  const isIOS = /iPhone|iPad|iPod/i.test(ua)
  const isAndroid = /Android/i.test(ua)
  const isMac = /Macintosh|Mac OS X/i.test(ua)
  const isWindows = /Windows/i.test(ua)
  const isChrome = /Chrome\//i.test(ua) && !/Edg\//i.test(ua)
  const isSafari = /Safari\//i.test(ua) && !/Chrome\//i.test(ua)
  const isFirefox = /Firefox\//i.test(ua)
  const isEdge = /Edg\//i.test(ua)

  const browser = isEdge
    ? 'Edge'
    : isChrome
      ? 'Chrome'
      : isFirefox
        ? 'Firefox'
        : isSafari
          ? 'Safari'
          : '브라우저'

  if (isIOS) return `${browser} · iOS`
  if (isAndroid) return `${browser} · Android`
  if (isMac) return `${browser} · Mac`
  if (isWindows) return `${browser} · Windows`
  return browser
}

export function formatSessionDetail(input: {
  ipAddress?: string | null
  lastUsedAt?: string | null
  createdAt: string
}): string {
  const when = input.lastUsedAt ?? input.createdAt
  let timeLabel = when
  try {
    timeLabel = new Date(when).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    // keep raw
  }
  const ip = input.ipAddress?.trim()
  return ip ? `${ip} · ${timeLabel}` : timeLabel
}
