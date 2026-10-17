/**
 * FindLoginIdActivity — 로그인 밖 아이디 찾기.
 */
import type { ActivityComponentType } from '@stackflow/react'
import { Text, VStack } from '@seed-design/react'
import { TextField, TextFieldInput } from 'seed-design/ui/text-field'

import { ActivityScreenLayout } from '../../app/layouts/ActivityScreenLayout'
import { useFindLoginIdScreen } from '../../features/auth/hooks/useFindLoginIdScreen'
import { BottomActionButton } from '../../shared/ui/BottomActionButton'

const FindLoginIdActivity: ActivityComponentType<'FindLoginId'> = () => {
  const screen = useFindLoginIdScreen()

  if (screen.step === 'done') {
    return (
      <ActivityScreenLayout
        title="아이디 찾기"
        onBack={screen.handleBack}
        bottomCTABehavior="fixed"
        fixedBottom={
          <BottomActionButton size="large" variant="brandSolid" onClick={screen.goLogin}>
            로그인하기
          </BottomActionButton>
        }
      >
        <VStack px="spacingX.globalGutter" py="x8" gap="x3">
          <Text textStyle="screenTitle" color="fg.neutral">
            아이디 확인
          </Text>
          <Text textStyle="t3Regular" color="fg.neutralMuted">
            확인된 아이디는 조회가 끝나면 여기에 보여 드려요.
          </Text>
        </VStack>
      </ActivityScreenLayout>
    )
  }

  if (screen.step === 'verify') {
    return (
      <ActivityScreenLayout
        title="아이디 찾기"
        onBack={screen.handleBack}
        bottomCTABehavior="keyboardAdaptive"
        fixedBottom={
          <BottomActionButton size="large" variant="brandSolid" onClick={screen.handleVerify}>
            아이디 확인하기
          </BottomActionButton>
        }
      >
        <VStack px="spacingX.globalGutter" py="x4" gap="x6">
          <VStack gap="spacingY.betweenText">
            <Text textStyle="screenTitle" color="fg.neutral">
              가입 정보를 확인해 주세요
            </Text>
            <Text textStyle="t3Regular" color="fg.neutralMuted">
              계좌 끝자리와 이름, 생년월일이 맞으면 아이디를 알려 드려요.
            </Text>
          </VStack>
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
    <ActivityScreenLayout
      title="아이디 찾기"
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

export default FindLoginIdActivity
