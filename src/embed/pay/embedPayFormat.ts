/** Embed 충전 금액·잔액 표시 유틸 (D26) */

export const AMOUNT_PRESETS = [10_000, 50_000, 100_000, 300_000] as const

export function formatMsAmount(raw: string | null | undefined): string {
  if (!raw) return '-'
  try {
    return BigInt(raw).toLocaleString('ko-KR')
  } catch {
    return raw
  }
}

export function formatMs(raw: string | null | undefined): string {
  const n = formatMsAmount(raw)
  return n === '-' ? '-' : `${n} MS`
}

export function formatBalanceAfter(
  balanceMs: string | null | undefined,
  debitMs: string | null | undefined,
): string {
  if (!balanceMs || !debitMs) return '-'
  try {
    const after = BigInt(balanceMs) - BigInt(debitMs)
    return `${after.toLocaleString('ko-KR')} MS`
  } catch {
    return '-'
  }
}

export function isAmountWithinBalance(
  amount: string,
  balanceMs: string | null | undefined,
): boolean {
  if (!/^[1-9]\d*$/.test(amount) || !balanceMs) return false
  try {
    return BigInt(amount) <= BigInt(balanceMs)
  } catch {
    return false
  }
}

export function digitsOnly(raw: string): string {
  return raw.replace(/[^\d]/g, '')
}
