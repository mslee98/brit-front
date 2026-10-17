/**
 * AccountSettingsActivity — 내 정보 요약과 계정 변경 진입.
 * 마이 페이지와 같은 아이콘·텍스트·화살표 리스트를 쓴다.
 */
import type { ReactElement, ReactNode } from 'react'
import type { ActivityComponentType } from '@stackflow/react'
import {
  IconCardLine,
  IconChevronRightLine,
  IconKeyholeShieldLine,
  IconLockLine,
  IconLockOpenedLine,
  IconMobileLine,
  IconPerson2Line,
} from '@karrotmarket/react-monochrome-icon'
import { Icon, VStack } from '@seed-design/react'
import { Avatar } from 'seed-design/ui/avatar'
import { IdentityPlaceholder } from 'seed-design/ui/identity-placeholder'
import { List, ListButtonItem, ListItem } from 'seed-design/ui/list'
import { ListHeader } from 'seed-design/ui/list-header'

import { ActivityScreenLayout } from '../../app/layouts/ActivityScreenLayout'
import { useAccountSettingsScreen } from '../../features/auth/hooks/useAccountSettingsScreen'

const rowIcon = (svg: ReactElement) => (
  <Icon svg={svg} size="x5" color="fg.neutralSubtle" />
)

function rowChevron() {
  return rowIcon(<IconChevronRightLine />)
}

function SettingsRow({
  title,
  detail,
  icon,
  onClick,
}: {
  title: string
  detail?: string
  icon: ReactElement
  onClick: () => void
}) {
  return (
    <ListButtonItem
      title={title}
      detail={detail}
      prefix={rowIcon(icon)}
      suffix={rowChevron()}
      onClick={onClick}
    />
  )
}

function profileDetail(loginId: string, verificationLabel: string): ReactNode {
  const parts = [loginId ? `아이디 ${loginId}` : '', verificationLabel].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : undefined
}

const AccountSettingsActivity: ActivityComponentType<'AccountSettings'> = () => {
  const screen = useAccountSettingsScreen()
  const profileTitle = screen.loading ? '불러오는 중이에요' : screen.nickname || '내 정보'

  return (
    <ActivityScreenLayout title="계정 설정">
      <VStack
        px="spacingX.globalGutter"
        pt="x4"
        gap="x6"
        style={{ paddingBottom: 'var(--app-content-bottom-padding)' }}
      >
        <List>
          <ListItem
            title={profileTitle}
            detail={
              screen.loading
                ? undefined
                : profileDetail(screen.loginId, screen.verificationLabel)
            }
            prefix={<Avatar size="48" fallback={<IdentityPlaceholder />} />}
          />
        </List>

        <VStack gap="x2">
          <ListHeader as="h3" variant="mediumWeak">
            계정 변경
          </ListHeader>
          <List>
            <SettingsRow
              title="로그인 비밀번호 변경"
              detail="현재 비밀번호를 확인한 뒤 바꿔요"
              icon={<IconKeyholeShieldLine />}
              onClick={screen.openChangePassword}
            />
            <SettingsRow
              title="계좌 변경"
              detail="심사 후 반영돼요"
              icon={<IconCardLine />}
              onClick={screen.openChangeBankAccount}
            />
            <SettingsRow
              title="거래 PIN 변경"
              detail="현재 PIN을 확인한 뒤 바꿔요"
              icon={<IconLockLine />}
              onClick={screen.openChangePin}
            />
            <SettingsRow
              title="거래 PIN을 잊었어요"
              detail="본인 확인 후 다시 만들어요"
              icon={<IconLockOpenedLine />}
              onClick={screen.openResetPin}
            />
          </List>
        </VStack>

        <VStack gap="x2">
          <ListHeader as="h3" variant="mediumWeak">
            로그인
          </ListHeader>
          <List>
            <SettingsRow
              title="이 기기에서 로그아웃"
              detail="지금 보고 있는 기기만 로그아웃해요"
              icon={<IconMobileLine />}
              onClick={screen.notifyNotReady}
            />
            <SettingsRow
              title="다른 기기에서도 로그아웃"
              detail="다른 기기에 남아 있는 로그인도 끊어요"
              icon={<IconPerson2Line />}
              onClick={screen.notifyNotReady}
            />
          </List>
        </VStack>
      </VStack>
    </ActivityScreenLayout>
  )
}

export default AccountSettingsActivity
