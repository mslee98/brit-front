import { IconChevronRightLine } from '@karrotmarket/react-monochrome-icon'
import { HStack, Icon, Text, VStack } from '@seed-design/react'

import type { TransactionSummary } from '../types'
import { formatCoinVolume, formatNetCoin } from '../utils/coinFlow'

interface MonthlyCoinSummaryProps {
  /** null이면 아직 불러오는 중이거나 실패 */
  summary: TransactionSummary | null
  onOpenAnalysis: () => void
}

export function MonthlyCoinSummary({ summary, onOpenAnalysis }: MonthlyCoinSummaryProps) {
  const net = summary?.net ?? 0
  const netColor = net > 0 ? 'fg.brand' : 'fg.neutral'
  const placeholder = '— C'

  return (
    <VStack align="center" gap="x3" px="spacingX.globalGutter" pt="x2" pb="x5">
      <VStack align="center" gap="x1">
        <Text textStyle="t4Regular" color="fg.neutralSubtle">
          이번 달 Coin 변화
        </Text>
        <Text textStyle="t9Bold" color={netColor} className="tabular-nums">
          {summary ? formatNetCoin(net) : placeholder}
        </Text>
      </VStack>

      <HStack justify="space-between" width="full" pt="x1">
        <VStack gap="x0_5" align="flex-start" flexGrow>
          <Text textStyle="t4Regular" color="fg.neutralSubtle">
            들어옴
          </Text>
          <Text textStyle="t5Bold" color="fg.brand" className="tabular-nums">
            {summary ? formatCoinVolume(summary.inflow) : placeholder}
          </Text>
        </VStack>
        <VStack gap="x0_5" align="flex-end" flexGrow>
          <Text textStyle="t4Regular" color="fg.neutralSubtle">
            나감
          </Text>
          <Text textStyle="t5Bold" color="fg.neutral" className="tabular-nums">
            {summary ? formatCoinVolume(summary.outflow) : placeholder}
          </Text>
        </VStack>
      </HStack>

      <Text textStyle="t3Regular" color="fg.neutralSubtle">
        {!summary
          ? ' '
          : summary.count > 0
            ? `총 ${summary.count}건의 거래가 있었어요`
            : '이번 달 거래가 없어요'}
      </Text>

      <button type="button" className="tx-filter-button" onClick={onOpenAnalysis}>
        <HStack align="center" gap="x0_5">
          <Text textStyle="t4Medium" color="fg.brand">
            거래 분석 보기
          </Text>
          <Icon svg={<IconChevronRightLine />} size="x4" color="fg.brand" />
        </HStack>
      </button>
    </VStack>
  )
}
