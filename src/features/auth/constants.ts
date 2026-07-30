export const SIGNUP_IDENTITY_FORM_ID = 'signup-identity-form'

export type CarrierCode = 'SKT' | 'KT' | 'LGU' | 'SKT_MVNO' | 'KT_MVNO' | 'LGU_MVNO'

export const CARRIERS: Array<{ code: CarrierCode; label: string }> = [
  { code: 'SKT', label: 'SKT' },
  { code: 'KT', label: 'KT' },
  { code: 'LGU', label: 'LG U+' },
  { code: 'SKT_MVNO', label: 'SKT 알뜰폰' },
  { code: 'KT_MVNO', label: 'KT 알뜰폰' },
  { code: 'LGU_MVNO', label: 'LG U+ 알뜰폰' },
]

export type SignupIdentityStep = 'name' | 'rrn' | 'carrier' | 'phone'
export type SignupAccountStep = 'bank' | 'accountNumber'
export type SignupPinStep = 'create' | 'confirm'
export type SignupCredentialsStep = 'loginId' | 'nickname' | 'password'
export type AccountRecoveryStep = 'phone' | 'verify' | 'password' | 'done'
/** P2 패스키 로그인 노출·활성. false면 Secondary 버튼 비활성 */
export const PASSKEY_LOGIN_ENABLED = false
export type NicknameCheckState =
  | 'idle'
  | 'checking'
  | 'available'
  | 'duplicated'
  | 'invalid'
  | 'error'

export type LoginIdCheckState = NicknameCheckState

export const NICKNAME_MIN_LENGTH = 2
export const NICKNAME_MAX_LENGTH = 12
/** 한글·영문·숫자·밑줄 */
export const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9_]{2,12}$/

export const LOGIN_ID_MIN_LENGTH = 4
export const LOGIN_ID_MAX_LENGTH = 20
/** 소문자 영문·숫자·밑줄 */
export const LOGIN_ID_PATTERN = /^[a-z0-9_]{4,20}$/

export const LOGIN_PASSWORD_MIN_LENGTH = 8
export const LOGIN_PASSWORD_MAX_LENGTH = 72

export const SIGNUP_CREDENTIALS_COPY = {
  loginId: {
    title: '로그인 아이디를 정해 주세요',
    description: 'BRIT에 로그인할 때 사용하는 아이디예요.',
  },
  nickname: {
    title: '거래에 사용할 닉네임을 정해 주세요',
    description: '다른 사용자에게는 실명 대신 닉네임이 표시돼요.',
  },
  password: {
    title: '로그인 비밀번호를 만들어 주세요',
    description: '아이디와 함께 BRIT에 로그인할 때 사용해요.',
  },
} as const

export const IDENTITY_STEPS: SignupIdentityStep[] = ['name', 'rrn', 'carrier', 'phone']

export const NEXT_IDENTITY_STEP: Partial<Record<SignupIdentityStep, SignupIdentityStep>> = {
  name: 'rrn',
  rrn: 'carrier',
  carrier: 'phone',
}

export const PREV_IDENTITY_STEP: Partial<Record<SignupIdentityStep, SignupIdentityStep>> = {
  rrn: 'name',
  carrier: 'rrn',
  phone: 'carrier',
}

export function getIdentityStepIndex(step: SignupIdentityStep): number {
  return IDENTITY_STEPS.indexOf(step)
}

export function isIdentityStepRevealed(
  activeStep: SignupIdentityStep,
  target: SignupIdentityStep,
): boolean {
  return getIdentityStepIndex(activeStep) >= getIdentityStepIndex(target)
}

export const IDENTITY_STEP_INDEX: Record<SignupIdentityStep, number> = {
  name: 1,
  rrn: 2,
  carrier: 3,
  phone: 4,
}

export const CTA_LABEL_BY_IDENTITY_STEP: Record<SignupIdentityStep, string> = {
  name: '주민등록번호 입력하기',
  rrn: '통신사 선택하기',
  /** carrier는 시트를 여는 CTA — phone으로 넘어가기 전 선택 유도 */
  carrier: '통신사 선택하기',
  phone: '계정 설정하기',
}

export type SignupTermsItemId =
  | 'service'
  | 'privacy'
  | 'uniqueIdentifier'
  | 'bankAccount'
  | 'marketing'

