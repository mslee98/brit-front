/**
 * PurchaseRequestAmount — Coin 메인 / KRW 서브.
 */
import { Text, VStack } from '@seed-design/react'

interface PurchaseRequestAmountProps {
  coinLabel: string
  amountLabel: string
}

export function PurchaseRequestAmount({
  coinLabel,
  amountLabel,
}: PurchaseRequestAmountProps) {
  return (
    <VStack gap="x1" align="flex-start" width="full">
      <Text textStyle="t3Regular" color="fg.neutralMuted">
        판매 금액
      </Text>
      <Text textStyle="t7Bold" color="fg.neutral" className="tabular-nums">
        {coinLabel}
      </Text>
      <Text textStyle="t4Regular" color="fg.neutralMuted" className="tabular-nums">
        {amountLabel}
      </Text>
    </VStack>
  )
}
