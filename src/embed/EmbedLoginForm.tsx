import { type FormEvent } from 'react'
import { IconEyeLine, IconEyeSlashLine } from '@karrotmarket/react-monochrome-icon'
import { Box, HStack, Text, VStack } from '@seed-design/react'
import { ActionButton } from 'seed-design/ui/action-button'
import { TextField, TextFieldInput } from 'seed-design/ui/text-field'

import { useEmbedLoginScreen } from '../features/auth/hooks/useEmbedLoginScreen'
import { TextLinkButton } from '../shared/components/TextLinkButton'
import { EmbedShell } from './EmbedShell'

const LOGIN_FORM_ID = 'embed-login-form'

type EmbedLoginFormProps = {
  /** 로그인 안내 부제 (충전/연결 맥락) */
  subtitle: string
  /** nextAction !== NONE 일 때 메시지 */
  pendingMessage: string
  onClose?: () => void
}

/**
 * Embed 팝업 로그인 — 메인 LoginActivity와 같은 필드·에러·패스키 톤.
 * Shell을 포함해 pay/link는 props만 넘긴다. Stackflow는 쓰지 않는다.
 */
export function EmbedLoginForm({
  subtitle,
  pendingMessage,
  onClose,
}: EmbedLoginFormProps) {
  const screen = useEmbedLoginScreen(pendingMessage)
  const isNextStep = screen.primaryCtaLabel === '다음'

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (isNextStep) {
      screen.goToPasswordField()
      return
    }
    void screen.handlePasswordLogin()
  }

  return (
    <EmbedShell
      onClose={onClose}
      stickyFooter
      footer={
        <VStack gap="x3" width="full">
          <ActionButton
            type={isNextStep ? 'button' : 'submit'}
            form={isNextStep ? undefined : LOGIN_FORM_ID}
            size="large"
            variant="brandSolid"
            loading={screen.isSubmitting}
            onClick={isNextStep ? screen.goToPasswordField : undefined}
          >
            {screen.primaryCtaLabel}
          </ActionButton>

          <Box display="flex" alignItems="center" gap="x3" py="x1">
            <Box flexGrow height="1px" bg="stroke.neutralMuted" />
            <Text textStyle="t3Regular" color="fg.neutralSubtle">
              또는
            </Text>
            <Box flexGrow height="1px" bg="stroke.neutralMuted" />
          </Box>

          <VStack gap="x2" width="full">
            <ActionButton
              type="button"
              size="large"
              variant="neutralOutline"
              disabled={!screen.passkeyEnabled || screen.isSubmitting}
              onClick={() => void screen.handlePasskeyLogin()}
            >
              패스키로 로그인
            </ActionButton>
            {!screen.passkeyEnabled ? (
              <Text textStyle="t2Regular" color="fg.neutralSubtle" align="center">
                곧 사용할 수 있어요
              </Text>
            ) : null}
          </VStack>

          <HStack width="full" align="center" justify="center" gap="x3" pt="x1">
            <TextLinkButton
              tone="neutral"
              disabled={screen.isSubmitting}
              onClick={screen.openFindLoginId}
            >
              아이디 찾기
            </TextLinkButton>
            <Text textStyle="t4Regular" color="fg.neutralSubtle">
              ·
            </Text>
            <TextLinkButton
              tone="neutral"
              disabled={screen.isSubmitting}
              onClick={screen.openResetPassword}
            >
              비밀번호 재설정
            </TextLinkButton>
          </HStack>

          <HStack width="full" align="center" justify="center" gap="x1">
            <Text textStyle="t4Regular" color="fg.neutralMuted">
              계정이 없으신가요?
            </Text>
            <TextLinkButton disabled={screen.isSubmitting} onClick={screen.openSignup}>
              회원가입
            </TextLinkButton>
          </HStack>
        </VStack>
      }
    >
      <VStack
        as="form"
        id={LOGIN_FORM_ID}
        gap="x5"
        flexGrow
        onSubmit={handleSubmit}
      >
        <div className="embed-hero">
          <h1 className="embed-hero__title">BRIT에 로그인</h1>
          <p className="embed-hero__subtitle">{subtitle}</p>
          <p className="embed-hero__subtitle">
            패스키를 등록했다면 더 간편하게 로그인할 수 있어요.
          </p>
        </div>

        <VStack gap="x5">
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

          <p
            className="embed-login-form__error"
            role={screen.formError ? 'alert' : undefined}
            aria-live="polite"
          >
            {screen.formError ?? '\u00a0'}
          </p>
        </VStack>
      </VStack>
    </EmbedShell>
  )
}
