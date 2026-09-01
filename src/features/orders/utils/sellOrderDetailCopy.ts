/**
 * SellOrderDetail — 상태·금액을 사용자 문장으로 번역.
 */
import type { SellOrderDto, SellOrderStatus } from '../types'

export type SellOrderEntryContext = 'created' | 'history'

export interface SellOrderDetailCopy {
  headline: string
  subline: string
  statusChip: string
  showSuccessCheck: boolean
  canCancel: boolean
}

function formatCoinLabel(amount: number): string {
  return `${amount.toLocaleString('ko-KR')} Coin`
}

export function resolveSellOrderEntryContext(
  value: string | undefined,
): SellOrderEntryContext {
  return value === 'created' ? 'created' : 'history'
}

export function buildSellOrderDetailCopy(params: {
  order: SellOrderDto
  hasPendingRequest: boolean
  entryContext: SellOrderEntryContext
}): SellOrderDetailCopy {
  const { order, hasPendingRequest, entryContext } = params
  const original = Number(order.amount.original)
  const remaining = Number(order.amount.remaining)
  const amountLabel = formatCoinLabel(original)
  const showSuccessCheck = entryContext === 'created' && order.status === 'OPEN'

  if (order.status === 'CANCELLED') {
    return {
      headline: `${amountLabel} 판매`,
      subline: '판매 등록을 취소했어요.',
      statusChip: '취소됨',
      showSuccessCheck: false,
      canCancel: false,
    }
  }

  if (order.status === 'COMPLETED') {
    return {
      headline: `${amountLabel} 판매`,
      subline: '판매가 완료됐어요.',
      statusChip: '판매 완료',
      showSuccessCheck: false,
      canCancel: false,
    }
  }

  if (hasPendingRequest) {
    return {
      headline: entryContext === 'created' ? `${amountLabel} 판매를 등록했어요` : `${amountLabel} 판매`,
      subline: '구매 요청이 도착했어요.',
      statusChip: '구매 요청 확인',
      showSuccessCheck,
      canCancel: remaining > 0,
    }
  }

  if (isInProgressStatus(order.status)) {
    return {
      headline: `${amountLabel} 판매`,
      subline: '구매자와 거래를 진행 중이에요.',
      statusChip: '거래 진행 중',
      showSuccessCheck: false,
      canCancel: remaining > 0,
    }
  }

  // OPEN + no pending
  if (entryContext === 'created') {
    return {
      headline: `${amountLabel} 판매를 등록했어요`,
      subline: '구매 요청이 들어오면 바로 알려드릴게요.',
      statusChip: '구매자 기다리는 중',
      showSuccessCheck: true,
      canCancel: remaining > 0,
    }
  }

  return {
    headline: `${amountLabel} 판매`,
    subline: '구매자를 기다리고 있어요.',
    statusChip: '구매자 기다리는 중',
    showSuccessCheck: false,
    canCancel: remaining > 0,
  }
}

function isInProgressStatus(status: SellOrderStatus): boolean {
  return status === 'PARTIALLY_MATCHED' || status === 'FULLY_RESERVED'
}

export function buildSellOrderCancelCopy(order: SellOrderDto): {
  title: string
  description: string
} {
  const remaining = Number(order.amount.remaining)
  const reserved = Number(order.amount.reserved)
  const remainingLabel = formatCoinLabel(remaining)

  if (reserved > 0) {
    return {
      title: '판매 등록을 취소할까요?',
      description: `현재 거래 중인 금액은 취소할 수 없어요.\n판매 대기 중인 ${remainingLabel}만 등록에서 제외돼요.`,
    }
  }

  return {
    title: '판매 등록을 취소할까요?',
    description: `아직 거래가 시작되지 않아\n${remainingLabel} 전부를 다시 사용할 수 있어요.`,
  }
}

export function formatSellOrderDateTime(iso: string): string {
  const date = new Date(iso)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}.${month}.${day} ${hours}:${minutes}`
}
