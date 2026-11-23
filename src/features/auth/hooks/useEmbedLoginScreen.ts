/**
 * useEmbedLoginScreen — Embed 팝업용 로그인.
 * Stackflow/홈 이동 없음. 성공 시 setSession만 하고 팝업 플로우가 이어진다.
 */
import { useRef, useState } from 'react'

import { loginWithPasskey, loginWithPassword } from '../api/auth.api'
import { PASSKEY_LOGIN_ENABLED } from '../constants'
import { setSession } from '../stores/authSession.store'
import {
  messageForLoginError,
  validateLoginFields,
} from '../utils/loginCredentials'
import { ApiError } from '../../../shared/api/errors'
import { useKeyboardInset } from '../../../shared/hooks/useKeyboardInset'

type LoginFocusedField = 'loginId' | 'password' | null

export function useEmbedLoginScreen(pendingMessage: string) {
  const [loginId, setLoginIdState] = useState('')
  const [password, setPasswordState] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginIdError, setLoginIdError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [focusedField, setFocusedField] = useState<LoginFocusedField>(null)
  const loginIdInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const keyboardInset = useKeyboardInset()
  const isCompact = keyboardInset > 0

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
      if (result.nextAction !== 'NONE') {
        setFormError(pendingMessage)
        return
      }
      setSession(result.tokens, result.user, result.nextAction)
    } catch (error) {
      setFormError(messageForLoginError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasskeyLogin = async () => {
    if (!PASSKEY_LOGIN_ENABLED || isSubmitting) return
    setIsSubmitting(true)
    setFormError(null)
    try {
      const result = await loginWithPasskey()
      if (result.nextAction !== 'NONE') {
        setFormError(pendingMessage)
        return
      }
      setSession(result.tokens, result.user, result.nextAction)
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : '패스키로 로그인하지 못했어요. 비밀번호로 시도해 보세요.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const openAuthPath = (path: string) => {
    window.open(
      `${window.location.origin}${path}`,
      '_blank',
      'noopener,noreferrer',
    )
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
    setLoginId,
    setPassword,
    toggleShowPassword: () => setShowPassword((prev) => !prev),
    handlePasswordLogin,
    handlePasskeyLogin,
    openFindLoginId: () => openAuthPath('/auth/find-id'),
    openResetPassword: () => openAuthPath('/auth/recovery'),
    openSignup: () => openAuthPath('/auth/signup/terms'),
    isCompact,
    focusedField,
    setFocusedField,
    loginIdInputRef,
    passwordInputRef,
    goToPasswordField: () => passwordInputRef.current?.focus(),
    primaryCtaLabel: isCompact && focusedField === 'loginId' ? '다음' : '로그인',
  }
}
