import { ApiError, API_ERROR_CODES } from '../../../../shared/api/errors'
import type {
  CompleteSignupPayload,
  CompleteSignupResult,
  LoginResult,
  PasskeyListItem,
  RecoverAccountPayload,
  RecoverAccountResult,
  RefreshTokensResult,
  SessionListItem,
} from '../../types/signup'

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function randomDelay(min = 300, max = 800) {
  return delay(min + Math.floor(Math.random() * (max - min)))
}

const takenNicknames = new Set(['Brit유저', 'admin', '브릿유저'])
const takenLoginIds = new Set(['admin', 'brit', 'test'])

function mockTokens(loginId: string) {
  return {
    accessToken: `mock-access-${loginId}-${Date.now()}`,
    refreshToken: `mock-refresh-${loginId}-${Date.now()}`,
    expiresInSec: 3600,
  }
}

export async function checkLoginIdMock(loginId: string): Promise<{ available: boolean }> {
  await randomDelay(200, 450)
  if (takenLoginIds.has(loginId.trim().toLowerCase())) {
    return { available: false }
  }
  return { available: true }
}

export async function checkNicknameMock(
  nickname: string,
): Promise<{ available: boolean }> {
  await randomDelay(200, 450)
  if (takenNicknames.has(nickname.trim())) {
    return { available: false }
  }
  return { available: true }
}

export async function sendSmsCodeMock(phone: string): Promise<{ success: true }> {
  const mockCode = String(Math.floor(100000 + Math.random() * 900000))
  if (import.meta.env.DEV) {
    console.info(`[mock] SMS code for ${phone}: ${mockCode}`)
  }
  await randomDelay()
  return { success: true }
}

export async function verifySmsCodeMock(
  _phone: string,
  code: string,
): Promise<{ verified: true }> {
  await randomDelay(400, 700)
  if (!/^\d{6}$/.test(code)) {
    throw new Error('INVALID_CODE')
  }
  return { verified: true }
}

export async function registerPinMock(_pin: string): Promise<{ success: true }> {
  await randomDelay(300, 600)
  if (!/^\d{6}$/.test(_pin)) {
    throw new ApiError(API_ERROR_CODES.INVALID_PIN)
  }
  return { success: true }
}

export async function completeSignupMock(
  payload: CompleteSignupPayload,
): Promise<CompleteSignupResult> {
  await randomDelay(500, 900)
  const { loginId, nickname } = payload.credentials
  if (takenLoginIds.has(loginId)) {
    throw new ApiError(API_ERROR_CODES.LOGIN_ID_TAKEN, 'LOGIN_ID_TAKEN', 409)
  }
  if (takenNicknames.has(nickname)) {
    throw new ApiError(API_ERROR_CODES.NICKNAME_TAKEN, 'NICKNAME_TAKEN', 409)
  }
  if (!/^\d{6}$/.test(payload.security.pin)) {
    throw new ApiError(API_ERROR_CODES.INVALID_PIN, 'INVALID_PIN', 400)
  }
  if (payload.bankAccount.accountHolderName !== payload.identity.name) {
    throw new ApiError(API_ERROR_CODES.NAME_MISMATCH, 'NAME_MISMATCH', 422)
  }
  const requiredTypes = ['SERVICE', 'PRIVACY', 'UNIQUE_IDENTIFIER', 'BANK_ACCOUNT'] as const
  const agreed = new Set(
    payload.consents.items.filter((item) => item.isAgreed).map((item) => item.consentType),
  )
  if (!requiredTypes.every((type) => agreed.has(type))) {
    throw new ApiError(API_ERROR_CODES.CONSENT_REQUIRED, 'CONSENT_REQUIRED', 400)
  }
  if (!/^\d{6}-\d{7}$/.test(payload.identity.residentRegistrationNumber)) {
    throw new ApiError(API_ERROR_CODES.INVALID_RRN, 'INVALID_RRN', 400)
  }
  takenLoginIds.add(loginId)
  takenNicknames.add(nickname)
  return {
    id: `mock-${Date.now()}`,
    loginId,
    status: 'PENDING',
  }
}

export async function loginWithPasswordMock(payload: {
  loginId: string
  password: string
}): Promise<LoginResult> {
  await randomDelay(300, 600)
  if (!payload.loginId || !payload.password) {
    throw new ApiError(API_ERROR_CODES.INVALID_CREDENTIALS, 'INVALID_CREDENTIALS', 401)
  }
  return {
    user: {
      id: `mock-user-${payload.loginId}`,
      loginId: payload.loginId,
      nickname: payload.loginId,
      phoneE164: '+821012345678',
    },
    tokens: mockTokens(payload.loginId),
  }
}

export async function refreshTokensMock(refreshToken: string): Promise<RefreshTokensResult> {
  await randomDelay(100, 200)
  if (!refreshToken) {
    throw new ApiError(API_ERROR_CODES.INVALID_REFRESH_TOKEN, 'INVALID_REFRESH_TOKEN', 401)
  }
  return {
    accessToken: `mock-access-refreshed-${Date.now()}`,
    refreshToken: `mock-refresh-rotated-${Date.now()}`,
    expiresInSec: 3600,
  }
}

export async function logoutMock(): Promise<void> {
  await randomDelay(100, 200)
}

export async function loginWithPasskeyMock(): Promise<LoginResult> {
  await randomDelay(400, 800)
  throw new ApiError(API_ERROR_CODES.PASSKEY_FAILED, '패스키는 곧 지원할 예정이에요.')
}

export async function registerPasskeyMock(): Promise<{ success: true }> {
  await randomDelay(400, 800)
  throw new ApiError(API_ERROR_CODES.PASSKEY_FAILED, '패스키는 곧 지원할 예정이에요.')
}

export async function markPasskeyRegisteredMock(): Promise<{ success: true }> {
  return { success: true }
}

export async function dismissPasskeyPromptMock(): Promise<{ success: true }> {
  return { success: true }
}

export async function listPasskeysMock(): Promise<PasskeyListItem[]> {
  await randomDelay(200, 400)
  return []
}

export async function deletePasskeyMock(id: string): Promise<{ success: true }> {
  void id
  await randomDelay(200, 400)
  return { success: true }
}

export async function renamePasskeyMock(
  id: string,
  friendlyName: string,
): Promise<{ success: true }> {
  void id
  void friendlyName
  await randomDelay(200, 400)
  return { success: true }
}

export async function listSessionsMock(): Promise<SessionListItem[]> {
  await randomDelay(200, 400)
  return [
    {
      id: 'sess-current',
      createdAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      isCurrent: true,
    },
  ]
}

export async function revokeSessionMock(id: string): Promise<{ success: true }> {
  void id
  await randomDelay(200, 400)
  return { success: true }
}

export async function revokeOtherSessionsMock(): Promise<{ success: true }> {
  await randomDelay(200, 400)
  return { success: true }
}

export async function recoverAccountMock(
  payload: RecoverAccountPayload,
): Promise<RecoverAccountResult> {
  await randomDelay(500, 900)
  if (!payload.octomoVerified || payload.accountNumberLast4.length !== 4) {
    throw new ApiError(API_ERROR_CODES.RECOVERY_FAILED)
  }
  const lockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  return { success: true, sensitiveActionsLockedUntil: lockedUntil }
}

export async function changeTransactionPinMock(payload: {
  currentPin: string
  newPin: string
}): Promise<{ success: true }> {
  void payload
  await randomDelay(300, 500)
  return { success: true }
}
