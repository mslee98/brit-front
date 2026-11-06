import type { KeyboardEvent, ReactNode } from 'react'
import { IconChevronRightLine } from '@karrotmarket/react-monochrome-icon'
import { Badge, Box, HStack, Icon, Text, VStack } from '@seed-design/react'
import { ActionButton } from 'seed-design/ui/action-button'

import { TextLinkButton } from '../../../shared/components/TextLinkButton'
import { formatAmount, formatCoinAmount } from '../../../shared/utils/formatAmount'
import type { MatchingCandidate } from '../matching/types'
import { AMOUNT_DELTA_COLOR, getAmountDelta } from '../utils/formatAmountDelta'
import { MatchingCandidateTagGroup } from './MatchingCandidateTagGroup'

export type MatchingCandidateCardVariant = 'default' | 'pending' | 'locked'

export type MatchingCandidateFooterAction =
  | { kind: 'button'; label: string; onClick: () => void }
  | { kind: 'link'; label: string; onClick: () => void }
  | { kind: 'cancel'; label: string; onClick: () => void }

interface MatchingCandidateCardProps {
  candidate: MatchingCandidate
  requestedAmountKrw: number
  variant?: MatchingCandidateCardVariant
  animate?: boolean
  /** Exact 신규 제안 강조 */
  showNewBadge?: boolean
  onSelect?: (candidate: MatchingCandidate) => void
  footerAction?: MatchingCandidateFooterAction
}

function resolveBorderColor(
  variant: MatchingCandidateCardVariant,
  isExact: boolean,
): 'stroke.neutralWeak' | 'stroke.brandWeak' {
  if (variant === 'pending' || isExact) return 'stroke.brandWeak'
  return 'stroke.neutralWeak'
}

function CandidateContent({
  candidate,
  requestedAmountKrw,
  variant,
  showNewBadge,
}: {
  candidate: MatchingCandidate
  requestedAmountKrw: number
  variant: MatchingCandidateCardVariant
  showNewBadge?: boolean
}) {
  const isExact = candidate.matchType === 'EXACT'
  const amountDelta = getAmountDelta(requestedAmountKrw, candidate.amountKrw)

  return (
    <VStack gap="x2" align="flex-start" width="full" flexGrow={1}>
      <HStack justify="space-between" align="center" width="full" gap="x2">
        <HStack gap="x2" align="center" flexWrap="wrap">
          {showNewBadge && (
            <Badge tone="informative" variant="weak" size="medium">
              새 제안
            </Badge>
          )}
          {isExact ? (
            <Badge tone="brand" variant="weak" size="medium">
              정확 매칭
            </Badge>
          ) : (
            <Text textStyle="t5Bold" color="fg.neutral">
              {candidate.nickname}
            </Text>
          )}
        </HStack>
        {!isExact && (
          <Badge tone="neutral" variant="weak" size="medium">
            비슷한 금액
          </Badge>
        )}
      </HStack>

      {isExact && (
        <Text textStyle="t6Bold" color="fg.neutral" className="tabular-nums">
          {formatCoinAmount(candidate.amountKrw)}
        </Text>
      )}

      {!isExact && (
        <Text textStyle="t6Bold" color="fg.neutral" className="tabular-nums">
          {formatAmount(candidate.amountKrw)}
        </Text>
      )}

      <VStack gap="x0_5" align="flex-start" width="full">
        {isExact ? (
          <Text textStyle="t4Regular" color="fg.neutralMuted" className="tabular-nums">
            {`입금 ${formatAmount(candidate.amountKrw)} · 수수료 없어요`}
          </Text>
        ) : amountDelta ? (
          <Text
            textStyle="t4Medium"
            color={AMOUNT_DELTA_COLOR[amountDelta.direction]}
            className="tabular-nums"
          >
            {amountDelta.label}
          </Text>
        ) : null}
      </VStack>

      <MatchingCandidateTagGroup candidate={candidate} />

      {variant === 'pending' && (
        <Text textStyle="t4Regular" color="fg.informative">
          상대 확인 중이에요
        </Text>
      )}
    </VStack>
  )
}

function FooterAction({ action }: { action: MatchingCandidateFooterAction }) {
  if (action.kind === 'link') {
    return <TextLinkButton onClick={action.onClick}>{action.label}</TextLinkButton>
  }

  return (
    <ActionButton
      size="medium"
      variant={action.kind === 'cancel' ? 'neutralWeak' : 'brandSolid'}
      style={{ width: '100%' }}
      onClick={action.onClick}
    >
      {action.label}
    </ActionButton>
  )
}

export function MatchingCandidateCard({
  candidate,
  requestedAmountKrw,
  variant = 'default',
  animate = false,
  showNewBadge = false,
  onSelect,
  footerAction,
}: MatchingCandidateCardProps) {
  const isLocked = variant === 'locked'
  const isExact = candidate.matchType === 'EXACT'
  const isSelectable = Boolean(onSelect) && !isLocked && variant !== 'pending' && !footerAction

  const rootClassName = [
    animate ? 'matching-candidate-item--enter' : '',
    isLocked ? 'matching-candidate-item--locked' : '',
    variant === 'pending' ? 'matching-candidate-item--pending' : '',
    isSelectable ? 'matching-candidate-item--selectable' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const handleClick = () => {
    if (!isSelectable || !onSelect) return
    onSelect(candidate)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isSelectable || !onSelect) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(candidate)
    }
  }

  let body: ReactNode = (
    <HStack width="full" gap="x3" align="center">
      <CandidateContent
        candidate={candidate}
        requestedAmountKrw={requestedAmountKrw}
        variant={variant}
        showNewBadge={showNewBadge}
      />
      {isSelectable && (
        <Box flexShrink={0}>
          <Icon svg={<IconChevronRightLine />} size="x5" color="fg.neutralSubtle" />
        </Box>
      )}
    </HStack>
  )

  if (footerAction) {
    body = (
      <VStack gap="x3" width="full" align="stretch">
        <CandidateContent
          candidate={candidate}
          requestedAmountKrw={requestedAmountKrw}
          variant={variant}
          showNewBadge={showNewBadge}
        />
        <FooterAction action={footerAction} />
      </VStack>
    )
  }

  return (
    <HStack
      className={rootClassName || undefined}
      width="full"
      p="x4"
      gap="x3"
      align="center"
      bg={isExact && variant !== 'locked' ? 'bg.brandWeak' : 'bg.layerDefault'}
      borderWidth="1"
      borderColor={resolveBorderColor(variant, isExact)}
      borderRadius="r4"
      role={isSelectable ? 'button' : undefined}
      tabIndex={isSelectable ? 0 : undefined}
      onClick={isSelectable ? handleClick : undefined}
      onKeyDown={isSelectable ? handleKeyDown : undefined}
    >
      {body}
    </HStack>
  )
}
