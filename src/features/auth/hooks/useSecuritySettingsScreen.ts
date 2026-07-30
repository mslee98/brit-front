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
      const [pk, sess] = await Promise.all([listPasskeys(), listSessions()])
      setPasskeys(pk)
      setSessions(sess)
    } catch {
      showSnackbar(snackbar, '보안 정보를 불러오지 못했어요.')
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
    setBusy(true)
    try {
      await revokeSession(id)
      if (isCurrent) {
        try {
          await logout()
        } catch {
          // ignore
        }
        clearSession()
        pop()
        return
      }
      await refresh()
    } catch {
      showSnackbar(snackbar, '세션을 종료하지 못했어요.')
    } finally {
      setBusy(false)
    }
  }

  const handleRevokeOthers = async () => {
    if (busy) return
    setBusy(true)
    try {
      await revokeOtherSessions()
      showSnackbar(snackbar, '다른 기기 로그인을 종료했어요.')
      await refresh()
    } catch {
      showSnackbar(
        snackbar,
        '다른 기기 종료를 지원하지 않거나 실패했어요. 잠시 후 다시 시도해 주세요.',
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
