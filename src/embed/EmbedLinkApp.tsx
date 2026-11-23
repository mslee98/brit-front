/**
 * BRIT 계정 연결 팝업 — 업체 사이트가 SDK로 연다. (MC-P9)
 *
 * 로그인(claim) → 코드 표시 + 대기 → BRIT 앱/웹에서 승인되면 code를 postMessage.
 * 최종 승인 CTA는 팝업에 두지 않는다. ALREADY_LINKED_SAME만 즉시 consent.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActionButton } from 'seed-design/ui/action-button'

import {
  clearSession,
  useAuthStatus,
  useAuthUser,
} from '../features/auth/stores/authSession.store'
import { ApiError } from '../shared/api/errors'
import { EmbedAccountSwitchLink } from './EmbedAccountSwitchLink'
import { EmbedLoginForm } from './EmbedLoginForm'
import { EmbedShell } from './EmbedShell'
import {
  claimLinkSession,
  consentLinkSession,
  rejectLinkSession,
  waitLinkSession,
  type EmbedLinkSession,
} from './embedLink.api'
import { LinkExpiryBar } from './LinkExpiryBar'
import { forgetSessionToken, postLinkResult } from './linkResultMessage'
import { subscribeLinkSessionEvents } from './subscribeLinkSessionEvents'

type View =
  | { kind: 'loading' }
  | { kind: 'login' }
  | { kind: 'waiting'; session: EmbedLinkSession }
  | { kind: 'blocked'; session: EmbedLinkSession; message: string }
  | { kind: 'finished'; title: string; message: string }
  | { kind: 'error'; message: string }

const CONFLICT_MESSAGES = {
  CONFLICT_OTHER_KEY:
    '이 BRIT 계정은 이미 이 업체의 다른 회원 계정과 연결돼 있어요. 기존 연결을 해제한 뒤 다시 시도해 주세요.',
  CONFLICT_KEY_TAKEN:
    '이 업체 회원 계정은 이미 다른 BRIT 계정과 연결돼 있어요. 연결한 BRIT 계정으로 로그인해 주세요.',
} as const

const WAIT_POLL_FALLBACK_MS = 4000

function errorMessage(error: unknown): string {
  if (error instanceof ApiError && error.message) return error.message
  return '잠시 후 다시 시도해 주세요.'
}

function closeSoon() {
  window.setTimeout(() => window.close(), 600)
}

export function EmbedLinkApp({ sessionToken }: { sessionToken: string | null }) {
  const authStatus = useAuthStatus()
  const user = useAuthUser()
  const [currentView, setView] = useState<View>({ kind: 'loading' })
  const [submitting, setSubmitting] = useState(false)
  const autoConsentRef = useRef(false)
  const finishedRef = useRef(false)

  const finish = useCallback(
    (
      returnOrigin: string,
      result: Parameters<typeof postLinkResult>[1],
      title: string,
      message: string,
    ) => {
      if (finishedRef.current) return
      finishedRef.current = true
      forgetSessionToken()
      const delivered = postLinkResult(returnOrigin, result)
      setView({
        kind: 'finished',
        title,
        message: delivered
          ? message
          : `${message} 이 창을 닫고 업체 화면으로 돌아가 주세요.`,
      })
      if (delivered) closeSoon()
    },
    [],
  )

  const completeAlreadyLinked = useCallback(
    async (session: EmbedLinkSession) => {
      if (!sessionToken || autoConsentRef.current) return
      autoConsentRef.current = true
      setSubmitting(true)
      try {
        const { code } = await consentLinkSession(sessionToken)
        finish(
          session.returnOrigin,
          { status: 'LINKED', code },
          '연결했어요',
          `${session.partnerName}와 이미 연결된 계정이에요.`,
        )
      } catch (error) {
        autoConsentRef.current = false
        setView({ kind: 'error', message: errorMessage(error) })
      } finally {
        setSubmitting(false)
      }
    },
    [finish, sessionToken],
  )

  useEffect(() => {
    if (authStatus !== 'authenticated' || !sessionToken) return
    let cancelled = false
    claimLinkSession(sessionToken).then(
      (session) => {
        if (cancelled) return
        if (session.linkState === 'ALREADY_LINKED_SAME') {
          void completeAlreadyLinked(session)
        } else if (session.linkState === 'NEW') {
          setView({ kind: 'waiting', session })
        } else {
          setView({
            kind: 'blocked',
            session,
            message: CONFLICT_MESSAGES[session.linkState],
          })
        }
      },
      (error: unknown) => {
        if (cancelled || (error instanceof ApiError && error.status === 401)) return
        setView({ kind: 'error', message: errorMessage(error) })
      },
    )
    return () => {
      cancelled = true
    }
  }, [authStatus, completeAlreadyLinked, sessionToken])

  useEffect(() => {
    if (currentView.kind !== 'waiting' || !sessionToken) return
    let cancelled = false
    const partnerName = currentView.session.partnerName
    const pinnedReturnOrigin = currentView.session.returnOrigin
    const controller = new AbortController()
    let pollTimer: number | undefined

    const applyWait = (result: Awaited<ReturnType<typeof waitLinkSession>>) => {
      if (cancelled || finishedRef.current) return
      if (result.status === 'PENDING') return
      if (result.status === 'CONSENTED' && result.code) {
        finish(
          pinnedReturnOrigin,
          { status: 'LINKED', code: result.code },
          '연결했어요',
          `${partnerName}와 BRIT 계정을 연결했어요.`,
        )
        return
      }
      if (result.status === 'REJECTED') {
        finish(
          pinnedReturnOrigin,
          { status: 'REJECTED' },
          '연결하지 않았어요',
          '업체 화면으로 돌아가요.',
        )
        return
      }
      if (result.status === 'EXPIRED') {
        setView({
          kind: 'error',
          message: '연결 요청 시간이 지났어요. 업체 화면에서 다시 시도해 주세요.',
        })
      }
    }

    const startPollFallback = () => {
      if (pollTimer != null || cancelled) return
      const tick = async () => {
        try {
          const result = await waitLinkSession(sessionToken)
          applyWait(result)
        } catch (error) {
          if (cancelled || finishedRef.current) return
          if (error instanceof ApiError && error.status === 401) return
          setView({ kind: 'error', message: errorMessage(error) })
        }
      }
      void tick()
      pollTimer = window.setInterval(() => void tick(), WAIT_POLL_FALLBACK_MS)
    }

    void subscribeLinkSessionEvents(sessionToken, applyWait, controller.signal).catch(
      () => {
        if (!cancelled) startPollFallback()
      },
    )

    return () => {
      cancelled = true
      controller.abort()
      if (pollTimer != null) window.clearInterval(pollTimer)
    }
  }, [currentView, finish, sessionToken])

  const reject = async () => {
    if (!sessionToken) return
    setSubmitting(true)
    try {
      const { returnOrigin } = await rejectLinkSession(sessionToken)
      finish(returnOrigin, { status: 'REJECTED' }, '연결하지 않았어요', '업체 화면으로 돌아가요.')
    } catch (error) {
      setView({ kind: 'error', message: errorMessage(error) })
    } finally {
      setSubmitting(false)
    }
  }

  const closeBlocked = (session: EmbedLinkSession) => {
    finish(
      session.returnOrigin,
      {
        status: 'ERROR',
        errorCode:
          session.linkState === 'CONFLICT_OTHER_KEY'
            ? 'PARTNER_USER_ALREADY_LINKED'
            : 'PARTNER_USER_LINK_ALREADY_EXISTS',
      },
      '연결할 수 없어요',
      '업체 화면으로 돌아가요.',
    )
  }

  const switchAccount = () => {
    autoConsentRef.current = false
    finishedRef.current = false
    setView({ kind: 'loading' })
    clearSession()
  }

  const view: View = !sessionToken
    ? { kind: 'error', message: '연결 요청 정보가 없어요. 업체 화면에서 다시 시도해 주세요.' }
    : authStatus === 'authenticated'
      ? currentView
      : { kind: 'login' }

  const handleClose = () => {
    if (submitting || finishedRef.current) return
    if (view.kind === 'waiting') {
      void reject()
      return
    }
    if (view.kind === 'blocked') {
      closeBlocked(view.session)
      return
    }
    window.close()
  }

  if (view.kind === 'login') {
    return (
      <EmbedLoginForm
        subtitle="업체와 연결할 BRIT 계정으로 로그인해 주세요."
        pendingMessage="가입 승인이 끝난 계정만 업체와 연결할 수 있어요."
        onClose={() => window.close()}
      />
    )
  }

  if (view.kind === 'loading') {
    return (
      <EmbedShell onClose={() => window.close()} closeDisabled={submitting}>
        <p className="embed-loading">연결 요청을 확인하고 있어요…</p>
      </EmbedShell>
    )
  }

  if (view.kind === 'waiting') {
    const member =
      view.session.partnerUserLabel
        ? `${view.session.partnerUserLabel} (${view.session.partnerUserKeyMasked})`
        : view.session.partnerUserKeyMasked
    return (
      <EmbedShell
        onClose={handleClose}
        closeDisabled={submitting}
        closeLabel="연결 취소"
        stickyFooter
        footer={
          <>
            <ActionButton
              size="large"
              variant="neutralWeak"
              disabled={submitting}
              onClick={() => void reject()}
            >
              연결 취소
            </ActionButton>
            <EmbedAccountSwitchLink
              disabled={submitting}
              onConfirmSwitch={switchAccount}
            />
          </>
        }
      >
        <div className="embed-hero">
          <h1 className="embed-hero__title">{view.session.partnerName}와 연결</h1>
          <p className="embed-hero__subtitle">
            아래 코드를 BRIT 앱·웹에 입력해 주세요. 승인될 때까지 이 창을 닫지 마세요.
          </p>
        </div>

        <div className="embed-code">
          <p className="embed-code__label">연결 코드</p>
          <p className="embed-code__value">{view.session.pairingCode ?? '····'}</p>
          <LinkExpiryBar
            expiresAt={view.session.pairingExpiresAt ?? view.session.expiresAt}
            onExpired={() =>
              setView({
                kind: 'error',
                message:
                  '연결 코드 시간이 지났어요. 업체 화면에서 다시 연결을 시작해 주세요.',
              })
            }
          />
        </div>

        <dl className="embed-rows" style={{ marginTop: 24 }}>
          <div>
            <dt>업체 회원</dt>
            <dd>{member}</dd>
          </div>
          <div>
            <dt>BRIT 계정</dt>
            <dd>{user?.nickname ?? user?.loginId ?? '-'}</dd>
          </div>
        </dl>

        <p className="embed-status">승인 대기 중이에요…</p>
      </EmbedShell>
    )
  }

  if (view.kind === 'blocked') {
    return (
      <EmbedShell
        onClose={handleClose}
        stickyFooter
        footer={
          <>
            <ActionButton
              size="large"
              variant="neutralSolid"
              onClick={() => closeBlocked(view.session)}
            >
              확인
            </ActionButton>
            <EmbedAccountSwitchLink onConfirmSwitch={switchAccount} />
          </>
        }
      >
        <div className="embed-hero">
          <h1 className="embed-hero__title">연결할 수 없어요</h1>
          <p className="embed-hero__subtitle">{view.message}</p>
        </div>
      </EmbedShell>
    )
  }

  if (view.kind === 'finished') {
    return (
      <EmbedShell>
        <div className="embed-hero">
          <h1 className="embed-hero__title">{view.title}</h1>
          <p className="embed-hero__subtitle">{view.message}</p>
        </div>
      </EmbedShell>
    )
  }

  return (
    <EmbedShell
      onClose={() => window.close()}
      stickyFooter
      footer={
        <ActionButton size="large" variant="neutralWeak" onClick={() => window.close()}>
          닫기
        </ActionButton>
      }
    >
      <div className="embed-hero">
        <h1 className="embed-hero__title">연결하지 못했어요</h1>
        <p className="embed-hero__subtitle">{view.message}</p>
      </div>
    </EmbedShell>
  )
}
