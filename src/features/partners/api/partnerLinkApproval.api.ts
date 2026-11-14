import { httpPost } from '../../../shared/api/httpClient'

export type PartnerLinkApprovalPreview = {
  sessionId: string
  partnerName: string
  partnerCode: string
  partnerUserKeyMasked: string
  partnerUserLabel: string | null
  linkState: 'NEW' | 'ALREADY_LINKED_SAME' | 'CONFLICT_OTHER_KEY' | 'CONFLICT_KEY_TAKEN'
  expiresAt: string
}

export function previewPartnerLinkApproval(input: {
  pairingCode?: string
  sessionId?: string
}): Promise<PartnerLinkApprovalPreview> {
  return httpPost('/v1/me/partner-link-approvals/preview', input)
}

export function approvePartnerLink(input: {
  pairingCode?: string
  sessionId?: string
}): Promise<{ sessionId: string; status: 'CONSENTED' }> {
  return httpPost('/v1/me/partner-link-approvals/approve', input)
}

export function rejectPartnerLink(input: {
  pairingCode?: string
  sessionId?: string
}): Promise<{ sessionId: string; status: 'REJECTED' }> {
  return httpPost('/v1/me/partner-link-approvals/reject', input)
}
