import type { TradeStatus } from '../types'

interface TradeStatusCopy {
  badge: string
  title: string
  description: string
}

type TradeRole = 'BUYER' | 'SELLER'

const MATCHING_COPY: Record<TradeRole, TradeStatusCopy> = {
  BUYER: {
    badge: '진행 중',
    title: '판매자를 찾고 있어요',
    description: '비슷한 금액의 거래가 들어오면 연결해드릴게요.',
  },
  SELLER: {
    badge: '진행 중',
    title: '구매자를 찾고 있어요',
    description: '구매자가 나타나면 알려드릴게요.',
  },
}

const PAYMENT_PENDING_COPY: Record<TradeRole, TradeStatusCopy> = {
  BUYER: {
    badge: '진행 중',
    title: '입금해 주세요',
    description: '입금 후 입금했어요를 눌러주세요.',
  },
  SELLER: {
    badge: '진행 중',
    title: '구매자 입금을 기다리고 있어요',
    description: '입금이 확인되면 알려드릴게요.',
  },
}

const PAYMENT_REPORTED_COPY: Record<TradeRole, TradeStatusCopy> = {
  BUYER: {
    badge: '입금 확인 중',
    title: '입금 완료를 알렸어요',
    description: '판매자가 입금을 확인하고 있어요',
  },
  SELLER: {
    badge: '진행 중',
    title: '입금 확인이 필요해요',
    description: '구매자 입금 여부를 확인해 주세요.',
  },
}

const DEFAULT_COPY: TradeStatusCopy = {
  badge: '진행 중',
  title: '거래가 진행 중이에요',
  description: '거래를 이어서 완료해 주세요.',
}

const DISPUTED_COPY: TradeStatusCopy = {
  badge: '분쟁',
  title: '분쟁 진행 중',
  description: '진행 상황을 확인해 주세요',
}

export function getTradeStatusCopy(
  status: TradeStatus,
  role: TradeRole = 'BUYER',
): TradeStatusCopy {
  if (status === 'MATCHING') return MATCHING_COPY[role]
  if (status === 'PAYMENT_PENDING') return PAYMENT_PENDING_COPY[role]
  if (status === 'PAYMENT_REPORTED') return PAYMENT_REPORTED_COPY[role]
  if (status === 'DISPUTED') return DISPUTED_COPY
  return DEFAULT_COPY
}
