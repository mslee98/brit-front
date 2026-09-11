import { useActivity, useFlow } from '@stackflow/react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAuthRequiredPrompt } from '../../auth/hooks/useAuthRequiredPrompt'
import { resetSignupDraft } from '../../auth/stores/signupDraft.store'
import { resetSignupSecrets } from '../../auth/stores/signupSecrets.store'
import { clearAttention } from '../../notifications/hooks/useNotifications'
import { openPurchaseRequestSheet } from '../../trade/stores/sellFlow.store'
import { useAmountReplay } from '../../../shared/hooks/useAmountReplay'
import { shouldUseOrdersHttpApi } from '../../orders/api/orders.api'
import { shouldUseTradesHttpApi } from '../../trade/api/trades.api'
import { useActiveSplitGroup } from '../../trade/hooks/useActiveSplitGroup'
import { useActiveTrade } from '../../trade/hooks/useActiveTrade'
import { useMatchingSession } from '../../trade/matching/hooks/useMatchingSession'
import {
  blocksNewTradeCompose,
  clearActiveTrade,
  isActionableInProgressTrade,
  isDisputeTrade,
  isPaymentTimeoutTrade,
  isSplitGroupInProgress,
  isTerminalStatus,
  setActiveTrade,
} from '../../trade/stores/tradeSession.store'
import type { TradeRecord, TradeSide } from '../../trade/types'
import { consumePendingBalanceReplay } from '../stores/homeWallet.store'
import type { HomeQuickActionId } from '../components/HomeQuickActions'
import { MOCK_HOME_TRADE_LISTS } from '../mocks/homeTradeLists.mock'
import {
  buildHomeTradeLists,
  type HomeTradeListItem,
} from '../utils/buildHomeTradeLists'
import { useHomeActiveTrades } from './useHomeActiveTrades'
import { useHomeProgressOrders } from './useHomeProgressOrders'
import { useHomeViewModel } from './useHomeViewModel'

/**
 * Home Activity orchestration.
 * 월렛·퀵액션·거래 리스트. 금액 입력은 TradeCompose에 위임합니다.
 *
 * @see docs/domains/trade.md
 */
