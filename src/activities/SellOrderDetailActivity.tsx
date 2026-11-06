/**
 * SellOrderDetailActivity — 판매 등록 이후 내 판매 운영 허브.
 * 구매요청 수락/거절은 GlobalSheetHost(PurchaseRequestSheet)가 담당한다.
 */
import { useActivity, type ActivityComponentType } from '@stackflow/react'
import { Text, VStack } from '@seed-design/react'

import { ActivityScreenLayout } from '../app/layouts/ActivityScreenLayout'
import { RealtimeConnectionNotice } from '../features/trade/components/RealtimeConnectionNotice'
import { SellOrderCancelSheet } from '../features/orders/components/SellOrderCancelSheet'
import { SellOrderContextBlock } from '../features/orders/components/SellOrderContextBlock'
import { SellOrderDetailHero } from '../features/orders/components/SellOrderDetailHero'
import {
  SellOrderInfoRow,
  SellOrderInfoSheet,
} from '../features/orders/components/SellOrderInfoSheet'
import { SellOrderPurchaseRequestSection } from '../features/orders/components/SellOrderPurchaseRequestSection'
import { useSellOrderDetailScreen } from '../features/orders/hooks/useSellOrderDetailScreen'
import { SELL_CLOSED_CTA } from '../features/orders/utils/sellOrderDetailCopy'
import { BottomActionButton } from '../shared/ui/BottomActionButton'
import { goBack } from '../stackflow/navigation'

const SellOrderDetailActivity: ActivityComponentType<'SellOrderDetail'> = () => {
  const screen = useSellOrderDetailScreen()
  const { isRoot } = useActivity()
  const order = screen.order
  const pending = screen.pendingRequest
  const copy = screen.copy
  const dismissToHome = screen.entryContext === 'created' || isRoot

  // WAITING_BUYER만 노출. PURCHASE_REQUEST는 GlobalSheetHost가 결정 UI.
  const showCancelCta = !pending && copy?.canCancel
  const fixedBottom = copy?.isClosed ? (
    <BottomActionButton size="large" variant="neutralWeak" onClick={screen.handleGoHome}>
      {SELL_CLOSED_CTA}
    </BottomActionButton>
  ) : showCancelCta ? (
    <BottomActionButton
      size="large"
      variant="neutralOutline"
      disabled={screen.isActing}
      onClick={() => screen.setCancelSheetOpen(true)}
    >
      판매 등록 취소
    </BottomActionButton>
  ) : undefined

  return (
    <ActivityScreenLayout
      title="내 판매"
      topNotice={<RealtimeConnectionNotice />}
      leftAction={dismissToHome ? 'close' : 'back'}
      onClose={dismissToHome ? goBack : undefined}
      bottomCTABehavior="fixed"
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
              statusTone={copy.statusTone}
              showSuccessCheck={copy.showSuccessCheck}
            />

            <SellOrderPurchaseRequestSection
              pending={pending}
              remainingSec={screen.remainingSec}
              onOpenPending={screen.handleOpenPurchaseRequest}
            />

            {copy.isClosed ? null : (
              <SellOrderContextBlock
                order={order}
                hasPendingRequest={pending !== null}
                sellerProfile={screen.sellerProfile}
              />
            )}

            <SellOrderInfoRow onOpen={() => screen.setInfoSheetOpen(true)} />
          </>
        ) : (
          <Text textStyle="t5Regular" color="fg.neutralMuted">
            판매 주문을 찾지 못했어요.
          </Text>
        )}
      </VStack>

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
