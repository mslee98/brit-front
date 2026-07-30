import type { ActivityComponentType } from '@stackflow/react'
import { Text, VStack } from '@seed-design/react'

import { ActivityScreenLayout } from '../../app/layouts/ActivityScreenLayout'
import { NumericKeypad } from '../../features/auth/components/NumericKeypad'
import { SignupExitAlertDialog } from '../../features/auth/components/SignupExitAlertDialog'
import { SignupProgressHeader } from '../../features/auth/components/SignupProgressBar'
import { PinField } from 'seed-design/ui/pin-field'
import { useSignupPinFlow } from '../../features/auth/hooks/useSignupPinFlow'

const SignupPinActivity: ActivityComponentType<'SignupPin'> = () => {
  const {
    step,
    pinLength,
    currentValue,
    isSubmitting,
    copy,
    handleDigit,
    handleBackspace,
    handleStepBack,
    exitDialogOpen,
    setExitDialogOpen,
    openExitDialog,
    handleConfirmExit,
  } = useSignupPinFlow()

  return (
    <>
      <ActivityScreenLayout
        title="거래 PIN"
        onBack={handleStepBack}
        onFlowClose={openExitDialog}
        progress={<SignupProgressHeader type="pin" step={step} />}
      >
        <VStack px="spacingX.globalGutter" py="x4" gap="x6" flexGrow>
          <VStack gap="spacingY.betweenText">
            <Text textStyle="screenTitle" color="fg.neutral">
              {copy.title}
            </Text>
            <Text textStyle="t3Regular" color="fg.neutralMuted">
              {copy.description}
            </Text>
          </VStack>

          <PinField length={pinLength} value={currentValue} aria-label="거래 PIN" />

          <VStack flexGrow justify="flex-end">
            <NumericKeypad
              onDigit={handleDigit}
              onBackspace={handleBackspace}
              disabled={isSubmitting}
            />
          </VStack>
        </VStack>
      </ActivityScreenLayout>

      <SignupExitAlertDialog
        open={exitDialogOpen}
        onOpenChange={setExitDialogOpen}
        onConfirmExit={handleConfirmExit}
      />
    </>
  )
}

export default SignupPinActivity
