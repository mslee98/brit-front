/**
 * 거래 취소 ResultState copy — 요청 취소(TRADE_REQUEST_CANCELLED_*)와 분리.
 */
import type { TradeRole } from '../types'

export type TradeCancelVariant = 'mutual' | 'self' | 'timeout' | 'dispute'

/** 서버 cancellationReason → UI variant (unknown은 mutual + 원문 표시) */
export function resolveTradeCancelVariant(
  reason: string | null | undefined,
): TradeCancelVariant {
  const text = (reason ?? '').trim()
  if (!text) return 'mutual'
  if (text.includes('거래 당사자 합의')) return 'mutual'
  if (text.includes('입금 전 취소')) return 'self'
  if (text.includes('미입금 확정')) return 'timeout'
  if (
    text.includes('분쟁') ||
    text.includes('운영') ||
    text.includes('확인되지 않') ||
    text.includes('늦은 입금')
  ) {
    return 'dispute'
  }
  // 알 수 없는 reason — 분쟁으로 오인하지 않고 원문을 보여 줌
  return 'mutual'
}

export function getTradeCancelledAppTitle(): string {
  return '거래 취소'
}

export function getTradeCancelledTitle(variant: TradeCancelVariant): string {
  if (variant === 'dispute') return '분쟁 처리가 완료됐어요'
  if (variant === 'timeout') return '거래가 자동으로 취소됐어요'
  return '거래가 취소됐어요'
}

export function getTradeCancelledDescriptionLines(
  variant: TradeCancelVariant,
  role: TradeRole,
  coinLabel: string,
): readonly string[] {
  if (variant === 'dispute') {
    if (role === 'SELLER') {
      return [
        '운영자 확인 결과 이번 거래는 취소됐어요.',
        `판매 중이던 ${coinLabel}은 다시 사용할 수 있어요.`,
      ]
    }
    return [
      '운영자 확인 결과 이번 거래는 취소됐어요.',
      'Coin 지급 없이 거래가 종료됐어요.',
    ]
  }

  if (variant === 'timeout') {
    if (role === 'SELLER') {
      return [
        '제한 시간 안에 거래가 진행되지 않았어요.',
        `${coinLabel}은 다시 사용할 수 있어요.`,
      ]
    }
    return [
      '제한 시간 안에 거래가 진행되지 않았어요.',
      'Coin 지급 없이 거래가 종료됐어요.',
    ]
  }

  // mutual / self — 같은 Hero, 역할별 Coin 결과
  if (role === 'SELLER') {
    return [
      '상대방과의 거래가 종료됐어요.',
      `판매 중이던 ${coinLabel}은 다시 사용할 수 있어요.`,
    ]
  }
  return [
    '상대방과의 거래가 종료됐어요.',
    'Coin 지급 없이 거래가 종료됐어요.',
  ]
}

/** 판매자 전용 — 구매자 취소 화면에서는 Coin 카드를 노출하지 않음 */
export function getTradeCancelledReturnedCoinCopy(coinLabel: string): {
  label: string
  amountLabel: string
  caption: string
} {
  return {
    label: '반환된 Coin',
    amountLabel: coinLabel,
    caption: '판매 가능 상태로 돌아왔어요.',
  }
}

export function getTradeCancelledReasonSectionTitle(variant: TradeCancelVariant): string {
  return variant === 'dispute' ? '처리 결과' : '취소 사유'
}

export function getTradeCancelledReasonBody(
  variant: TradeCancelVariant,
  reasonText: string | null | undefined,
): string {
  const raw = (reasonText ?? '').trim()
  if (variant === 'mutual') {
    return raw || '상대방과 합의하여 거래가 취소됐어요.'
  }
  if (variant === 'self') {
    return raw || '입금 전에 거래가 취소됐어요.'
  }
  if (variant === 'timeout') {
    return raw || '구매자 입금 시간 초과로 거래가 취소됐어요.'
  }
  return raw || '운영자 확인 결과 거래가 취소됐어요.'
}

export function getTradeCancelledConfirmCta(): string {
  return '확인'
}

export function getTradeCancelledTransactionsCta(): string {
  return '거래 내역 보기'
}
