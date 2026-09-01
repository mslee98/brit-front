import { IconArrowUpLine } from '@karrotmarket/react-monochrome-icon'
import { Float, HStack, Icon } from '@seed-design/react'
import { ActionButton } from 'seed-design/ui/action-button'

interface MatchingNewCandidatesPillProps {
  count: number
  onClick: () => void
}

/** 스크롤 중 새 후보 — Floating Pill */
export function MatchingNewCandidatesPill({ count, onClick }: MatchingNewCandidatesPillProps) {
  if (count <= 0) return null

  return (
    <Float
      placement="top-center"
      offsetY="x4"
      zIndex="var(--app-chrome-z-index)"
      className="matching-new-candidates-pill"
    >
      <ActionButton size="small" variant="neutralWeak" layout="withText" onClick={onClick}>
        <HStack gap="x1" align="center">
          <Icon svg={<IconArrowUpLine />} size="x4" />
          {`새로운 판매자 ${count}명`}
        </HStack>
      </ActionButton>
    </Float>
  )
}
