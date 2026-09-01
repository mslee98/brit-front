import { applyViewportMetrics, clearViewportMetrics } from './applyViewportMetrics'
import { KEYBOARD_OPEN_THRESHOLD_PX } from './keyboardCssVars'

/**
 * 화면 하단에 붙은 도킹 키보드만 inset으로 본다.
 * 플로팅·분할 키보드는 높이를 빼면 CTA가 과도하게 올라간다.
 */
export function getVirtualKeyboardInset(rect: DOMRectReadOnly): number {
  const touchesBottom = Math.abs(rect.bottom - window.innerHeight) < 2
  const coversEnoughWidth = rect.width >= window.innerWidth * 0.8
  if (!touchesBottom || !coversEnoughWidth) return 0
  return Math.max(0, Math.round(rect.height))
}

/**
 * Android Chromium VirtualKeyboard overlay.
 * 브라우저는 overlay로 두고, Brit 레이아웃은 docked일 때만 Resize로 변환한다.
 */
export function setupVirtualKeyboardInset(
  setInset: (value: number) => void,
): () => void {
  const virtualKeyboard = navigator.virtualKeyboard
  if (!virtualKeyboard) {
    clearViewportMetrics()
    setInset(0)
    return () => undefined
  }

  try {
    virtualKeyboard.overlaysContent = true
  } catch {
    // 미지원·정책 제한 — geometrychange만 시도
  }

  const handleGeometryChange = () => {
    const rawHeight = getVirtualKeyboardInset(virtualKeyboard.boundingRect)
    const keyboardHeight =
      rawHeight > KEYBOARD_OPEN_THRESHOLD_PX ? rawHeight : 0
    const stored = applyViewportMetrics({
      viewportHeight: window.innerHeight - keyboardHeight,
      keyboardHeight,
    })
    setInset(stored)
  }

  virtualKeyboard.addEventListener('geometrychange', handleGeometryChange)
  handleGeometryChange()

  return () => {
    virtualKeyboard.removeEventListener('geometrychange', handleGeometryChange)
    clearViewportMetrics()
    setInset(0)
  }
}
