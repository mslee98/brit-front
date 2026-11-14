import { httpGet, httpPost } from '../shared/api/httpClient'

/** brit-api `EmbedLinkState`와 같아야 한다. */
export type EmbedLinkState =
  | 'NEW'
  | 'ALREADY_LINKED_SAME'
  | 'CONFLICT_OTHER_KEY'
  | 'CONFLICT_KEY_TAKEN'

export interface EmbedLinkSession {
  partnerName: string
  partnerCode: string
  partnerUserKeyMasked: string
  partnerUserLabel: string | null
  returnOrigin: string
  expiresAt: string
  linkState: EmbedLinkState
  requiresPairing: boolean
  claimed: boolean
  /** claim 이후에만 평문 */
  pairingCode: string | null
  pairingExpiresAt: string | null
}

export type EmbedLinkWaitStatus = 'PENDING' | 'CONSENTED' | 'REJECTED' | 'EXPIRED'

export interface EmbedLinkWaitResult {
  status: EmbedLinkWaitStatus
  code: string | null
  returnOrigin: string
}

const base = (token: string) => `/v1/embed/link-sessions/${encodeURIComponent(token)}`

export function claimLinkSession(token: string): Promise<EmbedLinkSession> {
  return httpPost(base(token) + '/claim')
}

export function fetchLinkSession(token: string): Promise<EmbedLinkSession> {
  return httpGet<EmbedLinkSession>(base(token))
}

export function waitLinkSession(token: string): Promise<EmbedLinkWaitResult> {
  return httpGet<EmbedLinkWaitResult>(`${base(token)}/wait`)
}

/** ALREADY_LINKED_SAME 빠른 경로. NEW는 클라이언트 승인. */
export function consentLinkSession(
  token: string,
): Promise<{ code: string; returnOrigin: string }> {
  return httpPost(`${base(token)}/consent`)
}

export function rejectLinkSession(token: string): Promise<{ returnOrigin: string }> {
  return httpPost(`${base(token)}/reject`)
}
