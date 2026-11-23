/**
 * 로그인 자격 검증·에러 문구 — 메인 Login / Embed 로그인 공유.
 */
import { ApiError, API_ERROR_CODES } from '../../../shared/api/errors'
import { isValidLoginId } from './signupAuthValidation'

export const LOGIN_CREDENTIALS_ERROR_MESSAGE =
  '아이디 또는 비밀번호를 확인해 주세요.'
export const LOGIN_RETRY_ERROR_MESSAGE = '잠시 후 다시 시도해 주세요.'
export const LOGIN_PENDING_ERROR_MESSAGE =
  '가입 심사 중이에요. 심사 상태를 확인해 주세요.'

export function messageForLoginError(error: unknown): string {
  if (!(error instanceof ApiError)) return LOGIN_CREDENTIALS_ERROR_MESSAGE

  switch (error.code) {
    case API_ERROR_CODES.NETWORK_ERROR:
    case API_ERROR_CODES.HTTP_ERROR:
      return LOGIN_RETRY_ERROR_MESSAGE
    case API_ERROR_CODES.USER_PENDING:
    case API_ERROR_CODES.ACCOUNT_PENDING:
    case API_ERROR_CODES.WAIT_FOR_APPROVAL:
      return LOGIN_PENDING_ERROR_MESSAGE
    case API_ERROR_CODES.AUTH_INVALID_CREDENTIALS:
    case API_ERROR_CODES.LOGIN_FAILED:
    case API_ERROR_CODES.UNAUTHORIZED:
      if (error.status === 403) return LOGIN_PENDING_ERROR_MESSAGE
      return LOGIN_CREDENTIALS_ERROR_MESSAGE
    default:
      if (error.status === 403) return LOGIN_PENDING_ERROR_MESSAGE
      if (error.status !== undefined && error.status >= 500) {
        return LOGIN_RETRY_ERROR_MESSAGE
      }
      return LOGIN_CREDENTIALS_ERROR_MESSAGE
  }
}

export type LoginFieldErrors = {
  loginIdError: string | null
  passwordError: string | null
}

/** 아이디·비밀번호 필드 검증. 통과 시 에러 null. */
export function validateLoginFields(
  loginId: string,
  password: string,
): LoginFieldErrors {
  const normalized = loginId.trim().toLowerCase()
  let loginIdError: string | null = null
  let passwordError: string | null = null

  if (!normalized) {
    loginIdError = '아이디를 입력해 주세요.'
  } else if (!isValidLoginId(normalized)) {
    loginIdError = '아이디 형식을 확인해 주세요.'
  }

  if (!password) {
    passwordError = '비밀번호를 입력해 주세요.'
  }

  return { loginIdError, passwordError }
}
