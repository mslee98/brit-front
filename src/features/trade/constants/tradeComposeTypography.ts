import type { ComponentProps } from 'react'
import type { Text } from '@seed-design/react'

import { SEED_TYPO_ROLES } from '../../../shared/constants/typography'

type TextStyle = NonNullable<ComponentProps<typeof Text>['textStyle']>

/**
 * TradeCompose 타이포 — MatchingConditionsCard / Profile 카드와 역할 정렬.
 * 금액 입력은 SEED TextField underline large (`AmountHeroField`).
 */
export const TRADE_COMPOSE_TYPOGRAPHY = {
  /** 카드 상단 라벨 (구매할 Coin 등) */
  cardLabel: SEED_TYPO_ROLES.pageDesc,
  /** 잔액 요약 본문 */
  balance: SEED_TYPO_ROLES.pageDesc,
  /** 계산 행 라벨 */
  rowLabel: SEED_TYPO_ROLES.body,
  /** 계산 행 값 */
  rowValue: 't4Medium',
  /** 하단 요약 라벨 */
  summaryLabel: SEED_TYPO_ROLES.body,
  /** 하단 요약 값 (예상 수령량 등) */
  summaryValue: SEED_TYPO_ROLES.rowTitle,
  /** 차단·진행 중 안내 */
  notice: SEED_TYPO_ROLES.body,
  /** @deprecated cardLabel / balance 사용 */
  helper: SEED_TYPO_ROLES.pageDesc,
  /** @deprecated */
  heading: SEED_TYPO_ROLES.pageTitle,
} as const satisfies Record<string, TextStyle>
