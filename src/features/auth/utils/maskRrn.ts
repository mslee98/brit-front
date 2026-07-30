import { extractRrnDigits } from './formatRrn'

export function maskRrn(value: string): string {
  const digits = extractRrnDigits(value)
  if (digits.length < 7) return value
  return `${digits.slice(0, 6)}-${digits[6]}******`
}
