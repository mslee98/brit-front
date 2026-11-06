import { IconDot3VerticalLine } from '@karrotmarket/react-monochrome-icon'
import { Badge, HStack, Icon, Text, VStack } from '@seed-design/react'
import { ListButtonItem } from 'seed-design/ui/list'

import type { NotificationInboxItem } from '../api/notifications.api'
import { getNotificationPresentation } from '../constants/notificationPresentation'
import { formatNotificationMeta, formatNotificationTime } from '../utils/formatNotification'

interface NotificationItemProps {
  item: NotificationInboxItem
  now: Date
  onClick: (item: NotificationInboxItem) => void
  onMoreClick: (item: NotificationInboxItem) => void
}

export function NotificationItem({ item, now, onClick, onMoreClick }: NotificationItemProps) {
  const presentation = getNotificationPresentation(item.type)
  const meta = formatNotificationMeta(item)
  const actionLabel = item.actionState === 'REQUIRED' ? presentation.actionLabel : undefined
  const actionDone = item.actionState === 'DONE'
  const unread = !item.isRead

  return (
    <ListButtonItem
      alignItems="flex-start"
      rootProps={{ className: unread ? 'noti-item noti-item--unread' : 'noti-item' }}
      title={
        <Text textStyle={unread ? 't5Bold' : 't5Regular'} color="fg.neutral" maxLines={1}>
          {item.title}
        </Text>
      }
      prefix={
        <span className="noti-item__icon" data-tone={presentation.tone} aria-hidden>
          <Icon svg={presentation.icon} size="x5" />
        </span>
      }
      detail={
        <VStack gap="x1">
          <Text textStyle="t4Regular" color="fg.neutralMuted">
            {item.body}
          </Text>
          {(meta || actionLabel || actionDone) && (
            <HStack gap="x1_5" wrap align="center">
              {meta && (
                <Text textStyle="t3Regular" color="fg.neutralSubtle">
                  {meta}
                </Text>
              )}
              {actionLabel && (
                <Badge tone="brand" variant="weak" size="medium">
                  {actionLabel}
                </Badge>
              )}
              {actionDone && (
                <Text textStyle="t3Regular" color="fg.neutralSubtle">
                  처리됨
                </Text>
              )}
            </HStack>
          )}
        </VStack>
      }
      suffix={
        <VStack align="flex-end" gap="x1">
          <HStack gap="x1" align="center">
            {unread && <span className="noti-item__dot" aria-label="안 읽음" />}
            <Text textStyle="t3Regular" color="fg.neutralSubtle">
              <time dateTime={item.createdAt}>{formatNotificationTime(item.createdAt, now)}</time>
            </Text>
          </HStack>
          <button
            type="button"
            className="noti-item__more"
            aria-label="알림 관리"
            onClick={() => onMoreClick(item)}
          >
            <Icon svg={<IconDot3VerticalLine />} size="x4" color="fg.neutralSubtle" />
          </button>
        </VStack>
      }
      onClick={() => onClick(item)}
    />
  )
}
