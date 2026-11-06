const DAY_MS = 24 * 60 * 60 * 1000

/** 로컬 자정 (ms) — 같은 날 묶기용 키 */
export function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/** now 기준 달력상 며칠 전인지 (오늘 0, 어제 1) */
export function calendarDaysAgo(date: Date, now = new Date()): number {
  return Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS)
}

/** 오후 3:20 */
export function formatTimeOfDay(iso: string): string {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })
}

interface DayHeadingOptions {
  now?: Date
  /** 11월 3일 (화) */
  withWeekday?: boolean
  /** otherYear: 올해가 아니면 연도 표시 */
  year?: 'always' | 'otherYear'
}

/** 목록 날짜 구분선: 오늘 · 어제 · 2026년 11월 3일 */
export function formatDayHeading(
  iso: string,
  { now = new Date(), withWeekday = false, year = 'always' }: DayHeadingOptions = {},
): string {
  const date = new Date(iso)
  const days = calendarDaysAgo(date, now)
  if (days <= 0) return '오늘'
  if (days === 1) return '어제'
  const showYear = year === 'always' || date.getFullYear() !== now.getFullYear()
  const day = date.toLocaleDateString('ko-KR', {
    year: showYear ? 'numeric' : undefined,
    month: 'long',
    day: 'numeric',
  })
  if (!withWeekday) return day
  return `${day} (${date.toLocaleDateString('ko-KR', { weekday: 'short' })})`
}
