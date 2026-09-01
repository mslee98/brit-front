/**
 * Nest HTTP vs mock.
 * `VITE_USE_MOCK=true`일 때만 mock. URL 유무로 판단하지 않는다.
 */
export function shouldUseHttpApi(): boolean {
  return import.meta.env.VITE_USE_MOCK !== 'true'
}
