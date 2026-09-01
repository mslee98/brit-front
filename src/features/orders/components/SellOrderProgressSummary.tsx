/**
 * SellOrderProgressSummary — 판매 대기 / 거래 중 / 판매 완료.
 */
import {
  IconCheckmarkCircleFill,
  IconTimerLine,
} from '@karrotmarket/react-monochrome-icon'
import { Box, Divider, HStack, Icon, Text, VStack } from '@seed-design/react'

import { formatCoinAmount } from '../../../shared/utils/formatAmount'
import type { SellOrderAmountDto } from '../types'

interface SellOrderProgressSummaryProps {
  amount: SellOrderAmountDto
}

export function SellOrderProgressSummary({ amount }: SellOrderProgressSummaryProps) {
  return (
    <VStack gap="x3" align="flex-start" width="full">
      <Text textStyle="t5Bold" color="fg.neutral">
        판매 현황
      </Text>

      <VStack
        gap="x4"
        width="full"
        p="x4"
        borderRadius="r3"
        borderWidth={1}
        borderColor="stroke.neutralMuted"
        bg="bg.layerDefault"
      >
        <VStack gap="x1" align="flex-start" width="full">
          <Text textStyle="t3Medium" color="fg.informative">
            판매 대기
          </Text>
          <Text textStyle="t8Bold" color="fg.neutral">
            {formatCoinAmount(Number(amount.remaining))}
          </Text>
        </VStack>

        <Divider />

        <HStack gap="x4" width="full" align="flex-start">
          <HStack gap="x2" align="flex-start" flexGrow>
            <Icon svg={<IconTimerLine />} size="x5" color="fg.informative" />
            <VStack gap="x0_5" align="flex-start">
              <Text textStyle="t3Regular" color="fg.neutralMuted">
                거래 중
              </Text>
              <Text textStyle="t5Bold" color="fg.neutral">
                {formatCoinAmount(Number(amount.reserved))}
              </Text>
            </VStack>
          </HStack>

          <Box style={{ width: 1, alignSelf: 'stretch' }} bg="stroke.neutralMuted" />

          <HStack gap="x2" align="flex-start" flexGrow>
            <Icon svg={<IconCheckmarkCircleFill />} size="x5" color="fg.positive" />
            <VStack gap="x0_5" align="flex-start">
              <Text textStyle="t3Regular" color="fg.neutralMuted">
                판매 완료
              </Text>
              <Text textStyle="t5Bold" color="fg.neutral">
                {formatCoinAmount(Number(amount.completed))}
              </Text>
            </VStack>
          </HStack>
        </HStack>
      </VStack>
    </VStack>
  )
}
