/**
 * auth.api
 *
 * 책임: 가입·로그인·패스키·복구·거래 PIN facade
 * 비책임: mock/HTTP/Supabase 구현 (→ adapters)
 *
 * Nest 우선: `VITE_USE_MOCK=true`가 아니면 HTTP. 없으면 mock.
 * Supabase Auth 가입/로그인은 호출하지 않음.
 */
import { shouldUseHttpApi } from '../../../shared/api/apiMode'
import {
  changeTransactionPinHttp,
  checkLoginIdHttp,
  checkNicknameHttp,
  getMeHttp,
  getRegistrationStatusHttp,
  loginWithPasswordHttp,
  logoutHttp,
  logoutAllHttp,
  registerHttp,
  recoverAccountHttp,
  refreshTokensHttp,
  registerPinHttp,
  resubmitRegistrationHttp,
  sendSmsCodeHttp,
  verifySmsCodeHttp,
} from './adapters/auth.http'
import {
  changeTransactionPinMock,
  checkLoginIdMock,
  checkNicknameMock,
  completeSignupMock,
  deletePasskeyMock,
  dismissPasskeyPromptMock,
  listPasskeysMock,
  listSessionsMock,
  loginWithPasskeyMock,
  loginWithPasswordMock,
  logoutMock,
  markPasskeyRegisteredMock,
  recoverAccountMock,
  refreshTokensMock,
  registerPasskeyMock,
  registerPinMock,
  renamePasskeyMock,
  revokeOtherSessionsMock,
  revokeSessionMock,
  sendSmsCodeMock,
  verifySmsCodeMock,
} from './adapters/auth.mock'
import {
  deletePasskeySupabase,
  dismissPasskeyPromptSupabase,
  fetchSensitiveLockSupabase,
  listPasskeysSupabase,
  listSessionsSupabase,
  markPasskeyRegisteredSupabase,
  recoverAccountSupabase,
  registerPasskeySupabase,
  renamePasskeySupabase,
  revokeOtherSessionsSupabase,
  revokeSessionSupabase,
} from './adapters/auth.supabase'
import type {
  AuthMeResult,
  LoginResult,
  PasskeyListItem,
  RegisterPayload,
  RegisterResult,
  RecoverAccountPayload,
  RecoverAccountResult,
  RegistrationStatusResult,
  RefreshTokensResult,
  ResubmitRegistrationPayload,
  ResubmitRegistrationResult,
  SessionListItem,
} from '../types/signup'

function shouldUseSupabaseAuth() {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  )
}

export async function sendSmsCode(phone: string): Promise<{ success: true }> {
  if (shouldUseHttpApi()) return sendSmsCodeHttp(phone)
  return sendSmsCodeMock(phone)
}

export async function verifySmsCode(
  phone: string,
  code: string,
): Promise<{ verified: true }> {
  if (shouldUseHttpApi()) return verifySmsCodeHttp(phone, code)
  return verifySmsCodeMock(phone, code)
}

export async function checkLoginId(loginId: string): Promise<{ available: boolean }> {
  if (shouldUseHttpApi()) return checkLoginIdHttp(loginId)
  return checkLoginIdMock(loginId)
}

export async function checkNickname(nickname: string): Promise<{ available: boolean }> {
  if (shouldUseHttpApi()) return checkNicknameHttp(nickname)
  return checkNicknameMock(nickname)
}

/** @deprecated 가입 완료용 아님 — 거래 PIN 변경은 changeTransactionPin 사용 */
export async function registerPin(pin: string): Promise<{ success: true }> {
  if (shouldUseHttpApi()) return registerPinHttp(pin)
  return registerPinMock(pin)
}

export async function register(
  payload: RegisterPayload,
): Promise<RegisterResult> {
  if (shouldUseHttpApi()) return registerHttp(payload)
  return completeSignupMock(payload)
}

export async function loginWithPassword(payload: {
  loginId: string
  password: string
}): Promise<LoginResult> {
  if (shouldUseHttpApi()) return loginWithPasswordHttp(payload)
  return loginWithPasswordMock(payload)
}

export async function refreshTokens(refreshToken: string): Promise<RefreshTokensResult> {
  if (shouldUseHttpApi()) return refreshTokensHttp(refreshToken)
  return refreshTokensMock(refreshToken)
}

export async function logout(): Promise<void> {
  if (shouldUseHttpApi()) {
    try {
      await logoutHttp()
    } catch {
      // 로컬 세션은 항상 정리
    }
    return
  }
  return logoutMock()
}

