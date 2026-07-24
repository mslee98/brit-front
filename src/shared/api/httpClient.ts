import { ApiError, API_ERROR_CODES, toApiErrorCode } from './errors'
import { getAccessToken } from '../../features/auth/stores/authSession.store'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface HttpRequestOptions {
  method?: HttpMethod
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
  /** true면 Authorization 헤더를 붙이지 않음 (login/signup/refresh) */
  skipAuth?: boolean
}

function getBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
  if (!baseUrl) {
    throw new ApiError(API_ERROR_CODES.HTTP_ERROR, 'VITE_API_BASE_URL이 필요합니다.')
  }
  return baseUrl
}

interface NestErrorBody {
  code?: string
  error?: string
  message?: string | string[]
  statusCode?: number
}

function parseErrorBody(payload: NestErrorBody, status: number): ApiError {
  const details = Array.isArray(payload.message)
    ? payload.message
    : undefined
  const messageFromArray = details?.join(', ')
  const rawCode = payload.code ?? payload.error
  const message =
    (typeof payload.message === 'string' ? payload.message : undefined) ??
    messageFromArray ??
    rawCode ??
    `HTTP ${status}`
  const code = toApiErrorCode(rawCode)
  return new ApiError(code, message, status, details)
}

export async function httpRequest<T>(path: string, options: HttpRequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers, signal, skipAuth = false } = options
  const url = `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`

  const authHeaders: Record<string, string> = {}
  if (!skipAuth) {
    const token = getAccessToken()
    if (token) {
      authHeaders.Authorization = `Bearer ${token}`
    }
  }

  let response: Response
  try {
    response = await fetch(url, {
      method,
      signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...authHeaders,
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(API_ERROR_CODES.NETWORK_ERROR, '네트워크 요청에 실패했어요')
  }

  if (!response.ok) {
    try {
      const payload = (await response.json()) as NestErrorBody
      throw parseErrorBody(payload, response.status)
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(API_ERROR_CODES.HTTP_ERROR, `HTTP ${response.status}`, response.status)
    }
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  if (!text) {
    return undefined as T
  }

  return JSON.parse(text) as T
}

export function httpGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  return httpRequest<T>(path, { method: 'GET', signal })
}

export function httpPost<T>(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
  options?: { skipAuth?: boolean },
): Promise<T> {
  return httpRequest<T>(path, {
    method: 'POST',
    body,
    signal,
    skipAuth: options?.skipAuth,
  })
}
