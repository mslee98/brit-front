/**
 * NotificationSettingsActivity — 이 기기 Web Push 구독·권한
 */
import type { ActivityComponentType } from '@stackflow/react'
import { Text, VStack } from '@seed-design/react'
import { Callout } from 'seed-design/ui/callout'
import { List, ListItem } from 'seed-design/ui/list'

import { ActivityScreenLayout } from '../../app/layouts/ActivityScreenLayout'
import {
  NOTIFICATION_SETTINGS_COPY,
  PUSH_IOS_INSTALL_COPY,
} from '../../features/pwa/constants/pushNotificationCopy'
import { useNotificationSettingsScreen } from '../../features/pwa/hooks/usePushNotification'
import { BottomActionButton } from '../../shared/ui/BottomActionButton'

function eligibilityLabel(
  eligibility: ReturnType<typeof useNotificationSettingsScreen>['eligibility'],
): string {
  switch (eligibility) {
    case 'ready':
      return '구독됨'
    case 'denied':
      return '권한 거절'
    case 'ios_install_required':
      return '홈 화면 추가 필요'
    case 'unsupported':
      return '지원 안 함'
    default:
      return '미구독'
  }
}

const NotificationSettingsActivity: ActivityComponentType<'NotificationSettings'> = () => {
  const screen = useNotificationSettingsScreen()

  return (
    <ActivityScreenLayout title={NOTIFICATION_SETTINGS_COPY.title}>
      <VStack
        px="spacingX.globalGutter"
        pt="x4"
        gap="x6"
        style={{ paddingBottom: 'var(--app-content-bottom-padding)' }}
      >
        <VStack gap="x3">
          <Text textStyle="t5Bold" color="fg.neutral">
            이 기기
          </Text>
          <List>
            <ListItem title="알림 지원" detail={eligibilityLabel(screen.eligibility)} />
            <ListItem
              title="브라우저 권한"
              detail={
                typeof Notification !== 'undefined' ? Notification.permission : '-'
              }
            />
          </List>
        </VStack>

        {screen.eligibility === 'ios_install_required' && (
          <Callout
            tone="informative"
            title={PUSH_IOS_INSTALL_COPY.title}
            description={PUSH_IOS_INSTALL_COPY.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}
          />
        )}

        {screen.eligibility === 'denied' && (
          <Callout tone="warning" description={NOTIFICATION_SETTINGS_COPY.permissionDenied} />
        )}

        {screen.eligibility === 'unsupported' && (
          <Callout tone="warning" description={NOTIFICATION_SETTINGS_COPY.unsupported} />
        )}

        {screen.eligibility === 'ready' && (
          <Text textStyle="t3Regular" color="fg.neutralMuted">
            {NOTIFICATION_SETTINGS_COPY.subscribed}
          </Text>
        )}

        <VStack gap="x3">
          {(screen.eligibility === 'default' || screen.eligibility === 'denied') && (
            <BottomActionButton
              size="medium"
              onClick={() => void screen.handleEnable()}
              disabled={screen.busy || screen.eligibility === 'denied'}
            >
              {NOTIFICATION_SETTINGS_COPY.enableCta}
            </BottomActionButton>
          )}
          {screen.eligibility === 'ready' && (
            <>
              {import.meta.env.DEV && (
                <BottomActionButton
                  size="medium"
                  variant="neutralWeak"
                  onClick={() => void screen.handleTest()}
                  disabled={screen.busy}
                >
                  {NOTIFICATION_SETTINGS_COPY.testCta}
                </BottomActionButton>
              )}
              <BottomActionButton
                size="medium"
                variant="neutralWeak"
                onClick={() => void screen.handleDisable()}
                disabled={screen.busy}
              >
                {NOTIFICATION_SETTINGS_COPY.disableCta}
              </BottomActionButton>
            </>
          )}
        </VStack>
      </VStack>
    </ActivityScreenLayout>
  )
}

export default NotificationSettingsActivity
