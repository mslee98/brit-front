import { AMOUNT_UNIT_KRW } from '../../../shared/constants/money'
import type { TradeSide } from '../types'

export const TRADE_LIMITS = {
  minAmount: AMOUNT_UNIT_KRW,
  maxAmount: 5_000_000,
} as const

/** 구매 빠른 입력 — 현재 금액에 가산 */
export const BUY_QUICK_AMOUNTS = [10_000, 50_000, 100_000, 500_000] as const

/** 판매 빠른 입력 — 판매 가능 잔액 대비 비율 (100 = 전액) */
export const SELL_QUICK_PERCENTS = [25, 50, 75, 100] as const

/** @deprecated BUY_QUICK_AMOUNTS 사용 */
export const QUICK_AMOUNTS = BUY_QUICK_AMOUNTS

/** 현재 수수료 없음 — 자리 고정으로 다크패턴 방지 */
export const TRADE_FEE_KRW = 0 as const

export const TRADE_COMPOSE_COPY = {
  BUY: {
    amountLabel: '구매할 Coin',
    balanceLabel: '사용 가능',
    moneyLabel: '실제 지불 금액',
    resultLabel: '예상 수령량',
    info: '구매는 한 명의 판매자와 전체 금액으로 매칭돼요.',
    cta: '구매 조건 확인',
  },
  SELL: {
    amountLabel: '판매할 Coin',
    balanceLabel: '판매 가능',
    moneyLabel: '예상 수령액',
    resultLabel: '판매 가능 잔액',
    info: '판매는 한 명의 구매자와 전체 금액으로 매칭돼요.',
    cta: '판매 조건 확인',
  },
} as const satisfies Record<
  TradeSide,
  {
    amountLabel: string
    balanceLabel: string
    moneyLabel: string
    resultLabel: string
    info: string
    cta: string
  }
>

/** @deprecated TRADE_COMPOSE_COPY.*.info 사용 */
export const TRADE_COMPOSE_MATCHING_TIP = {
  BUY: TRADE_COMPOSE_COPY.BUY.info,
  SELL: TRADE_COMPOSE_COPY.SELL.info,
} as const
