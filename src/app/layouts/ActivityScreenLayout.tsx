import type { MouseEvent, ReactNode } from 'react'
import { IconXmarkLine } from '@karrotmarket/react-monochrome-icon'
import { VStack } from '@seed-design/react'
import {
  AppBar,
  AppBarBackButton,
  AppBarIconButton,
  AppBarLeft,
  AppBarMain,
  AppBarRight,
} from 'seed-design/ui/app-bar'
import { AppScreen, AppScreenContent, type AppScreenProps } from 'seed-design/ui/app-screen'

import { BottomCTA, type BottomCTABehavior } from '../../shared/ui/BottomCTA'

/** Standard Top Navigation 왼쪽 액션 — Back(히스토리) vs Close(플로우 종료) */
export type ActivityAppBarLeftAction = 'back' | 'close' | 'none'

interface ActivityScreenLayoutProps {
  title?: string
  subtitle?: string
  /** @default 'back' */
  leftAction?: ActivityAppBarLeftAction
  /**
   * 전달하면 기본 pop을 막고 이 핸들러만 실행한다.
   * 이전 step으로 replace하거나, 직접 pop할 때 사용.
   * 기본 뒤로가기만 필요하면 생략한다 (AppBarBackButton이 pop).
   */
  onBack?: (e: MouseEvent<HTMLButtonElement>) => void
  onClose?: (e: MouseEvent<HTMLButtonElement>) => void
  /**
   * 뒤로가기와 별도로 플로우 종료(X)를 오른쪽에 둘 때.
   * 가입처럼 back=이전 화면, close=이탈 확인이 분리될 때 사용.
   */
  onFlowClose?: (e: MouseEvent<HTMLButtonElement>) => void
  right?: ReactNode
  fixedBottom?: ReactNode
  /** @default keyboardAdaptive — Resize된 프레임 하단에 CTA 유지 */
  bottomCTABehavior?: BottomCTABehavior
  progress?: ReactNode
  appScreenProps?: AppScreenProps
  showAppBar?: boolean
  children: ReactNode
}

/**
 * Activity 공통 레이아웃 (Standard Top Navigation).
 * 하단 CTA는 AppScreen Layer 안 in-flow.
 * 키보드가 열리면 MobileFrame이 Resize되고 CTA는 inset 패딩 없이 가시 영역 하단에 남는다.
 */
export function ActivityScreenLayout({
  title = '',
  subtitle,
  leftAction = 'back',
  onBack,
  onClose,
  onFlowClose,
  right,
  fixedBottom,
  bottomCTABehavior = 'keyboardAdaptive',
  progress,
  appScreenProps,
  showAppBar = true,
  children,
}: ActivityScreenLayoutProps) {
  const { className: appScreenClassName, ...restAppScreenProps } = appScreenProps ?? {}
  const flowCloseButton = onFlowClose ? (
    <AppBarIconButton aria-label="닫기" type="button" onClick={onFlowClose}>
      <IconXmarkLine />
    </AppBarIconButton>
  ) : null

  return (
    <AppScreen
      {...restAppScreenProps}
      className={['keyboard-resize-screen', appScreenClassName].filter(Boolean).join(' ')}
    >
      {showAppBar && (
        <AppBar>
          {leftAction !== 'none' && (
            <AppBarLeft>
              {leftAction === 'close' ? (
                <AppBarIconButton
                  aria-label="닫기"
                  type="button"
                  onClick={onClose}
                >
                  <IconXmarkLine />
                </AppBarIconButton>
              ) : (
                <AppBarBackButton
                  onClick={(e) => {
                    if (!onBack) return
                    e.preventDefault()
                    onBack(e)
                  }}
                />
              )}
            </AppBarLeft>
          )}
          <AppBarMain title={title} subtitle={subtitle} />
          <AppBarRight>
            {right}
            {flowCloseButton}
          </AppBarRight>
        </AppBar>
      )}

      <AppScreenContent>
        <div className="keyboard-resize-activity">
          {progress && (
            <VStack px="spacingX.globalGutter" pt="x2" pb="x3" shrink={0}>
              {progress}
            </VStack>
          )}

          <div className="keyboard-resize-activity__content">{children}</div>

          {fixedBottom && (
            <BottomCTA
              behavior={bottomCTABehavior}
              variant="inline"
              className="keyboard-resize-activity__cta"
            >
              {fixedBottom}
            </BottomCTA>
          )}
        </div>
      </AppScreenContent>
    </AppScreen>
  )
}
