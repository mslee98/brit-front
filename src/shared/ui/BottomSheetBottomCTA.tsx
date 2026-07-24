import type { ReactNode } from 'react'

import { useKeyboardInset } from '../hooks/useKeyboardInset'
import type { BottomCTABehavior } from './BottomCTA'

interface BottomSheetBottomCTAProps {
  children: ReactNode
  behavior?: BottomCTABehavior
}

/** `BottomSheetFooter` 내부 — 키보드 inset padding만 적용 */
export function BottomSheetBottomCTA({
  children,
  behavior = 'fixed',
}: BottomSheetBottomCTAProps) {
  const keyboardInset = useKeyboardInset()

  if (behavior === 'hiddenWhenKeyboard' && keyboardInset > 0) {
    return null
  }

  const paddingBottom =
    behavior === 'keyboardAdaptive'
      ? 'calc(max(env(safe-area-inset-bottom, 0px), var(--keyboard-inset, 0px)))'
      : 'env(safe-area-inset-bottom, 0px)'

  return (
    <div className="bottom-sheet-bottom-cta" style={{ width: '100%', paddingBottom }}>
      {children}
    </div>
  )
}
