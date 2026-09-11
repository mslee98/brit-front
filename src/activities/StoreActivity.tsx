/**
 * StoreActivity — Brit 스토어 플레이스홀더 (푸시 전용, 하단 탭 없음).
 */
import type { ActivityComponentType } from '@stackflow/react'

import { ActivityScreenLayout } from '../app/layouts/ActivityScreenLayout'
import { DiscoveryDetailScreen } from '../features/discovery/components/DiscoveryDetailScreen'

const StoreActivity: ActivityComponentType<'Store'> = () => {
  return (
    <ActivityScreenLayout title="Brit 스토어" bottomCTABehavior="fixed">
      <DiscoveryDetailScreen variant="store" />
    </ActivityScreenLayout>
  )
}

export default StoreActivity
