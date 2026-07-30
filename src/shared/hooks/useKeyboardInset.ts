import { createContext, useContext, useEffect, useState } from 'react'

import { KEYBOARD_INSET_CSS_VAR } from '../keyboard/keyboardCssVars'
import type { KeyboardStrategy } from '../keyboard/keyboardPolicy'
import { setupVirtualKeyboardInset } from '../keyboard/setupVirtualKeyboardInset'
import { setupVisualViewportInset } from '../keyboard/setupVisualViewportInset'

export { KEYBOARD_INSET_CSS_VAR, VISUAL_VIEWPORT_HEIGHT_CSS_VAR } from '../keyboard/keyboardCssVars'

function applyKeyboardInset(inset: number) {
  document.documentElement.style.setProperty(KEYBOARD_INSET_CSS_VAR, `${inset}px`)
}

/**
 * strategy에 맞는 inset 구독. Provider에서만 호출.
 * @param syncVisualViewportHeight iOS에서만 true — MobileFrame 높이용
 */
export function useKeyboardInsetController(
  strategy: KeyboardStrategy,
  options?: { syncVisualViewportHeight?: boolean },
): number {
  const [inset, setInset] = useState(0)
  const syncVisualViewportHeight = options?.syncVisualViewportHeight === true

  useEffect(() => {
    const updateInset = (next: number) => {
      setInset(next)
      applyKeyboardInset(next)
    }

    if (strategy === 'none') {
      updateInset(0)
      return
    }

    if (strategy === 'virtual-keyboard-overlay' && navigator.virtualKeyboard) {
      return setupVirtualKeyboardInset(updateInset)
    }

    return setupVisualViewportInset(updateInset, {
      syncVisualViewportHeight,
    })
  }, [strategy, syncVisualViewportHeight])

  return inset
}

const KeyboardInsetContext = createContext(0)

/** Provider 하위에서 inset(px) 구독 — hiddenWhenKeyboard 등 */
export function useKeyboardInset(): number {
  return useContext(KeyboardInsetContext)
}

export { KeyboardInsetContext }
