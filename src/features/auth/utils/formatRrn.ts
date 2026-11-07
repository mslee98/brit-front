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
