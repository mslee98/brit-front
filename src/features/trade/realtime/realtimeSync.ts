/**
 * realtimeSync — 소켓 신호를 놓쳤을 수 있는 순간을 모아 화면에 resync를 알린다.
 *
 * 신호는 전달 보장이 없으므로 화면 상태의 기준은 항상 REST다.
 * - 재연결(서버 상태 복구 실패 시) · 앱 복귀 · 온라인 복귀 · bfcache 복귀 → resync 1회
 * - 끊겨 있는 동안에만 간격을 늘려 resync + 재연결 시도. 연결이 살아 있으면 추가 요청 없음
 * - handshake 인증 실패·서버 강제 종료 → 토큰 갱신 후 재연결
 */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { Socket } from 'socket.io-client'

import { shouldUseHttpApi } from '../../../shared/api/apiMode'
import { tryRefreshAccessToken } from '../../../shared/api/httpClient'

export type RealtimeConnectionState = 'connected' | 'reconnecting'

type Listener = () => void

/** 서버 socket-auth 미들웨어가 connect_error로 보내는 message */
const SOCKET_UNAUTHORIZED = 'UNAUTHORIZED'
const DISCONNECTED_RESYNC_BACKOFF_MS = [3_000, 6_000, 12_000, 24_000, 30_000]
/** 여러 트리거(두 소켓 재연결 + 앱 복귀)가 겹쳐도 GET은 한 번 */
const RESYNC_COALESCE_MS = 150
/** 재연결 직후(배포·서버 재시작 시 전원 동시) 다시 조회를 흩뿌리는 폭 */
const RECONNECT_RESYNC_JITTER_MS = 1_500
/** 세션이 끊긴 경우 refresh→거절 루프를 막는다. 다음 시도는 백오프 tick이 맡는다 */
const AUTH_RECOVERY_MIN_INTERVAL_MS = 10_000

/** 마감 시각(요청 만료·입금 기한 등) 직후 한 번 다시 조회할 때 서버 배치를 기다리는 여유 */
export const DEADLINE_RECHECK_GRACE_MS = 1_500

const resyncListeners = new Set<Listener>()
const stateListeners = new Set<Listener>()
const trackedSockets = new Map<string, Socket>()
const everConnected = new Set<string>()

let connectionState: RealtimeConnectionState = 'connected'
let pendingResync: number | null = null
let backoffTimer: number | null = null
let backoffStep = 0
let authRecovery: Promise<void> | null = null
let lastAuthRecoveryAt = 0

function isDocumentVisible(): boolean {
  return typeof document === 'undefined' || document.visibilityState === 'visible'
}

/** `jitterMs`: 서버 재시작처럼 여러 클라이언트가 동시에 부르는 경우 GET을 흩뿌린다 */
export function requestRealtimeResync(jitterMs = 0): void {
  if (typeof window === 'undefined' || pendingResync != null) return
  pendingResync = window.setTimeout(() => {
    pendingResync = null
    resyncListeners.forEach((listener) => listener())
  }, RESYNC_COALESCE_MS + Math.random() * jitterMs)
}

function setConnectionState(next: RealtimeConnectionState) {
  if (connectionState === next) return
  connectionState = next
  stateListeners.forEach((listener) => listener())
}

function clearBackoff() {
  if (backoffTimer != null) window.clearTimeout(backoffTimer)
  backoffTimer = null
}

function scheduleBackoff() {
  clearBackoff()
  if (connectionState === 'connected' || !isDocumentVisible()) return
  const delay =
    DISCONNECTED_RESYNC_BACKOFF_MS[
      Math.min(backoffStep, DISCONNECTED_RESYNC_BACKOFF_MS.length - 1)
    ]
  backoffTimer = window.setTimeout(() => {
    backoffTimer = null
    backoffStep += 1
    reviveStoppedSockets()
    requestRealtimeResync()
    scheduleBackoff()
  }, delay)
}

function recomputeConnectionState() {
  const anyDown = [...trackedSockets.values()].some((socket) => !socket.connected)
  setConnectionState(anyDown ? 'reconnecting' : 'connected')
  if (anyDown) {
    if (backoffTimer == null) scheduleBackoff()
  } else {
    backoffStep = 0
    clearBackoff()
  }
}

