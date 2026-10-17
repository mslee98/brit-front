export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const

export function toDateKeyFromParts(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** 일요일 시작. 앞뒤 빈 칸은 null. */
export function buildMonthCells(year: number, month: number): Array<number | null> {
  const firstWeekday = new Date(year, month - 1, 1).getDay()
  const days = new Date(year, month, 0).getDate()
  const cells: Array<number | null> = Array.from({ length: firstWeekday }, () => null)

  for (let day = 1; day <= days; day += 1) cells.push(day)
  while (cells.length % 7 !== 0) cells.push(null)

  return cells
}
