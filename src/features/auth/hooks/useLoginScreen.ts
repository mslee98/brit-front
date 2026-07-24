/**
 * useLoginScreen
 *
 * 책임: 아이디+비밀번호 로그인(Primary), 패스키 Secondary(미구현 시 비활성)
 * 성공 시 navigateToRootHome으로 스택 정리 (replace('Home')만 하면 depth 잔존)
 */
import { useState } from 'react'
import { useFlow, useStack } from '@stackflow/react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { loginWithPasskey, loginWithPassword } from '../api/auth.api'
import { PASSKEY_LOGIN_ENABLED } from '../constants'
import { setSession } from '../stores/authSession.store'
import { isValidLoginId } from '../utils/signupAuthValidation'
import { showSnackbar } from '../../../shared/utils/showSnackbar'
import { ApiError, API_ERROR_CODES } from '../../../shared/api/errors'
import { navigateToRootHome } from '../../../stackflow/navigateToRootHome'

const CREDENTIALS_ERROR_MESSAGE = '아이디 또는 비밀번호를 확인해 주세요.'
const RETRY_ERROR_MESSAGE = '잠시 후 다시 시도해 주세요.'

function messageForLoginError(error: unknown): string {
  if (!(error instanceof ApiError)) return CREDENTIALS_ERROR_MESSAGE

  switch (error.code) {
    case API_ERROR_CODES.NETWORK_ERROR:
    case API_ERROR_CODES.HTTP_ERROR:
      return RETRY_ERROR_MESSAGE
    case API_ERROR_CODES.INVALID_CREDENTIALS:
    case API_ERROR_CODES.LOGIN_FAILED:
    case API_ERROR_CODES.UNAUTHORIZED:
      return CREDENTIALS_ERROR_MESSAGE
    default:
      if (error.status !== undefined && error.status >= 500) {
        return RETRY_ERROR_MESSAGE
      }
      return CREDENTIALS_ERROR_MESSAGE
  }
}

export function useLoginScreen() {
  const { push, pop } = useFlow()
  const { activities } = useStack()
  const snackbar = useSnackbarAdapter()
  const [loginId, setLoginIdState] = useState('')
  const [password, setPasswordState] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginIdError, setLoginIdError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [findSheetOpen, setFindSheetOpen] = useState(false)

  const finishLogin = (tokens: Parameters<typeof setSession>[0], user: Parameters<typeof setSession>[1]) => {
    setSession(tokens, user)
    navigateToRootHome(activities.length)
  }

  const setLoginId = (value: string) => {
    setLoginIdState(value.toLowerCase())
    setLoginIdError(null)
    setFormError(null)
  }

  const setPassword = (value: string) => {
    setPasswordState(value)
    setPasswordError(null)
    setFormError(null)
  }

  const handlePasswordLogin = async () => {
    if (isSubmitting) return

    const normalized = loginId.trim().toLowerCase()
    let hasFieldError = false

    if (!normalized) {
      setLoginIdError('아이디를 입력해 주세요.')
      hasFieldError = true
    } else if (!isValidLoginId(normalized)) {
      setLoginIdError('아이디 형식을 확인해 주세요.')
      hasFieldError = true
    } else {
      setLoginIdError(null)
    }

    if (!password) {
      setPasswordError('비밀번호를 입력해 주세요.')
      hasFieldError = true
    } else {
      setPasswordError(null)
    }

    if (hasFieldError) return

    setIsSubmitting(true)
    setFormError(null)
    try {
      const result = await loginWithPassword({ loginId: normalized, password })
      finishLogin(result.tokens, result.user)
    } catch (error) {
      setFormError(messageForLoginError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasskeyLogin = async () => {
    if (!PASSKEY_LOGIN_ENABLED || isSubmitting) return
    setIsSubmitting(true)
    try {
      const result = await loginWithPasskey()
      // 세션 없이 홈 진입 금지 — tokens/user가 있을 때만 성공 처리
      finishLogin(result.tokens, result.user)
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : '패스키로 로그인하지 못했어요. 비밀번호로 시도해 보세요.'
      showSnackbar(snackbar, message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const goFindLoginId = () => {
    setFindSheetOpen(false)
    push('AccountRecovery', { step: 'phone' })
  }

  const goResetPassword = () => {
    setFindSheetOpen(false)
    push('AccountRecovery', { step: 'phone' })
  }

  const goSignup = () => push('SignupTerms', {})

  return {
    loginId,
    password,
    showPassword,
    loginIdError,
    passwordError,
    formError,
    isSubmitting,
    passkeyEnabled: PASSKEY_LOGIN_ENABLED,
    findSheetOpen,
    setFindSheetOpen,
    setLoginId,
    setPassword,
    toggleShowPassword: () => setShowPassword((prev) => !prev),
    handlePasswordLogin,
    handlePasskeyLogin,
    goFindLoginId,
    goResetPassword,
    goSignup,
    pop,
  }
}
