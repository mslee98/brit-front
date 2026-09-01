/**
 * MyActivity — 나의 Brit (설정·알림·거래 허브)
 */
import type { ActivityComponentType } from '@stackflow/react'
import { useFlow } from '@stackflow/react'
import { IconGearLine } from '@karrotmarket/react-monochrome-icon'
import { Icon } from '@seed-design/react'
import {
  AppBar,
  AppBarIconButton,
  AppBarMain,
  AppBarRight,
} from 'seed-design/ui/app-bar'
import { AppScreen, AppScreenContent } from 'seed-design/ui/app-screen'

import { MyScreen } from '../features/profile/components/MyScreen'

const MyActivity: ActivityComponentType<'My'> = () => {
  const { push } = useFlow()

  return (
    <AppScreen className="flex min-h-0 flex-1 flex-col">
      <AppBar>
        <AppBarMain title="나의 Brit" />
        <AppBarRight>
          <AppBarIconButton
            aria-label="설정"
            type="button"
            onClick={() => push('SecuritySettings', {}, { animate: true })}
          >
            <Icon svg={<IconGearLine />} size="x5" color="fg.neutralSubtle" />
          </AppBarIconButton>
        </AppBarRight>
      </AppBar>
      <AppScreenContent className="min-h-0 flex-1 overflow-y-auto">
        <MyScreen />
      </AppScreenContent>
    </AppScreen>
  )
}

export default MyActivity
