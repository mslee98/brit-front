import {
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  NICKNAME_PATTERN,
  LOGIN_ID_PATTERN,
  LOGIN_PASSWORD_MIN_LENGTH,
  LOGIN_PASSWORD_MAX_LENGTH,
} from '../constants'

export function isValidLoginId(loginId: string): boolean {
  return LOGIN_ID_PATTERN.test(loginId.trim())
}

export function isValidNickname(nickname: string): boolean {
  const trimmed = nickname.trim()
  if (trimmed.length < NICKNAME_MIN_LENGTH || trimmed.length > NICKNAME_MAX_LENGTH) {
    return false
  }
  return NICKNAME_PATTERN.test(trimmed)
}

export function isValidLoginPassword(password: string): boolean {
  if (password.length < LOGIN_PASSWORD_MIN_LENGTH) return false
  if (password.length > LOGIN_PASSWORD_MAX_LENGTH) return false
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  return hasLetter && hasNumber
}
