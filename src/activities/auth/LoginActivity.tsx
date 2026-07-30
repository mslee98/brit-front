/**
 * LoginActivity — 아이디+비밀번호 Primary, 패스키 Secondary
 *
 * CTA는 keyboardAdaptive fixedBottom — 키패드에 가리지 않게 Layer 안 inline
 */
import type { ActivityComponentType } from '@stackflow/react'
import { IconEyeLine, IconEyeSlashLine } from '@karrotmarket/react-monochrome-icon'
import { Box, HStack, Text, VStack } from '@seed-design/react'
import { TextField, TextFieldInput } from 'seed-design/ui/text-field'

import { ActivityScreenLayout } from '../../app/layouts/ActivityScreenLayout'
import { LoginFindAccountSheet } from '../../features/auth/components/LoginFindAccountSheet'
import { useLoginScreen } from '../../features/auth/hooks/useLoginScreen'
import { TextLinkButton } from '../../shared/components/TextLinkButton'
import { BottomActionButton } from '../../shared/ui/BottomActionButton'

const LOGIN_FORM_ID = 'login-form'

const LoginActivity: ActivityComponentType<'Login'> = () => {
  const screen = useLoginScreen()

  return (
    <>
      <ActivityScreenLayout
        title="로그인"
        onBack={() => screen.pop()}
        bottomCTABehavior="keyboardAdaptive"
        fixedBottom={
          <VStack gap="x3" width="full">
            <BottomActionButton
              type="submit"
              form={LOGIN_FORM_ID}
              size="large"
              variant="brandSolid"
              loading={screen.isSubmitting}
            >
              로그인
            </BottomActionButton>

            <Box display="flex" alignItems="center" gap="x3" py="x1">
              <Box flexGrow height="1px" bg="stroke.neutralMuted" />
              <Text textStyle="t3Regular" color="fg.neutralSubtle">
                또는
              </Text>
              <Box flexGrow height="1px" bg="stroke.neutralMuted" />
            </Box>

            <VStack gap="x2" width="full">
              <BottomActionButton
                type="button"
                size="large"
                variant="neutralOutline"
                disabled={!screen.passkeyEnabled || screen.isSubmitting}
                onClick={() => void screen.handlePasskeyLogin()}
              >
                패스키로 로그인
              </BottomActionButton>
              {!screen.passkeyEnabled ? (
                <Text textStyle="t2Regular" color="fg.neutralSubtle" align="center">
                  곧 사용할 수 있어요
                </Text>
              ) : null}
            </VStack>

            <HStack justify="center" gap="x1" pt="x1">
              <Text textStyle="t4Regular" color="fg.neutralMuted">
                계정이 없으신가요?
              </Text>
              <TextLinkButton onClick={screen.goSignup}>회원가입</TextLinkButton>
            </HStack>
          </VStack>
        }
      >
        <VStack
          as="form"
          id={LOGIN_FORM_ID}
          px="spacingX.globalGutter"
          py="x4"
          gap="x8"
          onSubmit={(e) => {
            e.preventDefault()
            void screen.handlePasswordLogin()
          }}
        >
          <VStack gap="spacingY.betweenText">
            <Text textStyle="screenTitle" color="fg.neutral">
              BRIT에 로그인
            </Text>
            <VStack gap="x1">
              <Text textStyle="t3Regular" color="fg.neutralMuted">
                아이디와 비밀번호를 입력해 주세요.
              </Text>
              <Text textStyle="t3Regular" color="fg.neutralMuted">
                패스키를 등록했다면 더 간편하게 로그인할 수 있어요.
              </Text>
            </VStack>
          </VStack>

          <VStack gap="x5">
            <TextField
              label="아이디"
              value={screen.loginId}
              onValueChange={({ value }) => screen.setLoginId(value)}
              invalid={Boolean(screen.loginIdError)}
              errorMessage={screen.loginIdError ?? undefined}
            >
              <TextFieldInput
                placeholder="아이디를 입력해 주세요"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="next"
              />
            </TextField>

            <TextField
              label="비밀번호"
              value={screen.password}
              onValueChange={({ value }) => screen.setPassword(value)}
              invalid={Boolean(screen.passwordError)}
              errorMessage={screen.passwordError ?? undefined}
              suffix={
                <button
                  type="button"
                  aria-label={screen.showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  onClick={screen.toggleShowPassword}
                  className="inline-flex items-center justify-center"
                  style={{ color: 'var(--seed-color-fg-neutral-muted)' }}
                >
                  {screen.showPassword ? (
                    <IconEyeSlashLine width={20} height={20} />
                  ) : (
                    <IconEyeLine width={20} height={20} />
                  )}
                </button>
              }
            >
              <TextFieldInput
                type={screen.showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="비밀번호를 입력해 주세요"
                enterKeyHint="go"
              />
            </TextField>

            <HStack justify="flex-end">
              <TextLinkButton onClick={() => screen.setFindSheetOpen(true)}>
                아이디·비밀번호 찾기
              </TextLinkButton>
            </HStack>

            {screen.formError ? (
              <Text textStyle="t3Regular" color="fg.critical">
                {screen.formError}
              </Text>
            ) : null}
          </VStack>
        </VStack>
      </ActivityScreenLayout>

      <LoginFindAccountSheet
        open={screen.findSheetOpen}
        onOpenChange={screen.setFindSheetOpen}
        onFindLoginId={screen.goFindLoginId}
        onResetPassword={screen.goResetPassword}
      />
    </>
  )
}

export default LoginActivity
