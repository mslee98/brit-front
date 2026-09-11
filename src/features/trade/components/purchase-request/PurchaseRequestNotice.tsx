/**
 * PurchaseRequestNotice — 입금 TTL 안내 (아이콘 없음).
 */
import { Text, VStack } from '@seed-design/react'

const NOTICE_COPY = '수락하면 구매자가 30분 내 입금을 진행할 수 있어요.'

export function PurchaseRequestNotice() {
  return (
    <VStack
      width="full"
      align="flex-start"
      px="x4"
      py="x3"
      borderRadius="r3"
      bg="bg.informativeWeak"
    >
      <Text textStyle="t4Regular" color="fg.informative">
        {NOTICE_COPY}
      </Text>
    </VStack>
  )
}
