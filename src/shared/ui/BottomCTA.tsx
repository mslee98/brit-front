import type { ReactNode } from 'react'
import { VStack } from '@seed-design/react'

import { APP_LAYOUT } from '../constants/app-layout'
import { useKeyboardInset } from '../hooks/useKeyboardInset'

export { BottomActionButton } from './BottomActionButton'

export type BottomCTABehavior = 'keyboardAdaptive' | 'fixed' | 'hiddenWhenKeyboard'

interface BottomCTAProps {
  children: ReactNode
  behavior?: BottomCTABehavior
  /**
   * `inline` — AppScreen Layer 안 in-flow (Activity 권장, 스택 z-index 안전)
   * `fixed` — viewport 고정 (특수 케이스; Layer 밖이면 z-index 주의)
   */
  variant?: 'fixed' | 'inline'
  className?: string
}

/** Resize 프레임 하단 여백. 키보드 inset은 CTA 배치에 쓰지 않음 */
function ctaPaddingBottom(keyboardAdaptive: boolean) {
  if (!keyboardAdaptive) {
    return 'calc(env(safe-area-inset-bottom, 0px) + var(--seed-dimension-x4, 16px))'
  }
  return 'var(--cta-safe-bottom)'
}

export function BottomCTA({
  children,
  behavior = 'keyboardAdaptive',
  variant = 'inline',
  className,
}: BottomCTAProps) {
  const keyboardInset = useKeyboardInset()

  if (behavior === 'hiddenWhenKeyboard' && keyboardInset > 0) {
    return null
  }

  const keyboardAdaptive = behavior === 'keyboardAdaptive'

  if (variant === 'inline') {
    return (
      <VStack
        width="full"
        px="spacingX.globalGutter"
        pt="x4"
        shrink={0}
        bg="bg.layerDefault"
        className={className}
        style={{
          paddingBottom: ctaPaddingBottom(keyboardAdaptive),
        }}
      >
        {children}
      </VStack>
    )
  }

  return (
    <div
      className={['bottom-cta', className].filter(Boolean).join(' ')}
      style={{
        ['--bottom-cta-offset' as string]: '0px',
        minHeight: APP_LAYOUT.fixedBottom.minHeight,
      }}
    >
      <VStack width="full" px="spacingX.globalGutter" py="x4">
        {children}
      </VStack>
    </div>
  )
}
