/**
 * ChangeBankAccountActivity — 거래 PIN 확인 후 은행·계좌 입력.
 * 은행 목록은 InstitutionSelectPanel을 재사용한다.
 */
import type { ActivityComponentType } from '@stackflow/react'
import { Text, VStack } from '@seed-design/react'
import { FieldButton } from 'seed-design/ui/field-button'
import { PageBanner } from 'seed-design/ui/page-banner'
import { PinField } from 'seed-design/ui/pin-field'
import { TextField, TextFieldInput } from 'seed-design/ui/text-field'

import { ActivityScreenLayout } from '../../app/layouts/ActivityScreenLayout'
import { InstitutionSelectPanel } from '../../features/auth/components/institution/InstitutionSelectPanel'
import { NumericKeypad } from '../../features/auth/components/NumericKeypad'
import { useChangeBankAccountScreen } from '../../features/auth/hooks/useChangeBankAccountScreen'
import { BottomActionButton } from '../../shared/ui/BottomActionButton'

const ChangeBankAccountActivity: ActivityComponentType<'ChangeBankAccount'> = () => {
  const screen = useChangeBankAccountScreen()

  if (screen.step === 'bank') {
    return (
      <ActivityScreenLayout title="금융기관 선택" onBack={screen.handleBack}>
        <InstitutionSelectPanel onSelect={screen.handleInstitutionSelect} />
      </ActivityScreenLayout>
    )
  }

  if (screen.step === 'accountNumber') {
    return (
      <ActivityScreenLayout
        title="계좌 변경"
        onBack={screen.handleBack}
        bottomCTABehavior="keyboardAdaptive"
        fixedBottom={
          <BottomActionButton
            size="large"
            variant="brandSolid"
            disabled={!screen.canSubmit}
            onClick={screen.handleSubmit}
          >
            심사 요청하기
          </BottomActionButton>
        }
      >
        <VStack
          as="form"
          px="spacingX.globalGutter"
          py="x4"
          gap="x6"
          onSubmit={(event) => {
            event.preventDefault()
            screen.handleSubmit()
          }}
        >
          <VStack gap="spacingY.betweenText">
            <Text textStyle="screenTitle" color="fg.neutral">
              바꿀 계좌를 입력해 주세요
            </Text>
            <Text textStyle="t3Regular" color="fg.neutralMuted">
              본인 명의 계좌만 등록할 수 있어요. 관리자 승인 후 반영돼요.
            </Text>
          </VStack>
          <FieldButton
            label="금융기관"
            buttonProps={{
              'aria-label': '금융기관 다시 선택',
              onClick: screen.handleReselectBank,
            }}
          >
            {screen.bankName || '금융기관 선택'}
          </FieldButton>
          <TextField
            label="계좌번호"
            value={screen.accountNumber}
            onValueChange={({ value }) => screen.handleAccountNumberChange(value)}
          >
            <TextFieldInput placeholder="숫자만 입력" inputMode="numeric" />
          </TextField>
          <PageBanner
            tone="informative"
            variant="weak"
            description="승인 전까지 기존 계좌가 유지돼요."
          />
        </VStack>
      </ActivityScreenLayout>
    )
  }

  if (screen.step === 'done') {
    return (
      <ActivityScreenLayout title="계좌 변경" onBack={screen.handleBack}>
        <VStack px="spacingX.globalGutter" py="x8" gap="x3">
          <Text textStyle="screenTitle" color="fg.neutral">
            심사 대기
          </Text>
          <Text textStyle="t3Regular" color="fg.neutralMuted">
            승인되면 입금 계좌가 바뀌어요. 그때까지 기존 계좌를 사용해요.
          </Text>
        </VStack>
      </ActivityScreenLayout>
    )
  }

  return (
    <ActivityScreenLayout title="계좌 변경">
      <VStack px="spacingX.globalGutter" py="x4" gap="x6" flexGrow>
        <VStack gap="spacingY.betweenText">
          <Text textStyle="screenTitle" color="fg.neutral">
            거래 PIN을 입력해 주세요
          </Text>
          <Text textStyle="t3Regular" color="fg.neutralMuted">
            계좌를 바꾸려면 거래 PIN 확인이 필요해요.
          </Text>
        </VStack>
        <PinField length={screen.pinLength} value={screen.pin} aria-label="거래 PIN" />
        <VStack flexGrow justify="flex-end">
          <NumericKeypad onDigit={screen.handleDigit} onBackspace={screen.handleBackspace} />
        </VStack>
      </VStack>
    </ActivityScreenLayout>
  )
}

export default ChangeBankAccountActivity
