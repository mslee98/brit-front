/**
 * SellOrderInfoRow + SellOrderInfoSheet — 주문번호·등록 일시 등 운영 정보.
 */
import { useRef } from 'react'
import {
  IconCheckmarkClipboardLine,
  IconChevronRightLine,
} from '@karrotmarket/react-monochrome-icon'
import { useActivityZIndexBase } from '@seed-design/stackflow'
import { HStack, Icon, Portal, Text, VStack } from '@seed-design/react'
import {
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetRoot,
} from 'seed-design/ui/bottom-sheet'
import { List, ListDivider, ListItem } from 'seed-design/ui/list'

import { useLayoutOverlay } from '../../../app/layouts/useLayoutOverlay'
import { PressableScale } from '../../../shared/ui/PressableScale'
import { formatCoinAmount } from '../../../shared/utils/formatAmount'
import type { SellOrderDto } from '../types'
import { formatSellOrderDateTime } from '../utils/sellOrderDetailCopy'

interface SellOrderInfoRowProps {
  onOpen: () => void
}

export function SellOrderInfoRow({ onOpen }: SellOrderInfoRowProps) {
  return (
    <PressableScale onClick={onOpen} style={{ width: '100%' }}>
      <HStack
        width="full"
        align="center"
        justify="space-between"
        gap="x3"
        py="x3"
      >
        <HStack gap="x3" align="center" flexGrow minWidth="0">
          <Icon
            svg={<IconCheckmarkClipboardLine />}
            size="x6"
            color="fg.informative"
          />
          <VStack gap="x0_5" align="flex-start" minWidth="0">
            <Text textStyle="t5Bold" color="fg.neutral">
              판매 정보
            </Text>
            <Text textStyle="t3Regular" color="fg.neutralMuted">
              주문번호와 등록 조건을 확인할 수 있어요
            </Text>
          </VStack>
        </HStack>
        <Icon svg={<IconChevronRightLine />} size="x5" color="fg.neutralSubtle" />
      </HStack>
    </PressableScale>
  )
}

interface SellOrderInfoSheetProps {
  open: boolean
  order: SellOrderDto | null
  onOpenChange: (open: boolean) => void
}

export function SellOrderInfoSheet({
  open,
  order,
  onOpenChange,
}: SellOrderInfoSheetProps) {
  const portalContainerRef = useRef<HTMLElement | null>(
    typeof document !== 'undefined' ? document.getElementById('app-frame-portal') : null,
  )
  const layerIndex = useActivityZIndexBase({ activityOffset: 2 })
  useLayoutOverlay(open)

  if (!order) return null

  return (
    <BottomSheetRoot open={open} onOpenChange={onOpenChange}>
      <Portal container={portalContainerRef}>
        <BottomSheetContent
          title="판매 정보"
          layerIndex={layerIndex}
          showHandle
          aria-describedby={undefined}
        >
          <BottomSheetBody>
            <List width="full">
              <ListItem title="주문번호" detail={order.orderNumber} />
              <ListDivider />
              <ListItem
                title="등록 일시"
                detail={formatSellOrderDateTime(order.createdAt)}
              />
              <ListDivider />
              <ListItem
                title="판매 금액"
                detail={formatCoinAmount(Number(order.amount.original))}
              />
            </List>
          </BottomSheetBody>
        </BottomSheetContent>
      </Portal>
    </BottomSheetRoot>
  )
}