/** 자동 재연결이 멈춘 소켓(인증 실패·서버 종료)을 토큰 갱신 후 다시 붙인다 */
function recoverAuth(socket: Socket) {
  if (authRecovery) return
  const now = Date.now()
  if (now - lastAuthRecoveryAt < AUTH_RECOVERY_MIN_INTERVAL_MS) return
  lastAuthRecoveryAt = now
  authRecovery = tryRefreshAccessToken()
    .then((refreshed) => {
      if (refreshed && !socket.connected) socket.connect()
    })
    .finally(() => {
      authRecovery = null
    })
}

function reviveStoppedSockets() {
  trackedSockets.forEach((socket) => {
    // active=false: 자동 재연결 중이 아님 (미들웨어 거절·서버 disconnect)
    if (!socket.connected && !socket.active) recoverAuth(socket)
  })
}

export function trackRealtimeSocket(name: string, socket: Socket): void {
  // mock 모드에는 서버가 없어 연결 상태를 추적하지 않는다
  if (!shouldUseHttpApi()) return
  trackedSockets.set(name, socket)

  socket.on('connect', () => {
    const isReconnect = everConnected.has(name)
    everConnected.add(name)
    recomputeConnectionState()
    // recovered면 서버가 놓친 이벤트를 다시 보냈다
    if (isReconnect && !socket.recovered) requestRealtimeResync(RECONNECT_RESYNC_JITTER_MS)
  })
  socket.on('disconnect', (reason) => {
    recomputeConnectionState()
    if (reason === 'io server disconnect') recoverAuth(socket)
  })
  socket.on('connect_error', (error) => {
    recomputeConnectionState()
    if (error.message === SOCKET_UNAUTHORIZED) recoverAuth(socket)
  })

  recomputeConnectionState()
}

export function untrackRealtimeSocket(name: string): void {
  trackedSockets.delete(name)
  everConnected.delete(name)
  recomputeConnectionState()
}

if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') {
      clearBackoff()
      return
    }
    reviveStoppedSockets()
    requestRealtimeResync()
    backoffStep = 0
    recomputeConnectionState()
  })
  window.addEventListener('online', () => {
    reviveStoppedSockets()
    requestRealtimeResync()
  })
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) requestRealtimeResync()
  })
}

/** effect 안에서 직접 구독할 때 (조회 함수가 effect 지역 변수인 화면) */
export function subscribeRealtimeResync(listener: Listener): () => void {
  resyncListeners.add(listener)
  return () => {
    resyncListeners.delete(listener)
  }
}

/**
 * 놓친 신호를 메우는 resync 콜백 등록. 화면이 보이는 동안만 켠다.
 * 소켓 이벤트 구독은 각 화면이 그대로 하고, 이 훅은 "다시 맞춰야 할 때"만 알린다.
 */
export function useRealtimeResync(onResync: () => void, enabled = true): void {
  const callbackRef = useRef(onResync)
  useEffect(() => {
    callbackRef.current = onResync
  }, [onResync])

  useEffect(() => {
    if (!enabled) return
    return subscribeRealtimeResync(() => callbackRef.current())
  }, [enabled])
}

function subscribeConnectionState(listener: Listener): () => void {
  stateListeners.add(listener)
  return () => stateListeners.delete(listener)
}

function getConnectionState(): RealtimeConnectionState {
  return connectionState
}

export function useRealtimeConnectionState(): RealtimeConnectionState {
  return useSyncExternalStore(subscribeConnectionState, getConnectionState, getConnectionState)
}

/** 순간 끊김에는 반응하지 않도록, 일정 시간 이상 끊겨 있을 때만 true */
export function useRealtimeConnectionUnstable(thresholdMs = 3_000): boolean {
  const state = useRealtimeConnectionState()
  const [unstable, setUnstable] = useState(false)

  useEffect(() => {
    if (state === 'connected') {
      const reset = window.setTimeout(() => setUnstable(false), 0)
      return () => window.clearTimeout(reset)
    }
    const timer = window.setTimeout(() => setUnstable(true), thresholdMs)
    return () => window.clearTimeout(timer)
  }, [state, thresholdMs])

  return unstable
}
