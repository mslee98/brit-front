import { formatDayHeading, formatTimeOfDay } from '../utils/formatDate'

export function formatChatDateLabel(iso: string): string {
  return formatDayHeading(iso)
}

export function formatChatTimeLabel(iso: string): string {
  return formatTimeOfDay(iso)
}

export function chatDateKey(iso: string): string {
  const date = new Date(iso)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
