import { useActivity, useActivityParams, useFlow, useStack } from '@stackflow/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { showSnackbar } from '../../../shared/utils/showSnackbar'
import { navigateToRootHome } from '../../../stackflow/navigateToRootHome'
import {
  cancelTrade,
  focusSplitLegTrade,
  getActiveSplitGroup,
  getSplitGroupById,
  getTradeDetail,
  getTradesById,
  openDispute,
  setOnTradeMatched,
} from '../stores/tradeSession.store'
import type { SplitLegViewModel } from '../types/splitDashboard'
import { mapSplitGroupToDashboard } from '../utils/mapSplitDashboard'
import { copyToClipboard } from '../utils/copyToClipboard'
import { openDisputeChatById } from '../utils/openDisputeChat'
import { shouldOpenPaymentSheet, getPaymentSheetAutoOpenKey, isPaymentFullPage } from '../utils/tradeSheetPolicy'
import { useMatchingAcceptSheet } from './useMatchingAcceptSheet'
import type { MatchingDensity } from './useMatchingDensity'
import { isListFocusedDensity } from './useMatchingDensity'
import { usePartyDisputeOpenedSync } from './usePartyDisputeOpenedSync'
import { useTradeSession } from './useTradeSession'

/**
 * Trade Activity orchestration.
 * splitGroupId → 위젯 대시보드 + leg micro-flow 시트. tradeId → 단건 상세/시트.
 * 이 화면에서 DISPUTED로 바뀌면 DisputeChat으로 보낸다 (처음부터 분쟁이면 CTA만).
 *
 * @see docs/architecture/trade-platform-summary.md
 * @see docs/porcess/trade-disputes.md
 */
