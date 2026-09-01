import { ApiError } from '../../../shared/api/errors'
import {
  deletePushSubscription,
  getVapidPublicKey,
  savePushSubscription,
} from '../api/push.api'
import type { PushEligibility } from '../constants/pushNotificationCopy'
import { PUSH_SUBSCRIPTION_STORAGE_KEY } from '../constants/pushNotificationCopy'
import { isIOS } from './detectInstallPlatform'
import { isStandaloneDisplay } from './pwaInstallPromptStore'

type Listener = () => void

const listeners = new Set<Listener>()

let vapidEnabled: boolean | null = null
let cachedVapidPublicKey: string | null = null

function notify() {
  listeners.forEach((listener) => listener())
}

function isNotificationApiAvailable(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

function isPushManagerAvailable(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof window !== 'undefined' &&
    'PushManager' in window
  )
}

function isIosWithoutStandalone(): boolean {
  return typeof window !== 'undefined' && isIOS() && !isStandaloneDisplay()
}

function readMockSubscriptionReady(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(PUSH_SUBSCRIPTION_STORAGE_KEY) === 'true'
}

function persistSubscriptionReady(ready: boolean) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PUSH_SUBSCRIPTION_STORAGE_KEY, ready ? 'true' : 'false')
}

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

async function refreshVapidAvailability(): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const result = await getVapidPublicKey()
    vapidEnabled = result.enabled
    cachedVapidPublicKey = result.publicKey ?? null
    notify()
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return
    }
    vapidEnabled = false
    cachedVapidPublicKey = null
    notify()
  }
}

export function resolvePushEligibility(): PushEligibility {
  if (isIosWithoutStandalone()) {
    return 'ios_install_required'
  }
  if (!isNotificationApiAvailable() || !isPushManagerAvailable()) {
    return 'unsupported'
  }
  if (vapidEnabled === false) {
    return 'unsupported'
  }
  if (Notification.permission === 'denied') {
    return 'denied'
  }
  if (Notification.permission === 'granted' && readMockSubscriptionReady()) {
    return 'ready'
  }
  return 'default'
}

export function getPushEligibility(): PushEligibility {
  return resolvePushEligibility()
}

export function canShowWhileYouWait(): boolean {
  return getPushEligibility() === 'ready'
}

export function subscribePushNotification(listener: Listener): () => void {
  listeners.add(listener)
  void refreshVapidAvailability()
  return () => listeners.delete(listener)
}

export async function requestPushPermission(): Promise<PushEligibility> {
  if (isIosWithoutStandalone()) {
    notify()
    return 'ios_install_required'
  }
  if (!isNotificationApiAvailable() || !isPushManagerAvailable()) {
    notify()
    return 'unsupported'
  }

  await refreshVapidAvailability()
  if (!vapidEnabled || !cachedVapidPublicKey) {
    notify()
    return 'unsupported'
  }

  const permission =
    Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission()

  if (permission === 'denied') {
    persistSubscriptionReady(false)
    notify()
    return 'denied'
  }
  if (permission !== 'granted') {
    notify()
    return 'default'
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const existing = await registration.pushManager.getSubscription()
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(cachedVapidPublicKey),
      }))
    const json = subscription.toJSON()
    const p256dh = json.keys?.p256dh
    const auth = json.keys?.auth
    if (!json.endpoint || !p256dh || !auth) {
      persistSubscriptionReady(false)
      notify()
      return 'default'
    }
    await savePushSubscription({
      endpoint: json.endpoint,
      keys: { p256dh, auth },
    })
    persistSubscriptionReady(true)
    notify()
    return 'ready'
  } catch {
    persistSubscriptionReady(false)
    notify()
    return getPushEligibility() === 'denied' ? 'denied' : 'default'
  }
}

export const TRADE_PUSH_OPEN_EVENT = 'brit:open-trade-payment'
export const BRIT_PUSH_CLICK_MESSAGE = 'BRIT_PUSH_CLICK'

export type TradePushNavigationDetail = {
  tradeId?: string
  sellOrderId?: string
  buyOrderId?: string
  url?: string
}

/** Web Push 구독 해제 (이 기기) */
export async function unsubscribePushNotification(): Promise<PushEligibility> {
  if (!isPushManagerAvailable()) {
    notify()
    return resolvePushEligibility()
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      const endpoint = subscription.endpoint
      await subscription.unsubscribe()
      try {
        await deletePushSubscription(endpoint)
      } catch {
        // 서버 행이 없어도 로컬 구독 해제는 성공으로 본다
      }
    }
    persistSubscriptionReady(false)
    notify()
    return resolvePushEligibility()
  } catch {
    notify()
    return resolvePushEligibility()
  }
}

