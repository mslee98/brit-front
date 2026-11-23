/**
 * useLoginScreen
 *
 * 책임: 아이디+비밀번호 로그인(Primary), 패스키 Secondary(미구현 시 비활성)
 * 키보드 compact 시 아이디 포커스면 CTA `다음`, 아니면 `로그인`
 * 성공 시 navigateToRootHome으로 스택 정리 (replace('Home')만 하면 depth 잔존)
 */
import { useEffect, useRef, useState } from 'react'
import { useFlow, useStack } from '@stackflow/react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { loginWithPasskey, loginWithPassword } from '../api/auth.api'
import { PASSKEY_LOGIN_ENABLED } from '../constants'
import { resetFindLoginIdDraft } from './useFindLoginIdScreen'
import { resetSignupDraft } from '../stores/signupDraft.store'
import { resetSignupSecrets } from '../stores/signupSecrets.store'
import { setSession } from '../stores/authSession.store'
import {
  messageForLoginError,
  validateLoginFields,
} from '../utils/loginCredentials'
import { showSnackbar } from '../../../shared/utils/showSnackbar'
import { ApiError } from '../../../shared/api/errors'
import { useKeyboardInset } from '../../../shared/hooks/useKeyboardInset'
import { navigateToRootHome } from '../../../stackflow/navigateToRootHome'

type LoginFocusedField = 'loginId' | 'password' | null

export function useLoginScreen() {
  const { push } = useFlow()
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
  const [focusedField, setFocusedField] = useState<LoginFocusedField>(null)
  const loginIdInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const keyboardInset = useKeyboardInset()
  const isCompact = keyboardInset > 0

  useEffect(() => {
    resetSignupDraft()
    resetSignupSecrets()
  }, [])

  const finishLogin = (
    tokens: Parameters<typeof setSession>[0],
    user: Parameters<typeof setSession>[1],
    nextAction: 'NONE' | 'WAIT_FOR_APPROVAL' | 'ACTION_REQUIRED',
  ) => {
    setSession(tokens, user, nextAction)
    if (nextAction === 'NONE') {
      navigateToRootHome(activities.length)
      return
    }
    if (nextAction === 'ACTION_REQUIRED') {
      push('RegistrationStatus', { mode: 'resubmit' })
      return
    }
    push('RegistrationStatus', { mode: 'wait' })
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
    const fieldErrors = validateLoginFields(normalized, password)
    setLoginIdError(fieldErrors.loginIdError)
    setPasswordError(fieldErrors.passwordError)
    if (fieldErrors.loginIdError || fieldErrors.passwordError) return

    setIsSubmitting(true)
    setFormError(null)
    try {
      const result = await loginWithPassword({ loginId: normalized, password })
      finishLogin(result.tokens, result.user, result.nextAction)
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
      finishLogin(result.tokens, result.user, result.nextAction)
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
    resetFindLoginIdDraft()
    push('FindLoginId', { step: 'phone' })
  }

  const goResetPassword = () => {
    setFindSheetOpen(false)
    push('AccountRecovery', { step: 'phone' })
  }

  const goSignup = () => push('SignupTerms', {})

  const goToPasswordField = () => {
    passwordInputRef.current?.focus()
  }

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
    isCompact,
    focusedField,
    setFocusedField,
    loginIdInputRef,
    passwordInputRef,
    goToPasswordField,
    primaryCtaLabel: isCompact && focusedField === 'loginId' ? '다음' : '로그인',
  }
}
