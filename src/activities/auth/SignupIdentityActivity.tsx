/**
 * SignupIdentityActivity
 *
 * 책임: 본인확인 화면 JSX 조립
 * 비책임: step·API·네비 (→ useSignupIdentityScreen)
 */
import type { ActivityComponentType } from '@stackflow/react'
import { BottomActionButton } from '../../shared/ui/BottomActionButton'

import { ActivityScreenLayout } from '../../app/layouts/ActivityScreenLayout'
import {
  getIdentityCtaLabel,
  SignupProgressiveForm,
} from '../../features/auth/components/SignupProgressiveForm'
import { SignupExitAlertDialog } from '../../features/auth/components/SignupExitAlertDialog'
import { SignupProgressHeader } from '../../features/auth/components/SignupProgressBar'
import { SIGNUP_IDENTITY_FORM_ID } from '../../features/auth/constants'
import { useSignupIdentityScreen } from '../../features/auth/hooks/useSignupIdentityScreen'

const SignupIdentityActivity: ActivityComponentType<'SignupIdentity'> = () => {
  const screen = useSignupIdentityScreen()
  const isCarrierStep = screen.activeStep === 'carrier'

  return (
    <>
      <ActivityScreenLayout
        title="가입하기"
        onBack={screen.handleBack}
        onFlowClose={screen.openExitDialog}
        progress={<SignupProgressHeader type="identity" />}
        bottomCTABehavior="keyboardAdaptive"
        fixedBottom={
          <BottomActionButton
            type={isCarrierStep ? 'button' : 'submit'}
            form={isCarrierStep ? undefined : SIGNUP_IDENTITY_FORM_ID}
            size="large"
            variant="brandSolid"
            disabled={isCarrierStep ? false : !screen.canGoNext}
            loading={screen.isSubmitting}
            onClick={isCarrierStep ? () => void screen.goNext() : undefined}
          >
            {getIdentityCtaLabel(screen.activeStep)}
          </BottomActionButton>
        }
      >
        <SignupProgressiveForm
          activeStep={screen.activeStep}
          name={screen.draft.name}
          residentRegistrationNumber={screen.draft.residentRegistrationNumber}
          carrier={screen.draft.carrier}
          phone={screen.draft.phone}
          onNameChange={screen.setName}
          onRrnChange={screen.setResidentRegistrationNumber}
          onCarrierSelect={screen.handleCarrierSelect}
          onPhoneChange={screen.setPhone}
          onSubmit={() => void screen.goNext()}
          canSubmit={screen.canGoNext}
          carrierSheetOpen={screen.carrierSheetOpen}
          onCarrierSheetOpenChange={screen.setCarrierSheetOpen}
        />
      </ActivityScreenLayout>

      <SignupExitAlertDialog
        open={screen.exitDialogOpen}
        onOpenChange={screen.setExitDialogOpen}
        onConfirmExit={screen.handleConfirmExit}
      />
    </>
  )
}

export default SignupIdentityActivity
