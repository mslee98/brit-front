import { useActivity, useActivityParams, useFlow, useStack } from '@stackflow/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { getAuthUser } from '../../auth/stores/authSession.store'
import { ApiError, API_ERROR_CODES } from '../../../shared/api/errors'
import { useRealtimeResync } from '../realtime/realtimeSync'
import { showSnackbar } from '../../../shared/utils/showSnackbar'
import { getMyTrade, shouldUseTradesHttpApi } from '../api/trades.api'
import {
  getDispute,
  listDisputeMessages,
  postDisputeMessage,
  uploadDisputeEvidence,
  type PartyDisputeDetail,
  type PartyDisputeMessage,
} from '../api/disputes.api'
import type { DisputeRealtimeMessage } from '../realtime/disputeSocket'
import { bootstrapServerTrade, getTradeDetail } from '../stores/tradeSession.store'
import { notify, setTradeRecord } from '../stores/tradeSession.state'
import { serverResponseToTradeRecord, type TradeRecord } from '../types'
import { toChatMessage } from '../utils/toChatMessage'
import { useDisputeRoomSocket } from './useDisputeRoomSocket'

/**
 * DisputeChat Activity orchestration — 방 요약 + REST 초기 로드 + 소켓 수신.
 */
export function useDisputeChatScreen() {
  const { isActive } = useActivity()
  const { disputeId } = useActivityParams<'DisputeChat'>()
  const { pop, replace } = useFlow()
  const { activities } = useStack()
  const snackbar = useSnackbarAdapter()

  const [room, setRoom] = useState<PartyDisputeDetail | null>(null)
  const [messages, setMessages] = useState<PartyDisputeMessage[]>([])
  const [trade, setTrade] = useState<TradeRecord | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const abortRef = useRef<AbortController | null>(null)
  const sawOpenRef = useRef(false)
  const leftForResultRef = useRef(false)
  const snackbarRef = useRef(snackbar)
  snackbarRef.current = snackbar

  const mapRealtimeMessage = useCallback(
    (raw: DisputeRealtimeMessage): PartyDisputeMessage => {
      const me = getAuthUser()?.id
      const isMine = Boolean(me && raw.actorUserId === me)
      let displayName = 'Brit 분쟁조정팀'
      if (raw.actorRole === 'BUYER' || raw.actorRole === 'SELLER') {
        displayName = isMine ? '나' : '상대방'
      }
      return {
        id: raw.id,
        actionType: raw.actionType,
        actorRole: raw.actorRole,
        displayName,
        isMine,
        body: raw.body,
        imageUrl: raw.imageUrl ?? null,
        createdAt:
          typeof raw.createdAt === 'string'
            ? raw.createdAt
            : new Date(raw.createdAt).toISOString(),
      }
    },
    [],
  )

  const upsertMessage = useCallback((next: PartyDisputeMessage) => {
    setMessages((prev) => {
      if (prev.some((row) => row.id === next.id)) return prev
      return [...prev, next]
    })
  }, [])

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!disputeId) return
      try {
        const [nextRoom, listed] = await Promise.all([
          getDispute(disputeId, signal),
          listDisputeMessages(disputeId, { page: 1, size: 100 }, signal),
        ])
        setRoom(nextRoom)
        setMessages(listed.items)
      } catch (error) {
        if (signal?.aborted) return
        if (
          error instanceof ApiError &&
          (error.status === 401 ||
            error.code === API_ERROR_CODES.UNAUTHORIZED ||
            error.code === API_ERROR_CODES.INVALID_REFRESH_TOKEN)
        ) {
          return
        }
        showSnackbar(snackbarRef.current, '채팅을 불러오지 못했어요.', 'critical')
      } finally {
        if (!signal?.aborted) setLoading(false)
      }
    },
    [disputeId],
  )

  useEffect(() => {
    if (!disputeId || !isActive) return

    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    void load(controller.signal)

    return () => {
      controller.abort()
    }
  }, [disputeId, isActive, load])

  useEffect(() => {
    if (!isActive || !room?.tradeId) return

    const cached = getTradeDetail(room.tradeId)
    if (cached) setTrade(cached)
    if (!shouldUseTradesHttpApi()) return

    const controller = new AbortController()
    void getMyTrade(room.tradeId, controller.signal)
      .then((dto) => {
        const record = serverResponseToTradeRecord(dto)
        setTradeRecord(record)
        notify()
        setTrade(record)
      })
      .catch(() => undefined)

    return () => {
      controller.abort()
    }
  }, [isActive, room?.tradeId])

  const goToTradeResult = useCallback(
    async (tradeId: string) => {
      if (leftForResultRef.current) return
      leftForResultRef.current = true
      try {
        const dto = await getMyTrade(tradeId)
        setTradeRecord(serverResponseToTradeRecord(dto))
        notify()
      } catch {
        bootstrapServerTrade(tradeId)
      }

      const previous = activities[activities.length - 2]
      if (previous?.name === 'Trade') {
        pop()
        return
      }
      replace('Trade', { tradeId }, { animate: true })
    },
    [activities, pop, replace],
  )

  useDisputeRoomSocket(disputeId, isActive && Boolean(disputeId), {
    onMessageCreated: (payload) => {
      upsertMessage(mapRealtimeMessage(payload.message))
    },
    onResolved: (payload) => {
      void goToTradeResult(payload.tradeId)
    },
  })

  const refetchIfVisible = useCallback(() => {
    void load(abortRef.current?.signal)
  }, [load])

  useRealtimeResync(refetchIfVisible, isActive && Boolean(disputeId))

  useEffect(() => {
    sawOpenRef.current = false
    leftForResultRef.current = false
  }, [disputeId])

  useEffect(() => {
    if (room?.canChat === true) sawOpenRef.current = true
  }, [room?.canChat])

  useEffect(() => {
    if (!isActive || loading || !room?.tradeId) return
    if (room.canChat !== false) return
    if (!sawOpenRef.current) return
    void goToTradeResult(room.tradeId)
  }, [goToTradeResult, isActive, loading, room])

  const handleViewTradeResult = useCallback(() => {
    if (!room?.tradeId) return
    leftForResultRef.current = false
    void goToTradeResult(room.tradeId)
  }, [goToTradeResult, room?.tradeId])

  const handleSend = useCallback(async () => {
    const body = draft.trim()
    if (!body || sending || !disputeId || room?.canChat === false) return
    setSending(true)
    try {
      const posted = await postDisputeMessage(disputeId, body)
      setDraft('')
      upsertMessage(posted)
    } catch {
      showSnackbar(snackbar, '메시지를 보내지 못했어요.', 'critical')
    } finally {
      setSending(false)
    }
  }, [disputeId, draft, room?.canChat, sending, snackbar, upsertMessage])

  const handleAttachEvidence = useCallback(
    async (files: File[]) => {
      if (!disputeId || sending || room?.canChat === false || files.length === 0) return
      setSending(true)
      try {
        for (const file of files) {
          const posted = await uploadDisputeEvidence(disputeId, file)
          upsertMessage(posted)
        }
      } catch {
        showSnackbar(snackbar, '이미지를 첨부하지 못했어요.', 'critical')
      } finally {
        setSending(false)
      }
    },
    [disputeId, room?.canChat, sending, snackbar, upsertMessage],
  )

  return {
    disputeId,
    room,
    trade,
    messages: messages.map(toChatMessage),
    draft,
    setDraft,
    sending,
    loading,
    handleSend,
    handleAttachEvidence,
    handleViewTradeResult,
    handleBack: pop,
  }
}
