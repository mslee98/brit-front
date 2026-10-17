/**
 * disputes.api — Nest /v1/disputes HTTP.
 * `VITE_USE_MOCK=true`이면 메모리 mock.
 */
import { httpGet, httpPost } from '../../../shared/api/httpClient'
import { shouldUseHttpApi } from '../../../shared/api/apiMode'

export type PartyDisputeDetail = {
  id: string
  tradeId: string
  status: string
  canChat: boolean
  displayName: string
}

export type PartyDisputeMessage = {
  id: string
  actionType: 'MESSAGE' | 'INTERNAL_NOTE' | 'EVIDENCE'
  actorRole: 'SYSTEM' | 'BUYER' | 'SELLER' | 'ADMIN'
  displayName: string
  isMine: boolean
  body: string
  imageUrl?: string | null
  createdAt: string
}

const mockMessages = new Map<string, PartyDisputeMessage[]>()
const mockRooms = new Map<string, PartyDisputeDetail>()

function mockRoom(disputeId: string): PartyDisputeDetail {
  const existing = mockRooms.get(disputeId)
  if (existing) return existing
  const created: PartyDisputeDetail = {
    id: disputeId,
    tradeId: disputeId.replace(/^mock-/, ''),
    status: 'OPEN_UNASSIGNED',
    canChat: true,
    displayName: 'Brit 분쟁조정팀',
  }
  mockRooms.set(disputeId, created)
  return created
}

export function getDispute(
  disputeId: string,
  signal?: AbortSignal,
): Promise<PartyDisputeDetail> {
  if (!shouldUseHttpApi()) {
    return Promise.resolve(mockRoom(disputeId))
  }
  return httpGet<PartyDisputeDetail>(`/v1/disputes/${disputeId}`, signal)
}

export function listDisputeMessages(
  disputeId: string,
  query?: { page?: number; size?: number },
  signal?: AbortSignal,
): Promise<{ items: PartyDisputeMessage[]; pagination: unknown }> {
  if (!shouldUseHttpApi()) {
    return Promise.resolve({
      items: [...(mockMessages.get(disputeId) ?? [])],
      pagination: { page: 1, size: 100, totalItems: 0, totalPages: 0 },
    })
  }
  const params = new URLSearchParams()
  if (query?.page) params.set('page', String(query.page))
  if (query?.size) params.set('size', String(query.size))
  const qs = params.toString()
  return httpGet(
    `/v1/disputes/${disputeId}/messages${qs ? `?${qs}` : ''}`,
    signal,
  )
}

export function postDisputeMessage(
  disputeId: string,
  body: string,
): Promise<PartyDisputeMessage> {
  if (!shouldUseHttpApi()) {
    const room = mockRoom(disputeId)
    if (!room.canChat) {
      return Promise.reject(new Error('TRADE_DISPUTE_CLOSED'))
    }
    const message: PartyDisputeMessage = {
      id: `mock-msg-${Date.now()}`,
      actionType: 'MESSAGE',
      actorRole: 'BUYER',
      displayName: '나',
      isMine: true,
      body,
      createdAt: new Date().toISOString(),
    }
    const list = mockMessages.get(disputeId) ?? []
    list.push(message)
    mockMessages.set(disputeId, list)
    return Promise.resolve(message)
  }
  return httpPost<PartyDisputeMessage>(`/v1/disputes/${disputeId}/messages`, {
    body,
  })
}

function getAssetOrigin(): string {
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''
  return base.replace(/\/v1$/, '') || ''
}

export function resolveDisputeAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${getAssetOrigin()}${path.startsWith('/') ? path : `/${path}`}`
}

export async function uploadDisputeEvidence(
  disputeId: string,
  file: File,
): Promise<PartyDisputeMessage> {
  if (!shouldUseHttpApi()) {
    const message: PartyDisputeMessage = {
      id: `mock-ev-${Date.now()}`,
      actionType: 'EVIDENCE',
      actorRole: 'BUYER',
      displayName: '나',
      isMine: true,
      body: '이미지를 첨부했어요.',
      imageUrl: URL.createObjectURL(file),
      createdAt: new Date().toISOString(),
    }
    const list = mockMessages.get(disputeId) ?? []
    list.push(message)
    mockMessages.set(disputeId, list)
    return message
  }

  const { getAccessToken } = await import('../../auth/stores/authSession.store')
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''
  const form = new FormData()
  form.append('file', file)
  const token = getAccessToken()
  const response = await fetch(`${base}/v1/disputes/${disputeId}/evidence`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return (await response.json()) as PartyDisputeMessage
}
