import type { ActivityComponentType } from '@stackflow/react'
import { useFlow } from '@stackflow/react'
import { Box, Text, VStack } from '@seed-design/react'
import { BottomActionButton } from '../../shared/ui/BottomActionButton'
import { ResultSection } from 'seed-design/ui/result-section'

import { ActivityScreenLayout } from '../../app/layouts/ActivityScreenLayout'
import { LOTTIE_ASSETS } from '../../assets/lottie/lottieRegistry'
import { LottiePlayer } from '../../shared/components/LottiePlayer'
import { RESULT_HERO_LOTTIE_SIZE } from '../../shared/constants/motion'
import { resetSignupDraft } from '../../features/auth/stores/signupDraft.store'
import { resetSignupSecrets } from '../../features/auth/stores/signupSecrets.store'

const SIGNUP_COMPLETE_LOTTIE = LOTTIE_ASSETS.success

const SignupCompleteActivity: ActivityComponentType<'SignupComplete'> = () => {
  const { replace } = useFlow()

  const goLogin = () => {
    resetSignupDraft()
    resetSignupSecrets()
    replace('Login', {})
  }

  return (
    <ActivityScreenLayout
      showAppBar={false}
      appScreenProps={{ preventSwipeBack: true, transitionStyle: 'fadeIn' }}
      bottomCTABehavior="fixed"
      fixedBottom={
        <BottomActionButton size="large" variant="brandSolid" onClick={goLogin}>
          로그인하러 가기
        </BottomActionButton>
      }
    >
      <VStack flexGrow justify="center" minHeight="full">
        <ResultSection
          asset={
            <Box pb="x4" display="flex" justifyContent="center">
              <LottiePlayer animationData={SIGNUP_COMPLETE_LOTTIE} size={RESULT_HERO_LOTTIE_SIZE} />
            </Box>
          }
          title="가입 신청이 접수됐어요"
          description="관리자 승인 후 로그인할 수 있어요. 승인되면 알려드릴게요."
        />
        <VStack align="center" px="spacingX.globalGutter" pt="x2">
          <Text textStyle="t3Regular" color="fg.neutralMuted" align="center">
            승인 전에는 로그인이 되지 않아요.
          </Text>
        </VStack>
      </VStack>
    </ActivityScreenLayout>
  )
}

export default SignupCompleteActivity
