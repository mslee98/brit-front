/**
 * NotificationCenterActivity — 서버 Inbox 알림 목록
 */
import type { ActivityComponentType } from '@stackflow/react'
import { Text, VStack } from '@seed-design/react'
import { List, ListButtonItem } from 'seed-design/ui/list'

import { ActivityScreenLayout } from '../app/layouts/ActivityScreenLayout'
import { useNotificationCenterScreen } from '../features/notifications/hooks/useNotificationCenterScreen'
import { BottomActionButton } from '../shared/ui/BottomActionButton'

const NotificationCenterActivity: ActivityComponentType<'NotificationCenter'> = () => {
  const screen = useNotificationCenterScreen()

  return (
    <ActivityScreenLayout title="알림">
      <VStack
        px="spacingX.globalGutter"
        pt="x4"
        gap="x4"
        style={{ paddingBottom: 'var(--app-content-bottom-padding)' }}
      >
        {screen.items.some((item) => !item.isRead) && (
          <BottomActionButton
            size="medium"
            variant="neutralWeak"
            onClick={() => void screen.handleMarkAllRead()}
          >
            모두 읽음
          </BottomActionButton>
        )}
        {screen.loading ? (
          <Text textStyle="t4Regular" color="fg.neutralSubtle">
            불러오는 중…
          </Text>
        ) : screen.items.length === 0 ? (
          <Text textStyle="t4Regular" color="fg.neutralSubtle">
            알림이 없어요
          </Text>
        ) : (
          <List>
            {screen.items.map((item) => (
              <ListButtonItem
                key={item.recipientNotificationId}
                title={item.title}
                detail={item.body}
                onClick={() => void screen.handleItemClick(item)}
              />
            ))}
          </List>
        )}
        {!screen.loading && screen.items.length > 0 && (
          <Text textStyle="t3Regular" color="fg.neutralMuted">
            알림을 누르면 해당 화면으로 이동해요
          </Text>
        )}
      </VStack>
    </ActivityScreenLayout>
  )
}

export default NotificationCenterActivity
