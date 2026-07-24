import type {
  SignupAccountStep,
  SignupCredentialsStep,
  SignupIdentityStep,
  SignupPinStep,
} from '../constants'

/** Activity 단위 진행률 (필드별이 아님) */
export const SIGNUP_PROGRESS_TOTAL = 6

export type SignupProgressInput =
  | { type: 'identity'; step?: SignupIdentityStep }
  | { type: 'sms' }
  | { type: 'account'; step?: SignupAccountStep }
  | { type: 'credentials'; step?: SignupCredentialsStep }
  | { type: 'pin'; step?: SignupPinStep }
  | { type: 'complete' }

const SIGNUP_STEP_LABELS = [
  '본인정보',
  '휴대폰 인증',
  '계정 설정',
  '계좌 연결',
  '거래 PIN',
  '가입 완료',
] as const

export function getSignupProgressStep(input: SignupProgressInput): number {
  switch (input.type) {
    case 'identity':
      return 1
    case 'sms':
      return 2
    case 'credentials':
      return 3
    case 'account':
      return 4
    case 'pin':
      return 5
    case 'complete':
      return 6
    default:
      return 1
  }
}

export function getSignupProgressLabel(currentStep: number): string {
  const clamped = Math.min(Math.max(currentStep, 1), SIGNUP_PROGRESS_TOTAL)
  return `${clamped} / ${SIGNUP_PROGRESS_TOTAL}`
}

export function getSignupProgressStepName(currentStep: number): string {
  const index = Math.min(Math.max(currentStep, 1), SIGNUP_PROGRESS_TOTAL) - 1
  return SIGNUP_STEP_LABELS[index] ?? ''
}
