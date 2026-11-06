/**
 * MarketActivity — 거래소 browse (공개 매도 + 요약).
 * 매칭 후보 피드와 분리. 선택 시 Apply → MatchingWaiting 수락 대기로 합류.
 * 상단 고정 + 리스트 ScrollFog(useMarketListScrollFog). CTA는 레이아웃 형제.
 */
import type { ActivityComponentType } from '@stackflow/react'
import { IconLightningFill } from '@karrotmarket/react-monochrome-icon'
import { PrefixIcon, ScrollFog, Text, VStack } from '@seed-design/react'

import { ActivityScreenLayout } from '../app/layouts/ActivityScreenLayout'
import { MarketApplyBottomSheet } from '../features/market/components/MarketApplyBottomSheet'
import { MarketHero } from '../features/market/components/MarketHero'
import { MarketModeChips } from '../features/market/components/MarketModeChips'
import { MarketSellOrderList } from '../features/market/components/MarketSellOrderList'
import { MarketSortChips } from '../features/market/components/MarketSortChips'
import { MarketSummaryCard } from '../features/market/components/MarketSummaryCard'
import {
  MARKET_AUTO_FIND_CTA,
  MARKET_EMPTY_HINT,
  MARKET_LOAD_ERROR,
  MARKET_TITLE,
} from '../features/market/copy'
import { useMarketListScrollFog } from '../features/market/hooks/useMarketListScrollFog'
import { useMarketScreen } from '../features/market/hooks/useMarketScreen'
import { BottomActionButton } from '../shared/ui/BottomActionButton'

const MarketActivity: ActivityComponentType<'Market'> = () => {
  const screen = useMarketScreen()
  const scrollFog = useMarketListScrollFog(
    screen.items.length,
    !screen.isLoading && !screen.loadError,
  )

  return (
    <>
      {screen.authRequiredDialog}
      <ActivityScreenLayout
        title={MARKET_TITLE}
        leftAction="back"
        bottomCTABehavior="fixed"
        fixedBottom={
          <BottomActionButton
            size="large"
            variant="brandSolid"
            onClick={screen.handleAutoFind}
          >
            <PrefixIcon svg={<IconLightningFill />} />
            {MARKET_AUTO_FIND_CTA}
          </BottomActionButton>
        }
      >
        <div className="market-screen">
          {screen.isLoading ? (
            <div className="market-screen-status">
              <VStack px="spacingX.globalGutter" pt="x4" pb="x6">
                <Text textStyle="t4Regular" color="fg.neutralMuted">
                  불러오는 중이에요…
                </Text>
              </VStack>
            </div>
          ) : screen.loadError ? (
            <div className="market-screen-status">
              <VStack px="spacingX.globalGutter" pt="x4" pb="x6" gap="x3" align="flex-start">
                <Text textStyle="t4Regular" color="fg.neutralMuted">
                  {MARKET_LOAD_ERROR}
                </Text>
                <BottomActionButton
                  size="large"
                  variant="neutralOutline"
                  onClick={screen.handleRetry}
                >
                  다시 시도
                </BottomActionButton>
              </VStack>
            </div>
          ) : (
            <>
              <div className="market-screen-fixed-top">
                <VStack px="spacingX.globalGutter" pt="x4" gap="x5" width="full">
                  <MarketHero />

                  {screen.summary ? (
                    <MarketSummaryCard
                      availableCoinAmount={screen.summary.availableCoinAmount}
                      availableSellOrderCount={screen.summary.availableSellOrderCount}
                      onOrdersClick={screen.handleScrollToList}
                    />
                  ) : null}

                  <MarketModeChips
                    value={screen.mode}
                    onChange={screen.handleModeChange}
                  />

                  <MarketSortChips value={screen.sort} onChange={screen.setSort} />
                </VStack>
              </div>

              <div className="market-screen-list-host">
                <ScrollFog
                  ref={screen.listScrollRef}
                  placement={scrollFog.placement}
                  sizes={scrollFog.sizes}
                  onScroll={scrollFog.onScroll}
                  hideScrollBar
                  className="market-screen-list-scroll"
                >
                  <div className="market-screen-list-inner" style={scrollFog.listInnerStyle}>
                    <VStack px="spacingX.globalGutter" gap="x2" width="full">
                      <MarketSellOrderList
                        items={screen.items}
                        disabled={screen.isApplying}
                        onSelect={screen.handleSelect}
                      />
                      {screen.items.length === 0 ? (
                        <Text textStyle="t4Regular" color="fg.neutralMuted">
                          {MARKET_EMPTY_HINT}
                        </Text>
                      ) : null}
                    </VStack>
                  </div>
                </ScrollFog>
              </div>
            </>
          )}
        </div>
      </ActivityScreenLayout>

      <MarketApplyBottomSheet
        open={screen.sheetOpen}
        onOpenChange={screen.handleSheetOpenChange}
        listing={screen.selected}
        onConfirm={screen.handleConfirmApply}
      />
    </>
  )
}

export default MarketActivity
