/**
 * MatchingWaitingActivity — 후보 피드 / Apply 대기 / 매칭 결과.
 */
import type { ActivityComponentType } from '@stackflow/react'
import { Text, VStack } from '@seed-design/react'

import { ActivityScreenLayout } from '../app/layouts/ActivityScreenLayout'
import { RealtimeConnectionNotice } from '../features/trade/components/RealtimeConnectionNotice'
import { useMatchingWaitingExit } from '../features/orders/hooks/useMatchingWaitingExit'
import { useMatchingWaitingScreen } from '../features/orders/hooks/useMatchingWaitingScreen'
import { BuyMatchingPushEnable } from '../features/pwa/components/PushEnableCard'
import { MatchingAcceptBottomSheet } from '../features/trade/components/MatchingAcceptBottomSheet'
import { MatchingBottomActions } from '../features/trade/components/MatchingBottomActions'
import { MatchingFeed } from '../features/trade/components/MatchingFeed'
import { MatchingLeaveAlertDialog } from '../features/trade/components/MatchingLeaveAlertDialog'
import { TradeCancelAlertDialog } from '../features/trade/components/TradeCancelAlertDialog'
import { TradeRequestCancelledScreen } from '../features/trade/components/TradeRequestCancelledScreen'
import { TradeRequestPendingScreen } from '../features/trade/components/TradeRequestPendingScreen'
import {
  TRADE_REQUEST_CANCELLED_BROWSE_MARKET,
  TRADE_REQUEST_CANCELLED_FIND_SELLERS,
  TRADE_REQUEST_PENDING_APP_TITLE,
} from '../features/trade/copy'
import { BottomActionButton } from '../shared/ui/BottomActionButton'

