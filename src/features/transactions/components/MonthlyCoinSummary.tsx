import { IconChevronRightLine } from '@karrotmarket/react-monochrome-icon'
import { HStack, Icon, Text, VStack } from '@seed-design/react'

import { formatCoinVolume, formatNetCoin } from '../utils/coinFlow'
import type { MonthCoinSummary } from '../utils/coinFlow'

interface MonthlyCoinSummaryProps {
  summary: MonthCoinSummary
  onOpenAnalysis: () => void
}

export function MonthlyCoinSummary({ summary, onOpenAnalysis }: MonthlyCoinSummaryProps) {
  const netColor = summary.net > 0 ? 'fg.brand' : 'fg.neutral'

  return (
    <VStack align="center" gap="x3" px="spacingX.globalGutter" pt="x2" pb="x5">
      <VStack align="center" gap="x1">
        <Text textStyle="t4Regular" color="fg.neutralSubtle">
          이번 달 Coin 변화
        </Text>
        <Text textStyle="t9Bold" color={netColor} className="tabular-nums">
          {formatNetCoin(summary.net)}
        </Text>
      </VStack>

      <HStack justify="space-between" width="full" pt="x1">
        <VStack gap="x0_5" align="flex-start" flexGrow>
          <Text textStyle="t4Regular" color="fg.neutralSubtle">
            들어옴
          </Text>
          <Text textStyle="t5Bold" color="fg.brand" className="tabular-nums">
            {formatCoinVolume(summary.inflow)}
          </Text>
        </VStack>
        <VStack gap="x0_5" align="flex-end" flexGrow>
          <Text textStyle="t4Regular" color="fg.neutralSubtle">
            나감
          </Text>
          <Text textStyle="t5Bold" color="fg.neutral" className="tabular-nums">
            {formatCoinVolume(summary.outflow)}
          </Text>
        </VStack>
      </HStack>

      <Text textStyle="t3Regular" color="fg.neutralSubtle">
        {summary.count > 0
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
