/**
 * useSecuritySettingsScreen
 *
 * 책임: 패스키 목록·추가·삭제·세션 조회/강제 종료
 */
import { useCallback, useEffect, useState } from 'react'
import { useFlow } from '@stackflow/react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import {
  deletePasskey,
  listPasskeys,
  listSessions,
  logout,
  registerPasskeyForCurrentUser,
  markPasskeyRegistered,
  revokeOtherSessions,
  revokeSession,
} from '../api/auth.api'
import type { PasskeyListItem, SessionListItem } from '../types/signup'
import { clearSession } from '../stores/authSession.store'
import { showSnackbar } from '../../../shared/utils/showSnackbar'

export function useSecuritySettingsScreen() {
  const { pop } = useFlow()
  const snackbar = useSnackbarAdapter()
  const [passkeys, setPasskeys] = useState<PasskeyListItem[]>([])
  const [sessions, setSessions] = useState<SessionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [pkResult, sessResult] = await Promise.allSettled([
        listPasskeys(),
        listSessions(),
      ])
      if (pkResult.status === 'fulfilled') {
        setPasskeys(pkResult.value)
      }
      if (sessResult.status === 'fulfilled') {
        setSessions(
          [...sessResult.value].sort(
            (a, b) => Number(b.isCurrent) - Number(a.isCurrent),
          ),
        )
      } else {
        showSnackbar(snackbar, '로그인 기기 목록을 불러오지 못했어요.', 'critical')
      }
    } finally {
      setLoading(false)
    }
  }, [snackbar])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleAddPasskey = async () => {
    if (busy) return
    setBusy(true)
    try {
      await registerPasskeyForCurrentUser()
      await markPasskeyRegistered()
      showSnackbar(snackbar, '패스키를 등록했어요.')
      await refresh()
    } catch {
      showSnackbar(snackbar, '패스키를 등록하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  const handleDeletePasskey = async (id: string) => {
    if (busy) return
    if (passkeys.length <= 1) {
      showSnackbar(
        snackbar,
        '마지막 패스키는 로그인 비밀번호가 있을 때만 지울 수 있어요. 지금은 유지해 주세요.',
      )
      return
    }
    setBusy(true)
    try {
      await deletePasskey(id)
      showSnackbar(snackbar, '패스키를 삭제했어요.')
      await refresh()
    } catch {
      showSnackbar(snackbar, '패스키를 삭제하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  const handleRevokeSession = async (id: string, isCurrent: boolean) => {
    if (busy) return
    if (isCurrent) {
      const ok = window.confirm(
        '이 기기에서 로그아웃할까요?\n지금 보고 있는 화면의 로그인이 끊겨요.',
      )
      if (!ok) return
    } else {
      const ok = window.confirm('이 기기의 로그인을 종료할까요?')
      if (!ok) return
    }
    setBusy(true)
    try {
      if (isCurrent) {
        try {
          await logout()
        } catch {
          // ignore — 로컬 세션은 항상 정리
        }
        clearSession()
        pop()
        return
      }
      await revokeSession(id)
      showSnackbar(snackbar, '해당 기기 로그인을 종료했어요.')
      await refresh()
    } catch {
      showSnackbar(snackbar, '세션을 종료하지 못했어요.', 'critical')
    } finally {
      setBusy(false)
    }
  }

  const handleRevokeOthers = async () => {
    if (busy) return
    const ok = window.confirm(
      '다른 기기의 로그인을 모두 종료할까요?\n지금 이 기기 로그인만 남아요.',
    )
    if (!ok) return
    setBusy(true)
    try {
      await revokeOtherSessions()
      showSnackbar(snackbar, '다른 기기 로그인을 종료했어요.')
      await refresh()
    } catch {
      showSnackbar(
        snackbar,
        '다른 기기 종료를 지원하지 않거나 실패했어요. 잠시 후 다시 시도해 주세요.',
        'critical',
      )
    } finally {
      setBusy(false)
    }
  }

  return {
    passkeys,
    sessions,
    loading,
    busy,
    pop,
    handleAddPasskey,
    handleDeletePasskey,
    handleRevokeSession,
    handleRevokeOthers,
  }
}
