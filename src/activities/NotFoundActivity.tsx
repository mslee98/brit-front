import type { ActivityComponentType } from '@stackflow/react'
import { useStack } from '@stackflow/react'
import { Text, VStack } from '@seed-design/react'
import { ActionButton } from 'seed-design/ui/action-button'

import {
  AppBar,
  AppBarBackButton,
  AppBarLeft,
  AppBarMain,
  AppBarRight,
} from 'seed-design/ui/app-bar'
import { AppScreen, AppScreenContent } from 'seed-design/ui/app-screen'
import { navigateToRootHome } from '../stackflow/navigateToRootHome'

const NotFoundActivity: ActivityComponentType<'NotFound'> = () => {
  const { activities } = useStack()

  return (
    <AppScreen>
      <AppBar>
        <AppBarLeft>
          <AppBarBackButton />
        </AppBarLeft>
        <AppBarMain>404</AppBarMain>
        <AppBarRight />
      </AppBar>

      <AppScreenContent>
        <VStack
          minHeight="full"
          align="center"
          justify="center"
          gap="spacingY.componentDefault"
          px="spacingX.globalGutter"
        >
          <Text textStyle="t7Bold" color="fg.neutral">
            페이지를 찾을 수 없습니다
          </Text>
          <ActionButton onClick={() => navigateToRootHome(activities.length)}>
            홈으로 돌아가기
          </ActionButton>
        </VStack>
      </AppScreenContent>
    </AppScreen>
  )
}

export default NotFoundActivity
