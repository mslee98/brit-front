/**
 * SignupAccountActivity
 *
 * 책임: 계좌 등록·예금주 확인 화면 JSX 조립
 * 비책임: 검증·draft·네비 (→ useSignupAccountScreen)
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

function maskAccountNumber(value: string): string {
  if (value.length <= 6) return value
  return `${value.slice(0, 6)}${'*'.repeat(Math.min(6, value.length - 6))}`
}

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

  if (screen.isVerified) {
    return (
      <>
        <ActivityScreenLayout
          title="계좌 연결"
          onBack={screen.handleBack}
          onFlowClose={screen.openExitDialog}
          progress={<SignupProgressHeader type="account" step="accountNumber" />}
          bottomCTABehavior="fixed"
          fixedBottom={
            <BottomActionButton
              size="large"
              variant="brandSolid"
              onClick={screen.handleGoPin}
            >
              거래 PIN 만들기
            </BottomActionButton>
          }
        >
          <VStack px="spacingX.globalGutter" py="x4" gap="x6">
            <VStack gap="spacingY.betweenText">
              <Text textStyle="screenTitle" color="fg.neutral">
                계좌가 확인됐어요
              </Text>
              <Text textStyle="t3Regular" color="fg.neutralMuted">
                본인 명의 계좌로 거래 대금을 보내고 받을 수 있어요.
              </Text>
            </VStack>

            <VStack gap="x2">
              <Text textStyle="t4Regular" color="fg.neutral">
                {screen.draft.bankName}
              </Text>
              <Text textStyle="t5Bold" color="fg.neutral" className="tabular-nums">
                {maskAccountNumber(screen.draft.accountNumber)}
              </Text>
              <Text textStyle="t4Regular" color="fg.neutralMuted">
                예금주 {screen.draft.accountHolderName || screen.draft.name}
              </Text>
            </VStack>
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
            loading={screen.isVerifying}
            onClick={() => void screen.handleVerify()}
          >
            계좌 확인하기
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
            void screen.handleVerify()
          }}
        >
          <VStack gap="spacingY.betweenText">
            <Text textStyle="screenTitle" color="fg.neutral">
              거래에 사용할 계좌를 연결해 주세요
            </Text>
            <Text textStyle="t3Regular" color="fg.neutralMuted">
              본인 명의 계좌만 등록할 수 있어요. 거래 대금을 보내고 받을 때 사용해요.
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
            description="계좌는 거래 취소, 환불, 환전에 사용돼요."
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
