/**
 * 입력 필드가 Visual Viewport(키보드 위 영역) 안에 보이는지.
 * 가려질 때만 scrollIntoView 보조에 사용.
 */
export function isElementVisibleAboveKeyboard(
  element: HTMLElement,
  bottomPaddingPx = 16,
): boolean {
  const viewport = window.visualViewport
  if (!viewport) return true

  const rect = element.getBoundingClientRect()
  const visibleTop = viewport.offsetTop
  const visibleBottom = viewport.offsetTop + viewport.height

  return rect.top >= visibleTop && rect.bottom <= visibleBottom - bottomPaddingPx
}

export function ensureInputVisibleAboveKeyboard(
  element: HTMLElement,
  delayMs = 250,
): void {
  window.setTimeout(() => {
    if (isElementVisibleAboveKeyboard(element)) return
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, delayMs)
}