export function useHomeScreen() {
  const { isActive } = useActivity()
  const { push, replace } = useFlow()
  const { promptAuth, authRequiredDialog } = useAuthRequiredPrompt({
    onNavigateToLogin: () => push('Login', {}),
  })
  const viewModel = useHomeViewModel()
  const progressOrders = useHomeProgressOrders(isActive)
  const activeTradesQuery = useHomeActiveTrades(isActive)
  const localActiveTrade = useActiveTrade()
  const matchingSession = useMatchingSession()
  const splitGroup = useActiveSplitGroup()
  const { replayKey: balanceReplayKey, triggerReplay: triggerBalanceReplay } = useAmountReplay()
  const [balanceStartCoin, setBalanceStartCoin] = useState(0)

  const useHttpApi = shouldUseOrdersHttpApi() || shouldUseTradesHttpApi()

  const activeTrades = useMemo(() => {
    const byId = new Map<string, TradeRecord>()

    for (const trade of activeTradesQuery.trades) {
      byId.set(trade.id, trade)
    }

    if (
      localActiveTrade &&
      !isTerminalStatus(localActiveTrade.status) &&
      !isDisputeTrade(localActiveTrade.status) &&
      (isActionableInProgressTrade(localActiveTrade.status) ||
        isPaymentTimeoutTrade(localActiveTrade.status)) &&
      !byId.has(localActiveTrade.id)
    ) {
      byId.set(localActiveTrade.id, localActiveTrade)
    }

    return [...byId.values()]
  }, [activeTradesQuery.trades, localActiveTrade])

  // 서버에 없거나 DISPUTED/terminal인 local activeTrade는 제거
  useEffect(() => {
    if (!localActiveTrade) return
    const onServer = activeTradesQuery.trades.some((t) => t.id === localActiveTrade.id)
    const stale =
      isTerminalStatus(localActiveTrade.status) ||
      isDisputeTrade(localActiveTrade.status) ||
      (!onServer &&
        useHttpApi &&
        !activeTradesQuery.isLoading &&
        !isActionableInProgressTrade(localActiveTrade.status) &&
        !isPaymentTimeoutTrade(localActiveTrade.status))

    if (stale) {
      clearActiveTrade()
      return
    }

    // 서버 목록에 있으면 서버 상태로 맞춤
    const serverTrade = activeTradesQuery.trades.find((t) => t.id === localActiveTrade.id)
    if (serverTrade && serverTrade.status !== localActiveTrade.status) {
      setActiveTrade(serverTrade)
    }
  }, [activeTradesQuery.isLoading, activeTradesQuery.trades, localActiveTrade, useHttpApi])

  const hasBlockingTrade =
    progressOrders.hasActiveProgressOrders ||
    activeTrades.some((trade) => blocksNewTradeCompose(trade)) ||
    isSplitGroupInProgress()

  const skipSellOrders =
    progressOrders.skipSellOrders ||
    activeTrades.some(
      (trade) => trade.role === 'SELLER' && blocksNewTradeCompose(trade),
    )

  const { attentionItems, inProgressItems } = useMemo(() => {
    const live = buildHomeTradeLists({
      activeTrades,
      splitGroup: splitGroup && isSplitGroupInProgress() ? splitGroup : null,
      matchingSession,
      sellOrders: progressOrders.sellOrders,
      buyOrders: progressOrders.buyOrders,
      skipSellOrders,
    })

    if (
      import.meta.env.DEV &&
      !useHttpApi &&
      live.attentionItems.length === 0 &&
      live.inProgressItems.length === 0
    ) {
      return MOCK_HOME_TRADE_LISTS
    }

    return live
  }, [
    activeTrades,
    matchingSession,
    progressOrders.buyOrders,
    progressOrders.sellOrders,
    skipSellOrders,
    splitGroup,
    useHttpApi,
  ])

  const scheduleBalanceReplay = useCallback(
    (startCoin: number) => {
      setBalanceStartCoin(startCoin)

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          triggerBalanceReplay()
        })
      })
    },
    [triggerBalanceReplay],
  )

  const handlePtrRefresh = useCallback(async () => {
    const startCoin = viewModel.wallet.availableCoin
    await Promise.all([
      viewModel.refresh(),
      progressOrders.refreshProgressOrders(),
      activeTradesQuery.refreshActiveTrades(),
    ])
    scheduleBalanceReplay(startCoin)
  }, [activeTradesQuery, progressOrders, scheduleBalanceReplay, viewModel])

  /** 거래 완료 후 Home 복귀 시 pending replay */
  useEffect(() => {
    if (!isActive) return

    const pending = consumePendingBalanceReplay()
    if (!pending) return

    const frame = requestAnimationFrame(() => {
      scheduleBalanceReplay(pending.from)
    })
    return () => cancelAnimationFrame(frame)
  }, [isActive, scheduleBalanceReplay, viewModel.wallet.availableCoin])

  useEffect(() => {
    if (!isActive) return
    resetSignupDraft()
    resetSignupSecrets()
  }, [isActive])

  const navigateCompose = useCallback(
    (side: TradeSide) => {
      promptAuth(() => {
        push('TradeCompose', { side }, { animate: true })
      }, 'trade')
    },
    [promptAuth, push],
  )

  const handleQuickAction = useCallback(
    (id: HomeQuickActionId) => {
      if (id === 'buy') {
        navigateCompose('BUY')
        return
      }
      if (id === 'sell') {
        navigateCompose('SELL')
        return
      }
      if (id === 'exchange') {
        promptAuth(() => {
          replace('Transactions', {}, { animate: true })
        }, 'transactions')
        return
      }
      promptAuth(() => {
        replace('My', {}, { animate: true })
      }, 'profile')
    },
    [navigateCompose, promptAuth, push, replace],
  )

  const handleTradeListItemClick = useCallback(
    (item: HomeTradeListItem) => {
      if (item.id.startsWith('mock-')) return

      if (item.tradeId) {
        clearAttention(item.tradeId)
      }

      // 구매 요청 attention → Decision Sheet 재오픈 (지속 Entry Point)
      if (item.attentionAction === 'confirm' && item.sellOrderId) {
        openPurchaseRequestSheet()
        return
      }

      if (item.sellOrderId) {
        push(
          'SellOrderDetail',
          { sellOrderId: item.sellOrderId, entryContext: 'history' },
          { animate: true },
        )
        return
      }

      if (item.buyOrderId) {
        push(
          'MatchingWaiting',
          {
            buyOrderId: item.buyOrderId,
            requestedAmountKrw: item.requestedAmountKrw,
          },
          { animate: true },
        )
        return
      }

      if (item.splitGroupId) {
        push('Trade', { splitGroupId: item.splitGroupId }, { animate: true })
        return
      }
      if (item.tradeId) {
        push('Trade', { tradeId: item.tradeId }, { animate: true })
      }
    },
    [push],
  )

  return {
    authRequiredDialog,
    viewModel,
    balanceReplayKey,
    balanceStartCoin,
    hasBlockingTrade,
    attentionItems,
    inProgressItems,
    isTradeListsLoading: progressOrders.isLoading || activeTradesQuery.isLoading,
    handleQuickAction,
    handleTradeListItemClick,
    handlePtrRefresh,
  }
}
