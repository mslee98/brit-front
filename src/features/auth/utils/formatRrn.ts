/** 주민번호 입력 표시용 (최대 13자리, 하이픈) */
export function formatRrnInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 13)
  if (digits.length === 0) return ''
  if (digits.length <= 6) return digits
  return `${digits.slice(0, 6)}-${digits.slice(6)}`
}

export function extractRrnDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 13)
}

/** Nest 제출용 `900101-1234567` */
export function formatResidentRegistrationNumber(digits: string): string {
  const normalized = extractRrnDigits(digits)
  if (normalized.length !== 13) return normalized
  return `${normalized.slice(0, 6)}-${normalized.slice(6)}`
}

export function isValidFullRrn(digits: string): boolean {
  return /^\d{13}$/.test(extractRrnDigits(digits))
}
