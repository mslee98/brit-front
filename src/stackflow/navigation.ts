import { navigateToRootHome } from './navigateToRootHome'
import { runWhenStackIdle } from './plugins/navigationSchedulerPlugin'
import { getLiveActivityNames } from './plugins/stackSnapshotPlugin'
import { actions } from './stackflow'

/**
 * 뒤로·닫기 공통 규칙.
 * - 도착지는 항상 바로 아래 Activity (스와이프·하드웨어 뒤로와 동일)
 * - 스택 첫 화면(새로고침·딥링크 진입)이면 Home으로 대체
 * - 화면 전환 중에 누르면 전환이 끝난 뒤 한 번만 실행한다
 *
 * @see docs/stackflow/README.md — 화면 역할
 */

/** 필수 params 없이 복귀 가능한 허브·루트 */
export type ExitTarget = 'Home' | 'Market'

export const BACK_INTENT_KEY = 'back'

export function goBack(): void {
  runWhenStackIdle(() => {
    const names = getLiveActivityNames()
    if (names.length > 1) {
      actions.pop()
      return
    }
    navigateToRootHome(names.length)
  }, BACK_INTENT_KEY)
}

/**
 * 아래쪽에서 가장 가까운 `target`까지 pop. 없으면 현재 화면을 target으로 replace.
 * Home이 target인데 스택에 없으면 루트 Home으로 정리한다.
 */
export function exitTo(target: ExitTarget): void {
  runWhenStackIdle(() => {
    const names = getLiveActivityNames()
    const topIndex = names.length - 1
    for (let index = topIndex - 1; index >= 0; index -= 1) {
      if (names[index] === target) {
        actions.pop(topIndex - index, { animate: true })
        return
      }
    }
    if (target === 'Home') {
      navigateToRootHome(names.length)
      return
    }
    actions.replace(target, {}, { animate: true })
  }, BACK_INTENT_KEY)
}
