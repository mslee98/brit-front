/**
 * trades.api — Nest /v1/trades HTTP.
 * `VITE_USE_MOCK=true`가 아니면 호출한다.
 */
import { httpGet, httpPost } from '../../../shared/api/httpClient'
import { shouldUseHttpApi } from '../../../shared/api/apiMode'
import type { ServerTradeListItem, ServerTradeResponse } from '../types'

export function shouldUseTradesHttpApi(): boolean {
  return shouldUseHttpApi()
}

export function getMyTrade(tradeId: string, signal?: AbortSignal): Promise<ServerTradeResponse> {
  return httpGet<ServerTradeResponse>(`/v1/trades/${tradeId}`, signal)
}

export function getMyTrades(
  query?: { status?: string; page?: number; size?: number },
  signal?: AbortSignal,
): Promise<{ items: ServerTradeListItem[]; pagination: unknown }> {
  const params = new URLSearchParams()
  if (query?.status) params.set('status', query.status)
  if (query?.page) params.set('page', String(query.page))
  if (query?.size) params.set('size', String(query.size))
  const qs = params.toString()
  return httpGet(`/v1/trades${qs ? `?${qs}` : ''}`, signal)
}

export function reportPaymentHttp(tradeId: string): Promise<ServerTradeResponse> {
  return httpPost<ServerTradeResponse>(`/v1/trades/${tradeId}/payment-report`)
}

export function confirmPaymentHttp(tradeId: string): Promise<ServerTradeResponse> {
  return httpPost<ServerTradeResponse>(`/v1/trades/${tradeId}/confirm-payment`)
}

export function cancelTradeHttp(tradeId: string, reason?: string): Promise<ServerTradeResponse> {
  return httpPost<ServerTradeResponse>(`/v1/trades/${tradeId}/cancel`, reason ? { reason } : undefined)
}

export function requestCancellationHttp(tradeId: string, reason?: string): Promise<ServerTradeResponse> {
  return httpPost<ServerTradeResponse>(`/v1/trades/${tradeId}/cancellation-request`, reason ? { reason } : undefined)
}

export function agreeCancellationHttp(tradeId: string): Promise<ServerTradeResponse> {
  return httpPost<ServerTradeResponse>(`/v1/trades/${tradeId}/cancellation-agreement`)
}

export function reportRefundHttp(tradeId: string): Promise<ServerTradeResponse> {
  return httpPost<ServerTradeResponse>(`/v1/trades/${tradeId}/refund-report`)
}

export function confirmRefundHttp(tradeId: string): Promise<ServerTradeResponse> {
  return httpPost<ServerTradeResponse>(`/v1/trades/${tradeId}/refund-confirm`)
}

export function markUnpaidHttp(tradeId: string): Promise<ServerTradeResponse> {
  return httpPost<ServerTradeResponse>(`/v1/trades/${tradeId}/mark-unpaid`)
}
