import { getAccessToken } from '../../auth/stores/authSession.store'
import type { NotificationInboxItem } from '../api/notifications.api'

type NotificationStreamHandler = (item: NotificationInboxItem) => void

const BASE_BACKOFF_MS = 1000
const MAX_BACKOFF_MS = 30_000

function getBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''
}

function parseSseChunk(buffer: string): { events: NotificationInboxItem[]; rest: string } {
  const events: NotificationInboxItem[] = []
  const parts = buffer.split('\n\n')
  const rest = parts.pop() ?? ''

  for (const part of parts) {
    const dataLine = part
      .split('\n')
      .find((line) => line.startsWith('data:'))
    if (!dataLine) continue
    const raw = dataLine.slice('data:'.length).trim()
    if (!raw) continue
    try {
      const envelope = JSON.parse(raw) as {
        type?: string
        data?: NotificationInboxItem
      }
      if (envelope.type === 'notification' && envelope.data) {
        events.push(envelope.data)
      }
    } catch {
      // ignore malformed frames
    }
  }

  return { events, rest }
}

/**
 * 인증 SSE (fetch + ReadableStream). EventSource는 Authorization 헤더를 못 보낸다.
 */
export class SseNotificationSource {
  private abortController: AbortController | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private backoffMs = BASE_BACKOFF_MS
  private handler: NotificationStreamHandler | null = null
  private active = false

  connect(onNotification: NotificationStreamHandler): void {
    this.handler = onNotification
    this.active = true
    this.backoffMs = BASE_BACKOFF_MS
    void this.openStream()
  }

  disconnect(): void {
    this.active = false
    this.handler = null
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.abortController?.abort()
    this.abortController = null
  }

  private scheduleReconnect(): void {
    if (!this.active) return
    const delay = this.backoffMs
    this.backoffMs = Math.min(this.backoffMs * 2, MAX_BACKOFF_MS)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      void this.openStream()
    }, delay)
  }

  private async openStream(): Promise<void> {
    if (!this.active) return
    const token = getAccessToken()
    if (!token) return

    this.abortController?.abort()
    const controller = new AbortController()
    this.abortController = controller

    const url = `${getBaseUrl()}/v1/me/notifications/stream`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        this.scheduleReconnect()
        return
      }

      this.backoffMs = BASE_BACKOFF_MS
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (this.active) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parsed = parseSseChunk(buffer)
        buffer = parsed.rest
        for (const item of parsed.events) {
          this.handler?.(item)
        }
      }

      if (this.active) {
        this.scheduleReconnect()
      }
    } catch (error) {
      if (controller.signal.aborted) return
      this.scheduleReconnect()
    }
  }
}

export const sseNotificationSource = new SseNotificationSource()
