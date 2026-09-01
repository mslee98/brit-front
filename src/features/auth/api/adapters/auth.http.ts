import { httpPost } from '../../../../shared/api/httpClient'
import type {
  AuthMeResult,
  LoginResult,
  RegisterPayload,
  RegisterResult,
  RecoverAccountPayload,
  RecoverAccountResult,
  RegistrationStatusResult,
  RefreshTokensResult,
  ResubmitRegistrationPayload,
  ResubmitRegistrationResult,
} from '../../types/signup'
import { httpGet, httpPatch } from '../../../../shared/api/httpClient'

export async function checkLoginIdHttp(loginId: string): Promise<{ available: boolean }> {
  return httpPost<{ available: boolean }>(
    '/v1/auth/login-id/check',
    { loginId },
    undefined,
    { skipAuth: true },
  )
}

export async function checkNicknameHttp(nickname: string): Promise<{ available: boolean }> {
  return httpPost<{ available: boolean }>(
    '/v1/auth/nickname/check',
    { nickname },
    undefined,
    { skipAuth: true },
  )
}

export async function sendSmsCodeHttp(phone: string): Promise<{ success: true }> {
  return httpPost<{ success: true }>('/v1/auth/sms/send', { phone }, undefined, {
    skipAuth: true,
  })
}

export async function verifySmsCodeHttp(
  phone: string,
  code: string,
): Promise<{ verified: true }> {
  return httpPost<{ verified: true }>(
    '/v1/auth/sms/verify',
    { phone, code },
    undefined,
    { skipAuth: true },
  )
}

export async function registerPinHttp(pin: string): Promise<{ success: true }> {
  return httpPost<{ success: true }>('/v1/auth/pin', { pin })
}

export async function registerHttp(payload: RegisterPayload): Promise<RegisterResult> {
  return httpPost<RegisterResult>('/v1/auth/register', payload, undefined, {
    skipAuth: true,
  })
}

export async function loginWithPasswordHttp(payload: {
  loginId: string
  password: string
}): Promise<LoginResult> {
  return httpPost<LoginResult>('/v1/auth/login', payload, undefined, { skipAuth: true })
}

export async function refreshTokensHttp(refreshToken: string): Promise<RefreshTokensResult> {
  return httpPost<RefreshTokensResult>(
    '/v1/auth/refresh',
    { refreshToken },
    undefined,
    { skipAuth: true },
  )
}

export async function logoutHttp(): Promise<void> {
  await httpPost<void>('/v1/auth/logout')
}

export async function logoutAllHttp(): Promise<void> {
  await httpPost<void>('/v1/auth/logout-all')
}

export async function getMeHttp(): Promise<AuthMeResult> {
  return httpGet<AuthMeResult>('/v1/auth/me')
}

export async function getRegistrationStatusHttp(): Promise<RegistrationStatusResult> {
  return httpGet<RegistrationStatusResult>('/v1/auth/registration-status')
}

export async function resubmitRegistrationHttp(
  payload: ResubmitRegistrationPayload,
): Promise<ResubmitRegistrationResult> {
  return httpPatch<ResubmitRegistrationResult>('/v1/auth/registration', payload)
}

export async function changeTransactionPinHttp(payload: {
  currentPin: string
  newPin: string
}): Promise<{ success: true }> {
  return httpPost<{ success: true }>('/v1/auth/pin', payload)
}

export async function recoverAccountHttp(
  payload: RecoverAccountPayload,
): Promise<RecoverAccountResult> {
  return httpPost<RecoverAccountResult>('/v1/auth/recovery', payload)
}
