/**
 * SignupAccountActivity
 *
 * 책임: 금융기관·계좌번호 입력 UI (외부 verify 없음)
 */
import type { ActivityComponentType } from '@stackflow/react'
import { Text, VStack } from '@seed-design/react'
import { BottomActionButton } from '../../shared/ui/BottomActionButton'
import { FieldButton } from 'seed-design/ui/field-button'
import { PageBanner } from 'seed-design/ui/page-banner'
import { TextField, TextFieldInput } from 'seed-design/ui/text-field'

import { ActivityScreenLayout } from '../../app/layouts/ActivityScreenLayout'
import { InstitutionSelectPanel } from '../../features/auth/components/institution/InstitutionSelectPanel'
import { SignupExitAlertDialog } from '../../features/auth/components/SignupExitAlertDialog'
import { SignupProgressHeader } from '../../features/auth/components/SignupProgressBar'
import { useSignupAccountScreen } from '../../features/auth/hooks/useSignupAccountScreen'

const SignupAccountActivity: ActivityComponentType<'SignupAccount'> = () => {
  const screen = useSignupAccountScreen()

  if (screen.step === 'bank') {
    return (
      <>
        <ActivityScreenLayout
          title="금융기관 선택"
          onBack={screen.handleBack}
          onFlowClose={screen.openExitDialog}
          progress={<SignupProgressHeader type="account" step="bank" />}
        >
          <InstitutionSelectPanel onSelect={screen.handleInstitutionSelect} />
        </ActivityScreenLayout>

        <SignupExitAlertDialog
          open={screen.exitDialogOpen}
          onOpenChange={screen.setExitDialogOpen}
          onConfirmExit={screen.handleConfirmExit}
        />
      </>
    )
  }

  return (
    <>
      <ActivityScreenLayout
        title="계좌 등록"
        onBack={screen.handleBack}
        onFlowClose={screen.openExitDialog}
        progress={<SignupProgressHeader type="account" step="accountNumber" />}
        fixedBottom={
          <BottomActionButton
            size="large"
            variant="brandSolid"
            disabled={!screen.canSubmit}
            onClick={screen.handleGoPin}
          >
            거래 PIN 만들기
          </BottomActionButton>
        }
      >
        <VStack
          as="form"
          px="spacingX.globalGutter"
          py="x4"
          gap="x6"
          onSubmit={(e) => {
            e.preventDefault()
            screen.handleGoPin()
          }}
        >
          <VStack gap="spacingY.betweenText">
            <Text textStyle="screenTitle" color="fg.neutral">
              거래에 사용할 계좌를 연결해 주세요
            </Text>
            <Text textStyle="t3Regular" color="fg.neutralMuted">
              본인 명의 계좌만 등록할 수 있어요. 예금주는 이름과 같아야 해요.
            </Text>
          </VStack>

          <FieldButton
            label="금융기관"
            buttonProps={{
              'aria-label': '금융기관 다시 선택',
              onClick: screen.handleReselectBank,
            }}
          >
            {screen.draft.bankName}
          </FieldButton>

          <TextField
            label="계좌번호"
            value={screen.draft.accountNumber}
            onValueChange={({ value }) => screen.handleAccountNumberChange(value)}
          >
            <TextFieldInput placeholder="숫자만 입력" inputMode="numeric" />
          </TextField>

          <PageBanner
            tone="informative"
            variant="weak"
            description="계좌는 거래 취소, 환불, 환전에 사용돼요. 관리자 승인 후 이용할 수 있어요."
          />
        </VStack>
      </ActivityScreenLayout>

      <SignupExitAlertDialog
        open={screen.exitDialogOpen}
        onOpenChange={screen.setExitDialogOpen}
        onConfirmExit={screen.handleConfirmExit}
      />
    </>
  )
}

export default SignupAccountActivity
