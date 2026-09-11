/**
 * CommunityActivity — 커뮤니티 플레이스홀더 (푸시 전용, 하단 탭 없음).
 */
import type { ActivityComponentType } from '@stackflow/react'

import { ActivityScreenLayout } from '../app/layouts/ActivityScreenLayout'
import { DiscoveryDetailScreen } from '../features/discovery/components/DiscoveryDetailScreen'

const CommunityActivity: ActivityComponentType<'Community'> = () => {
  return (
    <ActivityScreenLayout title="커뮤니티" bottomCTABehavior="fixed">
      <DiscoveryDetailScreen variant="community" />
    </ActivityScreenLayout>
  )
}

export default CommunityActivity
