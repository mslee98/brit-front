import type { ReactNode } from 'react'

interface MobileFrameProps {
  children: ReactNode
  shadow?: boolean
}

/**
 * `--app-viewport-height`가 있으면 가시 영역에 맞춘다.
 * 없으면 100dvh (desktop / 측정 전).
 */
export function MobileFrame({ children, shadow = true }: MobileFrameProps) {
  return (
    <main
      id="frameMain"
      className={[
        'mobile-frame relative flex w-full min-w-[var(--app-frame-min-width)] max-w-[var(--app-frame-max-width)] flex-col overflow-hidden bg-bg-layer-default',
        shadow ? 'shadow-[0_0_8px_rgba(0,0,0,0.16)]' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </main>
  )
}
