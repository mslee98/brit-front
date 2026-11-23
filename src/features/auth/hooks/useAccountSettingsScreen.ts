/**
 * useAccountSettingsScreen
 *
 * 나의 Brit 계정 허브. 변경·업체 연결·로그아웃.
 */
import { useCallback, useEffect, useState } from 'react'
import { useFlow, useStack } from '@stackflow/react'

import { getMe, logout, logoutAll } from '../api/auth.api'
import { clearSession, useAuthStatus } from '../stores/authSession.store'
import type { AuthMeResult } from '../types/signup'
import { navigateToRootLogin } from '../../../stackflow/navigateToRootLogin'
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
  const { activities } = useStack()
  const authStatus = useAuthStatus()
  const isAuthenticated = authStatus === 'authenticated'
  const [seenAuthStatus, setSeenAuthStatus] = useState(authStatus)
  const [me, setMe] = useState<AuthMeResult | null>(null)
  const [loading, setLoading] = useState(isAuthenticated)
  const [loggingOut, setLoggingOut] = useState(false)

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

  const openSecuritySettings = useCallback(() => {
    push('SecuritySettings', {}, { animate: true })
  }, [push])

  const openPartnerLinks = useCallback(() => {
    push('PartnerLinks', {}, { animate: true })
  }, [push])

  const openPartnerLinkApprove = useCallback(() => {
    push('PartnerLinkApprove', {}, { animate: true })
  }, [push])

  const handleLogoutThisDevice = useCallback(async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      clearSession()
      setLoggingOut(false)
      navigateToRootLogin(activities.length)
    }
  }, [activities.length, loggingOut])

  const handleLogoutAllDevices = useCallback(async () => {
    if (loggingOut) return
    const ok = window.confirm(
      '모든 기기에서 로그아웃할까요?\n다른 기기·탭의 로그인도 함께 끊겨요.',
    )
    if (!ok) return
    setLoggingOut(true)
    try {
      await logoutAll()
    } finally {
      clearSession()
      setLoggingOut(false)
      navigateToRootLogin(activities.length)
    }
  }, [activities.length, loggingOut])

  return {
    loading,
    loggingOut,
    nickname: me?.nickname ?? me?.loginId ?? me?.name ?? '',
    loginId: me?.loginId ?? '',
    verificationLabel: me ? getVerificationLabel(me) : '',
    openChangePassword,
    openChangeBankAccount,
    openChangePin,
    openResetPin,
    openSecuritySettings,
    openPartnerLinks,
    openPartnerLinkApprove,
    handleLogoutThisDevice,
    handleLogoutAllDevices,
  }
}
