/**
 * useMarketScreen — 거래소 browse + 선택 시 거래 요청(BuyOrder+Apply 원자) → 수락 대기 합류.
 */
import { useActivity, useFlow } from '@stackflow/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { ApiError } from '../../../shared/api/errors'
import { showSnackbar } from '../../../shared/utils/showSnackbar'
import { useRequireAuth } from '../../auth/hooks/useRequireAuth'
import { useOpenSellEntry } from '../../trade/hooks/useOpenSellEntry'
import {
  createIdempotencyKey,
  requestMarketTrade,
  shouldUseOrdersHttpApi,
} from '../../orders/api/orders.api'
import {
  getMarketSummary,
  listMarketSellOrders,
  shouldUseMarketHttpApi,
} from '../api/market.api'
import { MARKET_APPLY_SUCCESS, MARKET_LOAD_ERROR } from '../copy'
import type {
  MarketListing,
  MarketMode,
  MarketSellOrderItemDto,
  MarketSortId,
  MarketSummaryDto,
} from '../types'
import { sortMarketItems } from '../utils/sortMarketItems'

export function useMarketScreen() {
  const { push, replace } = useFlow()
  const snackbar = useSnackbarAdapter()
  const { requireAuth, authRequiredDialog } = useRequireAuth('trade')
  const useHttp = shouldUseMarketHttpApi() && shouldUseOrdersHttpApi()
  /** ScrollFog 스크롤 컨테이너 — 요약 카드 「판매글」탭 시 목록 상단으로 */
  const listScrollRef = useRef<HTMLDivElement | null>(null)

  const [summary, setSummary] = useState<MarketSummaryDto | null>(null)
  const [items, setItems] = useState<MarketSellOrderItemDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [selected, setSelected] = useState<MarketListing | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [mode, setMode] = useState<MarketMode>('buy')
  const [sort, setSort] = useState<MarketSortId>('recommended')

  const sortedItems = useMemo(() => sortMarketItems(items, sort), [items, sort])

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setIsLoading(true)
      else setIsRefreshing(true)
      setLoadError(false)
      try {
        const [nextSummary, list] = await Promise.all([
          getMarketSummary(),
          listMarketSellOrders({ page: 1, size: 30 }),
        ])
        setSummary(nextSummary)
        setItems(list.items)
      } catch {
        setLoadError(true)
        showSnackbar(snackbar, MARKET_LOAD_ERROR)
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [snackbar],
  )

  useEffect(() => {
    void load()
  }, [load])

  // 대기·주문 화면에서 pop으로 돌아오면 잔량·예약이 바뀌었을 수 있다.
  const { isActive } = useActivity()
  const wasActiveRef = useRef(isActive)
  useEffect(() => {
    if (isActive && !wasActiveRef.current) void load({ silent: true })
    wasActiveRef.current = isActive
  }, [isActive, load])

  const openSellEntry = useOpenSellEntry()

  const handleModeChange = useCallback(
    (next: MarketMode) => {
      if (next === 'sell') {
        requireAuth(openSellEntry)
        return
      }
      setMode('buy')
    },
    [openSellEntry, requireAuth],
  )

  const handleSelect = useCallback(
    (sellOrderId: string) => {
      const row = items.find((item) => item.sellOrderId === sellOrderId)
      if (!row) return

      requireAuth(() => {
        setSelected({
          sellOrderId: row.sellOrderId,
          seller: row.seller,
          remainingCoinAmount: Number(row.remainingCoinAmount),
        })
        setSheetOpen(true)
      })
    },
    [items, requireAuth],
  )

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open)
    if (!open) setSelected(null)
  }, [])

  const handleConfirmApply = useCallback(
    async (listing: MarketListing) => {
      if (isApplying) return

      if (!useHttp) {
        showSnackbar(
          snackbar,
          '데모 모드에서는 거래소 요청을 보낼 수 없어요. API 연동 후 사용해 주세요.',
        )
        setSheetOpen(false)
        setSelected(null)
        return
      }

      setIsApplying(true)

      try {
        const result = await requestMarketTrade(
          {
            sellOrderId: listing.sellOrderId,
            expectedCoinAmount: String(listing.remainingCoinAmount),
          },
          createIdempotencyKey(),
        )

        setSheetOpen(false)
        setSelected(null)
        showSnackbar(snackbar, MARKET_APPLY_SUCCESS)
        push(
          'MatchingWaiting',
          {
            buyOrderId: result.buyOrderId,
            requestedAmountKrw: listing.remainingCoinAmount,
            initialPhase: 'requestPending',
            tradeRequestId: result.tradeRequestId,
            tradeRequestExpiresAt:
              typeof result.expiresAt === 'string'
                ? result.expiresAt
                : new Date(result.expiresAt).toISOString(),
            targetSellOrderId: listing.sellOrderId,
            origin: 'market',
          },
          { animate: true },
        )
      } catch (error) {
        const isUnauthorized =
          error instanceof ApiError &&
          (error.code === 'UNAUTHORIZED' || error.status === 401)
        if (isUnauthorized) {
          showSnackbar(snackbar, '다시 로그인해 주세요.')
          replace('Login', {}, { animate: true })
          return
        }

        const code = error instanceof ApiError ? error.code : null
        if (
          code === 'SELL_ORDER_UNAVAILABLE' ||
          code === 'CANDIDATE_CHANGED' ||
          code === 'SELL_ORDER_PENDING_REQUEST' ||
          code === 'BUY_ORDER_PENDING_REQUEST'
        ) {
          showSnackbar(
            snackbar,
            '방금 그 판매글은 거래할 수 없어요. 목록을 새로고침할게요.',
          )
          setSheetOpen(false)
          setSelected(null)
          void load({ silent: true })
          return
        }

        showSnackbar(
          snackbar,
          error instanceof ApiError
            ? error.message
            : '요청에 실패했어요. 잠시 후 다시 시도해 주세요.',
        )
      } finally {
        setIsApplying(false)
      }
    },
    [isApplying, load, push, replace, snackbar, useHttp],
  )

  const handleAutoFind = useCallback(() => {
    requireAuth(() => {
      push('TradeCompose', { side: 'BUY' }, { animate: true })
    })
  }, [push, requireAuth])

  const handleScrollToList = useCallback(() => {
    listScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleRetry = useCallback(() => {
    void load()
  }, [load])

  return {
    summary,
    items: sortedItems,
    isLoading,
    isRefreshing,
    loadError,
    selected,
    sheetOpen,
    isApplying,
    mode,
    sort,
    listScrollRef,
    authRequiredDialog,
    setSort,
    handleModeChange,
    handleSelect,
    handleSheetOpenChange,
    handleConfirmApply,
    handleAutoFind,
    handleScrollToList,
    handleRetry,
    refresh: () => load({ silent: true }),
  }
}
