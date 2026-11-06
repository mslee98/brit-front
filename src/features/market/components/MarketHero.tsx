import { HStack, Text, VStack } from '@seed-design/react'

import { ApngPlayer } from '../../../shared/components/ApngPlayer'
import { MARKET_HERO_SUBTITLE, MARKET_HERO_TITLE } from '../copy'

/** 한 번 재생 후 마지막 프레임(파란 카드 스택)에서 멈춘다 */
const HERO_APNG_SRC = '/motion/account-blue-stack.v1.apng'
const HERO_SIZE = 80

export function MarketHero() {
  return (
    <HStack gap="x3" align="center" justify="space-between" width="full">
      <VStack gap="x1_5" align="flex-start" flexGrow={1} minWidth="0">
        <Text textStyle="t7Bold" color="fg.neutral">
          {MARKET_HERO_TITLE}
        </Text>
        <Text textStyle="t4Regular" color="fg.neutralMuted">
          {MARKET_HERO_SUBTITLE}
        </Text>
      </VStack>
      <ApngPlayer src={HERO_APNG_SRC} size={HERO_SIZE} alt="" />
    </HStack>
  )
}
