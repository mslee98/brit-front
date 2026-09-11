import { useMemo } from 'react'

/** 후보 수 기반 화면 밀도 — List Focused Matching Screen */
export type MatchingDensity = 'empty' | 'discovery' | 'compact' | 'listFocused'

export function resolveMatchingDensity(candidateCount: number): MatchingDensity {
  if (candidateCount <= 0) return 'empty'
  if (candidateCount <= 2) return 'discovery'
  if (candidateCount <= 4) return 'compact'
  return 'listFocused'
}

export function useMatchingDensity(candidateCount: number): MatchingDensity {
  return useMemo(() => resolveMatchingDensity(candidateCount), [candidateCount])
}

export function isListFocusedDensity(density: MatchingDensity): boolean {
  return density === 'listFocused'
}
