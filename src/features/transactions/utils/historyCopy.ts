import { HISTORY_KIND_LABEL } from '../constants'
import type { HistoryStatus, HistoryTransaction } from '../types'

export function historyStatusLabel(status: HistoryStatus, kind?: HistoryTransaction['kind']): string {
  if (status === 'CHECKING') return '처리 결과를 확인하고 있어요'
  if (status === 'PROCESSING') return '처리 중'
  if (status === 'CANCELLED') return '취소'
  if (status === 'FAILED') return '실패'
  if (kind === 'USER_SALE') return '거래 완료'
  return '완료'
}

export function historyListSubtitle(item: HistoryTransaction): { text: string; emphasize: boolean } {
  const who = item.pointName ?? item.counterpartyName ?? ''
  const status = historyStatusLabel(item.status, item.kind)
  const emphasize = item.status === 'PROCESSING' || item.status === 'CHECKING'
  const text = who ? `${who} · ${status}` : status
  return { text, emphasize }
}

export function historyKindLabel(item: HistoryTransaction): string {
  return HISTORY_KIND_LABEL[item.kind]
}

export function monthComparisonLines(current: number, previous: number): { lead: string; rest: string } {
  const delta = current - previous
  if (delta === 0) {
    return { lead: '지난달과', rest: '거래량이 같아요' }
  }

  const amount = `${Math.abs(delta).toLocaleString('ko-KR')} C`
  return {
    lead: '지난달보다',
    rest: delta > 0 ? `${amount} 더 거래했어요` : `${amount} 덜 거래했어요`,
  }
}
