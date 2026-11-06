/**
 * SellOrderRow — 거래소·매칭 공용 판매글 행.
 */
import { IconChevronRightLine } from '@karrotmarket/react-monochrome-icon'
import { Badge, HStack, Icon, Text, VStack } from '@seed-design/react'
import { motion } from 'motion/react'
import { Avatar } from 'seed-design/ui/avatar'
import { IdentityPlaceholder } from 'seed-design/ui/identity-placeholder'
import { ListButtonItem } from 'seed-design/ui/list'

import { formatCoinAmount } from '../../../shared/utils/formatAmount'
import {
  formatTradeTrustLine,
  TRADE_TRUST_EMPTY,
} from '../../../shared/utils/formatTradeTrust'
import {
  AMOUNT_DELTA_COLOR,
  type AmountDelta,
  MATCHING_EXACT_MATCH_LABEL,
} from '../../trade/utils/formatAmountDelta'

export interface SellOrderRowProps {
  id: string
  nickname: string
  /** 매칭 후보 신뢰 지표. 거래소(marketplace)는 생략 가능 */
  completedTradeCount?: number
  /** 완료율 % (0이거나 미지정이면 detail에 표시하지 않음) */
  completionRatePct?: number
  /** detail 문구 직접 지정 시 completedTradeCount/completionRatePct보다 우선 */
  trustDetail?: string
  amountKrw: number
  /** Near 후보의 요청 대비 차이 (예: "요청보다 20,000원 적어요") */
  amountDelta?: AmountDelta | null
  matchType?: 'EXACT' | 'NEAR'
  isNew?: boolean
  disabled?: boolean
  animate?: boolean
  onSelect?: () => void
}

function defaultTrustDetail(
  completedTradeCount?: number,
  completionRatePct?: number,
): string {
  return (
    formatTradeTrustLine({ completedTradeCount, completionRatePct }) ?? TRADE_TRUST_EMPTY
  )
}

function AmountSuffix({
  amountKrw,
  amountDelta,
  isExact,
  showChevron,
}: {
  amountKrw: number
  amountDelta?: AmountDelta | null
  isExact: boolean
  showChevron: boolean
}) {
  const matchLabel = isExact ? MATCHING_EXACT_MATCH_LABEL : amountDelta?.label
  const matchLabelColor = isExact
    ? 'fg.brand'
    : amountDelta
      ? AMOUNT_DELTA_COLOR[amountDelta.direction]
      : 'fg.neutralMuted'

  return (
    <HStack gap="x1" align="center">
      <VStack gap="x1" align="flex-end">
        <Text
          textStyle="t5Bold"
          color={isExact ? 'fg.brand' : 'fg.neutral'}
          className="tabular-nums"
        >
          {formatCoinAmount(amountKrw)}
        </Text>
        {matchLabel ? (
          <Text textStyle="t3Medium" color={matchLabelColor} className="tabular-nums">
            {matchLabel}
          </Text>
        ) : null}
      </VStack>
      {showChevron ? (
        <Icon svg={<IconChevronRightLine />} size="x4" color="fg.neutralSubtle" />
      ) : null}
    </HStack>
  )
}

export function SellOrderRow({
  nickname,
  completedTradeCount,
  completionRatePct,
  trustDetail,
  amountKrw,
  amountDelta,
  matchType,
  isNew = false,
  disabled,
  animate = false,
  onSelect,
}: SellOrderRowProps) {
  const isExact = matchType === 'EXACT'

  const title = isNew ? (
    <HStack gap="x2" align="center">
      <Text textStyle="t5Bold" color="fg.neutral">
        {nickname}
      </Text>
      <Badge tone="brand" variant="weak" size="medium">
        새 제안
      </Badge>
    </HStack>
  ) : (
    nickname
  )

  const detail = trustDetail ?? defaultTrustDetail(completedTradeCount, completionRatePct)
  const interactive = typeof onSelect === 'function'

  const row = (
    <ListButtonItem
      alignItems="center"
      prefix={<Avatar size="36" fallback={<IdentityPlaceholder />} />}
      title={title}
      detail={detail}
      suffix={
        <AmountSuffix
          amountKrw={amountKrw}
          amountDelta={amountDelta}
          isExact={isExact}
          showChevron={interactive}
        />
      }
      disabled={disabled}
      onClick={onSelect}
      className="sell-order-row"
    />
  )

  if (!animate) return row

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.2, 0.1, 0.21, 0.99] }}
    >
      {row}
    </motion.div>
  )
}
