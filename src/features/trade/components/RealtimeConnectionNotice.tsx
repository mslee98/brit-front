/**
 * RealtimeConnectionNotice — 실시간 연결이 잠시 이상 끊겼을 때만 보이는 안내.
 * 다시 연결되면 화면은 resync로 조용히 맞춰지고 안내는 사라진다.
 */
import { IconArrowClockwiseCircularLine } from '@karrotmarket/react-monochrome-icon'
import { VStack } from '@seed-design/react'
import { Callout } from 'seed-design/ui/callout'

import { useRealtimeConnectionUnstable } from '../realtime/realtimeSync'

export const REALTIME_RECONNECTING_COPY = '연결이 잠시 불안정해요. 다시 연결하는 중이에요.'

export function RealtimeConnectionNotice() {
  const unstable = useRealtimeConnectionUnstable()
  if (!unstable) return null

  return (
    <VStack px="spacingX.globalGutter" pt="x3" shrink={0} role="status">
      <Callout
        tone="warning"
        prefixIcon={<IconArrowClockwiseCircularLine />}
        description={REALTIME_RECONNECTING_COPY}
      />
    </VStack>
  )
}
