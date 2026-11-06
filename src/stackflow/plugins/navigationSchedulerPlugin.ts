import type { StackflowPlugin } from '@stackflow/core'

import { logNavigation } from '../navigationLog'

/**
 * 화면 전환(enter/exit 애니메이션) 중에 들어온 이동을 전환이 끝난 뒤로 미룬다.
 *
 * Seed AppScreen 전환은 최상단 Activity의 transitionState 변화로 인라인 transform을 건다.
 * 전환이 겹치면 진행 중 애니메이션이 취소되고 도착 화면이 임시 위치에 남을 수 있어,
 * 사용자가 누른 이동이 반영되지 않은 것처럼 보인다.
 *
 * - push·replace: 이 플러그인의 onBefore 훅에서 막고 큐에 넣는다.
 * - pop: 막으면 안 된다. 다른 플러그인 훅은 계속 실행되어 history-sync가
 *   history.back()을 예약해 URL만 뒤로 간다. 호출부에서 `runWhenStackIdle`로 미룬다.
 */

type Task = { key?: string; run: () => void }

let transitioning = false
let flushing = false
const queue: Task[] = []

export function isStackTransitioning(): boolean {
  return transitioning || queue.length > 0
}

/**
 * 전환 중이면 끝난 뒤 실행한다. key가 같은 작업은 하나만 대기한다
 * (전환 중 뒤로가기 연타가 여러 화면을 닫지 않도록).
 */
export function runWhenStackIdle(run: () => void, key?: string): void {
  if (!isStackTransitioning() || flushing) {
    run()
    return
  }
  if (key && queue.some((task) => task.key === key)) {
    logNavigation('drop-duplicate', { key })
    return
  }
  logNavigation('defer', { key })
  queue.push({ key, run })
}

function flush() {
  if (transitioning || flushing) return
  const task = queue.shift()
  if (!task) return
  flushing = true
  try {
    task.run()
  } finally {
    flushing = false
  }
  // 실행한 작업이 새 전환을 시작하면 남은 작업은 다음 idle에서 이어간다
  if (!transitioning && queue.length > 0) queueMicrotask(flush)
}

export function navigationSchedulerPlugin(): StackflowPlugin {
  return () => ({
    key: 'plugin-navigation-scheduler',
    onInit({ actions }) {
      transitioning = actions.getStack().globalTransitionState === 'loading'
    },
    onChanged({ actions }) {
      const next = actions.getStack().globalTransitionState === 'loading'
      const becameIdle = transitioning && !next
      transitioning = next
      if (becameIdle && queue.length > 0) queueMicrotask(flush)
    },
    onBeforePush({ actionParams, actions: { preventDefault, push } }) {
      logNavigation('push', { activity: actionParams.activityName })
      if (flushing || !isStackTransitioning()) return
      preventDefault()
      runWhenStackIdle(() => push(actionParams))
    },
    onBeforeReplace({ actionParams, actions: { preventDefault, replace } }) {
      logNavigation('replace', { activity: actionParams.activityName })
      if (flushing || !isStackTransitioning()) return
      preventDefault()
      runWhenStackIdle(() => replace(actionParams))
    },
    onBeforePop({ actions }) {
      logNavigation('pop', { from: actions.getStack().activities.find((a) => a.isTop)?.name })
    },
  })
}