/** Nest consents.items.documentVersion */
export const CONSENT_DOCUMENT_VERSION = '1.0'

export type NestConsentType =
  | 'SERVICE'
  | 'PRIVACY'
  | 'UNIQUE_IDENTIFIER'
  | 'BANK_ACCOUNT'
  | 'MARKETING'

export const TERMS_ID_TO_CONSENT_TYPE: Record<SignupTermsItemId, NestConsentType> = {
  service: 'SERVICE',
  privacy: 'PRIVACY',
  uniqueIdentifier: 'UNIQUE_IDENTIFIER',
  bankAccount: 'BANK_ACCOUNT',
  marketing: 'MARKETING',
}

export interface SignupTermsItem {
  id: SignupTermsItemId
  label: string
  required: boolean
  /** 법무 확정 전 플레이스홀더 본문 */
  detailTitle: string
  detailBody: string
}

export const SIGNUP_TERMS_ITEMS: SignupTermsItem[] = [
  {
    id: 'service',
    label: '서비스 이용약관',
    required: true,
    detailTitle: '서비스 이용약관',
    detailBody:
      'Brit 서비스 이용과 관련된 기본 약관입니다. 법무 검토 후 최종 문구로 교체해요.',
  },
  {
    id: 'privacy',
    label: '개인정보 수집 및 이용',
    required: true,
    detailTitle: '개인정보 수집 및 이용',
    detailBody:
      '회원가입·거래에 필요한 개인정보 수집·이용 안내입니다. 법무 검토 후 최종 문구로 교체해요.',
  },
  {
    id: 'uniqueIdentifier',
    label: '고유식별정보 처리',
    required: true,
    detailTitle: '고유식별정보 처리',
    detailBody:
      '주민등록번호 등 고유식별정보 처리에 대한 동의입니다. 법무 검토 후 최종 문구로 교체해요.',
  },
  {
    id: 'bankAccount',
    label: '계좌 정보 수집 및 이용',
    required: true,
    detailTitle: '계좌 정보 수집 및 이용',
    detailBody:
      '거래 대금 입출금에 필요한 계좌 정보 수집·이용 안내입니다. 법무 검토 후 최종 문구로 교체해요.',
  },
  {
    id: 'marketing',
    label: '혜택 및 알림 수신',
    required: false,
    detailTitle: '혜택 및 알림 수신',
    detailBody:
      '이벤트·혜택 안내를 받아볼지 선택하는 항목이에요. 가입 후에도 설정에서 변경할 수 있어요.',
  },
]

export const SIGNUP_TERMS_COPY = {
  title: '서비스 이용을 위해 동의가 필요해요',
  description: '필수 항목에 동의하면 가입을 시작할 수 있어요.',
  cta: '동의하고 시작하기',
} as const

export interface IdentityStepCopy {
  screenTitle: string
  screenSubtitle: string
  fieldLabel: string
  fieldDescription?: string
  placeholder?: string
}

export const IDENTITY_STEP_COPY: Record<SignupIdentityStep, IdentityStepCopy> = {
  name: {
    screenTitle: '이름',
    screenSubtitle: '이름을 써주세요.',
    fieldLabel: '이름',
    fieldDescription: '본인 확인에 사용할 실명을 입력해 주세요.',
    placeholder: '홍길동',
  },
  rrn: {
    screenTitle: '주민등록번호',
    screenSubtitle: '주민등록번호 13자리를 입력해 주세요.',
    fieldLabel: '주민등록번호',
    fieldDescription: '생년월일·성별·뒷자리를 모두 입력해 주세요.',
    placeholder: '900101-1234567',
  },
  carrier: {
    screenTitle: '통신사',
    screenSubtitle: '사용 중인 통신사를 선택해 주세요.',
    fieldLabel: '통신사',
    fieldDescription: '가입에 사용할 통신사예요.',
    placeholder: '통신사 선택',
  },
  phone: {
    screenTitle: '휴대폰 번호',
    screenSubtitle: '본인 명의 휴대폰 번호를 입력해 주세요.',
    fieldLabel: '휴대폰 번호',
    fieldDescription: '연락 가능한 번호를 입력해 주세요.',
    placeholder: '010-0000-0000',
  },
}
