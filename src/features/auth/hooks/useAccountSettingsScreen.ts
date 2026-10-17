/**
 * useAccountSettingsScreen
 *
 * 나의 Brit 계정 허브. 변경 화면으로 push하고, 로그아웃 API는 다음 단계에서 연결한다.
 */
import { useCallback, useEffect, useState } from 'react'
import { useFlow } from '@stackflow/react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { showSnackbar } from '../../../shared/utils/showSnackbar'
import { getMe } from '../api/auth.api'
import { ACCOUNT_ACTION_NOT_READY_MESSAGE } from '../constants'
import type { AuthMeResult } from '../types/signup'
import { useAuthStatus } from '../stores/authSession.store'
import { resetChangeBankAccountDraft } from './useChangeBankAccountScreen'
import { resetTransactionPinDraft } from './useTransactionPinScreen'

function getVerificationLabel(me: AuthMeResult): string {
  if (me.status === 'ACTIVE' && me.bankAccount.status === 'ACTIVE') {
    return '본인 인증 완료'
  }
  return '인증 필요'
}

export function useAccountSettingsScreen() {
  const { push } = useFlow()
  const snackbar = useSnackbarAdapter()
  const authStatus = useAuthStatus()
  const isAuthenticated = authStatus === 'authenticated'
  const [seenAuthStatus, setSeenAuthStatus] = useState(authStatus)
  const [me, setMe] = useState<AuthMeResult | null>(null)
  const [loading, setLoading] = useState(isAuthenticated)

  if (seenAuthStatus !== authStatus) {
    setSeenAuthStatus(authStatus)
    setMe(null)
    setLoading(authStatus === 'authenticated')
  }

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    void getMe()
      .then((result) => {
        if (!cancelled) setMe(result)
      })
      .catch(() => {
        if (!cancelled) setMe(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  const notifyNotReady = useCallback(() => {
    showSnackbar(snackbar, ACCOUNT_ACTION_NOT_READY_MESSAGE)
  }, [snackbar])

  const openChangePassword = useCallback(() => {
    push('ChangePassword', {}, { animate: true })
  }, [push])

  const openChangeBankAccount = useCallback(() => {
    resetChangeBankAccountDraft()
    push('ChangeBankAccount', { step: 'pin' }, { animate: true })
  }, [push])

  const openChangePin = useCallback(() => {
    resetTransactionPinDraft()
    push('TransactionPin', { mode: 'change', step: 'current' }, { animate: true })
  }, [push])

  const openResetPin = useCallback(() => {
    resetTransactionPinDraft()
    push('TransactionPin', { mode: 'reset', step: 'verify' }, { animate: true })
  }, [push])

  return {
    loading,
    nickname: me?.nickname ?? me?.loginId ?? me?.name ?? '',
    loginId: me?.loginId ?? '',
    verificationLabel: me ? getVerificationLabel(me) : '',
    openChangePassword,
    openChangeBankAccount,
    openChangePin,
    openResetPin,
    notifyNotReady,
  }
}
