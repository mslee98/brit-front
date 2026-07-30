import type { CarrierCode } from '../constants'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresInSec: number
}

export interface AuthUserSummary {
  id: string
  loginId: string
  nickname: string
  phoneE164: string
}

export type ConsentType =
  | 'SERVICE'
  | 'PRIVACY'
  | 'UNIQUE_IDENTIFIER'
  | 'BANK_ACCOUNT'
  | 'MARKETING'

export interface SignupConsentItem {
  consentType: ConsentType
  documentVersion: string
  isAgreed: boolean
}

export interface CompleteSignupPayload {
  identity: {
    name: string
    residentRegistrationNumber: string
    mobileCarrier: CarrierCode
    phone: string
  }
  credentials: {
    loginId: string
    loginPassword: string
    nickname: string
  }
  bankAccount: {
    bankCode: string
    accountNumber: string
    accountHolderName: string
  }
  security: {
    pin: string
  }
  consents: {
    agreedAt: string
    items: SignupConsentItem[]
  }
}

/** Nest signup 성공 — 토큰 없음, 관리자 승인 대기 */
export interface CompleteSignupResult {
  id: string
  loginId: string
  status: 'PENDING' | string
}

export interface LoginResult {
  user: AuthUserSummary
  tokens: AuthTokens
}

export interface RefreshTokensResult {
  accessToken: string
  refreshToken: string
  expiresInSec: number
}

export interface PasskeyListItem {
  id: string
  friendlyName: string
  createdAt: string
  lastUsedAt?: string
}

export interface SessionListItem {
  id: string
  createdAt: string
  userAgent?: string
  isCurrent: boolean
}

export interface RecoverAccountPayload {
  phone: string
  octomoVerified: boolean
  accountNumberLast4: string
  name: string
  birthDate: string
  newLoginPassword: string
}

export interface RecoverAccountResult {
  success: true
  sensitiveActionsLockedUntil: string
}
