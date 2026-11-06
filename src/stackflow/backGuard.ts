import { useActivity } from '@stackflow/react'
import { parse } from 'flatted'
import { useEffect, useRef } from 'react'

import { logNavigation } from './navigationLog'
import { getLiveActivities } from './plugins/stackSnapshotPlugin'

/** @stackflow/plugin-history-sync serializeState 태그 */
const HISTORY_SYNC_STATE_TAG = '@stackflow/plugin-history-sync'

/**
 * 하드웨어·브라우저 뒤로가기 가드.
 *
 * historySync는 popstate를 받으면 onBeforePop 없이 바로 Popped를 dispatch한다.
 * 그래서 history 라이브러리보다 먼저 popstate를 받아, 최상단 Activity에 가드가 있으면
 * 이벤트를 멈추고 한 칸 앞으로 되돌린 뒤 가드를 실행한다.
 *
 * 앱 내부 pop(actions.pop)은 Popped가 먼저 반영된 뒤 history-sync가 history.back()을 부른다.
 * 그 popstate의 대상은 새 최상단이므로, 대상 id가 최상단보다 아래일 때만 가로챈다.
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

/**
 * history-sync가 history state에 직렬화한 대상 Activity id. 해석 불가면 null.
 * state 형식(`usr._TAG`, flatted `flattedState`)은 plugin-history-sync 1.11.x 내부 구현이라 업그레이드 시 확인한다.
 */
function readTargetActivityId(state: unknown): string | null {
  const usr = (state as { usr?: { _TAG?: unknown; flattedState?: unknown } } | null)?.usr
  if (usr?._TAG !== HISTORY_SYNC_STATE_TAG || typeof usr.flattedState !== 'string') return null
  try {
    const parsed = parse(usr.flattedState) as { activity?: { id?: unknown } } | null
    return typeof parsed?.activity?.id === 'string' ? parsed.activity.id : null
  } catch {
    return null
  }
}

function handlePopState(event: PopStateEvent) {
  const top = getLiveActivities().at(-1)
  const targetId = readTargetActivityId(event.state)

  if (ignoreNextPopState) {
    clearIgnoreFlag()
    // go(1) 복귀는 가드 화면 자신으로 돌아온다. 다른 곳이면 실제 이동이므로 통과
    if (!targetId || targetId === top?.id) {
      event.stopImmediatePropagation()
      return
    }
  }

  const guard = top ? guards.get(top.id) : undefined
  if (!guard || !top) return
  // 앱 내부 pop은 스택이 먼저 바뀌어 대상이 이미 최상단(가드 화면)이다.
  // 여기서 가로채면 history 라이브러리가 이벤트를 못 받아 history-sync 큐가 멈춘다.
  // 사용자가 가드 화면에서 더 아래로 가려는 경우(대상 id < 최상단 id)만 가로챈다.
  if (targetId && targetId >= top.id) return

  logNavigation('guard-intercept', { activity: top.name })
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
