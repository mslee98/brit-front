import { applyViewportMetrics, clearViewportMetrics } from './applyViewportMetrics'
import { KEYBOARD_OPEN_THRESHOLD_PX } from './keyboardCssVars'

const SETTLE_REMEASURE_MS = 350

function isEditableElement(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) return false
  return element.matches("input, textarea, select, [contenteditable='true']")
}

/**
 * iOS / Android fallback — layout viewport top=0인 프레임이
 * visualViewport 하단(키보드 상단)까지 닿도록 height+offsetTop을 쓴다.
 * CSS `top`은 쓰지 않는다 (이중 보정).
 */
export function setupVisualViewportInset(
  setInset: (value: number) => void,
): () => void {
  const viewport = window.visualViewport
  if (!viewport) {
    const stored = applyViewportMetrics({
      viewportHeight: window.innerHeight,
      keyboardHeight: 0,
    })
    setInset(stored)
    return () => {
      clearViewportMetrics()
      setInset(0)
    }
  }

  let baselineHeight = Math.max(window.innerHeight, viewport.height)
  let baselineWidth = window.innerWidth
  let rafId: number | null = null
  let settleTimer: number | null = null

  const publish = (viewportHeight: number, keyboardHeight: number) => {
    const stored = applyViewportMetrics({
      viewportHeight,
      keyboardHeight,
    })
    setInset(stored)
  }

  const measure = () => {
    const widthChanged = Math.abs(window.innerWidth - baselineWidth) > 40
    if (widthChanged) {
      baselineWidth = window.innerWidth
      baselineHeight = Math.max(window.innerHeight, viewport.height)
    }

    const visibleBottom = viewport.height + viewport.offsetTop
    const appHeight = Math.min(baselineHeight, visibleBottom)

    const isInputFocused = isEditableElement(document.activeElement)
    if (!isInputFocused) {
      baselineHeight = Math.max(window.innerHeight, viewport.height)
      publish(Math.min(baselineHeight, visibleBottom), 0)
      return
    }

    const baselineInset = baselineHeight - visibleBottom
    const layoutInset = window.innerHeight - visibleBottom
    const rawKeyboardHeight = Math.max(0, Math.round(Math.max(baselineInset, layoutInset)))
    const keyboardHeight =
      rawKeyboardHeight >= KEYBOARD_OPEN_THRESHOLD_PX ? rawKeyboardHeight : 0

    publish(appHeight, keyboardHeight)
  }

  const scheduleMeasure = () => {
    if (rafId !== null) cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(() => {
      rafId = null
      measure()
    })

    if (settleTimer !== null) window.clearTimeout(settleTimer)
    settleTimer = window.setTimeout(() => {
      settleTimer = null
      measure()
    }, SETTLE_REMEASURE_MS)
  }

  viewport.addEventListener('resize', scheduleMeasure)
  viewport.addEventListener('scroll', scheduleMeasure)
  window.addEventListener('resize', scheduleMeasure)
  document.addEventListener('focusin', scheduleMeasure)
  document.addEventListener('focusout', scheduleMeasure)

  scheduleMeasure()

  return () => {
    viewport.removeEventListener('resize', scheduleMeasure)
    viewport.removeEventListener('scroll', scheduleMeasure)
    window.removeEventListener('resize', scheduleMeasure)
    document.removeEventListener('focusin', scheduleMeasure)
    document.removeEventListener('focusout', scheduleMeasure)
    if (rafId !== null) cancelAnimationFrame(rafId)
    if (settleTimer !== null) window.clearTimeout(settleTimer)
    clearViewportMetrics()
    setInset(0)
  }
}