export function useTradeScreen() {
  const { isActive } = useActivity()
  const { tradeId, splitGroupId, focusLeg } = useActivityParams<'Trade'>()
  const { push, replace } = useFlow()
  const { activities } = useStack()
  const snackbar = useSnackbarAdapter()

  const [paymentSheetTradeId, setPaymentSheetTradeId] = useState<string | null>(null)
  const focusHandledRef = useRef<string | null>(null)
  const autoSheetKeyRef = useRef<string | null>(null)
  const lastStatusByTradeIdRef = useRef<Map<string, string>>(new Map())
  /** 구매자가 직접 접수한 직후 U1 effect가 한 번 더 push하지 않게 */
  const skipAutoEnterRef = useRef(false)

  const selectSplitGroup = useCallback(
    (version: number) => {
      void version
      return getSplitGroupById(splitGroupId ?? '') ?? getActiveSplitGroup()
    },
    [splitGroupId],
  )

  const selectTradesById = useCallback((version: number) => {
    void version
    return getTradesById()
  }, [])

  const splitGroup = useTradeSession(selectSplitGroup)
  const tradesById = useTradeSession(selectTradesById)

  const dashboard = useTradeSession(
    useCallback(
      (version) => {
        void version
        if (!splitGroup) return null
        return mapSplitGroupToDashboard(splitGroup, tradesById)
      },
      [splitGroup, tradesById],
    ),
  )

  const activeTrade = tradeId ? tradesById.get(tradeId) : undefined
  const matchingAcceptEnabled =
    isActive && Boolean(tradeId) && activeTrade?.status === 'MATCHING'

  const watchedTradeIds = useMemo(() => {
    if (tradeId) return [tradeId]
    if (!dashboard) return []
    return dashboard.legs
      .map((leg) => leg.tradeId)
      .filter((id): id is string => Boolean(id))
  }, [dashboard, tradeId])
  usePartyDisputeOpenedSync(watchedTradeIds, isActive)

  const [matchingDensity, setMatchingDensity] = useState<MatchingDensity>('empty')

  const acceptSheet = useMatchingAcceptSheet({
    enabled: matchingAcceptEnabled,
    tradeId: tradeId ?? null,
    autoOpenReady: isListFocusedDensity(matchingDensity),
  })

  const openPaymentSheet = useCallback((targetTradeId: string) => {
    const trade = getTradeDetail(targetTradeId) ?? tradesById.get(targetTradeId)
    if (trade && !shouldOpenPaymentSheet(trade)) return
    setPaymentSheetTradeId(targetTradeId)
    focusSplitLegTrade(targetTradeId)
  }, [tradesById])

  const openDisputeChat = useCallback(
    (targetTradeId: string) => {
      const trade = getTradeDetail(targetTradeId) ?? tradesById.get(targetTradeId)
      const disputeId = trade?.dispute?.id
      if (disputeId) {
        openDisputeChatById(disputeId)
        return true
      }
      showSnackbar(snackbar, '채팅방을 열지 못했어요.', 'critical')
      return false
    },
    [snackbar, tradesById],
  )

  const openOrCreateDisputeChat = useCallback(
    async (targetTradeId: string) => {
      const trade = getTradeDetail(targetTradeId) ?? tradesById.get(targetTradeId)
      if (trade?.dispute?.id) {
        openDisputeChatById(trade.dispute.id)
        return
      }

      skipAutoEnterRef.current = true
      try {
        const updated = await openDispute(targetTradeId)
        if (updated.dispute?.id) {
          openDisputeChatById(updated.dispute.id)
          return
        }
        skipAutoEnterRef.current = false
        showSnackbar(snackbar, '채팅방을 열지 못했어요.', 'critical')
      } catch {
        skipAutoEnterRef.current = false
        showSnackbar(snackbar, '분쟁을 접수하지 못했어요.', 'critical')
      }
    },
    [snackbar, tradesById],
  )

  const handleOpenBuyerDispute = useCallback(async () => {
    if (!tradeId) return
    await openOrCreateDisputeChat(tradeId)
  }, [openOrCreateDisputeChat, tradeId])

  const handlePaymentDenied = useCallback(
    (updated: { dispute?: { id: string } | null }) => {
      if (updated.dispute?.id) {
        skipAutoEnterRef.current = true
        openDisputeChatById(updated.dispute.id)
        return
      }
      skipAutoEnterRef.current = false
      showSnackbar(snackbar, '채팅방을 열지 못했어요.', 'critical')
    },
    [snackbar],
  )

  const handlePaymentDenyStart = useCallback(() => {
    skipAutoEnterRef.current = true
  }, [])

  const handlePaymentDenyAborted = useCallback(() => {
    skipAutoEnterRef.current = false
  }, [])

  const closePaymentSheet = useCallback(() => {
    setPaymentSheetTradeId(null)
  }, [])

  const handleLegPrimaryAction = useCallback(
    async (leg: SplitLegViewModel) => {
      if (leg.primaryAction === 'OPEN_DISPUTE') {
        if (leg.tradeId) {
          await openOrCreateDisputeChat(leg.tradeId)
          return
        }
        showSnackbar(snackbar, '채팅방을 열지 못했어요.', 'critical')
        return
      }

      if (leg.primaryAction === 'OPEN_CHAT') {
        if (leg.tradeId) openDisputeChat(leg.tradeId)
        return
      }

      if (!leg.tradeId) {
        return
      }

      if (leg.primaryAction === 'VIEW_MATCHING') {
        focusSplitLegTrade(leg.tradeId)
        replace('Trade', { tradeId: leg.tradeId, splitGroupId: splitGroupId ?? undefined })
        return
      }

      if (leg.primaryAction === 'REPORT_PAYMENT') {
        focusSplitLegTrade(leg.tradeId)
        replace('Trade', { tradeId: leg.tradeId, splitGroupId: splitGroupId ?? undefined })
        return
      }

      if (leg.primaryAction === 'NONE') {
        return
      }

      if (leg.primaryAction === 'CONFIRM_PAYMENT') {
        focusSplitLegTrade(leg.tradeId)
        replace('Trade', { tradeId: leg.tradeId, splitGroupId: splitGroupId ?? undefined })
        return
      }

      if (leg.primaryAction === 'VIEW_DETAIL') {
        openPaymentSheet(leg.tradeId)
      }
    },
    [openDisputeChat, openOrCreateDisputeChat, openPaymentSheet, replace, snackbar, splitGroupId, tradesById],
  )

  const handleBrowseStore = useCallback(() => {
    push('Store', {}, { animate: true })
  }, [push])

  const handleBrowseCommunity = useCallback(() => {
    push('Community', {}, { animate: true })
  }, [push])

  const handleGoHome = useCallback(() => {
    setPaymentSheetTradeId(null)
    navigateToRootHome(activities.length)
  }, [activities.length])

  const handleChangeMatchingConditions = useCallback(async () => {
    if (!tradeId) return

    const trade = getTradeDetail(tradeId)
    if (!trade) return

    await cancelTrade(trade.id, trade.version)
    replace('TradeCompose', { side: trade.side }, { animate: true })
  }, [replace, tradeId])

  const handleStopMatching = useCallback(async () => {
    if (!tradeId) return

    const trade = getTradeDetail(tradeId)
    if (!trade) return

    await cancelTrade(trade.id, trade.version)
    setPaymentSheetTradeId(null)
    navigateToRootHome(activities.length)
  }, [activities.length, tradeId])

  const handleCopyAccount = useCallback(async () => {
    const targetId = tradeId ?? paymentSheetTradeId
    if (!targetId) return

    const trade = getTradeDetail(targetId)
    if (!trade?.sellerAccount) return

    const copied = await copyToClipboard(trade.sellerAccount.accountNumber)
    if (copied) {
      showSnackbar(snackbar, '계좌번호를 복사했어요.')
    } else {
      showSnackbar(snackbar, '복사하지 못했어요.', 'critical')
    }
  }, [paymentSheetTradeId, snackbar, tradeId])

  const handleCopyAccountFailed = useCallback(() => {
    showSnackbar(snackbar, '복사하지 못했어요.', 'critical')
  }, [snackbar])

  const handleContactSupport = useCallback(() => {
    replace('Transactions', {}, { animate: true })
  }, [replace])

  const handleOpenTransactions = useCallback(() => {
    replace('Transactions', {}, { animate: true })
  }, [replace])

  useEffect(() => {
    autoSheetKeyRef.current = null
    focusHandledRef.current = null
    lastStatusByTradeIdRef.current = new Map()
    skipAutoEnterRef.current = false
  }, [tradeId, splitGroupId])

  /** Binding 직후 구매자 입금은 풀페이지 — 시트 자동 오픈 없음 */
  useEffect(() => {
    if (!isActive) return

    setOnTradeMatched((matchedTradeId) => {
      focusSplitLegTrade(matchedTradeId)
    })

    return () => setOnTradeMatched(null)
  }, [isActive])

  /** focusLeg param — leg CTA deep link */
  useEffect(() => {
    if (!focusLeg || !dashboard) return
    const focusKey = `${splitGroupId ?? ''}:${focusLeg}`
    if (focusHandledRef.current === focusKey) return

    const leg = dashboard.legs.find((item) => String(item.index) === focusLeg)
    if (!leg) return

    focusHandledRef.current = focusKey
    handleLegPrimaryAction(leg)
  }, [dashboard, focusLeg, handleLegPrimaryAction, splitGroupId])

  /** MATCHING leg 진입 시 매칭 세션 포커스 */
  useEffect(() => {
    if (!isActive || !tradeId) return

    const trade = tradesById.get(tradeId)
    if (trade?.status === 'MATCHING') {
      focusSplitLegTrade(tradeId)
    }
  }, [isActive, tradeId, tradesById])

  /** 단건 tradeId 진입 시 PAYMENT 상태별 leg 시트 자동 오픈 (1회/상태) */
  useEffect(() => {
    if (!isActive || !tradeId || splitGroupId) return

    const trade = tradesById.get(tradeId)
    if (!trade) return

    if (trade.status === 'DISPUTED' && paymentSheetTradeId === tradeId) {
      setPaymentSheetTradeId(null)
    }

    // 입금 대기/지시·확인: 풀페이지만 — 잘못 열린 시트도 즉시 닫음
    if (isPaymentFullPage(trade) && paymentSheetTradeId === tradeId) {
      setPaymentSheetTradeId(null)
      return
    }

    const sheetKey = getPaymentSheetAutoOpenKey(trade)
    if (!shouldOpenPaymentSheet(trade)) {
      if (autoSheetKeyRef.current?.startsWith(`${tradeId}:`)) {
        autoSheetKeyRef.current = sheetKey
      }
      return
    }

    if (autoSheetKeyRef.current === sheetKey) return
    autoSheetKeyRef.current = sheetKey
    openPaymentSheet(tradeId)
  }, [isActive, openPaymentSheet, paymentSheetTradeId, splitGroupId, tradeId, tradesById])

  /**
   * 이 화면에서 분쟁으로 바뀌면 채팅으로 보낸다.
   * 처음부터 DISPUTED면 CTA만 (복귀는 U2). 구매자 직접 접수는 skipAutoEnter.
   * 스플릿 대시보드(tradeId 없음)도 각 leg를 본다.
   */
  useEffect(() => {
    if (!isActive) return

    const watched: Array<{ id: string; status?: string; disputeId?: string }> = []
    if (tradeId) {
      const trade = tradesById.get(tradeId)
      if (trade) {
        watched.push({
          id: trade.id,
          status: trade.status,
          disputeId: trade.dispute?.id,
        })
      }
    } else if (dashboard) {
      for (const leg of dashboard.legs) {
        if (!leg.tradeId) continue
        const trade = tradesById.get(leg.tradeId)
        if (!trade) continue
        watched.push({
          id: trade.id,
          status: trade.status,
          disputeId: trade.dispute?.id,
        })
      }
    }

    for (const trade of watched) {
      const previous = lastStatusByTradeIdRef.current.get(trade.id)
      if (trade.status) lastStatusByTradeIdRef.current.set(trade.id, trade.status)

      if (
        previous &&
        previous !== 'DISPUTED' &&
        trade.status === 'DISPUTED' &&
        trade.disputeId
      ) {
        setPaymentSheetTradeId(null)
        if (skipAutoEnterRef.current) {
          skipAutoEnterRef.current = false
          continue
        }
        openDisputeChatById(trade.disputeId)
      }
    }
  }, [dashboard, isActive, tradeId, tradesById])

  const handleSingleTradeContinue = useCallback(() => {
    if (!tradeId) return

    const trade = tradesById.get(tradeId)
    if (!trade) return

    if (trade.status === 'DISPUTED') {
      openDisputeChat(tradeId)
      return
    }

    if (shouldOpenPaymentSheet(trade)) {
      openPaymentSheet(tradeId)
    }
  }, [openDisputeChat, openPaymentSheet, tradeId, tradesById])

  return {
    tradeId,
    splitGroupId,
    focusLeg,
    dashboard,
    paymentSheetTradeId,
    closePaymentSheet,
    handleLegPrimaryAction,
    handleSingleTradeContinue,
    handleBrowseStore,
    handleBrowseCommunity,
    handleGoHome,
    handleChangeMatchingConditions,
    handleStopMatching,
    handleCopyAccount,
    handleCopyAccountFailed,
    handleContactSupport,
    handleOpenTransactions,
    handleOpenBuyerDispute,
    handlePaymentDenied,
    handlePaymentDenyStart,
    handlePaymentDenyAborted,
    openPaymentSheet,
    acceptOpen: acceptSheet.acceptOpen,
    acceptCandidate: acceptSheet.acceptCandidate,
    onAcceptOpenChange: acceptSheet.onAcceptOpenChange,
    onAcceptConfirm: acceptSheet.onAcceptConfirm,
    onAcceptSkip: acceptSheet.onAcceptSkip,
    openAcceptForCandidate: acceptSheet.openAcceptForCandidate,
    handleDensityChange: setMatchingDensity,
  }
}
