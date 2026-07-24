export const API_ERROR_CODES = {
  BANKS_FETCH_FAILED: 'BANKS_FETCH_FAILED',
  HTTP_ERROR: 'HTTP_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  NICKNAME_TAKEN: 'NICKNAME_TAKEN',
  LOGIN_ID_TAKEN: 'LOGIN_ID_TAKEN',
  INVALID_LOGIN_ID: 'INVALID_LOGIN_ID',
  INVALID_NICKNAME: 'INVALID_NICKNAME',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  INVALID_PIN: 'INVALID_PIN',
  INVALID_PHONE: 'INVALID_PHONE',
  INVALID_RRN: 'INVALID_RRN',
  PHONE_EXISTS: 'PHONE_EXISTS',
  IDENTITY_EXISTS: 'IDENTITY_EXISTS',
  CONSENT_REQUIRED: 'CONSENT_REQUIRED',
  OCTOMO_INVALID: 'OCTOMO_INVALID',
  OCTOMO_EXPIRED: 'OCTOMO_EXPIRED',
  ACCOUNT_VERIFY_FAILED: 'ACCOUNT_VERIFY_FAILED',
  ACCOUNT_VERIFY_EXPIRED: 'ACCOUNT_VERIFY_EXPIRED',
  NAME_MISMATCH: 'NAME_MISMATCH',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
  SIGNUP_FAILED: 'SIGNUP_FAILED',
  LOGIN_FAILED: 'LOGIN_FAILED',
  PASSKEY_FAILED: 'PASSKEY_FAILED',
  SENSITIVE_LOCKED: 'SENSITIVE_LOCKED',
  RECOVERY_FAILED: 'RECOVERY_FAILED',
} as const

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES]

const KNOWN_ERROR_CODES = new Set<string>(Object.values(API_ERROR_CODES))

export function toApiErrorCode(raw: string | undefined): ApiErrorCode {
  if (raw && KNOWN_ERROR_CODES.has(raw)) {
    return raw as ApiErrorCode
  }
  return API_ERROR_CODES.HTTP_ERROR
}

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status?: number
  readonly details?: string[]

  constructor(
    code: ApiErrorCode,
    message?: string,
    status?: number,
    details?: string[],
  ) {
    super(message ?? code)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}
