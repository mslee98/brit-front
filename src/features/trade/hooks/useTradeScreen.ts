import { useActivity, useActivityParams, useFlow, useStack } from '@stackflow/react'
import { useCallback, useEffect, useRef, useState } from 'react'
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
  setOnTradeMatched,
} from '../stores/tradeSession.store'
import type { SplitLegViewModel } from '../types/splitDashboard'
import { mapSplitGroupToDashboard } from '../utils/mapSplitDashboard'
import { copyToClipboard } from '../utils/copyToClipboard'
import { shouldOpenPaymentSheet, getPaymentSheetAutoOpenKey, isPaymentFullPage } from '../utils/tradeSheetPolicy'
import { useMatchingAcceptSheet } from './useMatchingAcceptSheet'
import type { MatchingDensity } from './useMatchingDensity'
import { isListFocusedDensity } from './useMatchingDensity'
import { useTradeSession } from './useTradeSession'

/**
 * Trade Activity orchestration.
 * splitGroupId → 위젯 대시보드 + leg micro-flow 시트. tradeId → 단건 상세/시트.
 *
 * @see docs/architecture/trade-platform-summary.md
 */
export function useTradeScreen() {
  const { isActive } = useActivity()
  const { tradeId, splitGroupId, focusLeg } = useActivityParams<'Trade'>()
  const { push, replace } = useFlow()
  const { activities } = useStack()
  const snackbar = useSnackbarAdapter()

  const [paymentSheetTradeId, setPaymentSheetTradeId] = useState<string | null>(null)
  const [disputeSheetLeg, setDisputeSheetLeg] = useState<SplitLegViewModel | null>(null)
  const focusHandledRef = useRef<string | null>(null)
  const autoSheetKeyRef = useRef<string | null>(null)

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

  const openDisputeSheet = useCallback((leg: SplitLegViewModel) => {
    setDisputeSheetLeg(leg)
  }, [])

  const handleOpenBuyerDispute = useCallback(() => {
    if (!tradeId) return
    const trade = tradesById.get(tradeId)
    if (!trade) return

    openDisputeSheet({
      index: trade.splitLegIndex ?? 1,
      tradeId: trade.id,
      amountKrw: trade.amountKrw,
      uiPhase: 'payment_confirm',
      primaryAction: 'OPEN_DISPUTE',
      counterpartyNickname: null,
      statusLine: '입금 확인 대기',
    })
  }, [openDisputeSheet, tradeId, tradesById])

  const closePaymentSheet = useCallback(() => {
    setPaymentSheetTradeId(null)
  }, [])

  const closeDisputeSheet = useCallback(() => {
    setDisputeSheetLeg(null)
  }, [])

  const handleLegPrimaryAction = useCallback(
    (leg: SplitLegViewModel) => {
      if (leg.primaryAction === 'OPEN_DISPUTE') {
        openDisputeSheet(leg)
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
    [openDisputeSheet, openPaymentSheet, replace, splitGroupId],
  )

  const handleBrowseStore = useCallback(() => {
    push('Store', {}, { animate: true })
  }, [push])

  const handleBrowseCommunity = useCallback(() => {
    push('Community', {}, { animate: true })
  }, [push])

  const handleGoHome = useCallback(() => {
    setPaymentSheetTradeId(null)
    setDisputeSheetLeg(null)
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
    setDisputeSheetLeg(null)
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

  useEffect(() => {
    autoSheetKeyRef.current = null
    focusHandledRef.current = null
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

  const handleSingleTradeContinue = useCallback(() => {
    if (!tradeId) return

    const trade = tradesById.get(tradeId)
    if (!trade) return

    if (shouldOpenPaymentSheet(trade)) {
      openPaymentSheet(tradeId)
    }
  }, [openPaymentSheet, tradeId, tradesById])

  return {
    tradeId,
    splitGroupId,
    focusLeg,
    dashboard,
    paymentSheetTradeId,
    disputeSheetLeg,
    closePaymentSheet,
    closeDisputeSheet,
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
    handleOpenBuyerDispute,
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
