/**
 * market.api — 거래소 조회 (summary · 공개 매도 목록).
 * Matching candidates와 합치지 않는다.
 */
import { httpGet } from '../../../shared/api/httpClient'
import { shouldUseHttpApi } from '../../../shared/api/apiMode'
import type {
  MarketSellerDto,
  MarketSellOrderItemDto,
  MarketSellOrderListDto,
  MarketSummaryDto,
} from '../types'

export function shouldUseMarketHttpApi(): boolean {
  return shouldUseHttpApi()
}

const MOCK_SUMMARY: MarketSummaryDto = {
  availableSellOrderCount: 5,
  availableCoinAmount: '1450000',
}

const MOCK_LIST: MarketSellOrderListDto = {
  items: [
    {
      sellOrderId: 'mock-sell-1',
      seller: {
        nickname: '테**',
        completedTradeCount: 128,
        completionRatePct: 98,
        disputeCount: 0,
        hasTradedBefore: true,
      },
      remainingCoinAmount: '270000',
      minimumTradeAmount: '50000',
      createdAt: '2026-11-05T10:00:00.000Z',
    },
    {
      sellOrderId: 'mock-sell-2',
      seller: {
        nickname: '김**',
        completedTradeCount: 45,
        completionRatePct: 96,
        disputeCount: 1,
        isNewSeller: false,
      },
      remainingCoinAmount: '520000',
      minimumTradeAmount: '100000',
      createdAt: '2026-11-05T14:00:00.000Z',
    },
    {
      sellOrderId: 'mock-sell-3',
      seller: {
        nickname: '이**',
        completedTradeCount: 3,
        completionRatePct: 100,
        disputeCount: 0,
        isNewSeller: true,
      },
      remainingCoinAmount: '180000',
      minimumTradeAmount: '50000',
      createdAt: '2026-11-06T01:00:00.000Z',
    },
    {
      sellOrderId: 'mock-sell-4',
      seller: {
        nickname: '박**',
        completedTradeCount: 210,
        completionRatePct: 99,
        disputeCount: 2,
        hasTradedBefore: true,
      },
      remainingCoinAmount: '350000',
      minimumTradeAmount: '100000',
      createdAt: '2026-11-04T08:00:00.000Z',
    },
    {
      sellOrderId: 'mock-sell-5',
      seller: {
        nickname: '최**',
        completedTradeCount: 12,
        completionRatePct: 92,
        disputeCount: 0,
        isNewSeller: true,
      },
      remainingCoinAmount: '130000',
      minimumTradeAmount: '30000',
      createdAt: '2026-11-06T02:00:00.000Z',
    },
  ],
  pagination: { page: 1, size: 20, totalItems: 5, totalPages: 1 },
}

function normalizeItem(raw: MarketSellOrderItemDto): MarketSellOrderItemDto {
  return {
    ...raw,
    createdAt:
      typeof raw.createdAt === 'string'
        ? raw.createdAt
        : new Date(raw.createdAt).toISOString(),
    seller: {
      nickname: raw.seller.nickname,
      completedTradeCount: raw.seller.completedTradeCount,
      completionRatePct: raw.seller.completionRatePct,
      disputeCount: raw.seller.disputeCount,
      isNewSeller: raw.seller.isNewSeller,
      hasTradedBefore: raw.seller.hasTradedBefore,
    },
  }
}

export async function getMarketSummary(
  signal?: AbortSignal,
): Promise<MarketSummaryDto> {
  if (!shouldUseMarketHttpApi()) return MOCK_SUMMARY
  return httpGet<MarketSummaryDto>('/v1/market/summary', signal)
}

/** 거래소 카드에 보이는 내 판매자 정보 (인증 필요). 데모 모드는 null */
export async function getMySellerProfile(
  signal?: AbortSignal,
): Promise<MarketSellerDto | null> {
  if (!shouldUseMarketHttpApi()) return null
  return httpGet<MarketSellerDto>('/v1/market/sellers/me', signal)
}

export async function listMarketSellOrders(
  input: {
    page?: number
    size?: number
    minAmount?: number
    maxAmount?: number
    signal?: AbortSignal
  } = {},
): Promise<MarketSellOrderListDto> {
  if (!shouldUseMarketHttpApi()) {
    return MOCK_LIST
  }

  const params = new URLSearchParams()
  if (input.page != null) params.set('page', String(input.page))
  if (input.size != null) params.set('size', String(input.size))
  if (input.minAmount != null) params.set('minAmount', String(input.minAmount))
  if (input.maxAmount != null) params.set('maxAmount', String(input.maxAmount))
  const query = params.toString()
  const data = await httpGet<MarketSellOrderListDto>(
    `/v1/market/sell-orders${query ? `?${query}` : ''}`,
    input.signal,
  )
  return {
    ...data,
    items: data.items.map(normalizeItem),
  }
}
