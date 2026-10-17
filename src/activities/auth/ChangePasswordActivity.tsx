/**
 * ChangePasswordActivity — 로그인 비밀번호 변경 입력.
 */
import type { ActivityComponentType } from '@stackflow/react'
import { Text, VStack } from '@seed-design/react'
import { TextField, TextFieldInput } from 'seed-design/ui/text-field'

import { ActivityScreenLayout } from '../../app/layouts/ActivityScreenLayout'
import { useChangePasswordScreen } from '../../features/auth/hooks/useChangePasswordScreen'
import { BottomActionButton } from '../../shared/ui/BottomActionButton'

const ChangePasswordActivity: ActivityComponentType<'ChangePassword'> = () => {
  const screen = useChangePasswordScreen()

  return (
    <ActivityScreenLayout
      title="비밀번호 변경"
      bottomCTABehavior="keyboardAdaptive"
      fixedBottom={
        <BottomActionButton size="large" variant="brandSolid" onClick={screen.handleSubmit}>
          비밀번호 바꾸기
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
            로그인 비밀번호를 바꿔 주세요
          </Text>
          <Text textStyle="t3Regular" color="fg.neutralMuted">
            현재 비밀번호를 확인한 뒤 새 비밀번호를 설정해요.
          </Text>
        </VStack>
        <TextField
          label="현재 비밀번호"
          value={screen.currentPassword}
          onValueChange={({ value }) => screen.setCurrentPassword(value)}
        >
          <TextFieldInput type="password" autoComplete="current-password" />
        </TextField>
        <TextField
          label="새 비밀번호"
          value={screen.newPassword}
          onValueChange={({ value }) => screen.setNewPassword(value)}
        >
          <TextFieldInput type="password" autoComplete="new-password" />
        </TextField>
        <TextField
          label="새 비밀번호 확인"
          value={screen.passwordConfirm}
          onValueChange={({ value }) => screen.setPasswordConfirm(value)}
        >
          <TextFieldInput type="password" autoComplete="new-password" />
        </TextField>
      </VStack>
    </ActivityScreenLayout>
  )
}

export default ChangePasswordActivity
