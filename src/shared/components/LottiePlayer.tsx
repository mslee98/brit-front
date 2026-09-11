import LottieImport from 'lottie-react'
import type { LottieComponentProps } from 'lottie-react'
import { useEffect, useState, type ComponentType } from 'react'

import './lottie-player.css'

const Lottie = (
  'default' in LottieImport ? LottieImport.default : LottieImport
) as ComponentType<LottieComponentProps>

const DEFAULT_RENDERER_SETTINGS: LottieComponentProps['rendererSettings'] = {
  preserveAspectRatio: 'xMidYMid meet',
  progressiveLoad: true,
}

interface LottiePlayerProps {
  animationData?: object
  loadAnimation?: () => Promise<object>
  mountWhen?: boolean
  className?: string
  loop?: boolean
  autoplay?: boolean
  size?: number
}

function joinClassNames(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(' ')
}

/**
 * Lottie 재생 플레이어.
 *
 * prefers-reduced-motion (제품 결정 B — 의도적 예외):
 * OS 「동작 줄이기」여도 `loop`/`autoplay` prop을 덮어쓰지 않고 호출부 설정을 그대로 따릅니다.
 * (이전: reduce 시 autoplay/loop off → 첫 프레임만. APNG와 정책을 맞춰 상태 그래픽이 끊기지 않게 함.)
 *
 * 접근성 리스크·탈출 경로(A 정적 / C 앱 토글)는 ApngPlayer와 동일합니다.
 *
 * @see .cursor/rules/mobile-motion.mdc
 * @see docs/pwa/trade-motion-diagnosis.md
 */
export function LottiePlayer({
  animationData: animationDataProp,
  loadAnimation,
  mountWhen = true,
  className,
  loop = false,
  autoplay = true,
  size = 80,
}: LottiePlayerProps) {
  const [loadedAnimationData, setLoadedAnimationData] = useState<object | null>(
    animationDataProp ?? null,
  )
  const rootClassName = joinClassNames('lottie-player-root', className)

  useEffect(() => {
    if (!mountWhen || animationDataProp) {
      setLoadedAnimationData(animationDataProp ?? null)
      return
    }

    if (!loadAnimation) {
      setLoadedAnimationData(null)
      return
    }

    let cancelled = false
    void loadAnimation()
      .then((data) => {
        if (!cancelled) setLoadedAnimationData(data)
      })
      .catch(() => {
        if (!cancelled) setLoadedAnimationData(null)
      })

    return () => {
      cancelled = true
    }
  }, [animationDataProp, loadAnimation, mountWhen])

  if (!mountWhen || !loadedAnimationData) return null

  return (
    <Lottie
      animationData={loadedAnimationData}
      loop={loop}
      autoplay={autoplay}
      className={rootClassName}
      style={{ width: size, height: size }}
      rendererSettings={DEFAULT_RENDERER_SETTINGS}
    />
  )
}
