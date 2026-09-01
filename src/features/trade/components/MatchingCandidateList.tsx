import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { VStack } from '@seed-design/react'
import { ListHeader } from 'seed-design/ui/list-header'

import type { MatchingCandidate } from '../matching/types'
import { partitionRevealedCandidates } from '../matching/utils/matchingPhase'
import {
  MatchingCandidateCard,
  type MatchingCandidateCardVariant,
  type MatchingCandidateFooterAction,
} from './MatchingCandidateCard'

interface MatchingCandidateListProps {
  candidates: MatchingCandidate[]
  requestedAmountKrw: number
  pendingCandidateId: string | null
  queueLocked: boolean
  animate: boolean
  /** Near·행 탭용 — Exact는 footerAction 우선 */
  onSelectCandidate?: (candidate: MatchingCandidate) => void
  getFooterAction?: (candidate: MatchingCandidate) => MatchingCandidateFooterAction | undefined
  /** Exact에 새 제안 Badge */
  newExactIds?: ReadonlySet<string>
  exactTitle?: string
  nearTitle?: string
}

function RevealedCard({ children, animate }: { children: ReactNode; animate: boolean }) {
  if (!animate) {
    return <>{children}</>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.2, 0.1, 0.21, 0.99] }}
    >
      {children}
    </motion.div>
  )
}

function renderCard(params: {
  candidate: MatchingCandidate
  requestedAmountKrw: number
  pendingCandidateId: string | null
  queueLocked: boolean
  animate: boolean
  onSelectCandidate?: (candidate: MatchingCandidate) => void
  getFooterAction?: (candidate: MatchingCandidate) => MatchingCandidateFooterAction | undefined
  newExactIds?: ReadonlySet<string>
}) {
  const {
    candidate,
    requestedAmountKrw,
    pendingCandidateId,
    queueLocked,
    animate,
    onSelectCandidate,
    getFooterAction,
    newExactIds,
  } = params

  const variant: MatchingCandidateCardVariant =
    pendingCandidateId === candidate.id ? 'pending' : queueLocked ? 'locked' : 'default'
  const footerAction = getFooterAction?.(candidate)
  const showNewBadge = Boolean(newExactIds?.has(candidate.id))

  return (
    <RevealedCard key={candidate.id} animate={animate}>
      <MatchingCandidateCard
        candidate={candidate}
        requestedAmountKrw={requestedAmountKrw}
        variant={variant}
        animate={animate}
        showNewBadge={showNewBadge}
        onSelect={footerAction ? undefined : onSelectCandidate}
        footerAction={footerAction}
      />
    </RevealedCard>
  )
}

export function MatchingCandidateList({
  candidates,
  requestedAmountKrw,
  pendingCandidateId,
  queueLocked,
  animate,
  onSelectCandidate,
  getFooterAction,
  newExactIds,
  exactTitle = '정확 매칭',
  nearTitle = '비슷한 조건',
}: MatchingCandidateListProps) {
  const { exact, near } = partitionRevealedCandidates(candidates, requestedAmountKrw)

  return (
    <VStack gap="x5" width="full">
      {exact.length > 0 && (
        <VStack gap="x3" width="full">
          <ListHeader as="h3" variant="mediumWeak">
            {exactTitle}
          </ListHeader>
          {exact.map((candidate) =>
            renderCard({
              candidate,
              requestedAmountKrw,
              pendingCandidateId,
              queueLocked,
              animate,
              onSelectCandidate,
              getFooterAction,
              newExactIds,
            }),
          )}
        </VStack>
      )}
      {near.length > 0 && (
        <VStack gap="x3" width="full">
          <ListHeader as="h3" variant="mediumWeak">
            {`${nearTitle} ${near.length}건`}
          </ListHeader>
          {near.map((candidate) =>
            renderCard({
              candidate,
              requestedAmountKrw,
              pendingCandidateId,
              queueLocked,
              animate,
              onSelectCandidate,
              getFooterAction: undefined,
              newExactIds,
            }),
          )}
        </VStack>
      )}
    </VStack>
  )
}
