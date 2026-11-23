import { actions } from './stackflow'

/**
 * 로그아웃 후 스택을 루트 Login으로 정리합니다.
 * `replace('Login')`만 하면 My·AccountSettings 등 인증 화면 depth가 남아
 * 헤더 뒤로가기로 세션 없는 이전 Activity에 진입할 수 있습니다.
 *
 * @see navigateToRootHome — 로그인 성공 시 대칭 패턴
 */
export function navigateToRootLogin(
  activityCount: number,
  options?: { animate?: boolean },
) {
  const popCount = Math.max(0, activityCount - 1)
  if (popCount > 0) {
    actions.pop(popCount, { animate: false })
  }
  actions.replace('Login', {}, { animate: options?.animate ?? true })
}
