/**
 * SecuritySettingsActivity — 패스키·세션 관리
 */
import type { ActivityComponentType } from '@stackflow/react'
import { Text, VStack } from '@seed-design/react'
import { List, ListButtonItem, ListItem } from 'seed-design/ui/list'

import { ActivityScreenLayout } from '../../app/layouts/ActivityScreenLayout'
import { useSecuritySettingsScreen } from '../../features/auth/hooks/useSecuritySettingsScreen'
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
            로그인 세션
          </Text>
          <Text textStyle="t3Regular" color="fg.neutralMuted">
            Supabase 클라이언트는 현재 세션 위주로 보여 줘요. 다른 기기 강제 종료는 지원 범위가
            제한될 수 있어요.
          </Text>
          <List>
            {screen.sessions.map((s) => (
              <ListButtonItem
                key={s.id}
                title={s.isCurrent ? '이 기기' : '다른 세션'}
                detail={s.isCurrent ? '현재 로그인' : '탭하면 종료'}
                onClick={() => void screen.handleRevokeSession(s.id, s.isCurrent)}
              />
            ))}
          </List>
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
