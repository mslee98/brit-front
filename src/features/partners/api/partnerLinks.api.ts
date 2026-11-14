import { httpGet, httpPost } from '../../../shared/api/httpClient'
import { shouldUseHttpApi } from '../../../shared/api/apiMode'

export type MePartnerLinkItem = {
  linkId: string
  partnerId: string
  partnerName: string
  partnerCode: string
  partnerUserKeyMasked: string
  status: 'ACTIVE' | 'UNLINKED'
  linkedAt: string
}

export function shouldUsePartnerLinksHttpApi(): boolean {
  return shouldUseHttpApi()
}

export async function listMyPartnerLinks(
  signal?: AbortSignal,
): Promise<MePartnerLinkItem[]> {
  return httpGet<MePartnerLinkItem[]>('/v1/me/partner-links', signal)
}

export async function revokeMyPartnerLink(
  linkId: string,
): Promise<MePartnerLinkItem> {
  return httpPost<MePartnerLinkItem>(
    `/v1/me/partner-links/${encodeURIComponent(linkId)}/revoke`,
  )
}
