/**
 * SellOrderDetail — 상태·금액을 사용자 문장으로 번역.
 */
import type { SellOrderDto, SellOrderStatus } from '../types'

export type SellOrderEntryContext = 'created' | 'history'

/** 판매하기 진입 시 이미 활성 판매가 있으면 내 판매로 보내며 띄우는 안내 */
export const SELL_ACTIVE_ORDER_NOTICE = '진행 중인 판매가 있어요. 내 판매로 이동할게요.'

export type SellOrderStatusTone = 'neutral' | 'informative' | 'brand' | 'positive'

export interface SellOrderDetailCopy {
  headline: string
  subline: string
  statusChip: string
  statusTone: SellOrderStatusTone
  showSuccessCheck: boolean
  canCancel: boolean
  /** 이 화면에서 더 할 일이 없는 상태(거래 시작·완료·취소). 보는 중에 바뀐 경우에만 노출된다 */
  isClosed: boolean
}

export const SELL_CLOSED_CTA = '홈으로'

export const SELL_REQUEST_TITLE = '구매 요청'
export const SELL_REQUEST_CTA = '요청 확인하기'
export const SELL_REQUEST_FROM_MARKET = '거래소에서 고른 요청'
export const SELL_REQUEST_REMAINING = (countdown: string) => `남은 시간 ${countdown}`

/** 첫 판매(완료 거래 0건) — 요청 이후 흐름 안내 */
export const SELL_GUIDE_TITLE = '요청이 오면 이렇게 진행돼요'
export const SELL_GUIDE_STEPS = [
  '구매 요청이 오면 제한 시간 안에 수락하거나 거절해요.',
  '수락하면 구매자가 입금해요. 알림이 오면 계좌에서 입금액을 확인해 주세요.',
  '입금을 확인하면 Coin이 구매자에게 전달되고 거래가 끝나요.',
] as const

/** 거래 이력 있음 — 거래소 카드 미리보기 */
export const SELL_PREVIEW_TITLE = '구매자에게는 이렇게 보여요'
export const SELL_PREVIEW_HINT =
  '거래소에는 닉네임 일부와 거래 이력, 판매 대기 금액만 공개돼요.'

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
      statusTone: 'neutral',
      showSuccessCheck: false,
      canCancel: false,
      isClosed: true,
    }
  }

  if (order.status === 'COMPLETED') {
    return {
      headline: `${amountLabel} 판매`,
      subline: '판매가 완료됐어요.',
      statusChip: '판매 완료',
      statusTone: 'positive',
      showSuccessCheck: false,
      canCancel: false,
      isClosed: true,
    }
  }

  if (hasPendingRequest) {
    return {
      headline: entryContext === 'created' ? `${amountLabel} 판매를 등록했어요` : `${amountLabel} 판매`,
      subline: '구매 요청이 도착했어요.',
      statusChip: '구매 요청 확인',
      statusTone: 'brand',
      showSuccessCheck,
      canCancel: false,
      isClosed: false,
    }
  }

  if (isInProgressStatus(order.status)) {
    return {
      headline: `${amountLabel} 판매`,
      subline: '거래가 시작됐어요. 홈에서 진행 상황을 확인해 주세요.',
      statusChip: '거래 진행 중',
      statusTone: 'informative',
      showSuccessCheck: false,
      canCancel: false,
      isClosed: true,
    }
  }

  // OPEN + no pending
  if (entryContext === 'created') {
    return {
      headline: `${amountLabel} 판매를 등록했어요`,
      subline: '구매 요청이 들어오면 바로 알려드릴게요.',
      statusChip: '구매자 기다리는 중',
      statusTone: 'informative',
      showSuccessCheck: true,
      canCancel: remaining > 0,
      isClosed: false,
    }
  }

  return {
    headline: `${amountLabel} 판매`,
    subline: '구매자를 기다리고 있어요.',
    statusChip: '구매자 기다리는 중',
    statusTone: 'informative',
    showSuccessCheck: false,
    canCancel: remaining > 0,
    isClosed: false,
  }
}

function isInProgressStatus(status: SellOrderStatus): boolean {
  return status === 'PARTIALLY_MATCHED' || status === 'FULLY_RESERVED'
}

export function buildSellOrderCancelCopy(order: SellOrderDto): {
  title: string
  description: string
} {
  const remainingLabel = formatCoinLabel(Number(order.amount.remaining))

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
