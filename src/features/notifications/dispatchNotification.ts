import {
  clearAttention,
  enqueuePending,
  setAttention,
} from './notification.store'
import type {
  ChannelDispatchResult,
  DispatchContext,
  NotificationEventType,
  NotificationPayload,
} from './types'

function isOnTradeScreen(context: DispatchContext): boolean {
  return context.currentActivity === 'Trade'
}

function isOnHomeScreen(context: DispatchContext): boolean {
  return context.currentActivity === 'Home'
}

function isSameTradeContext(context: DispatchContext, tradeId?: string): boolean {
  if (!tradeId || !context.tradeId) return false
  return context.tradeId === tradeId
}

function shouldSkipBanner(context: DispatchContext, payload: NotificationPayload): boolean {
  if (!isOnTradeScreen(context)) return false
  if (!payload.tradeId) return true
  return isSameTradeContext(context, payload.tradeId)
}

/**
 * 인앱 채널 라우팅. OS Push는 서버→SW만 담당한다.
 * type은 서버 NotificationEventType wire와 동일하다.
 */
export function dispatchNotification(
  payload: NotificationPayload,
  context: DispatchContext,
): ChannelDispatchResult {
  const result: ChannelDispatchResult = {}

  if (!context.isDocumentVisible) {
    return result
  }

  switch (payload.type) {
    case 'TRADE_REQUEST_ACCEPTED': {
      if (shouldSkipBanner(context, payload)) {
        if (context.isActivityActive) {
          result.snackbar = { message: payload.message }
        }
        break
      }
      if (isOnHomeScreen(context) && context.isActivityActive) {
        result.snackbar = { message: payload.message }
        if (payload.tradeId) {
          result.attention = { tradeId: payload.tradeId, type: payload.type }
          setAttention({ tradeId: payload.tradeId, type: payload.type, message: payload.message })
        }
      } else if (!isOnTradeScreen(context) || !isSameTradeContext(context, payload.tradeId)) {
        result.pending = payload
        enqueuePending(payload)
        result.banner = payload
      }
      break
    }

    case 'TRADE_PAYMENT_REPORTED': {
      if (context.tradeRole === 'BUYER') {
        break
      }
      if (shouldSkipBanner(context, payload)) {
        if (context.isActivityActive) {
          result.snackbar = { message: payload.message }
        }
        break
      }
      if (isOnHomeScreen(context) && context.isActivityActive) {
        result.snackbar = { message: payload.message }
        if (payload.tradeId) {
          result.attention = { tradeId: payload.tradeId, type: payload.type }
          setAttention({ tradeId: payload.tradeId, type: payload.type, message: payload.message })
        }
      } else if (!isOnTradeScreen(context) || !isSameTradeContext(context, payload.tradeId)) {
        result.pending = payload
        enqueuePending(payload)
        result.banner = payload
      }
      break
    }

    case 'TRADE_COMPLETED': {
      if (context.isActivityActive && (isOnHomeScreen(context) || isOnTradeScreen(context))) {
        result.snackbar = { message: payload.message }
      } else {
        result.pending = payload
        enqueuePending(payload)
        result.banner = payload
      }
      if (payload.tradeId) {
        clearAttention(payload.tradeId)
      }
      break
    }

    case 'TRADE_REQUEST_CREATED':
    case 'DISPUTE_OPENED':
    case 'DISPUTE_RESOLVED':
    case 'TRADE_EXPIRED':
    case 'TRADE_CANCELLED': {
      if (shouldSkipBanner(context, payload) && context.isActivityActive) {
        result.snackbar = { message: payload.message }
        break
      }
      result.pending = payload
      enqueuePending(payload)
      if (!shouldSkipBanner(context, payload)) {
        result.banner = payload
      }
      break
    }

    default:
      break
  }

  return result
}

export function createNotificationId(type: NotificationEventType, tradeId?: string): string {
  return `${type}:${tradeId ?? 'global'}:${Date.now()}`
}
