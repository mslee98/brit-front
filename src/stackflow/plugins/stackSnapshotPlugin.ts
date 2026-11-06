import type { Stack, StackflowPlugin } from '@stackflow/core'

export interface LiveActivity {
  id: string
  name: string
}

/** 퇴장 중·퇴장 완료를 뺀 현재 스택 (아래 → 위) */
let liveActivities: LiveActivity[] = []

export function getLiveActivities(): readonly LiveActivity[] {
  return liveActivities
}

export function getLiveActivityNames(): readonly string[] {
  return liveActivities.map((activity) => activity.name)
}

export function stackSnapshotPlugin(): StackflowPlugin {
  const sync = (actions: { getStack: () => Stack }) => {
    liveActivities = actions
      .getStack()
      .activities.filter(
        (activity) =>
          activity.transitionState === 'enter-active' ||
          activity.transitionState === 'enter-done',
      )
      .map((activity) => ({ id: activity.id, name: activity.name }))
  }

  return () => ({
    key: 'plugin-stack-snapshot',
    onInit({ actions }) {
      sync(actions)
    },
    onChanged({ actions }) {
      sync(actions)
    },
  })
}
