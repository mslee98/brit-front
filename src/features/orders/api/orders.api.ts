/**
 * orders.api — Nest buy/sell/matching HTTP (Apply + Accept).
 * `VITE_USE_MOCK=true`가 아니면 호출한다.
 */
import { httpGet, httpPost, httpRequest } from '../../../shared/api/httpClient'
import { shouldUseHttpApi } from '../../../shared/api/apiMode'
import type {
  AcceptTradeRequestResponseDto,
  ApplyBuyOrderRequest,
  ApplyBuyOrderResponseDto,
  BuyMatchType,
  BuyOrderDto,
  BuyOrderStatus,
  ListMyBuyOrdersParams,
  ListMySellOrdersParams,
  MatchingCandidatesDto,
  MatchingStatusDto,
  PaginatedResponseDto,
  RejectTradeRequestRequest,
  SellOrderDto,
  SellOrderStatus,
  TradeRequestDto,
} from '../types'

export function createIdempotencyKey(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export async function createBuyOrder(input: {
  coinAmount: string
  idempotencyKey: string
  signal?: AbortSignal
}): Promise<BuyOrderDto> {
  return httpRequest<BuyOrderDto>('/v1/buy-orders', {
    method: 'POST',
    body: { coinAmount: input.coinAmount },
    signal: input.signal,
    headers: { 'Idempotency-Key': input.idempotencyKey },
  })
}

export async function getBuyOrderMatchingStatus(
  orderId: string,
  signal?: AbortSignal,
): Promise<MatchingStatusDto> {
  return httpGet<MatchingStatusDto>(
    `/v1/buy-orders/${orderId}/matching-status`,
    signal,
  )
}

export async function getBuyOrderCandidates(
  orderId: string,
  input: {
    type: BuyMatchType
    limit?: number
    cursor?: string
    signal?: AbortSignal
  },
): Promise<MatchingCandidatesDto> {
  const params = new URLSearchParams({ type: input.type })
  if (input.limit != null) params.set('limit', String(input.limit))
  if (input.cursor) params.set('cursor', input.cursor)
  return httpGet<MatchingCandidatesDto>(
    `/v1/buy-orders/${orderId}/candidates?${params.toString()}`,
    input.signal,
  )
}

export async function applyBuyOrder(
  orderId: string,
  body: ApplyBuyOrderRequest,
  idempotencyKey: string,
  signal?: AbortSignal,
): Promise<ApplyBuyOrderResponseDto> {
  return httpRequest<ApplyBuyOrderResponseDto>(
    `/v1/buy-orders/${orderId}/apply`,
    {
      method: 'POST',
      body,
      signal,
      headers: { 'Idempotency-Key': idempotencyKey },
    },
  )
}

export async function cancelBuyOrder(
  orderId: string,
  signal?: AbortSignal,
): Promise<BuyOrderDto> {
  return httpPost<BuyOrderDto>(`/v1/buy-orders/${orderId}/cancel`, undefined, signal)
}

function buildOrderListQuery(params: {
  status?: BuyOrderStatus | SellOrderStatus
  page?: number
  size?: number
}): string {
  const search = new URLSearchParams()
  if (params.status) search.set('status', params.status)
  if (params.page != null) search.set('page', String(params.page))
  if (params.size != null) search.set('size', String(params.size))
  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function listMyBuyOrders(
  params: ListMyBuyOrdersParams = {},
): Promise<PaginatedResponseDto<BuyOrderDto>> {
  const query = buildOrderListQuery({
    status: params.status,
    page: params.page,
    size: params.size,
  })
  return httpGet<PaginatedResponseDto<BuyOrderDto>>(`/v1/buy-orders${query}`, params.signal)
}

export async function listMySellOrders(
  params: ListMySellOrdersParams = {},
): Promise<PaginatedResponseDto<SellOrderDto>> {
  const query = buildOrderListQuery({
    status: params.status,
    page: params.page,
    size: params.size,
  })
  return httpGet<PaginatedResponseDto<SellOrderDto>>(`/v1/sell-orders${query}`, params.signal)
}

export async function listMyActiveBuyOrders(
  signal?: AbortSignal,
): Promise<BuyOrderDto[]> {
  const [matching, pending] = await Promise.all([
    listMyBuyOrders({ status: 'MATCHING', page: 1, size: 20, signal }),
    listMyBuyOrders({ status: 'REQUEST_PENDING', page: 1, size: 20, signal }),
  ])
  return [...pending.items, ...matching.items]
}

export async function listMyActiveSellOrders(
  signal?: AbortSignal,
): Promise<SellOrderDto[]> {
  const [open, partial] = await Promise.all([
    listMySellOrders({ status: 'OPEN', page: 1, size: 20, signal }),
    listMySellOrders({ status: 'PARTIALLY_MATCHED', page: 1, size: 20, signal }),
  ])
  return [...open.items, ...partial.items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export async function getTradeRequest(
  tradeRequestId: string,
  signal?: AbortSignal,
): Promise<TradeRequestDto> {
  return httpGet<TradeRequestDto>(`/v1/trade-requests/${tradeRequestId}`, signal)
}

export async function acceptTradeRequest(
  tradeRequestId: string,
  signal?: AbortSignal,
): Promise<AcceptTradeRequestResponseDto> {
  return httpPost<AcceptTradeRequestResponseDto>(
    `/v1/trade-requests/${tradeRequestId}/accept`,
    undefined,
    signal,
  )
}

export async function rejectTradeRequest(
  tradeRequestId: string,
  body: RejectTradeRequestRequest,
  signal?: AbortSignal,
): Promise<TradeRequestDto> {
  return httpPost<TradeRequestDto>(
    `/v1/trade-requests/${tradeRequestId}/reject`,
    body,
    signal,
  )
}

export async function cancelTradeRequest(
  tradeRequestId: string,
  signal?: AbortSignal,
): Promise<TradeRequestDto> {
  return httpPost<TradeRequestDto>(
    `/v1/trade-requests/${tradeRequestId}/cancel`,
    undefined,
    signal,
  )
}

export async function createSellOrder(input: {
  coinAmount: string
  idempotencyKey: string
  signal?: AbortSignal
}): Promise<SellOrderDto> {
  return httpRequest<SellOrderDto>('/v1/sell-orders', {
    method: 'POST',
    body: { coinAmount: input.coinAmount },
    signal: input.signal,
    headers: { 'Idempotency-Key': input.idempotencyKey },
  })
}

export async function getSellOrder(
  orderId: string,
  signal?: AbortSignal,
): Promise<SellOrderDto> {
  return httpGet<SellOrderDto>(`/v1/sell-orders/${orderId}`, signal)
}

export async function getSellOrderPendingRequest(
  orderId: string,
  signal?: AbortSignal,
): Promise<TradeRequestDto | null> {
  const result = await httpGet<TradeRequestDto | undefined>(
    `/v1/sell-orders/${orderId}/pending-request`,
    signal,
  )
  return result ?? null
}

export async function cancelSellOrder(
  orderId: string,
  signal?: AbortSignal,
): Promise<SellOrderDto> {
  return httpPost<SellOrderDto>(`/v1/sell-orders/${orderId}/cancel`, undefined, signal)
}

export function shouldUseOrdersHttpApi(): boolean {
  return shouldUseHttpApi()
}
