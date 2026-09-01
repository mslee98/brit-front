import { useMemo } from 'react'

export type MatchingHeroMode = 'large' | 'medium' | 'compact' | 'collapsed'

const SCROLL_COLLAPSE_PX = 100

/**
 * 후보 수·스크롤에 따른 Adaptive Hero 모드.
 * - 후보 0: large (큰 APNG)
 * - 후보 ≥1: 즉시 compact (리스트가 주인공 — medium 미사용)
 * - PENDING: compact 고정
 * - 스크롤: collapsed sticky
 */
export function resolveMatchingHeroMode(params: {
  exactCount: number
  nearCount: number
  scrollY: number
  isPending: boolean
}): MatchingHeroMode {
  if (params.isPending) return 'compact'

  const total = params.exactCount + params.nearCount
  if (total === 0) return 'large'
  if (params.scrollY > SCROLL_COLLAPSE_PX) return 'collapsed'
  return 'compact'
}

export function useMatchingHeroMode(params: {
  exactCount: number
  nearCount: number
  scrollY: number
  isPending: boolean
}): MatchingHeroMode {
  return useMemo(
    () => resolveMatchingHeroMode(params),
    [params.exactCount, params.nearCount, params.scrollY, params.isPending],
  )
}

export const MATCHING_HERO_APNG_SIZE = {
  large: 128,
  /** @deprecated 결과 시 compact만 사용 — 호환용 유지 */
  medium: 72,
} as const