const MatchingWaitingActivity: ActivityComponentType<'MatchingWaiting'> = () => {
  const screen = useMatchingWaitingScreen()
  const exit = useMatchingWaitingExit(screen.phase)

  const title =
    screen.phase === 'matched'
      ? '매칭 완료'
      : screen.phase === 'requestPending' || screen.phase === 'requestCancelled'
        ? TRADE_REQUEST_PENDING_APP_TITLE
        : screen.phase === 'expired'
          ? '매칭 종료'
          : screen.phase === 'cancelled'
            ? '매칭 취소'
            : '거래 찾기'

  const showFeed = screen.phase === 'searching' && screen.browseTrade
  const isSearching = screen.phase === 'searching'
  const isRequestPending = screen.phase === 'requestPending'
  const isRequestCancelled = screen.phase === 'requestCancelled'

  const fixedBottom = isSearching ? (
    <MatchingBottomActions
      disabled={screen.isCancelling}
      onStopMatching={() => exit.setStopDialogOpen(true)}
    />
  ) : isRequestPending ? undefined : isRequestCancelled ? (
    <VStack gap="x2">
      <BottomActionButton
        size="large"
        variant="brandSolid"
        onClick={screen.handleRetrySearch}
      >
        {TRADE_REQUEST_CANCELLED_FIND_SELLERS}
      </BottomActionButton>
      <BottomActionButton
        size="large"
        variant="neutralOutline"
        onClick={screen.handleBrowseMarket}
      >
        {TRADE_REQUEST_CANCELLED_BROWSE_MARKET}
      </BottomActionButton>
    </VStack>
  ) : screen.phase === 'expired' ? (
    <VStack gap="x2">
      <BottomActionButton
        size="large"
        variant="brandSolid"
        onClick={screen.handleRetry}
      >
        다시 구매하기
      </BottomActionButton>
      <BottomActionButton
        size="large"
        variant="neutralWeak"
        onClick={screen.handleGoHome}
      >
        홈으로
      </BottomActionButton>
    </VStack>
  ) : screen.phase === 'matched' && screen.tradeId ? (
    <VStack gap="x2">
      <BottomActionButton
        size="large"
        variant="brandSolid"
        onClick={screen.handleGoToTrade}
      >
        거래 진행하기
      </BottomActionButton>
      <BottomActionButton
        size="large"
        variant="neutralWeak"
        onClick={screen.handleGoHome}
      >
        나중에 할게요
      </BottomActionButton>
    </VStack>
  ) : (
    <BottomActionButton
      size="large"
      variant="brandSolid"
      onClick={screen.handleGoHome}
    >
      홈으로
    </BottomActionButton>
  )

  return (
    <ActivityScreenLayout
      title={title}
      topNotice={<RealtimeConnectionNotice />}
      leftAction={exit.showsCloseAction ? 'close' : 'back'}
      onClose={exit.showsCloseAction ? exit.handleExitIntent : undefined}
      appScreenProps={{
        preventSwipeBack: exit.preventSwipeBack,
      }}
      fixedBottom={fixedBottom}
    >
      {showFeed ? (
        <>
          <MatchingFeed
            trade={screen.browseTrade!}
            onSelectCandidate={screen.handleSelectCandidate}
            onChangeConditions={screen.handleChangeConditions}
            onStopMatching={screen.handleCancelMatching}
            onDensityChange={screen.handleDensityChange}
            hideStopCta
            onRequestStopMatching={() => exit.setStopDialogOpen(true)}
          />
          <MatchingAcceptBottomSheet
            open={screen.acceptSheet.acceptOpen}
            onOpenChange={screen.acceptSheet.onAcceptOpenChange}
            candidate={screen.acceptSheet.acceptCandidate}
            onConfirm={screen.acceptSheet.onAcceptConfirm}
            onSkip={screen.acceptSheet.onAcceptSkip}
          />
          <MatchingLeaveAlertDialog
            open={exit.leaveDialogOpen}
            onOpenChange={exit.setLeaveDialogOpen}
            onConfirmLeave={exit.handleConfirmLeave}
          />
          <TradeCancelAlertDialog
            open={exit.stopDialogOpen}
            onOpenChange={exit.setStopDialogOpen}
            variant="matching"
            onConfirm={() => void screen.handleCancelMatching()}
          />
        </>
      ) : isRequestPending ? (
        <TradeRequestPendingScreen
          candidate={screen.pendingCandidate}
          expiresAt={screen.pendingExpiresAt}
          countdownPaused={screen.countdownPaused}
          cancelLoading={screen.isCancelling}
          cancelSheetOpen={exit.cancelSheetOpen}
          onCancelSheetOpenChange={exit.setCancelSheetOpen}
          onCancelConfirm={screen.handleCancelTradeRequest}
        />
      ) : isRequestCancelled ? (
        <TradeRequestCancelledScreen />
      ) : (
        <VStack
          px="spacingX.globalGutter"
          pt="x6"
          pb="x4"
          gap="x3"
          flexGrow
          minHeight="full"
        >
          {screen.phase === 'searching' && (
            <>
              <Text textStyle="t7Bold" color="fg.neutral">
                조건에 맞는 판매자를 찾고 있어요
              </Text>
              <Text textStyle="t5Regular" color="fg.neutralMuted">
                잠시만 기다려 주세요.
              </Text>
              <BuyMatchingPushEnable />
            </>
          )}

          {screen.phase === 'matched' && (
            <>
              <Text textStyle="t7Bold" color="fg.neutral">
                판매자와 매칭됐어요
              </Text>
              <Text textStyle="t5Regular" color="fg.neutralMuted">
                입금·확인은 다음 단계에서 이어가요.
              </Text>
            </>
          )}

          {screen.phase === 'expired' && (
            <>
              <Text textStyle="t7Bold" color="fg.neutral">
                탐색 시간이 끝났어요
              </Text>
              <Text textStyle="t5Regular" color="fg.neutralMuted">
                금액을 바꿔 다시 시도해 보세요.
              </Text>
            </>
          )}

          {screen.phase === 'cancelled' && (
            <>
              <Text textStyle="t7Bold" color="fg.neutral">
                매칭을 취소했어요
              </Text>
              <Text textStyle="t5Regular" color="fg.neutralMuted">
                필요할 때 다시 구매를 시작해 주세요.
              </Text>
            </>
          )}
        </VStack>
      )}
    </ActivityScreenLayout>
  )
}

export default MatchingWaitingActivity
