import { useEffect, useState } from 'react'

interface ApngPlayerProps {
  src: string
  className?: string
  size?: number
  alt?: string
}

/**
 * APNG 재생 플레이어.
 *
 * Chromium: SW Cache API 응답을 `<img src>`에 직접 넣으면 첫 프레임만 보이는 경우가 있어
 * fetch → blob URL로 재생합니다. (runtime CacheFirst 오프라인 캐시와 병행 가능)
 *
 * 루프는 APNG acTL num_plays에 따릅니다 (0 = 무한). 대기 화면 에셋은 0으로 패치합니다.
 *
 * prefers-reduced-motion (제품 결정 B — 의도적 예외):
 * OS 「동작 줄이기」/저전력 모드여도 APNG를 숨기지 않고 동일하게 재생합니다.
 * iOS에서 reduce 시 `null`이면 거래·가입 핵심 상태 그래픽이 빈 자리로 남아 문맥이 끊겼습니다.
 *
 * @see .cursor/rules/mobile-motion.mdc
 * @see docs/pwa/trade-motion-diagnosis.md
 */
export function ApngPlayer({
  src,
  className,
  size = 80,
  alt = '',
}: ApngPlayerProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let createdUrl: string | null = null

    const load = async () => {
      try {
        const response = await fetch(src)
        if (!response.ok || cancelled) return

        const blob = await response.blob()
        if (cancelled) return

        const nextUrl = URL.createObjectURL(blob)
        if (cancelled) {
          URL.revokeObjectURL(nextUrl)
          return
        }

        createdUrl = nextUrl
        setObjectUrl(nextUrl)
      } catch {
        // 네트워크/캐시 실패 시 모션 자리만 비움 (텍스트 UI로 상태 전달)
      }
    }

    void load()

    return () => {
      cancelled = true
      if (createdUrl) URL.revokeObjectURL(createdUrl)
      setObjectUrl(null)
    }
  }, [src])

  if (!objectUrl) {
    return (
      <span
        aria-hidden
        className={className}
        style={{
          width: size,
          height: size,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
    )
  }

  return (
    <img
      src={objectUrl}
      alt={alt}
      aria-hidden={alt === '' ? true : undefined}
      decoding="async"
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        flexShrink: 0,
      }}
    />
  )
}
