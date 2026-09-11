/** 계좌번호 표시용 하이픈 포맷 (숫자만 추출 후 4자리 단위). */
export function formatAccountNumberDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return raw

  const parts: string[] = []
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4))
  }
  return parts.join('-')
}
