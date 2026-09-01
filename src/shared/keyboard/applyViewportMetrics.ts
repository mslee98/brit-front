import {
  APP_VIEWPORT_HEIGHT_CSS_VAR,
  KEYBOARD_INSET_CSS_VAR,
  KEYBOARD_OPEN_THRESHOLD_PX,
} from './keyboardCssVars'

export interface ViewportMetrics {
  /** 앱이 쓸 높이. `null`이면 변수 제거 → CSS `100dvh` fallback */
  viewportHeight: number | null
  keyboardHeight: number
}

/**
 * Resize 모델의 단일 기록점.
 * `--keyboard-inset`은 측정·가림 판단용이며 CTA 배치에 쓰지 않는다.
 */
export function applyViewportMetrics({
  viewportHeight,
  keyboardHeight,
}: ViewportMetrics): number {
  const root = document.documentElement
  const inset = Math.max(0, Math.round(keyboardHeight))
  const storedInset = inset > KEYBOARD_OPEN_THRESHOLD_PX ? inset : 0

  if (viewportHeight === null) {
    root.style.removeProperty(APP_VIEWPORT_HEIGHT_CSS_VAR)
  } else {
    root.style.setProperty(
      APP_VIEWPORT_HEIGHT_CSS_VAR,
      `${Math.round(viewportHeight)}px`,
    )
  }

  root.style.setProperty(KEYBOARD_INSET_CSS_VAR, `${storedInset}px`)
  root.dataset.keyboardOpen = String(storedInset > 0)

  return storedInset
}

export function clearViewportMetrics(): void {
  applyViewportMetrics({ viewportHeight: null, keyboardHeight: 0 })
  delete document.documentElement.dataset.keyboardOpen
}
