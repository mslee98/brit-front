/**
 * SellOrderDetailActivity — 판매 등록 이후 내 판매 운영 허브.
 */
import { useActivity, type ActivityComponentType } from '@stackflow/react'
import { Text, VStack } from '@seed-design/react'

import { ActivityScreenLayout } from '../app/layouts/ActivityScreenLayout'
import { SellOrderCancelSheet } from '../features/orders/components/SellOrderCancelSheet'
import { SellOrderDetailHero } from '../features/orders/components/SellOrderDetailHero'
import {
  SellOrderInfoRow,
  SellOrderInfoSheet,
} from '../features/orders/components/SellOrderInfoSheet'
import { SellOrderProgressSummary } from '../features/orders/components/SellOrderProgressSummary'
import { SellOrderPurchaseRequestSection } from '../features/orders/components/SellOrderPurchaseRequestSection'
import { useSellOrderDetailScreen } from '../features/orders/hooks/useSellOrderDetailScreen'
import { TradeRequestActionSheet } from '../features/trade/components/TradeRequestActionSheet'
import { BottomActionButton } from '../shared/ui/BottomActionButton'

const SellOrderDetailActivity: ActivityComponentType<'SellOrderDetail'> = () => {
  const screen = useSellOrderDetailScreen()
  const { isRoot } = useActivity()
  const order = screen.order
  const pending = screen.pendingRequest
  const copy = screen.copy
  const dismissToHome = screen.entryContext === 'created' || isRoot

  const fixedBottom = pending ? (
    <VStack gap="x2">
      <BottomActionButton
        size="large"
        variant="brandSolid"
        disabled={screen.isActing}
        onClick={screen.openAcceptSheet}
      >
        수락하기
      </BottomActionButton>
      <BottomActionButton
        size="large"
        variant="neutralWeak"
        disabled={screen.isActing}
        onClick={screen.openRejectSheet}
      >
        거절하기
      </BottomActionButton>
    </VStack>
  ) : copy?.canCancel ? (
    <BottomActionButton
      size="large"
      variant="ghost"
      disabled={screen.isActing}
      onClick={() => screen.setCancelSheetOpen(true)}
    >
      판매 등록 취소
    </BottomActionButton>
  ) : undefined

  return (
    <ActivityScreenLayout
      title="내 판매"
      leftAction={dismissToHome ? 'close' : 'back'}
      onClose={dismissToHome ? screen.handleGoHome : undefined}
      fixedBottom={fixedBottom}
    >
      <VStack
        px="spacingX.globalGutter"
        pt="x6"
        pb="x4"
        gap="x6"
        flexGrow
        minHeight="full"
      >
        {screen.isLoading && !order ? (
          <Text textStyle="t5Regular" color="fg.neutralMuted">
            불러오는 중…
          </Text>
        ) : order && copy ? (
          <>
            <SellOrderDetailHero
              headline={copy.headline}
              subline={copy.subline}
              statusChip={copy.statusChip}
              showSuccessCheck={copy.showSuccessCheck}
            />

            <SellOrderProgressSummary amount={order.amount} />

            <SellOrderPurchaseRequestSection
              pending={pending}
              remainingSec={screen.remainingSec}
            />

            <SellOrderInfoRow onOpen={() => screen.setInfoSheetOpen(true)} />
          </>
        ) : (
          <Text textStyle="t5Regular" color="fg.neutralMuted">
            판매 주문을 찾지 못했어요.
          </Text>
        )}
      </VStack>

      <TradeRequestActionSheet
        open={screen.sheetOpen}
        mode={screen.sheetMode}
        request={pending}
        onOpenChange={screen.handleSheetOpenChange}
        onAccept={screen.handleAccept}
        onReject={screen.handleReject}
      />

      <SellOrderInfoSheet
        open={screen.infoSheetOpen}
        order={order}
        onOpenChange={screen.setInfoSheetOpen}
      />

      <SellOrderCancelSheet
        open={screen.cancelSheetOpen}
        order={order}
        onOpenChange={screen.setCancelSheetOpen}
        onConfirm={screen.handleCancelSellOrder}
      />
    </ActivityScreenLayout>
  )
}

export default SellOrderDetailActivity
