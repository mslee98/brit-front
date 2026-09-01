import { useSyncExternalStore } from 'react'

import {
  beginTradeRequestPending,
  consumeSuggestion,
  endTradeRequestPending,
  proposeMatch,
  getMatchingSession,
  skipCandidate,
  subscribeMatchingSession,
  withdrawProposal,
} from '../matchingSession.store'
import type { MatchingSession } from '../types'

export function useMatchingSession(): MatchingSession | null {
  return useSyncExternalStore(subscribeMatchingSession, getMatchingSession, () => null)
}

export function useMatchingSessionActions() {
  return {
    proposeMatch,
    beginTradeRequestPending,
    endTradeRequestPending,
    withdrawProposal,
    consumeSuggestion,
    skipCandidate,
  }
}
