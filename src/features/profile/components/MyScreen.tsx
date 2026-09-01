import { Text, VStack } from '@seed-design/react'
import { List, ListItem } from 'seed-design/ui/list'
import { ListHeader } from 'seed-design/ui/list-header'

import { MY_NAVIGABLE_SECTIONS } from '../constants/myMenu.config'
import { useMyScreen } from '../hooks/useMyScreen'
import { MyMenuSection } from './MyMenuSection'
import { MyProfileRow } from './MyProfileRow'

const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? '0.0.0'

export function MyScreen() {
  const screen = useMyScreen()

  if (screen.loading) {
    return (
      <VStack
        px="spacingX.globalGutter"
        pt="x4"
        style={{ paddingBottom: 'var(--app-content-bottom-padding)' }}
      >
        <Text textStyle="t4Regular" color="fg.neutralSubtle">
          불러오는 중…
        </Text>
      </VStack>
    )
  }

  return (
    <VStack
      px="spacingX.globalGutter"
      pt="x4"
      gap="x6"
      style={{ paddingBottom: 'var(--app-content-bottom-padding)' }}
    >
      <MyProfileRow
        nickname={screen.nickname}
        verificationLabel={screen.verificationLabel}
        onClick={screen.handleProfileClick}
      />

      {MY_NAVIGABLE_SECTIONS.map((section) => (
        <MyMenuSection
          key={section.header}
          section={section}
          resolveDetail={screen.resolveMenuDetail}
          onItemClick={screen.handleMenuItemClick}
        />
      ))}

      <VStack gap="x2">
        <ListHeader as="h3" variant="mediumWeak">
          기타
        </ListHeader>
        <List>
          <ListItem title="고객센터" detail="문의하기" />
          <ListItem title="약관 및 정책" detail="이용약관, 개인정보 처리방침" />
          <ListItem title="앱 버전" detail={APP_VERSION} />
        </List>
      </VStack>
    </VStack>
  )
}
