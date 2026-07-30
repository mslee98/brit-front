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
  onBack?: (e: MouseEvent<HTMLButtonElement>) => void
  onClose?: (e: MouseEvent<HTMLButtonElement>) => void
  /**
   * 뒤로가기와 별도로 플로우 종료(X)를 오른쪽에 둘 때.
   * 가입처럼 back=이전 화면, close=이탈 확인이 분리될 때 사용.
   */
  onFlowClose?: (e: MouseEvent<HTMLButtonElement>) => void
  right?: ReactNode
  fixedBottom?: ReactNode
  /** @default keyboardAdaptive — 입력 화면은 키보드 위로, 없으면 inset 0과 동일 */
  bottomCTABehavior?: BottomCTABehavior
  progress?: ReactNode
  appScreenProps?: AppScreenProps
  showAppBar?: boolean
  children: ReactNode
}

/**
 * Activity 공통 레이아웃 (Standard Top Navigation).
 * 하단 CTA는 AppScreen Layer 안 in-flow로 두어 스택 z-index에 가려지지 않게 하고,
 * keyboardAdaptive 시 `--keyboard-inset`으로 키패드 위에 올린다.
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
  const flowCloseButton = onFlowClose ? (
    <AppBarIconButton aria-label="닫기" type="button" onClick={onFlowClose}>
      <IconXmarkLine />
    </AppBarIconButton>
  ) : null

  return (
    <AppScreen {...appScreenProps}>
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
                <AppBarBackButton onClick={onBack} />
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
        <VStack minHeight="full">
          {progress && (
            <VStack px="spacingX.globalGutter" pt="x2" pb="x3" shrink={0}>
              {progress}
            </VStack>
          )}

          <VStack flexGrow style={{ minHeight: 0, overflow: 'auto' }}>
            {children}
          </VStack>

          {fixedBottom && (
            <BottomCTA behavior={bottomCTABehavior} variant="inline">
              {fixedBottom}
            </BottomCTA>
          )}
        </VStack>
      </AppScreenContent>
    </AppScreen>
  )
}
