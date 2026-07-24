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

export interface AccountVerifyResult {
  verified: true
  holderName: string
  bankName: string
  accountNumberMasked: string
  accountVerifyToken: string
  expiresInSec: number
}

export interface CompleteSignupPayload {
  identity: {
    name: string
    rrnFront7: string
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
    accountVerifyToken: string
  }
  security: {
    transactionPin: string
  }
  octomo: {
    requestId: string
    verifiedAt: string
  }
  consents: {
    service: boolean
    privacy: boolean
    identity: boolean
    marketing: boolean
    agreedAt: string
  }
}

export interface CompleteSignupResult {
  success: true
  user: AuthUserSummary
  tokens: AuthTokens
}

export interface LoginResult {
  success: true
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
