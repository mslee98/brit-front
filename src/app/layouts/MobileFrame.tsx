import type { ReactNode } from 'react'

interface MobileFrameProps {
  children: ReactNode
  shadow?: boolean
}

/**
 * iOS visual-viewport 전략 시 Provider가 `--visual-viewport-height`를 설정한다.
 * 없으면 min-h-dvh 유지 (Android overlay / desktop).
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
