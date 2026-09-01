import { createContext, useContext, useEffect, useState } from 'react'

import { clearViewportMetrics } from '../keyboard/applyViewportMetrics'
import type { KeyboardStrategy } from '../keyboard/keyboardPolicy'
import { setupVirtualKeyboardInset } from '../keyboard/setupVirtualKeyboardInset'
import { setupVisualViewportInset } from '../keyboard/setupVisualViewportInset'

export { APP_VIEWPORT_HEIGHT_CSS_VAR, KEYBOARD_INSET_CSS_VAR } from '../keyboard/keyboardCssVars'

/**
 * strategy에 맞는 inset 구독. Provider에서만 호출.
 * CSS 변수는 setup이 applyViewportMetrics로 기록한다.
 */
export function useKeyboardInsetController(strategy: KeyboardStrategy): number {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    if (strategy === 'none') {
      clearViewportMetrics()
      return
    }

    if (strategy === 'virtual-keyboard-overlay' && navigator.virtualKeyboard) {
      return setupVirtualKeyboardInset(setInset)
    }

    return setupVisualViewportInset(setInset)
  }, [strategy])

  return inset
}

const KeyboardInsetContext = createContext(0)

/** Provider 하위에서 inset(px) 구독 — hiddenWhenKeyboard 등 */
export function useKeyboardInset(): number {
  return useContext(KeyboardInsetContext)
}

export { KeyboardInsetContext }
