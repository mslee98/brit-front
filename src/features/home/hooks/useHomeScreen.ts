import { useActivity, useFlow } from '@stackflow/react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAuthRequiredPrompt } from '../../auth/hooks/useAuthRequiredPrompt'
import { resetSignupDraft } from '../../auth/stores/signupDraft.store'
import { resetSignupSecrets } from '../../auth/stores/signupSecrets.store'
import { clearAttention } from '../../notifications/hooks/useNotifications'
import { useAmountReplay } from '../../../shared/hooks/useAmountReplay'
import { shouldUseOrdersHttpApi } from '../../orders/api/orders.api'
import { shouldUseTradesHttpApi } from '../../trade/api/trades.api'
import { useActiveSplitGroup } from '../../trade/hooks/useActiveSplitGroup'
import { useActiveTrade } from '../../trade/hooks/useActiveTrade'
import { useMatchingSession } from '../../trade/matching/hooks/useMatchingSession'
import {
  isSplitGroupInProgress,
  isTerminalStatus,
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
      !byId.has(localActiveTrade.id)
    ) {
      byId.set(localActiveTrade.id, localActiveTrade)
    }

    return [...byId.values()]
  }, [activeTradesQuery.trades, localActiveTrade])

  const hasBlockingTrade =
    progressOrders.hasActiveProgressOrders ||
    activeTrades.length > 0 ||
    isSplitGroupInProgress()

  const { attentionItems, inProgressItems } = useMemo(() => {
    const live = buildHomeTradeLists({
      activeTrades,
      splitGroup: splitGroup && isSplitGroupInProgress() ? splitGroup : null,
      matchingSession,
      sellOrders: progressOrders.sellOrders,
      buyOrders: progressOrders.buyOrders,
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
          replace('Detail', { id: 'transactions' }, { animate: true })
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
