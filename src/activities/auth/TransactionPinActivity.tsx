/**
 * TransactionPinActivity — 거래 PIN 변경·분실 재설정.
 */
import type { ActivityComponentType } from '@stackflow/react'
import { Text, VStack } from '@seed-design/react'
import { PinField } from 'seed-design/ui/pin-field'
import { TextField, TextFieldInput } from 'seed-design/ui/text-field'

import { ActivityScreenLayout } from '../../app/layouts/ActivityScreenLayout'
import { NumericKeypad } from '../../features/auth/components/NumericKeypad'
import { useTransactionPinScreen } from '../../features/auth/hooks/useTransactionPinScreen'
import { BottomActionButton } from '../../shared/ui/BottomActionButton'

const TransactionPinActivity: ActivityComponentType<'TransactionPin'> = () => {
  const screen = useTransactionPinScreen()
  const title = screen.mode === 'reset' ? '거래 PIN 재설정' : '거래 PIN 변경'
  const onBack = screen.step === 'current' || screen.step === 'verify' ? undefined : screen.handleBack

  if (screen.step === 'verify') {
    return (
      <ActivityScreenLayout
        title={title}
        bottomCTABehavior="keyboardAdaptive"
        fixedBottom={
          <BottomActionButton size="large" variant="brandSolid" onClick={screen.handleVerifyNext}>
            다음
          </BottomActionButton>
        }
      >
        <VStack px="spacingX.globalGutter" py="x4" gap="x6">
          <VStack gap="spacingY.betweenText">
            <Text textStyle="screenTitle" color="fg.neutral">
              {screen.copy.title}
            </Text>
            <Text textStyle="t3Regular" color="fg.neutralMuted">
              {screen.copy.description}
            </Text>
          </VStack>
          <TextField
            label="휴대폰 번호"
            value={screen.phone}
            onValueChange={({ value }) => screen.setPhone(value)}
          >
            <TextFieldInput inputMode="tel" placeholder="010-0000-0000" />
          </TextField>
          <TextField
            label="등록 계좌 끝 4자리"
            value={screen.accountNumberLast4}
            onValueChange={({ value }) => screen.setAccountNumberLast4(value)}
          >
            <TextFieldInput inputMode="numeric" placeholder="1234" maxLength={4} />
          </TextField>
          <TextField label="이름" value={screen.name} onValueChange={({ value }) => screen.setName(value)}>
            <TextFieldInput placeholder="홍길동" />
          </TextField>
          <TextField
            label="생년월일"
            description="YYYY-MM-DD"
            value={screen.birthDate}
            onValueChange={({ value }) => screen.setBirthDate(value)}
          >
            <TextFieldInput placeholder="1990-01-01" />
          </TextField>
        </VStack>
      </ActivityScreenLayout>
    )
  }

  return (
    <ActivityScreenLayout title={title} onBack={onBack}>
      <VStack px="spacingX.globalGutter" py="x4" gap="x6" flexGrow>
        <VStack gap="spacingY.betweenText">
          <Text textStyle="screenTitle" color="fg.neutral">
            {screen.copy.title}
          </Text>
          <Text textStyle="t3Regular" color="fg.neutralMuted">
            {screen.copy.description}
          </Text>
        </VStack>
        <PinField length={screen.pinLength} value={screen.entry} aria-label="거래 PIN" />
        <VStack flexGrow justify="flex-end">
          <NumericKeypad onDigit={screen.handleDigit} onBackspace={screen.handleBackspace} />
        </VStack>
      </VStack>
    </ActivityScreenLayout>
  )
}

export default TransactionPinActivity
