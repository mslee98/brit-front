import type { ActivityComponentType } from '@stackflow/react'
import { useStack } from '@stackflow/react'
import { Box, Text, VStack } from '@seed-design/react'
import { BottomActionButton } from '../../shared/ui/BottomActionButton'
import { ResultSection } from 'seed-design/ui/result-section'

import { ActivityScreenLayout } from '../../app/layouts/ActivityScreenLayout'
import { LOTTIE_ASSETS } from '../../assets/lottie/lottieRegistry'
import { LottiePlayer } from '../../shared/components/LottiePlayer'
import { RESULT_HERO_LOTTIE_SIZE } from '../../shared/constants/motion'
import { resetSignupDraft } from '../../features/auth/stores/signupDraft.store'
import { resetSignupSecrets } from '../../features/auth/stores/signupSecrets.store'
import { TextLinkButton } from '../../shared/components/TextLinkButton'
import { actions } from '../../stackflow/stackflow'
import { navigateToRootHome } from '../../stackflow/navigateToRootHome'

const SIGNUP_COMPLETE_LOTTIE = LOTTIE_ASSETS.success

const SignupCompleteActivity: ActivityComponentType<'SignupComplete'> = () => {
  const { activities } = useStack()

  const finishSignup = () => {
    resetSignupDraft()
    resetSignupSecrets()
    navigateToRootHome(activities.length)
  }

  const handleStart = () => {
    finishSignup()
  }

  const handlePasskeyRegister = () => {
    finishSignup()
    window.setTimeout(() => {
      actions.push('SecuritySettings', {})
    }, 50)
  }

  return (
    <ActivityScreenLayout
      showAppBar={false}
      appScreenProps={{ preventSwipeBack: true, transitionStyle: 'fadeIn' }}
      bottomCTABehavior="fixed"
      fixedBottom={
        <VStack gap="x4" px="spacingX.globalGutter" pb="x4">
          <BottomActionButton size="large" variant="brandSolid" onClick={handleStart}>
            시작하기
          </BottomActionButton>

          <VStack gap="x2">
            <VStack gap="spacingY.betweenText">
              <Text textStyle="t5Bold" color="fg.neutral">
                다음부터 더 빠르게 로그인하세요
              </Text>
              <Text textStyle="t3Regular" color="fg.neutralMuted">
                Face ID나 지문을 사용하면 비밀번호 없이 로그인할 수 있어요.
              </Text>
            </VStack>
            <BottomActionButton size="large" variant="neutralWeak" onClick={handlePasskeyRegister}>
              패스키 등록하기
            </BottomActionButton>
            <VStack align="center" pt="x1">
              <TextLinkButton onClick={handleStart}>나중에 설정하기</TextLinkButton>
            </VStack>
          </VStack>
        </VStack>
      }
    >
      <VStack flexGrow justify="center" minHeight="full">
        <ResultSection
          asset={
            <Box pb="x4" display="flex" justifyContent="center">
              <LottiePlayer animationData={SIGNUP_COMPLETE_LOTTIE} size={RESULT_HERO_LOTTIE_SIZE} />
            </Box>
          }
          title="가입이 완료됐어요"
          description="이제 안전하게 거래를 시작할 수 있어요."
        />
      </VStack>
    </ActivityScreenLayout>
  )
}

export default SignupCompleteActivity
