import type { ComponentProps, CSSProperties } from 'react'
import type { Text } from '@seed-design/react'

import { SEED_TYPO_ROLES } from '../../../shared/constants/typography'

type TextStyle = NonNullable<ComponentProps<typeof Text>['textStyle']>

/**
 * 매칭 화면 타이포 — 홈·Compose와 동일 SEED 역할 토큰.
 */
export const MATCHING_TYPOGRAPHY = {
  heading: SEED_TYPO_ROLES.pageTitle,
  helper: SEED_TYPO_ROLES.pageDesc,
  body: SEED_TYPO_ROLES.body,
  sectionTitle: SEED_TYPO_ROLES.pageTitle,
  rowTitle: SEED_TYPO_ROLES.rowTitle,
  amount: SEED_TYPO_ROLES.amountInline,
  statValue: 't5Bold',
} as const satisfies Record<string, TextStyle>

/** 수락 대기 카운트다운 — SEED t 스케일 밖 히어로 숫자 (~40px) */
export const TRADE_REQUEST_COUNTDOWN_TYPOGRAPHY = {
  fontSize: '2.5rem',
  lineHeight: 1.1,
  fontWeight: 700,
} as const satisfies CSSProperties
