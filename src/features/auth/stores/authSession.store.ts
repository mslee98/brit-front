/**
 * authSession.store
 *
 * Nest JWT 세션(status + tokens + user). localStorage에 보관.
 */
import { useSyncExternalStore } from 'react'

import type { AuthTokens, AuthUserSummary } from '../types/signup'

export type AuthStatus = 'guest' | 'authenticated'

const STORAGE_KEY = 'nt-auth-session'

type Listener = () => void

interface PersistedSession {
  status: AuthStatus
  tokens: AuthTokens | null
  user: AuthUserSummary | null
}

type SessionSnapshot = PersistedSession

let session: SessionSnapshot = {
  status: 'guest',
  tokens: null,
  user: null,
}
const listeners = new Set<Listener>()

function notify() {
  listeners.forEach((listener) => listener())
}

function readStoredSession(): SessionSnapshot {
  if (typeof window === 'undefined') {
    return { status: 'guest', tokens: null, user: null }
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { status: 'guest', tokens: null, user: null }

    // legacy: plain "authenticated"
    if (raw === 'authenticated') {
      return { status: 'authenticated', tokens: null, user: null }
    }
    if (raw === 'guest') {
      return { status: 'guest', tokens: null, user: null }
    }

    const parsed = JSON.parse(raw) as Partial<PersistedSession>
    const tokens = parsed.tokens ?? null
    const user = parsed.user ?? null
    const status: AuthStatus =
      parsed.status === 'authenticated' || Boolean(tokens?.accessToken)
        ? 'authenticated'
        : 'guest'
    return { status, tokens, user }
  } catch {
    return { status: 'guest', tokens: null, user: null }
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
  return session.status === 'authenticated'
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

export function setSession(tokens: AuthTokens, user: AuthUserSummary) {
  session = { status: 'authenticated', tokens, user }
  persistSession(session)
  notify()
}

export function updateTokens(tokens: AuthTokens) {
  session = { ...session, status: 'authenticated', tokens }
  persistSession(session)
  notify()
}

/** @deprecated Prefer setSession / clearSession */
export function setAuthStatus(next: AuthStatus) {
  if (next === 'guest') {
    clearSession()
    return
  }
  session = { ...session, status: 'authenticated' }
  persistSession(session)
  notify()
}

export function clearSession() {
  session = { status: 'guest', tokens: null, user: null }
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
