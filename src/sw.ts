/// <reference lib="webworker" />

import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { clientsClaim } from 'workbox-core'
import { ExpirationPlugin } from 'workbox-expiration'
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<string | { url: string; revision: string | null }>
}

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
self.skipWaiting()
clientsClaim()

const precachedIndexHtml = self.__WB_MANIFEST.map((entry) =>
  typeof entry === 'string' ? entry : entry.url,
).find((url) => url === '/index.html' || url === 'index.html')

if (precachedIndexHtml) {
  registerRoute(new NavigationRoute(createHandlerBoundToURL(precachedIndexHtml)))
}

registerRoute(
  ({ url }) => /\/motion\/.+\.apng$/i.test(url.pathname),
  new CacheFirst({
    cacheName: 'brit-motion-v2',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 24,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
      new CacheableResponsePlugin({ statuses: [200] }),
    ],
  }),
)

registerRoute(
  ({ url }) => /\/apng\/.+\.png$/i.test(url.pathname),
  new CacheFirst({
    cacheName: 'brit-motion-v2',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 24,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
      new CacheableResponsePlugin({ statuses: [200] }),
    ],
  }),
)

type BritPushPayload = {
  notificationId?: string
  type?: string
  title?: string
  body?: string
  deepLink?: string
  message?: string
  url?: string
  tradeId?: string
  sellOrderId?: string
  buyOrderId?: string
  referenceId?: string
  eventType?: string
}

function parsePushPayload(event: PushEvent): BritPushPayload {
  if (!event.data) return {}
  try {
    return event.data.json() as BritPushPayload
  } catch {
    return { body: event.data.text(), message: event.data.text() }
  }
}

function resolveBody(payload: BritPushPayload): string {
  return payload.body ?? payload.message ?? ''
}

function resolveDeepLink(payload: BritPushPayload): string {
  return payload.deepLink || payload.url || '/'
}

self.addEventListener('push', (event) => {
  const payload = parsePushPayload(event)
  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'Brit', {
      body: resolveBody(payload),
      tag:
        payload.notificationId ??
        payload.referenceId ??
        payload.tradeId ??
        payload.sellOrderId ??
        'brit-push',
      data: payload,
      icon: '/logo_symbol-gray.png',
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = (event.notification.data ?? {}) as BritPushPayload
  const url = resolveDeepLink(data)
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      const existing = clientList[0]
      if (existing) {
        await existing.focus()
        existing.postMessage({
          type: 'BRIT_PUSH_CLICK',
          notificationId: data.notificationId,
          eventType: data.type ?? data.eventType,
          tradeId: data.tradeId,
          sellOrderId: data.sellOrderId,
          buyOrderId: data.buyOrderId,
          url,
        })
        return
      }
      await self.clients.openWindow(url)
    })(),
  )
})
