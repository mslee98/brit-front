/** 서버 NotificationEventType와 동일한 wire SoT (Push·향후 SSE/WS) */
export type NotificationEventType =
  | 'TRADE_REQUEST_CREATED'
  | 'TRADE_REQUEST_ACCEPTED'
  | 'TRADE_REQUEST_REJECTED'
  | 'TRADE_PAYMENT_REPORTED'
  | 'TRADE_COMPLETED'
  | 'USER_REGISTRATION_REQUESTED'
  | 'USER_REGISTRATION_APPROVED'
  | 'USER_REGISTRATION_REJECTED'
  | 'TRADE_EXPIRED'
  | 'TRADE_CANCELLED'
  | 'DISPUTE_OPENED'
  | 'DISPUTE_RESOLVED'

export type NotificationChannel = 'snackbar' | 'attention' | 'banner' | 'pending' | 'push'

export type NotificationPriority = 'low' | 'normal' | 'high'

export interface NotificationPayload {
  id: string
  type: NotificationEventType
  tradeId?: string
  splitGroupId?: string
  focusLeg?: number
  amountKrw?: number
  message: string
  title?: string
  priority: NotificationPriority
  createdAt: string
}

export interface DispatchContext {
  currentActivity: string | null
  pathname: string
  tradeId?: string | null
  splitGroupId?: string | null
  tradeRole?: 'BUYER' | 'SELLER' | null
  isActivityActive: boolean
  isDocumentVisible: boolean
}

export interface ChannelDispatchResult {
  snackbar?: { message: string; variant?: 'positive' | 'critical' | 'default' }
  attention?: { tradeId: string; type: NotificationEventType }
  banner?: NotificationPayload
  pending?: NotificationPayload
  /** @deprecated OS Push는 서버 Web Push + SW만. 클라이언트 push 채널 미사용 */
  push?: NotificationPayload
}

export interface AttentionState {
  tradeId: string
  type: NotificationEventType
  message: string
}

/** Push·소켓 공용 wire (서버 TradePushPayload와 정렬) */
export type NotificationWirePayload = {
  notificationId: string
  type: NotificationEventType | string
  title: string
  body: string
  deepLink: string
  eventType?: string
  message?: string
  url?: string
  tradeId?: string
  sellOrderId?: string
  buyOrderId?: string
  referenceId?: string
}
