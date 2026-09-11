import { IconCheckmarkLine, IconChevronRightLine } from '@karrotmarket/react-monochrome-icon'
import { HStack, Icon, Text } from '@seed-design/react'

import { MATCHING_TYPOGRAPHY } from '../constants/matchingTypography'

interface MatchingCompactConditionProps {
  onChangeConditions?: () => void
}

export function MatchingCompactCondition({ onChangeConditions }: MatchingCompactConditionProps) {
  if (!onChangeConditions) {
    return (
      <HStack
        width="full"
        px="x3"
        py="x3"
        bg="bg.neutralWeak"
        borderRadius="r3"
        align="center"
        gap="x2"
      >
        <Icon svg={<IconCheckmarkLine />} size="x4" color="fg.neutral" />
        <Text textStyle={MATCHING_TYPOGRAPHY.body} color="fg.neutral">
          수수료 없음
        </Text>
      </HStack>
    )
  }

  return (
    <button
      type="button"
      onClick={onChangeConditions}
      className="matching-compact-condition"
      style={{
        display: 'flex',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        padding: '12px',
        border: 'none',
        borderRadius: 'var(--seed-radius-r3)',
        background: 'var(--seed-color-bg-neutral-weak)',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <HStack gap="x2" align="center" style={{ minWidth: 0 }}>
        <Icon svg={<IconCheckmarkLine />} size="x4" color="fg.neutral" />
        <Text textStyle={MATCHING_TYPOGRAPHY.body} color="fg.neutral">
          수수료 없음
        </Text>
      </HStack>
      <HStack gap="x0_5" align="center" flexShrink={0}>
        <Text textStyle="t4Medium" color="fg.brand">
          조건 변경
        </Text>
        <Icon svg={<IconChevronRightLine />} size="x4" color="fg.brand" />
      </HStack>
    </button>
  )
}
