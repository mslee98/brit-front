/**
 * useSellOrderDetailScreen — 판매 주문 상세 + pending 폴링·수락/거절·취소.
 */
import { useActivity, useActivityParams, useFlow, useStack } from '@stackflow/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { ApiError } from '../../../shared/api/errors'
import { useOnDocumentVisible } from '../../../shared/hooks/useOnDocumentVisible'
import { showSnackbar } from '../../../shared/utils/showSnackbar'
import { navigateToRootHome } from '../../../stackflow/navigateToRootHome'
import { syncHomeWalletFromApi } from '../../home/api/homeWalletSync'
import {
  acceptTradeRequest,
  cancelSellOrder,
  getSellOrder,
  getSellOrderPendingRequest,
  rejectTradeRequest,
} from '../api/orders.api'
import type {
  SellOrderDto,
  TradeRequestDto,
  TradeRequestRejectionReason,
} from '../types'
import type { TradeRequestSheetMode } from '../../trade/components/TradeRequestActionSheet'
import {
  buildSellOrderDetailCopy,
  resolveSellOrderEntryContext,
} from '../utils/sellOrderDetailCopy'

const PENDING_POLL_MS = 2500

export function useSellOrderDetailScreen() {
  const { isActive } = useActivity()
  const params = useActivityParams<'SellOrderDetail'>()
  const { replace } = useFlow()
  const { activities } = useStack()
  const snackbar = useSnackbarAdapter()

  const entryContext = resolveSellOrderEntryContext(params.entryContext)

  const [order, setOrder] = useState<SellOrderDto | null>(null)
  const [pendingRequest, setPendingRequest] = useState<TradeRequestDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActing, setIsActing] = useState(false)
  const [sheetMode, setSheetMode] = useState<TradeRequestSheetMode>(null)
  const [infoSheetOpen, setInfoSheetOpen] = useState(false)
  const [cancelSheetOpen, setCancelSheetOpen] = useState(false)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const autoOpenedRequestIdRef = useRef<string | null>(null)
  const dismissedRequestIdRef = useRef<string | null>(null)

  const loadOrder = useCallback(
    async (signal?: AbortSignal) => {
      const next = await getSellOrder(params.sellOrderId, signal)
      setOrder(next)
      return next
    },
    [params.sellOrderId],
  )

  const loadPending = useCallback(
    async (signal?: AbortSignal) => {
      const next = await getSellOrderPendingRequest(params.sellOrderId, signal)
      setPendingRequest(next)
      return next
    },
    [params.sellOrderId],
  )

  const refreshWalletFromApi = useCallback(async () => {
    await syncHomeWalletFromApi()
  }, [])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    const bootstrap = async () => {
      setIsLoading(true)
      try {
        await Promise.all([
          loadOrder(controller.signal),
          loadPending(controller.signal),
        ])
      } catch (error) {
        if (cancelled) return
        if (error instanceof DOMException && error.name === 'AbortError') return
        showSnackbar(
          snackbar,
          error instanceof ApiError
            ? error.message
            : '판매 주문을 불러오지 못했어요.',
        )
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [loadOrder, loadPending, snackbar])

  const refreshOrderAndPending = useCallback(async () => {
    await Promise.all([loadOrder(), loadPending()])
  }, [loadOrder, loadPending])

  useEffect(() => {
    if (!isActive) return

    let cancelled = false

    const poll = async () => {
      if (cancelled || document.visibilityState === 'hidden') return
      try {
        await refreshOrderAndPending()
      } catch {
        // 다음 폴링
      }
    }

    const timer = window.setInterval(() => {
      if (cancelled) return
      void poll()
    }, PENDING_POLL_MS)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [isActive, refreshOrderAndPending])

  const refetchIfVisible = useCallback(() => {
    if (!isActive) return
    void refreshOrderAndPending().catch(() => {
      // 다음 폴링
    })
  }, [isActive, refreshOrderAndPending])

  useOnDocumentVisible(refetchIfVisible, isActive)

  useEffect(() => {
    if (!pendingRequest) return
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [pendingRequest])

  const remainingSec = pendingRequest
    ? Math.max(
        0,
        Math.ceil((new Date(pendingRequest.expiresAt).getTime() - nowMs) / 1000),
      )
    : 0

  const copy = useMemo(() => {
    if (!order) return null
    return buildSellOrderDetailCopy({
      order,
      hasPendingRequest: pendingRequest !== null,
      entryContext,
    })
  }, [entryContext, order, pendingRequest])

  const openAcceptSheet = useCallback(() => {
    if (!pendingRequest || isActing) return
    setSheetMode('accept')
  }, [isActing, pendingRequest])

  const openRejectSheet = useCallback(() => {
    if (!pendingRequest || isActing) return
    dismissedRequestIdRef.current = pendingRequest.id
    setSheetMode('reject')
  }, [isActing, pendingRequest])

  const handleSheetOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        if (pendingRequest) {
          dismissedRequestIdRef.current = pendingRequest.id
        }
        setSheetMode(null)
      }
    },
    [pendingRequest],
  )

  useEffect(() => {
    if (!isActive || !pendingRequest || isActing) return
    if (sheetMode !== null || infoSheetOpen || cancelSheetOpen) return
    if (dismissedRequestIdRef.current === pendingRequest.id) return
    if (autoOpenedRequestIdRef.current === pendingRequest.id) return

    autoOpenedRequestIdRef.current = pendingRequest.id
    setSheetMode('accept')
  }, [
    cancelSheetOpen,
    infoSheetOpen,
    isActing,
    isActive,
    pendingRequest?.id,
    sheetMode,
  ])

  const handleAccept = useCallback(async () => {
    if (!pendingRequest || isActing) return
    setIsActing(true)
    try {
      const result = await acceptTradeRequest(pendingRequest.id)
      setSheetMode(null)
      setPendingRequest(null)
      showSnackbar(snackbar, '거래를 수락했어요.')
      replace('Trade', { tradeId: result.tradeId }, { animate: true })
    } catch (error) {
      const isUnauthorized =
        error instanceof ApiError &&
        (error.code === 'UNAUTHORIZED' || error.status === 401)
      if (isUnauthorized) {
        showSnackbar(snackbar, '다시 로그인해 주세요.')
        replace('Login', {}, { animate: true })
        return
      }
      showSnackbar(
        snackbar,
        error instanceof ApiError
          ? error.message
          : '수락에 실패했어요. 잠시 후 다시 시도해 주세요.',
      )
      try {
        await loadPending()
      } catch {
        // ignore
      }
    } finally {
      setIsActing(false)
    }
  }, [isActing, loadPending, pendingRequest, replace, snackbar])

  const handleReject = useCallback(
    async (reasonCode: TradeRequestRejectionReason) => {
      if (!pendingRequest || isActing) return
      setIsActing(true)
      try {
        await rejectTradeRequest(pendingRequest.id, { reasonCode })
        setSheetMode(null)
        setPendingRequest(null)
        showSnackbar(snackbar, '신청을 거절했어요.')
        await loadOrder()
      } catch (error) {
        const isUnauthorized =
          error instanceof ApiError &&
          (error.code === 'UNAUTHORIZED' || error.status === 401)
        if (isUnauthorized) {
          showSnackbar(snackbar, '다시 로그인해 주세요.')
          replace('Login', {}, { animate: true })
          return
        }
        showSnackbar(
          snackbar,
          error instanceof ApiError
            ? error.message
            : '거절에 실패했어요. 잠시 후 다시 시도해 주세요.',
        )
      } finally {
        setIsActing(false)
      }
    },
    [isActing, loadOrder, pendingRequest, replace, snackbar],
  )

  const handleCancelSellOrder = useCallback(async () => {
    if (!order || isActing) return
    setIsActing(true)
    try {
      await cancelSellOrder(order.id)
      setCancelSheetOpen(false)
      await refreshWalletFromApi()
      showSnackbar(snackbar, '판매 등록을 취소했어요.')
      navigateToRootHome(activities.length)
    } catch (error) {
      const isUnauthorized =
        error instanceof ApiError &&
        (error.code === 'UNAUTHORIZED' || error.status === 401)
      if (isUnauthorized) {
        showSnackbar(snackbar, '다시 로그인해 주세요.')
        replace('Login', {}, { animate: true })
        return
      }
      showSnackbar(
        snackbar,
        error instanceof ApiError
          ? error.message
          : '취소에 실패했어요. 잠시 후 다시 시도해 주세요.',
      )
    } finally {
      setIsActing(false)
    }
  }, [activities.length, isActing, order, refreshWalletFromApi, replace, snackbar])

  const handleGoHome = useCallback(() => {
    navigateToRootHome(activities.length)
  }, [activities.length])

  return {
    sellOrderId: params.sellOrderId,
    entryContext,
    order,
    pendingRequest,
    copy,
    isLoading,
    isActing,
    remainingSec,
    sheetMode,
    sheetOpen: sheetMode !== null,
    infoSheetOpen,
    cancelSheetOpen,
    setInfoSheetOpen,
    setCancelSheetOpen,
    handleSheetOpenChange,
    openAcceptSheet,
    openRejectSheet,
    handleAccept,
    handleReject,
    handleCancelSellOrder,
    handleGoHome,
  }
}
