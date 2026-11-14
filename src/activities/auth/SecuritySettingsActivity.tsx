/**
 * SecuritySettingsActivity — 패스키·로그인 기기(세션) 관리
 */
import type { ActivityComponentType } from '@stackflow/react'
import { Text, VStack } from '@seed-design/react'
import { List, ListButtonItem, ListItem } from 'seed-design/ui/list'

import { ActivityScreenLayout } from '../../app/layouts/ActivityScreenLayout'
import { useSecuritySettingsScreen } from '../../features/auth/hooks/useSecuritySettingsScreen'
import {
  formatSessionDetail,
  guessDeviceName,
} from '../../features/auth/utils/deviceLabel'
import { BottomActionButton } from '../../shared/ui/BottomActionButton'

const SecuritySettingsActivity: ActivityComponentType<'SecuritySettings'> = () => {
  const screen = useSecuritySettingsScreen()

  return (
    <ActivityScreenLayout title="로그인 및 보안">
      <VStack
        px="spacingX.globalGutter"
        pt="x4"
        gap="x6"
        style={{ paddingBottom: 'var(--app-content-bottom-padding)' }}
      >
        <VStack gap="x3">
          <Text textStyle="t5Bold" color="fg.neutral">
            패스키
          </Text>
          <Text textStyle="t3Regular" color="fg.neutralMuted">
            기기마다 패스키를 추가하면 하나를 잃어도 로그인할 수 있어요.
          </Text>
          {screen.loading ? (
            <Text textStyle="t4Regular" color="fg.neutralSubtle">
              불러오는 중…
            </Text>
          ) : (
            <List>
              {screen.passkeys.map((pk) => (
                <ListButtonItem
                  key={pk.id}
                  title={pk.friendlyName}
                  detail={pk.lastUsedAt ? '최근 사용함' : '등록됨'}
                  onClick={() => void screen.handleDeletePasskey(pk.id)}
                />
              ))}
              {screen.passkeys.length === 0 && (
                <ListItem title="등록된 패스키 없음" detail="아래에서 추가해 주세요" />
              )}
            </List>
          )}
          <BottomActionButton
            size="medium"
            variant="neutralWeak"
            loading={screen.busy}
            onClick={() => void screen.handleAddPasskey()}
          >
            새 패스키 추가
          </BottomActionButton>
          {screen.passkeys.length === 1 && (
            <Text textStyle="t3Regular" color="fg.neutralMuted">
              패스키가 1개예요. 다른 기기에도 추가해 두면 좋아요해요.
            </Text>
          )}
        </VStack>

        <VStack gap="x3">
          <Text textStyle="t5Bold" color="fg.neutral">
            로그인 기기
          </Text>
          <Text textStyle="t3Regular" color="fg.neutralMuted">
            지금 로그인된 기기와 IP예요. 모르는 항목이 있으면 종료해 주세요.
          </Text>
          {screen.loading ? (
            <Text textStyle="t4Regular" color="fg.neutralSubtle">
              불러오는 중…
            </Text>
          ) : screen.sessions.length === 0 ? (
            <List>
              <ListItem title="활성 세션 없음" detail="다시 로그인해 주세요" />
            </List>
          ) : (
            <List>
              {screen.sessions.map((s) => {
                const title =
                  s.deviceName?.trim() ||
                  guessDeviceName(s.userAgent) ||
                  (s.isCurrent ? '이 기기' : '다른 기기')
                return (
                  <ListButtonItem
                    key={s.id}
                    title={s.isCurrent ? `${title} (이 기기)` : title}
                    detail={
                      s.isCurrent
                        ? `${formatSessionDetail(s)} · 현재 로그인`
                        : `${formatSessionDetail(s)} · 탭하면 종료`
                    }
                    onClick={() => void screen.handleRevokeSession(s.id, s.isCurrent)}
                  />
                )
              })}
            </List>
          )}
          <BottomActionButton
            size="medium"
            variant="neutralWeak"
            loading={screen.busy}
            onClick={() => void screen.handleRevokeOthers()}
          >
            다른 기기 로그인 종료
          </BottomActionButton>
        </VStack>
      </VStack>
    </ActivityScreenLayout>
  )
}

export default SecuritySettingsActivity
