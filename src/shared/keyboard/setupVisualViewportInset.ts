import { VISUAL_VIEWPORT_HEIGHT_CSS_VAR } from './keyboardCssVars'

const MIN_KEYBOARD_INSET_PX = 80
const FOCUS_REMEASURE_MS = 300

function isEditableElement(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) return false
  return element.matches("input, textarea, select, [contenteditable='true']")
}

/**
 * iOS / Android fallback — VisualViewport + baseline 보정.
 * focus 지연 재측정으로 키보드 애니메이션 종료 후 값을 잡는다.
 */
export function setupVisualViewportInset(
  setInset: (value: number) => void,
  options?: { syncVisualViewportHeight?: boolean },
): () => void {
  const viewport = window.visualViewport
  if (!viewport) {
    setInset(0)
    return () => undefined
  }

  const syncVvHeight = options?.syncVisualViewportHeight === true

  let baselineHeight = Math.max(window.innerHeight, viewport.height)
  let baselineWidth = window.innerWidth
  let rafId: number | null = null
  let delayedTimer: number | null = null

  const applyVisualViewportHeight = () => {
    if (!syncVvHeight) return
    const height = Math.round(viewport.height)
    document.documentElement.style.setProperty(VISUAL_VIEWPORT_HEIGHT_CSS_VAR, `${height}px`)
  }

  const clearVisualViewportHeight = () => {
    if (!syncVvHeight) return
    document.documentElement.style.removeProperty(VISUAL_VIEWPORT_HEIGHT_CSS_VAR)
  }

  const measure = () => {
    const activeElement = document.activeElement
    const isInputFocused = isEditableElement(activeElement)

    const widthChanged = Math.abs(window.innerWidth - baselineWidth) > 40
    if (widthChanged) {
      baselineWidth = window.innerWidth
      baselineHeight = Math.max(window.innerHeight, viewport.height)
    }

    applyVisualViewportHeight()

    if (!isInputFocused) {
      baselineHeight = Math.max(window.innerHeight, viewport.height)
      setInset(0)
      return
    }

    const visibleBottom = viewport.height + viewport.offsetTop
    const baselineInset = baselineHeight - visibleBottom
    const layoutInset = window.innerHeight - viewport.height - viewport.offsetTop
    const inset = Math.max(0, Math.round(Math.max(baselineInset, layoutInset)))

    // 주소창·미세 흔들림은 키보드로 보지 않음
    setInset(inset >= MIN_KEYBOARD_INSET_PX ? inset : 0)
  }

  const scheduleMeasure = () => {
    if (rafId !== null) cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(() => {
      rafId = null
      measure()
    })
  }

  const handleFocusIn = () => {
    scheduleMeasure()
    if (delayedTimer !== null) window.clearTimeout(delayedTimer)
    delayedTimer = window.setTimeout(scheduleMeasure, FOCUS_REMEASURE_MS)
  }

  const handleFocusOut = () => {
    scheduleMeasure()
    if (delayedTimer !== null) window.clearTimeout(delayedTimer)
    delayedTimer = window.setTimeout(() => {
      baselineHeight = Math.max(window.innerHeight, viewport.height)
      setInset(0)
      applyVisualViewportHeight()
    }, FOCUS_REMEASURE_MS)
  }

  viewport.addEventListener('resize', scheduleMeasure)
  viewport.addEventListener('scroll', scheduleMeasure)
  window.addEventListener('resize', scheduleMeasure)
  document.addEventListener('focusin', handleFocusIn)
  document.addEventListener('focusout', handleFocusOut)

  applyVisualViewportHeight()
  scheduleMeasure()

  return () => {
    viewport.removeEventListener('resize', scheduleMeasure)
    viewport.removeEventListener('scroll', scheduleMeasure)
    window.removeEventListener('resize', scheduleMeasure)
    document.removeEventListener('focusin', handleFocusIn)
    document.removeEventListener('focusout', handleFocusOut)
    if (rafId !== null) cancelAnimationFrame(rafId)
    if (delayedTimer !== null) window.clearTimeout(delayedTimer)
    clearVisualViewportHeight()
    setInset(0)
  }
}
