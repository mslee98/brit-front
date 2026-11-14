import { getAccessToken } from '../features/auth/stores/authSession.store'
import { parseSseDataChunks } from '../shared/api/parseSseData'
import type { EmbedLinkWaitResult } from './embedLink.api'

function getBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''
}

function extractLinkSession(envelope: unknown): EmbedLinkWaitResult | null {
  if (!envelope || typeof envelope !== 'object') return null
  const e = envelope as { type?: string; data?: EmbedLinkWaitResult }
  if (e.type === 'link_session' && e.data) return e.data
  return null
}

/**
 * Embed 승인 대기 SSE (Authorization 헤더). EventSource는 Bearer를 못 보낸다.
 */
export async function subscribeLinkSessionEvents(
  sessionToken: string,
  onEvent: (result: EmbedLinkWaitResult) => void,
  signal: AbortSignal,
): Promise<void> {
  const token = getAccessToken()
  if (!token) return

  const url = `${getBaseUrl()}/v1/embed/link-sessions/${encodeURIComponent(sessionToken)}/events`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'text/event-stream',
      Authorization: `Bearer ${token}`,
    },
    signal,
  })

  if (!response.ok || !response.body) {
    throw new Error(`link-session SSE ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (!signal.aborted) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parsed = parseSseDataChunks(buffer, extractLinkSession)
    buffer = parsed.rest
    for (const event of parsed.events) {
      onEvent(event)
    }
  }
}
