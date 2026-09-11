import { useEffect } from 'react'
import { useActivity, type ActivityComponentType } from '@stackflow/react'
import { Text, VStack } from '@seed-design/react'

import { ActivityScreenLayout } from '../app/layouts/ActivityScreenLayout'
import { SplitTradeDashboard } from '../features/trade/components/SplitTradeDashboard'
import { TradeLegOverlays } from '../features/trade/components/TradeLegOverlays'
import { TradeRoomScreen } from '../features/trade/components/TradeRoomScreen'
import { useTradeDetail } from '../features/trade/hooks/useTradeDetail'
import { useTradeScreen } from '../features/trade/hooks/useTradeScreen'
import { bootstrapServerTrade } from '../features/trade/stores/tradeSession.store'
import { shouldUseTradesHttpApi } from '../features/trade/api/trades.api'

/**
 * TradeActivity — split 대시보드 + leg micro-flow 시트, 또는 단건 leg 상세.
 *
 * @see docs/architecture/trade-platform-summary.md
 */
const TradeActivity: ActivityComponentType<'Trade'> = () => {
  const screen = useTradeScreen()
  const { isRoot } = useActivity()
  const leftAction = isRoot ? 'close' : 'back'
  const onClose = isRoot ? screen.handleGoHome : undefined
  const singleTradeId = screen.tradeId ?? ''
  const singleTrade = useTradeDetail(singleTradeId)

  // HTTP 모드: 서버 tradeId로 진입 시 세션에 등록
  useEffect(() => {
    if (screen.tradeId && shouldUseTradesHttpApi()) {
      bootstrapServerTrade(screen.tradeId)
    }
  }, [screen.tradeId])

  const overlays = (
    <TradeLegOverlays
      paymentSheetTradeId={screen.paymentSheetTradeId}
      disputeSheetLeg={screen.disputeSheetLeg}
      acceptOpen={screen.acceptOpen}
      acceptCandidate={screen.acceptCandidate}
      onAcceptOpenChange={screen.onAcceptOpenChange}
      onAcceptConfirm={screen.onAcceptConfirm}
      onAcceptSkip={screen.onAcceptSkip}
      onPaymentOpenChange={(open) => {
        if (!open) screen.closePaymentSheet()
      }}
      onDisputeOpenChange={(open) => {
        if (!open) screen.closeDisputeSheet()
      }}
    />
  )

  if (screen.dashboard && !screen.tradeId) {
    return (
      <>
        {overlays}
        <ActivityScreenLayout title="거래" leftAction={leftAction} onClose={onClose}>
          <SplitTradeDashboard
            dashboard={screen.dashboard}
            onLegPrimaryAction={screen.handleLegPrimaryAction}
            onStoreClick={screen.handleBrowseStore}
            onCommunityClick={screen.handleBrowseCommunity}
          />
        </ActivityScreenLayout>
      </>
    )
  }

  if (screen.tradeId && singleTrade.trade) {
    const trade = singleTrade.trade

    return (
      <>
        {overlays}
        <ActivityScreenLayout
          title={
            trade.status === 'MATCHING'
              ? '판매자 찾기'
              : trade.status === 'COMPLETED'
                ? '거래 완료'
                : trade.status === 'CANCELLED'
                  ? '거래 취소'
                  : trade.status === 'DISPUTED'
                    ? '분쟁 검토 중'
                    : trade.status === 'PAYMENT_TIMEOUT'
                      ? '입금 확인 필요'
                      : trade.status === 'COIN_TRANSFERRING'
                        ? '코인 이전 중'
                        : '거래 진행'
          }
          leftAction={leftAction}
          onClose={onClose}
        >
          <TradeRoomScreen
            trade={trade}
            onContinueTrade={screen.handleSingleTradeContinue}
            onGoHome={screen.handleGoHome}
            onSelectMatchingCandidate={screen.openAcceptForCandidate}
            onChangeMatchingConditions={screen.handleChangeMatchingConditions}
            onStopMatching={screen.handleStopMatching}
            onDensityChange={screen.handleDensityChange}
            onBrowseStore={screen.handleBrowseStore}
            onBrowseCommunity={screen.handleBrowseCommunity}
            onCopyAccount={screen.handleCopyAccount}
            onCopyFailed={screen.handleCopyAccountFailed}
            onContactSupport={screen.handleContactSupport}
            onOpenDispute={screen.handleOpenBuyerDispute}
          />
        </ActivityScreenLayout>
      </>
    )
  }

  return (
    <>
      {overlays}
      <ActivityScreenLayout title="거래" leftAction={leftAction} onClose={onClose}>
        <VStack
          px="spacingX.globalGutter"
          pt="spacingY.navToTitle"
          gap="spacingY.betweenText"
        >
          <Text textStyle="t7Bold" color="fg.neutral">
            거래를 찾을 수 없어요
          </Text>
        </VStack>
      </ActivityScreenLayout>
    </>
  )
}

export default TradeActivity
