import type { CarrierCode } from '../constants'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresInSec: number
}

export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN' | 'REJECTED'
export type UserBankAccountStatus =
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'RETIRED'
  | 'CLOSED'
  | 'REJECTED'
export type AuthNextAction = 'NONE' | 'WAIT_FOR_APPROVAL' | 'ACTION_REQUIRED'
export type RegistrationStatus = 'UNDER_REVIEW' | 'ACTION_REQUIRED' | 'COMPLETED'

export interface AuthUserSummary {
  id: string
  loginId: string
  nickname: string | null
  phoneE164: string
  status?: UserStatus
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

export interface RegisterPayload {
  loginId: string
  password: string
  name: string
  residentRegistrationNumber: string
  mobileCarrier: CarrierCode
  phone: string
  nickname?: string
  bankCode: string
  bankAccountNumber: string
  bankAccountHolderName: string
  pin: string
  consents: Array<{
    type: ConsentType
    version: string
    agreed: boolean
  }>
}

export interface RegisterResult {
  userId: string
  status: UserStatus
  nextAction: AuthNextAction
}

export interface LoginResult {
  user: AuthUserSummary
  tokens: AuthTokens
  nextAction: AuthNextAction
}

export interface RefreshTokensResult {
  accessToken: string
  refreshToken: string
  expiresInSec: number
}

export interface AuthMeResult {
  id: string
  loginId: string
  name: string
  nickname: string | null
  status: UserStatus
  bankAccount: {
    status: UserBankAccountStatus | null
  }
  permissions: {
    canTrade: boolean
    canUsePartnerExchange: boolean
  }
  nextAction: AuthNextAction
}

export interface RegistrationStatusResult {
  userStatus: UserStatus
  bankAccountStatus: UserBankAccountStatus | null
  registrationStatus: RegistrationStatus
  submittedAt: string
  rejection: {
    reason: string | null
    rejectedAt: string | null
  } | null
}

export interface ResubmitRegistrationPayload {
  bankAccount: {
    bankCode: string
    accountNumber: string
    holderName: string
  }
}

export interface ResubmitRegistrationResult {
  userId: string
  userStatus: UserStatus
  bankAccountStatus: UserBankAccountStatus
  registrationStatus: RegistrationStatus
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
