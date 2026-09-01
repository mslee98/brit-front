import { IconMobileLine } from '@karrotmarket/react-monochrome-icon'
import { Float } from '@seed-design/react'
import { useState } from 'react'
import { FloatingActionButton } from 'seed-design/ui/floating-action-button'

import {
  getActivityFromPathname,
  useLayout,
} from '../../../app/layouts/LayoutContext'
import { useIsDesktopViewport } from '../../../app/layouts/useIsDesktopViewport'
import { APP_LAYOUT } from '../../../shared/constants/app-layout'
import { DeviceContextDevSheet } from './DeviceContextDevSheet'

const FAB_OFFSET_Y = `calc(${APP_LAYOUT.bottomNavigation.height}px + env(safe-area-inset-bottom, 0px) + 16px)`

/** DEV 전용: 모바일 프레임에서 기기 정보를 FAB로 연다 */
export function DeviceContextDevFab() {
  const isDesktop = useIsDesktopViewport()
  const { pathname } = useLayout()
  const [open, setOpen] = useState(false)
  const activityName = getActivityFromPathname(pathname)

  if (!import.meta.env.DEV || isDesktop) return null
  // TradeCompose Primary CTA와 행동 우선순위가 겹치지 않게 숨김
  if (activityName === 'TradeCompose') return null

  return (
    <>
      <Float
        placement="bottom-end"
        offsetX="x4"
        offsetY={FAB_OFFSET_Y}
        zIndex="var(--app-chrome-z-index)"
      >
        <FloatingActionButton
          icon={<IconMobileLine />}
          label="기기 정보"
          extended={false}
          onClick={() => setOpen(true)}
        />
      </Float>
      <DeviceContextDevSheet open={open} onOpenChange={setOpen} />
    </>
  )
}
