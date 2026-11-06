import { ApiError, API_ERROR_CODES, toApiErrorCode } from './errors'
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  updateTokens,
} from '../../features/auth/stores/authSession.store'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface HttpRequestOptions {
  method?: HttpMethod
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
  /** true면 Authorization 헤더를 붙이지 않음 (login/signup/refresh) */
  skipAuth?: boolean
  /** 갱신 후 재시도한 요청. 401이 다시 나오면 세션을 버린다. */
  retried?: boolean
}

interface RefreshedTokens {
  accessToken: string
  refreshToken: string
  expiresInSec: number
}

let refreshInFlight: Promise<boolean> | null = null

/** 동시 호출은 한 번의 refresh로 합친다. 소켓 handshake 인증 실패 복구에도 쓴다. */
export async function tryRefreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight
  const run = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false
    try {
      const tokens = await httpRequest<RefreshedTokens>('/v1/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
        skipAuth: true,
        retried: true,
      })
      if (!tokens.accessToken || !tokens.refreshToken) return false
      updateTokens(tokens)
      return true
    } catch {
      return false
    }
  })()
  refreshInFlight = run
  try {
    return await run
  } finally {
    if (refreshInFlight === run) refreshInFlight = null
  }
}

function getBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''
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
  const { method = 'GET', body, headers, signal, skipAuth = false, retried = false } = options
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
      const error = parseErrorBody(payload, response.status)
      if (response.status === 401 && !skipAuth && !retried) {
        const refreshed = await tryRefreshAccessToken()
        if (refreshed) {
          return httpRequest<T>(path, { ...options, retried: true })
        }
        clearSession()
      } else if (
        error.code === API_ERROR_CODES.INVALID_REFRESH_TOKEN ||
        response.status === 401
      ) {
        clearSession()
      }
      throw error
    } catch (error) {
      if (error instanceof ApiError) throw error
      if (response.status === 401 && !skipAuth && !retried) {
        const refreshed = await tryRefreshAccessToken()
        if (refreshed) {
          return httpRequest<T>(path, { ...options, retried: true })
        }
      }
      if (response.status === 401) {
        clearSession()
      }
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
  options?: { skipAuth?: boolean; headers?: Record<string, string> },
): Promise<T> {
  return httpRequest<T>(path, {
    method: 'POST',
    body,
    signal,
    skipAuth: options?.skipAuth,
    headers: options?.headers,
  })
}

export function httpPatch<T>(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
  options?: { skipAuth?: boolean },
): Promise<T> {
  return httpRequest<T>(path, {
    method: 'PATCH',
    body,
    signal,
    skipAuth: options?.skipAuth,
  })
}

export function httpDelete<T>(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  return httpRequest<T>(path, { method: 'DELETE', body, signal })
}
