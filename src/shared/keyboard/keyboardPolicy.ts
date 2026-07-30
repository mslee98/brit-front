/** PWA RuntimeEnvironment와 동일 — shared가 features를 의존하지 않도록 로컬 유니온 */
export type KeyboardRuntimeEnvironment = 'ios' | 'android' | 'desktop'

export type KeyboardStrategy =
  | 'virtual-keyboard-overlay'
  | 'visual-viewport'
  | 'none'

export interface KeyboardPolicy {
  strategy: KeyboardStrategy
  enabled: boolean
}

/**
 * OS 판별 → 기본 정책, 기능 감지 → 실제 API.
 * Android라도 VirtualKeyboard 미지원이면 visual-viewport로 폴백.
 */
export function getKeyboardPolicy(
  environment: KeyboardRuntimeEnvironment,
): KeyboardPolicy {
  switch (environment) {
    case 'android':
      return {
        strategy:
          typeof navigator !== 'undefined' && 'virtualKeyboard' in navigator
            ? 'virtual-keyboard-overlay'
            : 'visual-viewport',
        enabled: true,
      }
    case 'ios':
      return {
        strategy: 'visual-viewport',
        enabled: true,
      }
    case 'desktop':
    default:
      return {
        strategy: 'none',
        enabled: false,
      }
  }
}
