import { useActivity } from '@stackflow/react'
import { useEffect, useRef } from 'react'

import { getLiveActivities } from './plugins/stackSnapshotPlugin'

/**
 * 하드웨어·브라우저 뒤로가기 가드.
 *
 * historySync는 popstate를 받으면 onBeforePop 없이 바로 Popped를 dispatch한다.
 * 그래서 history 라이브러리보다 먼저 popstate를 받아, 최상단 Activity에 가드가 있으면
 * 이벤트를 멈추고 한 칸 앞으로 되돌린 뒤 가드를 실행한다.
 *
 * 앱 내부 pop(actions.pop)은 Popped가 먼저 반영되어 popstate 시점의 최상단이 이미 바뀌어 있으므로
 * 가로채지 않는다.
 */

const guards = new Map<string, () => void>()
/** go(1)이 popstate를 내지 않으면(앞 항목 없음 등) 다음 실제 뒤로가기를 삼키지 않도록 풀어 준다 */
const RESTORE_POPSTATE_TIMEOUT_MS = 500
let ignoreNextPopState = false
let ignoreResetTimer: ReturnType<typeof setTimeout> | undefined
let installed = false

function clearIgnoreFlag() {
  ignoreNextPopState = false
  if (ignoreResetTimer !== undefined) {
    clearTimeout(ignoreResetTimer)
    ignoreResetTimer = undefined
  }
}

function handlePopState(event: PopStateEvent) {
  if (ignoreNextPopState) {
    clearIgnoreFlag()
    event.stopImmediatePropagation()
    return
  }
  const top = getLiveActivities().at(-1)
  const guard = top ? guards.get(top.id) : undefined
  if (!guard) return

  event.stopImmediatePropagation()
  ignoreNextPopState = true
  ignoreResetTimer = setTimeout(clearIgnoreFlag, RESTORE_POPSTATE_TIMEOUT_MS)
  window.history.go(1)
  guard()
}

/** history 라이브러리의 popstate 리스너보다 먼저 등록돼야 한다 (appHistory 생성 전 호출). */
export function installBackGuardListener(): void {
  if (installed || typeof window === 'undefined') return
  installed = true
  window.addEventListener('popstate', handlePopState)
}

/**
 * enabled인 동안 이 Activity가 최상단일 때 하드웨어·브라우저 뒤로가기를 onBack으로 돌린다.
 * 헤더 버튼·스와이프는 각 화면이 직접 처리한다.
 */
export function useBackGuard(enabled: boolean, onBack: () => void): void {
  const { id } = useActivity()
  const onBackRef = useRef(onBack)

  useEffect(() => {
    onBackRef.current = onBack
  }, [onBack])

  useEffect(() => {
    if (!enabled) return
    guards.set(id, () => onBackRef.current())
    return () => {
      guards.delete(id)
    }
  }, [enabled, id])
}
