/**
 * authSession.store
 *
 * Nest JWT 세션(status + tokens + user). localStorage에 보관.
 * "로그인됨" = accessToken 존재. status만 있고 토큰이 없으면 guest로 취급한다.
 */
import { useSyncExternalStore } from 'react'

import type { AuthNextAction, AuthTokens, AuthUserSummary } from '../types/signup'
import { shouldUseHttpApi } from '../../../shared/api/apiMode'

export type AuthStatus = 'guest' | 'authenticated'

const STORAGE_KEY = 'nt-auth-session'

type Listener = () => void

interface PersistedSession {
  status: AuthStatus
  tokens: AuthTokens | null
  user: AuthUserSummary | null
  nextAction: AuthNextAction
}

type SessionSnapshot = PersistedSession

const GUEST_SESSION: SessionSnapshot = {
  status: 'guest',
  tokens: null,
  user: null,
  nextAction: 'NONE',
}

let session: SessionSnapshot = { ...GUEST_SESSION }
const listeners = new Set<Listener>()

function notify() {
  listeners.forEach((listener) => listener())
}

function hasAccessToken(tokens: AuthTokens | null | undefined): boolean {
  const token = tokens?.accessToken?.trim()
  if (!token) return false
  // Nest 실API 사용 중이면 mock 로그인 잔재를 인증으로 보지 않음
  if (shouldUseHttpApi() && token.startsWith('mock-access-')) {
    return false
  }
  return true
}

/** Nest JWT가 있어야만 authenticated. 토큰 없는 status는 guest로 정규화. */
function normalizeSession(raw: {
  tokens: AuthTokens | null
  user: AuthUserSummary | null
  nextAction?: AuthNextAction
  status?: AuthStatus
}): SessionSnapshot {
  const tokens = raw.tokens
  if (!hasAccessToken(tokens)) {
    return { ...GUEST_SESSION }
  }

  const nextAction: AuthNextAction =
    raw.nextAction === 'WAIT_FOR_APPROVAL' || raw.nextAction === 'ACTION_REQUIRED'
      ? raw.nextAction
      : 'NONE'

  return {
    status: 'authenticated',
    tokens,
    user: raw.user,
    nextAction,
  }
}

function readStoredSession(): SessionSnapshot {
  if (typeof window === 'undefined') {
    return { ...GUEST_SESSION }
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...GUEST_SESSION }

    // legacy: plain "authenticated" / "guest" — 토큰 없으므로 guest
    if (raw === 'authenticated' || raw === 'guest') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(GUEST_SESSION))
      return { ...GUEST_SESSION }
    }

    const parsed = JSON.parse(raw) as Partial<PersistedSession>
    const normalized = normalizeSession({
      tokens: parsed.tokens ?? null,
      user: parsed.user ?? null,
      nextAction: parsed.nextAction,
      status: parsed.status,
    })

    // 깨진 세션이면 스토리지도 guest로 정리
    if (
      normalized.status === 'guest' &&
      (parsed.status === 'authenticated' || parsed.tokens)
    ) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(GUEST_SESSION))
    }

    return normalized
  } catch {
    return { ...GUEST_SESSION }
  }
}

function persistSession(next: SessionSnapshot) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

session = readStoredSession()

export function getAuthStatus(): AuthStatus {
  return session.status
}

export function isAuthenticated(): boolean {
  return session.status === 'authenticated' && hasAccessToken(session.tokens)
}

export function getAccessToken(): string | null {
  return session.tokens?.accessToken ?? null
}

export function getRefreshToken(): string | null {
  return session.tokens?.refreshToken ?? null
}

export function getAuthUser(): AuthUserSummary | null {
  return session.user
}

export function getAuthTokens(): AuthTokens | null {
  return session.tokens
}

export function getAuthNextAction(): AuthNextAction {
  return session.nextAction
}

export function setSession(tokens: AuthTokens, user: AuthUserSummary, nextAction: AuthNextAction) {
  session = normalizeSession({ tokens, user, nextAction })
  persistSession(session)
  notify()
}

export function updateTokens(tokens: AuthTokens) {
  session = normalizeSession({
    tokens,
    user: session.user,
    nextAction: session.nextAction,
  })
  persistSession(session)
  notify()
}

/** @deprecated Prefer setSession / clearSession. 토큰 없이 authenticated 불가. */
export function setAuthStatus(next: AuthStatus) {
  if (next === 'guest' || !hasAccessToken(session.tokens)) {
    clearSession()
    return
  }
  session = { ...session, status: 'authenticated' }
  persistSession(session)
  notify()
}

export function clearSession() {
  session = { ...GUEST_SESSION }
  persistSession(session)
  notify()
}

export function subscribeAuthStatus(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useAuthStatus(): AuthStatus {
  return useSyncExternalStore(subscribeAuthStatus, getAuthStatus, () => 'guest')
}

export function useAuthUser(): AuthUserSummary | null {
  return useSyncExternalStore(subscribeAuthStatus, getAuthUser, () => null)
}

export function useAuthNextAction(): AuthNextAction {
  return useSyncExternalStore(subscribeAuthStatus, getAuthNextAction, () => 'NONE')
}
