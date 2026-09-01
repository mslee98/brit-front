import { httpDelete, httpGet, httpPost } from '../../../shared/api/httpClient'

export type VapidPublicKeyResponse = {
  enabled: boolean
  publicKey?: string
}

export type PushSubscriptionKeys = {
  p256dh: string
  auth: string
}

export async function getVapidPublicKey(
  signal?: AbortSignal,
): Promise<VapidPublicKeyResponse> {
  return httpGet<VapidPublicKeyResponse>('/v1/me/push/vapid-public-key', signal)
}

export async function savePushSubscription(input: {
  endpoint: string
  keys: PushSubscriptionKeys
  signal?: AbortSignal
}): Promise<{ id: string; endpoint: string }> {
  return httpPost<{ id: string; endpoint: string }>(
    '/v1/me/push/subscriptions',
    { endpoint: input.endpoint, keys: input.keys },
    input.signal,
  )
}

export async function deletePushSubscription(
  endpoint: string,
  signal?: AbortSignal,
): Promise<void> {
  await httpDelete<void>('/v1/me/push/subscriptions', { endpoint }, signal)
}

export async function sendDevTestPush(
  signal?: AbortSignal,
): Promise<{ queued: true; referenceId: string }> {
  return httpPost<{ queued: true; referenceId: string }>(
    '/v1/me/push/test',
    {},
    signal,
  )
}
