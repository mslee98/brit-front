/**
 * Android Chromium VirtualKeyboard overlay — boundingRect.height를 그대로 사용.
 */
export function setupVirtualKeyboardInset(setInset: (value: number) => void): () => void {
  const virtualKeyboard = navigator.virtualKeyboard
  if (!virtualKeyboard) {
    setInset(0)
    return () => undefined
  }

  try {
    virtualKeyboard.overlaysContent = true
  } catch {
    // 미지원·정책 제한 — geometrychange만 시도
  }

  const handleGeometryChange = () => {
    const height = Math.max(0, Math.round(virtualKeyboard.boundingRect.height))
    setInset(height)
  }

  virtualKeyboard.addEventListener('geometrychange', handleGeometryChange)
  handleGeometryChange()

  return () => {
    virtualKeyboard.removeEventListener('geometrychange', handleGeometryChange)
    setInset(0)
  }
}
