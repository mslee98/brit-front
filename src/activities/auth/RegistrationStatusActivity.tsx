import type { ActivityComponentType } from '@stackflow/react'
import { Box, Text, VStack } from '@seed-design/react'
import { FieldButton } from 'seed-design/ui/field-button'
import { PageBanner } from 'seed-design/ui/page-banner'
import { ResultSection } from 'seed-design/ui/result-section'
import { TextField, TextFieldInput } from 'seed-design/ui/text-field'

import { ActivityScreenLayout } from '../../app/layouts/ActivityScreenLayout'
import { BottomActionButton } from '../../shared/ui/BottomActionButton'
import { InstitutionSelectPanel } from '../../features/auth/components/institution/InstitutionSelectPanel'
import { useRegistrationStatusScreen } from '../../features/auth/hooks/useRegistrationStatusScreen'

const RegistrationStatusActivity: ActivityComponentType<'RegistrationStatus'> = () => {
  const screen = useRegistrationStatusScreen()

  if (screen.mode === 'resubmit' && screen.step === 'bank') {
    return (
      <ActivityScreenLayout
        title="계좌 다시 등록"
        onBack={screen.handleResubmitBankBack}
      >
        <InstitutionSelectPanel onSelect={screen.handleSelectInstitution} />
      </ActivityScreenLayout>
    )
  }

  if (screen.mode === 'resubmit') {
    return (
      <ActivityScreenLayout
        title="계좌 다시 등록"
        fixedBottom={
          <BottomActionButton
            size="large"
            variant="brandSolid"
            onClick={() => void screen.handleSubmitResubmission()}
            disabled={!screen.bankCode || screen.accountNumber.length < 10}
            loading={screen.isSubmitting}
          >
            재제출하기
          </BottomActionButton>
        }
      >
        <VStack px="spacingX.globalGutter" py="x4" gap="x6">
          <VStack gap="x2">
            <Text textStyle="screenTitle">계좌 정보를 다시 제출해 주세요</Text>
            <Text textStyle="t3Regular" color="fg.neutralMuted">
              반려된 계좌 정보를 수정하면 다시 심사해요.
            </Text>
          </VStack>
          <FieldButton
            label="금융기관"
            buttonProps={{
              'aria-label': '금융기관 선택',
              onClick: () => screen.setStep('bank'),
            }}
          >
            {screen.bankName || '금융기관 선택'}
          </FieldButton>
          <TextField
            label="계좌번호"
            value={screen.accountNumber}
            onValueChange={({ value }) => screen.setAccountNumber(value.replace(/\D/g, ''))}
          >
            <TextFieldInput inputMode="numeric" placeholder="숫자만 입력" />
          </TextField>
          <PageBanner tone="informative" variant="weak" description="제출 후 승인되면 정상 이용할 수 있어요." />
        </VStack>
      </ActivityScreenLayout>
    )
  }

  return (
    <ActivityScreenLayout
      title="가입 심사 상태"
      leftAction="none"
      appScreenProps={{ preventSwipeBack: true, transitionStyle: 'fadeIn' }}
      fixedBottom={
        <BottomActionButton size="large" variant="neutralWeak" onClick={() => void screen.handleLogout()}>
          로그아웃
        </BottomActionButton>
      }
    >
      <Box pt="x8">
        <ResultSection
          title="가입 심사 중이에요"
          description="관리자 심사 후 이용할 수 있어요. 결과가 나오면 다시 로그인해 주세요."
        />
      </Box>
      <VStack px="spacingX.globalGutter" pt="x4">
        <Text textStyle="t3Regular" color="fg.neutralMuted" align="center">
          현재 상태: {screen.isLoading ? '불러오는 중' : screen.status}
        </Text>
      </VStack>
    </ActivityScreenLayout>
  )
}

export default RegistrationStatusActivity
