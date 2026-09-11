import { VStack } from '@seed-design/react'

import type { MatchingCandidate } from '../matching/types'
import type { TradeDetailViewModel } from '../types'
import { MatchingFeed } from './MatchingFeed'

interface TradeLegMatchingScreenProps {
  trade: TradeDetailViewModel
  onSelectCandidate?: (candidate: MatchingCandidate) => void
  onChangeConditions?: () => void | Promise<void>
  onStopMatching?: () => void | Promise<void>
  onDensityChange?: (density: import('../hooks/useMatchingDensity').MatchingDensity) => void
}

export function TradeLegMatchingScreen({
  trade,
  onSelectCandidate,
  onChangeConditions,
  onStopMatching,
  onDensityChange,
}: TradeLegMatchingScreenProps) {
  return (
    <VStack flexGrow minHeight="full" gap="x0" style={{ minHeight: 0 }}>
      <MatchingFeed
        trade={trade}
        onSelectCandidate={onSelectCandidate}
        onChangeConditions={onChangeConditions}
        onStopMatching={onStopMatching}
        onDensityChange={onDensityChange}
      />
    </VStack>
  )
}