export async function logoutAll(): Promise<void> {
  if (shouldUseHttpApi()) {
    try {
      await logoutAllHttp()
    } catch {
      // ignore and let local session clear
    }
    return
  }
  return logoutMock()
}

export async function getMe(): Promise<AuthMeResult> {
  if (shouldUseHttpApi()) return getMeHttp()
  const session = await loginWithPasswordMock({ loginId: 'mock', password: 'mock' })
  return {
    id: session.user.id,
    loginId: session.user.loginId,
    name: '홍길동',
    nickname: session.user.nickname,
    status: 'ACTIVE',
    bankAccount: { status: 'ACTIVE' },
    permissions: { canTrade: true, canUsePartnerExchange: true },
    nextAction: 'NONE',
  }
}

export async function getRegistrationStatus(): Promise<RegistrationStatusResult> {
  if (shouldUseHttpApi()) return getRegistrationStatusHttp()
  return {
    userStatus: 'PENDING',
    bankAccountStatus: 'PENDING_APPROVAL',
    registrationStatus: 'UNDER_REVIEW',
    submittedAt: new Date().toISOString(),
    rejection: null,
  }
}

export async function resubmitRegistration(
  payload: ResubmitRegistrationPayload,
): Promise<ResubmitRegistrationResult> {
  if (shouldUseHttpApi()) return resubmitRegistrationHttp(payload)
  return {
    userId: `mock-${Date.now()}`,
    userStatus: 'PENDING',
    bankAccountStatus: 'PENDING_APPROVAL',
    registrationStatus: 'UNDER_REVIEW',
  }
}

export async function loginWithPasskey(): Promise<LoginResult> {
  return loginWithPasskeyMock()
}

export async function registerPasskeyForCurrentUser(): Promise<{ success: true }> {
  if (shouldUseSupabaseAuth()) return registerPasskeySupabase()
  return registerPasskeyMock()
}

export async function markPasskeyRegistered(): Promise<{ success: true }> {
  if (shouldUseSupabaseAuth()) return markPasskeyRegisteredSupabase()
  return markPasskeyRegisteredMock()
}

export async function dismissPasskeyPrompt(): Promise<{ success: true }> {
  if (shouldUseSupabaseAuth()) return dismissPasskeyPromptSupabase()
  return dismissPasskeyPromptMock()
}

export async function listPasskeys(): Promise<PasskeyListItem[]> {
  if (shouldUseSupabaseAuth()) return listPasskeysSupabase()
  return listPasskeysMock()
}

export async function deletePasskey(id: string): Promise<{ success: true }> {
  if (shouldUseSupabaseAuth()) return deletePasskeySupabase(id)
  return deletePasskeyMock(id)
}

export async function renamePasskey(
  id: string,
  friendlyName: string,
): Promise<{ success: true }> {
  if (shouldUseSupabaseAuth()) return renamePasskeySupabase(id, friendlyName)
  return renamePasskeyMock(id, friendlyName)
}

export async function listSessions(): Promise<SessionListItem[]> {
  if (shouldUseSupabaseAuth()) return listSessionsSupabase()
  return listSessionsMock()
}

export async function revokeSession(id: string): Promise<{ success: true }> {
  if (shouldUseSupabaseAuth()) return revokeSessionSupabase(id)
  return revokeSessionMock(id)
}

export async function revokeOtherSessions(): Promise<{ success: true }> {
  if (shouldUseSupabaseAuth()) return revokeOtherSessionsSupabase()
  return revokeOtherSessionsMock()
}

export async function recoverAccount(
  payload: RecoverAccountPayload,
): Promise<RecoverAccountResult> {
  if (shouldUseHttpApi()) return recoverAccountHttp(payload)
  if (shouldUseSupabaseAuth()) return recoverAccountSupabase(payload)
  return recoverAccountMock(payload)
}

export async function changeTransactionPin(payload: {
  currentPin: string
  newPin: string
}): Promise<{ success: true }> {
  const { assertSensitiveActionAllowed } = await import('../utils/sensitiveActionLock')
  try {
    assertSensitiveActionAllowed()
  } catch {
    const { ApiError, API_ERROR_CODES } = await import('../../../shared/api/errors')
    throw new ApiError(API_ERROR_CODES.SENSITIVE_LOCKED, 'SENSITIVE_LOCKED', 423)
  }
  if (shouldUseHttpApi()) return changeTransactionPinHttp(payload)
  return changeTransactionPinMock(payload)
}

export async function fetchSensitiveLockUntil(): Promise<string | null> {
  if (shouldUseSupabaseAuth()) return fetchSensitiveLockSupabase()
  return null
}
