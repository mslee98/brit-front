/**
 * NotificationCenterActivity — 서버 Inbox 알림 목록 (날짜별 묶음 · 필터 · 모두 읽음)
 *
 * @see docs/domains/notifications.md
 */
import type { ActivityComponentType } from '@stackflow/react'
import { Text, VStack } from '@seed-design/react'
import { List } from 'seed-design/ui/list'

import { ActivityScreenLayout } from '../app/layouts/ActivityScreenLayout'
import { NotificationItem } from '../features/notifications/components/NotificationItem'
import { NotificationItemMenuSheet } from '../features/notifications/components/NotificationItemMenuSheet'
import { useNotificationCenterScreen } from '../features/notifications/hooks/useNotificationCenterScreen'
import { BottomActionButton } from '../shared/ui/BottomActionButton'
import { FilterChips } from '../shared/ui/FilterChips'
import '../features/notifications/notification-center.css'

const NotificationCenterActivity: ActivityComponentType<'NotificationCenter'> = () => {
  const screen = useNotificationCenterScreen()

  return (
    <ActivityScreenLayout
      title="알림"
      right={
        <button
          type="button"
          className="noti-header-action"
          disabled={screen.unreadCount === 0}
          onClick={() => void screen.handleMarkAllRead()}
        >
          <Text
            textStyle="t4Medium"
            color={screen.unreadCount === 0 ? 'fg.disabled' : 'fg.neutralMuted'}
          >
            모두 읽음
          </Text>
        </button>
      }
    >
      <VStack pt="x3" style={{ paddingBottom: 'var(--app-content-bottom-padding)' }}>
        <VStack px="spacingX.globalGutter">
          <FilterChips
            items={screen.filterItems}
            value={screen.filter}
            onChange={screen.setFilter}
            aria-label="알림 필터"
          />
        </VStack>

        {screen.loading && screen.items.length === 0 ? (
          <VStack px="spacingX.globalGutter" py="x6">
            <Text textStyle="t4Regular" color="fg.neutralSubtle">
              불러오는 중…
            </Text>
          </VStack>
        ) : screen.items.length === 0 ? (
          <VStack align="center" gap="x1" px="spacingX.globalGutter" py="x16">
            <Text textStyle="t5Bold" color="fg.neutral">
              {screen.emptyCopy.title}
            </Text>
            <Text textStyle="t4Regular" color="fg.neutralSubtle" align="center">
              {screen.emptyCopy.detail}
            </Text>
          </VStack>
        ) : (
          <>
            {screen.groups.map((group) => (
              <section key={group.key} aria-label={group.label}>
                <VStack px="spacingX.globalGutter" pt="x4" pb="x1">
                  <Text textStyle="t3Bold" color="fg.neutralSubtle">
                    {group.label}
                  </Text>
                </VStack>
                <List>
                  {group.items.map((item) => (
                    <NotificationItem
                      key={item.recipientNotificationId}
                      item={item}
                      now={screen.now}
                      onClick={(target) => void screen.handleItemClick(target)}
                      onMoreClick={screen.openItemMenu}
                    />
                  ))}
                </List>
              </section>
            ))}
            {screen.hasMore && (
              <VStack px="spacingX.globalGutter" pt="x4">
                <BottomActionButton
                  size="medium"
                  variant="neutralWeak"
                  loading={screen.loadingMore}
                  onClick={() => void screen.loadMore()}
                >
                  더 보기
                </BottomActionButton>
              </VStack>
            )}
          </>
        )}
      </VStack>
      <NotificationItemMenuSheet
        item={screen.menuItem}
        onOpenChange={screen.handleMenuOpenChange}
        onArchive={screen.handleArchiveMenuItem}
      />
    </ActivityScreenLayout>
  )
}

export default NotificationCenterActivity
