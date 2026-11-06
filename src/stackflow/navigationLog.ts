/**
 * DEV 전용 네비게이션 로그. 「눌렀는데 안 넘어감」 재현 시 콘솔에서 `[nav]`로 필터한다.
 * - push/replace/pop: 액션이 Stackflow까지 도달했는지
 * - defer/drop-duplicate: 전환 중이라 미뤄졌는지
 * - guard-*: 하드웨어 뒤로가기 가드가 popstate를 가로챘는지
 */
export function logNavigation(event: string, detail?: Record<string, unknown>): void {
  if (!import.meta.env.DEV) return
  console.debug(`[nav] ${event}`, detail ?? {})
}
