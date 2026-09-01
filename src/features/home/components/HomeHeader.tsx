import { IconBellLine } from '@karrotmarket/react-monochrome-icon'
import {
  HStack,
  Icon,
  NotificationBadge,
  NotificationBadgePositioner,
} from '@seed-design/react'
import {
  AppBar,
  AppBarIconButton,
  AppBarLeft,
  AppBarRight,
} from 'seed-design/ui/app-bar'

import LogoBrit from '../../../assets/icons/brand/logo-brit.svg?react'
import { actions } from '../../../stackflow/stackflow'

interface HomeHeaderProps {
  unreadNotificationCount?: number
}

function formatNotificationBadgeLabel(count: number): string {
  if (count > 9) return '9+'
  return String(count)
}

/** 홈 Root Top Navigation — 로고 왼쪽, 알림 오른쪽 */
export function HomeHeader({ unreadNotificationCount = 0 }: HomeHeaderProps) {
  const hasUnreadNotification = unreadNotificationCount > 0
  const showCountBadge = unreadNotificationCount > 1

  return (
    <AppBar>
      <AppBarLeft>
        <LogoBrit className="home-header__logo" aria-label="Brit" role="img" />
      </AppBarLeft>
      <AppBarRight>
        <AppBarIconButton
          aria-label={hasUnreadNotification ? '읽지 않은 알림 있음' : '알림'}
          type="button"
          onClick={() => actions.push('NotificationCenter', {}, { animate: true })}
        >
          <HStack position="relative" align="flex-start">
            <Icon svg={<IconBellLine />} size="x5" color="fg.neutralSubtle" />
            {hasUnreadNotification && (
              <NotificationBadgePositioner
                size={showCountBadge ? 'large' : 'small'}
                attach="icon"
              >
                {showCountBadge ? (
                  <NotificationBadge size="large">
                    {formatNotificationBadgeLabel(unreadNotificationCount)}
                  </NotificationBadge>
                ) : (
                  <NotificationBadge size="small" />
                )}
              </NotificationBadgePositioner>
            )}
          </HStack>
        </AppBarIconButton>
      </AppBarRight>
    </AppBar>
  )
}
