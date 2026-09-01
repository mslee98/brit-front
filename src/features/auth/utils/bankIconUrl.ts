/**
 * brit-api ServeStatic(`/assets`)과 동일한 공개 경로.
 * same-origin(Vite 프록시) 기준. Nest `iconUrl`이 없을 때의 fallback.
 */
export function getBankIconUrl(svgFilename: string): string {
  if (!svgFilename) return ''
  return `/assets/banks/${svgFilename}`
}
