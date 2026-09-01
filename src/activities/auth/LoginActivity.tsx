/**
 * LoginActivity — 아이디+비밀번호 Primary, 패스키 Secondary
 *
 * 키보드가 열리면 환영 문구·패스키·회원가입을 숨기고, 아이디 포커스 시 CTA는 `다음`.
 */
import { useEffect, useRef, type FormEvent } from 'react'
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
const ERROR_SCROLL_MARGIN_PX = 28

function scrollErrorIntoContent(element: HTMLElement) {
  const container = element.closest('.keyboard-resize-activity__content')
  if (!(container instanceof HTMLElement)) {
    element.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    return
  }

  const targetRect = element.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  const overflow = targetRect.bottom - containerRect.bottom + ERROR_SCROLL_MARGIN_PX
  if (overflow <= 0) return
  container.scrollBy({ top: overflow, behavior: 'smooth' })
}

const LoginActivity: ActivityComponentType<'Login'> = () => {
  const screen = useLoginScreen()
  const isNextStep = screen.primaryCtaLabel === '다음'
  const loginIdFieldRef = useRef<HTMLDivElement>(null)
  const passwordFieldRef = useRef<HTMLDivElement>(null)
  const formErrorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const target = screen.loginIdError
      ? loginIdFieldRef.current
      : screen.passwordError
        ? passwordFieldRef.current
        : screen.formError
          ? formErrorRef.current
          : null
    if (!target) return
    const frame = window.requestAnimationFrame(() => scrollErrorIntoContent(target))
    return () => window.cancelAnimationFrame(frame)
  }, [screen.loginIdError, screen.passwordError, screen.formError])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (isNextStep) {
      screen.goToPasswordField()
      return
    }
    void screen.handlePasswordLogin()
  }

  return (
    <>
      <ActivityScreenLayout
        title={screen.isCompact ? 'BRIT 로그인' : '로그인'}
        bottomCTABehavior="keyboardAdaptive"
        fixedBottom={
          <VStack gap="x3" width="full">
            <BottomActionButton
              type={isNextStep ? 'button' : 'submit'}
              form={isNextStep ? undefined : LOGIN_FORM_ID}
              size="large"
              variant="brandSolid"
              loading={screen.isSubmitting}
              onClick={isNextStep ? screen.goToPasswordField : undefined}
            >
              {screen.primaryCtaLabel}
            </BottomActionButton>

            {!screen.isCompact ? (
              <>
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

                <HStack width="full" align="center" justify="center" gap="x1" pt="x1">
                  <Text textStyle="t4Regular" color="fg.neutralMuted">
                    계정이 없으신가요?
                  </Text>
                  <TextLinkButton onClick={screen.goSignup}>회원가입</TextLinkButton>
                </HStack>
              </>
            ) : null}
          </VStack>
        }
      >
        <VStack
          as="form"
          id={LOGIN_FORM_ID}
          px="spacingX.globalGutter"
          pt="x4"
          pb="x8"
          gap={screen.isCompact ? 'x5' : 'x8'}
          onSubmit={handleSubmit}
        >
          {!screen.isCompact ? (
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
          ) : null}

          <VStack gap="x5">
            <div ref={loginIdFieldRef}>
            <TextField
              label="아이디"
              value={screen.loginId}
              onValueChange={({ value }) => screen.setLoginId(value)}
              invalid={Boolean(screen.loginIdError)}
              errorMessage={screen.loginIdError ?? undefined}
            >
              <TextFieldInput
                ref={screen.loginIdInputRef}
                placeholder="아이디를 입력해 주세요"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="next"
                onFocus={() => screen.setFocusedField('loginId')}
              />
            </TextField>
            </div>

            <div ref={passwordFieldRef}>
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
                ref={screen.passwordInputRef}
                type={screen.showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="비밀번호를 입력해 주세요"
                enterKeyHint="go"
                onFocus={() => screen.setFocusedField('password')}
              />
            </TextField>
            </div>

            {!screen.isCompact ? (
              <HStack justify="flex-end">
                <TextLinkButton onClick={() => screen.setFindSheetOpen(true)}>
                  아이디·비밀번호 찾기
                </TextLinkButton>
              </HStack>
            ) : null}

            {screen.formError ? (
              <div ref={formErrorRef}>
                <Text textStyle="t3Regular" color="fg.critical">
                  {screen.formError}
                </Text>
              </div>
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
