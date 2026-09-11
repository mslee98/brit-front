import type { StackflowPlugin } from '@stackflow/core'

import type { BottomNavStackTop } from '../../shared/constants/app-layout'

let topActivity: BottomNavStackTop = null
const listeners = new Set<() => void>()

function syncTopActivity(actions: { getStack: () => { activities: Array<{ name: string; params: unknown }> } }) {
  const top = actions.getStack().activities.at(-1)
  topActivity = top
    ? {
        name: top.name,
        params: top.params as Record<string, unknown> | undefined,
      }
    : null
  listeners.forEach((listener) => listener())
}

export function subscribeTopActivity(onStoreChange: () => void) {
  listeners.add(onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
  }
}

export function getTopActivitySnapshot(): BottomNavStackTop {
  return topActivity
}

export function bottomNavChromePlugin(): StackflowPlugin {
  return () => ({
    key: 'plugin-bottom-nav-chrome',
    onInit({ actions }) {
      syncTopActivity(actions)
    },
    onChanged({ actions }) {
      syncTopActivity(actions)
    },
  })
}
