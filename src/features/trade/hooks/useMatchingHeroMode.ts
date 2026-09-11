import { useMemo } from 'react'

import type { MatchingDensity } from './useMatchingDensity'

export type MatchingHeroMode = 'large' | 'medium' | 'compact' | 'collapsed' | 'hidden'

const SCROLL_COLLAPSE_PX = 100

/**
 * density·스크롤에 따른 Adaptive Hero 모드.
 * - empty / discovery: large APNG
 * - compact (3~4건): medium 가로 status banner
 * - listFocused (5건+): hidden — CandidateHeader가 상태 표시
 * - PENDING: compact (요청 대기 UI)
 */
export function resolveMatchingHeroMode(params: {
  density: MatchingDensity
  scrollY: number
  isPending: boolean
}): MatchingHeroMode {
  if (params.isPending) return 'compact'

  switch (params.density) {
    case 'empty':
    case 'discovery':
      if (params.scrollY > SCROLL_COLLAPSE_PX) return 'collapsed'
      return 'large'
    case 'compact':
      if (params.scrollY > SCROLL_COLLAPSE_PX) return 'collapsed'
      return 'medium'
    case 'listFocused':
      return 'hidden'
  }
}

export function useMatchingHeroMode(params: {
  density: MatchingDensity
  scrollY: number
  isPending: boolean
}): MatchingHeroMode {
  return useMemo(
    () => resolveMatchingHeroMode(params),
    [params.density, params.scrollY, params.isPending],
  )
}

export const MATCHING_HERO_APNG_SIZE = {
  large: 128,
  medium: 48,
} as const
