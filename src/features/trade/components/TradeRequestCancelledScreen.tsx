/**
 * TradeRequestCancelledScreen — 거래 요청 취소 완료.
 */
import type { ReactNode } from 'react'
import { IconMagnifyingglassLine } from '@karrotmarket/react-monochrome-icon'
import { Box, HStack, Icon, Text, VStack } from '@seed-design/react'

import {
  TRADE_REQUEST_CANCELLED_DESCRIPTION,
  TRADE_REQUEST_CANCELLED_HINT_SEARCH,
  TRADE_REQUEST_CANCELLED_HINT_SEARCH_DETAIL,
  TRADE_REQUEST_CANCELLED_TITLE,
} from '../copy'
import { MATCHING_TYPOGRAPHY } from '../constants/matchingTypography'

const MATCHING_CANCEL_ICON_SRC = '/icons/matching-cancel.png'

function CancelledIllustration() {
  return (
    <Box
      width="120px"
      height="120px"
      display="flex"
      alignItems="center"
      justifyContent="center"
      aria-hidden
    >
      <img
        src={MATCHING_CANCEL_ICON_SRC}
        alt=""
        width={120}
        height={120}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </Box>
  )
}

function HintRow({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <HStack gap="x3" align="flex-start" width="full">
      <Box
        width="40px"
        height="40px"
        borderRadius="full"
        bg="bg.informativeWeak"
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
      >
        {icon}
      </Box>
      <VStack gap="x1" align="flex-start" flexGrow minWidth="0">
        <Text textStyle="t4Bold" color="fg.neutral">
          {title}
        </Text>
        <Text textStyle="t3Regular" color="fg.neutralMuted">
          {description}
        </Text>
      </VStack>
    </HStack>
  )
}

export function TradeRequestCancelledScreen() {
  return (
    <VStack
      px="spacingX.globalGutter"
      pt="x8"
      pb="x4"
      gap="x6"
      width="full"
      flexGrow
      align="center"
    >
      <VStack gap="x4" width="full" align="center">
        <CancelledIllustration />
        <VStack gap="x2" width="full" align="center">
          <Text
            textStyle={MATCHING_TYPOGRAPHY.heading}
            color="fg.neutral"
            style={{ textAlign: 'center' }}
          >
            {TRADE_REQUEST_CANCELLED_TITLE}
          </Text>
          <Text
            textStyle={MATCHING_TYPOGRAPHY.helper}
            color="fg.neutralMuted"
            style={{ textAlign: 'center' }}
          >
            {TRADE_REQUEST_CANCELLED_DESCRIPTION}
          </Text>
        </VStack>
      </VStack>

      <VStack gap="x3" width="full" align="flex-start">
        <HintRow
          icon={<Icon svg={<IconMagnifyingglassLine />} size="x5" color="fg.brand" />}
          title={TRADE_REQUEST_CANCELLED_HINT_SEARCH}
          description={TRADE_REQUEST_CANCELLED_HINT_SEARCH_DETAIL}
        />
      </VStack>
    </VStack>
  )
}
