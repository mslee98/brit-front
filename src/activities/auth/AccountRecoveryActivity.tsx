/**
 * AccountRecoveryActivity — 2요소 이상 복구 + 쿨다운 안내
 */
import type { ActivityComponentType } from '@stackflow/react'
import { Text, VStack } from '@seed-design/react'
import { TextField, TextFieldInput } from 'seed-design/ui/text-field'
import { PageBanner } from 'seed-design/ui/page-banner'

import { ActivityScreenLayout } from '../../app/layouts/ActivityScreenLayout'
import { useAccountRecoveryScreen } from '../../features/auth/hooks/useAccountRecoveryScreen'
import { BottomActionButton } from '../../shared/ui/BottomActionButton'

const AccountRecoveryActivity: ActivityComponentType<'AccountRecovery'> = () => {
  const screen = useAccountRecoveryScreen()

  if (screen.step === 'done') {
    return (
      <ActivityScreenLayout
        title="계정 복구"
        showAppBar={false}
        appScreenProps={{ preventSwipeBack: true }}
        bottomCTABehavior="fixed"
        fixedBottom={
          <BottomActionButton size="large" variant="brandSolid" onClick={screen.goLogin}>
            로그인하기
          </BottomActionButton>
        }
      >
        <VStack px="spacingX.globalGutter" py="x8" gap="x6" flexGrow justify="center">
          <Text textStyle="screenTitle" color="fg.neutral">
            비밀번호를 바꿨어요
          </Text>
          <Text textStyle="t3Regular" color="fg.neutralMuted">
            보안을 위해 일정 시간 동안 계좌 변경·고액 거래·환전·거래 비밀번호 변경이 제한돼요.
          </Text>
          {screen.lockedUntil && (
            <PageBanner
              tone="warning"
              variant="weak"
              description={`제한 해제: ${new Date(screen.lockedUntil).toLocaleString('ko-KR')}`}
            />
          )}
        </VStack>
      </ActivityScreenLayout>
    )
  }

  if (screen.step === 'password') {
    return (
      <ActivityScreenLayout
        title="계정 복구"
        onBack={screen.handleStepBack}
        bottomCTABehavior="keyboardAdaptive"
        fixedBottom={
          <BottomActionButton
            size="large"
            variant="brandSolid"
            loading={screen.isSubmitting}
            onClick={() => void screen.handleSubmitPassword()}
          >
            비밀번호 바꾸기
          </BottomActionButton>
        }
      >
        <VStack px="spacingX.globalGutter" py="x4" gap="x6">
          <Text textStyle="screenTitle" color="fg.neutral">
            새 로그인 비밀번호
          </Text>
          <TextField
            label="새 비밀번호"
            value={screen.newPassword}
            onValueChange={({ value }) => screen.setNewPassword(value)}
          >
            <TextFieldInput type="password" autoComplete="new-password" />
          </TextField>
          <TextField
            label="비밀번호 확인"
            value={screen.passwordConfirm}
            onValueChange={({ value }) => screen.setPasswordConfirm(value)}
          >
            <TextFieldInput type="password" autoComplete="new-password" />
          </TextField>
        </VStack>
      </ActivityScreenLayout>
    )
  }

  if (screen.step === 'verify') {
    return (
      <ActivityScreenLayout
        title="계정 복구"
        onBack={screen.handleStepBack}
        bottomCTABehavior="keyboardAdaptive"
        fixedBottom={
          <BottomActionButton size="large" variant="brandSolid" onClick={screen.handleVerifyNext}>
            다음
          </BottomActionButton>
        }
      >
        <VStack px="spacingX.globalGutter" py="x4" gap="x6">
          <Text textStyle="screenTitle" color="fg.neutral">
            추가 확인이 필요해요
          </Text>
          <PageBanner
            tone="warning"
            variant="weak"
            description="휴대폰 인증만으로는 비밀번호를 바꿀 수 없어요. 계좌와 신원 정보를 함께 확인해 주세요."
          />
          <BottomActionButton
            size="medium"
            variant={screen.octomoVerified ? 'neutralWeak' : 'brandSolid'}
            onClick={screen.handleMarkOctomoVerified}
          >
            {screen.octomoVerified ? '기기인증 완료됨' : '기기인증하기'}
          </BottomActionButton>
          <TextField
            label="등록 계좌 끝 4자리"
            value={screen.accountNumberLast4}
            onValueChange={({ value }) =>
              screen.setAccountNumberLast4(value.replace(/\D/g, '').slice(0, 4))
            }
          >
            <TextFieldInput inputMode="numeric" placeholder="1234" maxLength={4} />
          </TextField>
          <TextField
            label="이름"
            value={screen.name}
            onValueChange={({ value }) => screen.setName(value)}
          >
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
    <ActivityScreenLayout
      title="계정 복구"
      bottomCTABehavior="keyboardAdaptive"
      fixedBottom={
        <BottomActionButton size="large" variant="brandSolid" onClick={screen.handlePhoneNext}>
          다음
        </BottomActionButton>
      }
    >
      <VStack px="spacingX.globalGutter" py="x4" gap="x6">
        <Text textStyle="screenTitle" color="fg.neutral">
          가입한 휴대폰 번호
        </Text>
        <TextField
          label="휴대폰 번호"
          value={screen.phone}
          onValueChange={({ value }) => screen.setPhone(value)}
        >
          <TextFieldInput inputMode="tel" placeholder="010-0000-0000" />
        </TextField>
      </VStack>
    </ActivityScreenLayout>
  )
}

export default AccountRecoveryActivity
