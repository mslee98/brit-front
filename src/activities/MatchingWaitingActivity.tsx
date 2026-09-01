/**
 * MatchingWaitingActivity — 후보 피드 / Apply 대기 / 매칭 결과.
 */
import type { ActivityComponentType } from '@stackflow/react'
import { Text, VStack } from '@seed-design/react'

import { ActivityScreenLayout } from '../app/layouts/ActivityScreenLayout'
import { useMatchingWaitingScreen } from '../features/orders/hooks/useMatchingWaitingScreen'
import { MatchingAcceptBottomSheet } from '../features/trade/components/MatchingAcceptBottomSheet'
import { MatchingFeed } from '../features/trade/components/MatchingFeed'
import { BottomActionButton } from '../shared/ui/BottomActionButton'

const MatchingWaitingActivity: ActivityComponentType<'MatchingWaiting'> = () => {
  const screen = useMatchingWaitingScreen()

  const title =
    screen.phase === 'matched'
      ? '매칭 완료'
      : screen.phase === 'requestPending'
        ? '수락 대기'
        : screen.phase === 'expired'
          ? '매칭 종료'
          : screen.phase === 'cancelled'
            ? '매칭 취소'
            : '거래 찾기'

  const fixedBottom =
    screen.phase === 'searching' || screen.phase === 'requestPending'
      ? null
      : screen.phase === 'expired' ? (
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

  const showFeed =
    (screen.phase === 'searching' || screen.phase === 'requestPending') &&
    screen.browseTrade

  const isActiveFlow = screen.phase === 'searching' || screen.phase === 'requestPending'

  return (
    <ActivityScreenLayout
      title={title}
      leftAction={isActiveFlow ? 'close' : 'back'}
      onClose={isActiveFlow ? screen.handleGoHome : undefined}
      appScreenProps={{
        preventSwipeBack: isActiveFlow,
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
            onCancelRequest={screen.handleCancelTradeRequest}
          />
          <MatchingAcceptBottomSheet
            open={screen.acceptSheet.acceptOpen}
            onOpenChange={screen.acceptSheet.onAcceptOpenChange}
            candidate={screen.acceptSheet.acceptCandidate}
            onConfirm={screen.acceptSheet.onAcceptConfirm}
            onSkip={screen.acceptSheet.onAcceptSkip}
          />
        </>
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
            </>
          )}

          {screen.phase === 'requestPending' && (
            <>
              <Text textStyle="t7Bold" color="fg.neutral">
                거래 요청을 보냈어요
              </Text>
              <Text textStyle="t5Regular" color="fg.neutralMuted">
                판매자가 수락하면 입금 단계로 이어져요.
              </Text>
              <BottomActionButton
                size="large"
                variant="neutralWeak"
                loading={screen.isCancelling}
                disabled={screen.isCancelling}
                onClick={screen.handleCancelTradeRequest}
              >
                요청 취소
              </BottomActionButton>
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
