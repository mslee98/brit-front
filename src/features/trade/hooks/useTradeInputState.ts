import { useMemo, useState } from 'react'

import { AMOUNT_UNIT_KRW, COIN_TO_KRW } from '../../../shared/constants/money'
import {
  formatAmountInputDisplay,
  formatAmountNumber,
  isManwonUnitAmount,
  krwToCoin,
  parseAmountInput,
} from '../../../shared/utils/formatAmount'
import { TRADE_LIMITS } from '../constants/tradeCompose'
import type { TradeSide } from '../types'

interface UseTradeInputStateOptions {
  coinBalance: number
  /** Activity params에서 온 초기 side */
  initialSide?: TradeSide
}

function getAmountError(
  amountKrw: number | null,
  side: TradeSide,
  coinBalance: number,
): string | null {
  if (amountKrw === null) return null

  if (!isManwonUnitAmount(amountKrw)) {
    return '10,000원 단위로 입력해 주세요'
  }

  if (amountKrw < TRADE_LIMITS.minAmount) {
    return `${formatAmountNumber(TRADE_LIMITS.minAmount)}원 이상부터 거래할 수 있어요`
  }

  if (amountKrw > TRADE_LIMITS.maxAmount) {
    const maxLabel = formatAmountNumber(TRADE_LIMITS.maxAmount)
    if (side === 'BUY') {
      return `1회 구매 한도를 초과했어요. 최대 ${maxLabel} Coin까지 구매할 수 있어요.`
    }
    return `1회 판매 한도를 초과했어요. 최대 ${maxLabel} Coin까지 판매할 수 있어요.`
  }

  if (side === 'SELL' && krwToCoin(amountKrw) > coinBalance) {
    return `판매 가능 Coin을 초과했어요. 최대 ${formatAmountNumber(coinBalance)} Coin까지 판매할 수 있어요.`
  }

  return null
}

/** 만원 단위로 내림 (비율 칩용) */
function floorToManwon(amount: number): number {
  return Math.floor(amount / AMOUNT_UNIT_KRW) * AMOUNT_UNIT_KRW
}

/**
 * 거래 금액 입력 상태.
 * 구매/판매 모두 1건 전체 금액 매칭만 지원합니다.
 */
export function useTradeInputState({
  coinBalance,
  initialSide = 'BUY',
}: UseTradeInputStateOptions) {
  const [side, setSide] = useState<TradeSide>(initialSide)
  const [amountKrw, setAmountKrw] = useState<number | null>(null)
  const [amountInput, setAmountInput] = useState('')

  const availableKrw = coinBalance * COIN_TO_KRW

  const amountError = useMemo(
    () => getAmountError(amountKrw, side, coinBalance),
    [amountKrw, side, coinBalance],
  )

  const isSubmitDisabled = !amountKrw || !!amountError

  const applyAmount = (next: number) => {
    setAmountKrw(next)
    setAmountInput(formatAmountNumber(next))
  }

  const handleAmountInputChange = (value: string) => {
    const digitsOnly = parseAmountInput(value)
    setAmountInput(formatAmountInputDisplay(digitsOnly))

    if (!digitsOnly) {
      setAmountKrw(null)
      return
    }

    setAmountKrw(Number(digitsOnly))
  }

  /** 구매: 고정 금액 가산 */
  const handleQuickAmountSelect = (amount: number) => {
    const current = amountKrw ?? 0
    applyAmount(current + amount)
  }

  /** 판매: 잔액 대비 비율 (100 = 전액) */
  const handleSellPercentSelect = (percent: number) => {
    const next = floorToManwon(Math.floor((availableKrw * percent) / 100))
    if (next <= 0) {
      setAmountKrw(null)
      setAmountInput('')
      return
    }
    applyAmount(next)
  }

  return {
    side,
    setSide,
    amountKrw,
    amountInput,
    amountError,
    isSubmitDisabled,
    handleAmountInputChange,
    handleQuickAmountSelect,
    handleSellPercentSelect,
  }
}
