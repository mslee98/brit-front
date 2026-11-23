/** Embed 충전 금액·잔액 표시 유틸 (D26) */

/** 자주 쓰는 금액 3개 + UI에서 전액 버튼 */
export const AMOUNT_PRESETS = [10_000, 50_000, 100_000] as const

/** KRW 스타일 천단위 쉼표 */
export function formatAmount(raw: string | null | undefined): string {
  if (!raw) return '-'
  try {
    return BigInt(raw).toLocaleString('ko-KR')
  } catch {
    return raw
  }
}

/** @deprecated formatAmount 사용. 호환용 별칭. */
export function formatMsAmount(raw: string | null | undefined): string {
  return formatAmount(raw)
}

export function formatMs(raw: string | null | undefined): string {
  const n = formatAmount(raw)
  return n === '-' ? '-' : `${n} MS`
}

/** merchant §: 1:1 포인트 가정. 사용자 Embed에 수수료 행은 두지 않음. */
export function formatPartnerPoints(raw: string | null | undefined): string {
  const n = formatAmount(raw)
  return n === '-' ? '-' : `${n}P`
}

export function formatPresetLabel(preset: number): string {
  if (preset >= 10_000 && preset % 10_000 === 0) {
    return `+${(preset / 10_000).toLocaleString('ko-KR')}만`
  }
  return `+${preset.toLocaleString('ko-KR')}`
}

export function formatBalanceAfter(
  balanceMs: string | null | undefined,
  debitMs: string | null | undefined,
): string {
  if (!balanceMs || !debitMs) return '-'
  try {
    const after = BigInt(balanceMs) - BigInt(debitMs)
    return after.toLocaleString('ko-KR')
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

/** 프리셋 누적. 잔액 초과 시 null. */
export function addAmountPreset(
  current: string,
  preset: number,
  balanceMs: string | null | undefined,
): string | null {
  try {
    const base =
      current && /^\d+$/.test(current) ? BigInt(current) : 0n
    const next = base + BigInt(preset)
    if (balanceMs != null && next > BigInt(balanceMs)) return null
    return String(next)
  } catch {
    return null
  }
}

export function canAddAmountPreset(
  current: string,
  preset: number,
  balanceMs: string | null | undefined,
): boolean {
  return addAmountPreset(current, preset, balanceMs) != null
}

export function digitsOnly(raw: string): string {
  return raw.replace(/[^\d]/g, '')
}

/** 입력 표시용 — 빈 값은 '', 그 외 천단위 쉼표 */
export function formatAmountInput(raw: string): string {
  if (!raw) return ''
  try {
    return BigInt(raw).toLocaleString('ko-KR')
  } catch {
    return raw
  }
}
