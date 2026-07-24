/**
 * useSignupOctomoVerify
 *
 * 책임: OCTOMO READY/WAITING/CHECKING/VERIFIED/DELAYED 상태머신·방법 전환·적응형 폴링
 * 비책임: Edge Function / OCTOMO secret, PWA 설치 여부로 인증 분기
 * QR 이미지는 클라 QRCodeSVG(smsHref) — OCTOMO CreateQR 미사용
 */
import { useActivityParams, useFlow } from '@stackflow/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { useIsDesktopViewport } from '../../../app/layouts/useIsDesktopViewport'
import { showSnackbar } from '../../../shared/utils/showSnackbar'
import { useDeviceContext } from '../../pwa/hooks/useDeviceContext'
import { useRuntimeEnvironment } from '../../pwa/hooks/useRuntimeEnvironment'
import { checkOctomoMessage } from '../api/octomo.api'
import {
  OCTOMO_SMS_MESSAGE,
  OCTOMO_SMS_PHONE,
  createOctomoSmsHref,
} from '../utils/createOctomoSmsUrl'
import {
  clearPendingOctomo,
  savePendingOctomo,
} from '../utils/pendingOctomoStorage'
import {
  OCTOMO_QR_POLL_DELAYS_MS,
  OCTOMO_SMS_POLL_DELAYS_MS,
  startOctomoPolling,
} from '../utils/startOctomoPolling'
import { updateSignupDraft } from '../stores/signupDraft.store'
import { useSignupForm } from './useSignupForm'
import { useSignupExitGuard } from './useSignupExitGuard'

export type OctomoAuthMethod = 'sms' | 'qr'
export type OctomoVerifyState =
  | 'READY'
  | 'WAITING'
  | 'CHECKING'
  | 'VERIFIED'
  | 'DELAYED'
  | 'ERROR'

const VERIFIED_NAVIGATE_MS = 800
const WAITING_SOFT_COPY_MS = 20_000

function recommendAuthMethod(isDesktop: boolean): OctomoAuthMethod {
  return isDesktop ? 'qr' : 'sms'
}

function maskPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 10) return raw
  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`
}

export function useSignupOctomoVerify() {
  const { phone: phoneParam } = useActivityParams<'SignupSms'>()
  const { replace, pop } = useFlow()
  const snackbar = useSnackbarAdapter()
  const exit = useSignupExitGuard()
  const { draft } = useSignupForm()
  const isDesktopViewport = useIsDesktopViewport()
  const runtime = useRuntimeEnvironment()
  const device = useDeviceContext()

  const phone = draft.phone || phoneParam.replace(/\D/g, '')
  const isDesktop =
    isDesktopViewport ||
    runtime === 'desktop' ||
    device?.runtimeEnvironment === 'desktop'

  const smsHref = createOctomoSmsHref()
  const verificationMessage = OCTOMO_SMS_MESSAGE

  const [authMethod, setAuthMethodState] = useState<OctomoAuthMethod>(() =>
    recommendAuthMethod(isDesktop),
  )
  const [state, setState] = useState<OctomoVerifyState>('READY')
  const [showSoftWaitingCopy, setShowSoftWaitingCopy] = useState(false)
  const [manualChecking, setManualChecking] = useState(false)

  const verifiedRef = useRef(false)
  const smsOpenedRef = useRef(false)
  const methodOverrideRef = useRef(false)
  const desktopHintAppliedRef = useRef(false)
  const pollingActiveRef = useRef(false)
  const pollingStopRef = useRef<(() => void) | null>(null)
  const softCopyTimerRef = useRef<number | undefined>(undefined)
  const navigateTimerRef = useRef<number | undefined>(undefined)
  const phoneRef = useRef(phone)
  const snackbarRef = useRef(snackbar)
  const replaceRef = useRef(replace)

  phoneRef.current = phone
  snackbarRef.current = snackbar
  replaceRef.current = replace

  const stopPolling = useCallback(() => {
    pollingStopRef.current?.()
    pollingStopRef.current = null
    pollingActiveRef.current = false
  }, [])

  const clearSoftCopyTimer = useCallback(() => {
    if (softCopyTimerRef.current !== undefined) {
      window.clearTimeout(softCopyTimerRef.current)
      softCopyTimerRef.current = undefined
    }
  }, [])

  const persistPending = useCallback(() => {
    const currentPhone = phoneRef.current
    if (!currentPhone) return
    savePendingOctomo({
      phone: currentPhone,
      message: verificationMessage,
      startedAt: Date.now(),
    })
  }, [verificationMessage])

  const handleVerified = useCallback(() => {
    if (verifiedRef.current) return
    verifiedRef.current = true
    stopPolling()
    clearSoftCopyTimer()
    clearPendingOctomo()
    // Edge가 requestId를 아직 안 주므로 Nest 계약용 임시 proof
    updateSignupDraft({
      octomoRequestId: crypto.randomUUID(),
      octomoVerifiedAt: new Date().toISOString(),
    })
    setState('VERIFIED')

    navigateTimerRef.current = window.setTimeout(() => {
      replaceRef.current('SignupCredentials', { step: 'loginId' })
    }, VERIFIED_NAVIGATE_MS)
  }, [clearSoftCopyTimer, stopPolling])

  const startPolling = useCallback(
    (method: OctomoAuthMethod) => {
      const currentPhone = phoneRef.current
      if (!currentPhone || verifiedRef.current || pollingActiveRef.current) return

      stopPolling()
      persistPending()
      pollingActiveRef.current = true
      setShowSoftWaitingCopy(false)
      clearSoftCopyTimer()
      softCopyTimerRef.current = window.setTimeout(() => {
        setShowSoftWaitingCopy(true)
      }, WAITING_SOFT_COPY_MS)
      setState('WAITING')

      pollingStopRef.current = startOctomoPolling({
        mobileNum: currentPhone,
        text: verificationMessage,
        delaysMs:
          method === 'sms' ? OCTOMO_SMS_POLL_DELAYS_MS : OCTOMO_QR_POLL_DELAYS_MS,
        onCheckStart: () => {
          if (!verifiedRef.current) setState('CHECKING')
        },
        onWaiting: () => {
          if (!verifiedRef.current) setState('WAITING')
        },
        onVerified: handleVerified,
        onTimeout: () => {
          pollingActiveRef.current = false
          pollingStopRef.current = null
          if (!verifiedRef.current) {
            setState('DELAYED')
            clearSoftCopyTimer()
          }
        },
        onError: () => {
          if (!verifiedRef.current) setState('ERROR')
        },
      })
    },
    [
      clearSoftCopyTimer,
      handleVerified,
      persistPending,
      stopPolling,
      verificationMessage,
    ],
  )

  const setAuthMethod = useCallback(
    (method: OctomoAuthMethod) => {
      if (verifiedRef.current) return
      methodOverrideRef.current = true
      stopPolling()
      clearSoftCopyTimer()
      smsOpenedRef.current = false
      setShowSoftWaitingCopy(false)
      setState('READY')
      setAuthMethodState(method)
    },
    [clearSoftCopyTimer, stopPolling],
  )

  // DeviceContext가 늦게 오면 1회만 기본 방법 반영 (사용자 전환 후엔 덮지 않음)
  useEffect(() => {
    if (methodOverrideRef.current || desktopHintAppliedRef.current) return
    if (!isDesktop) return
    desktopHintAppliedRef.current = true
    setAuthMethodState('qr')
  }, [isDesktop])

  // QR 이미지는 Activity의 QRCodeSVG가 smsHref로 그림. 여기선 exists 폴링만.
  useEffect(() => {
    if (authMethod !== 'qr' || verifiedRef.current) return

    startPolling('qr')

    return () => {
      stopPolling()
    }
  }, [authMethod, startPolling, stopPolling])

  useEffect(() => {
    if (authMethod !== 'sms') return

    const tryStartAfterReturn = () => {
      if (
        document.visibilityState === 'visible' &&
        smsOpenedRef.current &&
        !verifiedRef.current &&
        !pollingActiveRef.current
      ) {
        startPolling('sms')
      }
    }

    document.addEventListener('visibilitychange', tryStartAfterReturn)
    window.addEventListener('pageshow', tryStartAfterReturn)
    window.addEventListener('focus', tryStartAfterReturn)

    return () => {
      document.removeEventListener('visibilitychange', tryStartAfterReturn)
      window.removeEventListener('pageshow', tryStartAfterReturn)
      window.removeEventListener('focus', tryStartAfterReturn)
    }
  }, [authMethod, startPolling])

  useEffect(() => {
    return () => {
      stopPolling()
      clearSoftCopyTimer()
      if (navigateTimerRef.current !== undefined) {
        window.clearTimeout(navigateTimerRef.current)
      }
    }
  }, [clearSoftCopyTimer, stopPolling])

  const handlePrepareSmsOpen = useCallback(() => {
    persistPending()
    smsOpenedRef.current = true
    setState('WAITING')
  }, [persistPending])

  const handleManualRecheck = useCallback(async () => {
    if (verifiedRef.current || manualChecking || !phoneRef.current) return

    setManualChecking(true)
    setState('CHECKING')

    try {
      const result = await checkOctomoMessage({
        mobileNum: phoneRef.current,
        text: verificationMessage,
        withinMinutes: 5,
      })

      if (result.exists) {
        handleVerified()
        return
      }

      showSnackbar(snackbarRef.current, '아직 문자가 확인되지 않았어요', 'default')
      setState('DELAYED')
    } catch {
      showSnackbar(snackbarRef.current, '잠시 후 다시 확인해 주세요', 'default')
      setState('ERROR')
    } finally {
      setManualChecking(false)
    }
  }, [handleVerified, manualChecking, verificationMessage])

  const handleEditPhone = useCallback(() => {
    stopPolling()
    pop()
  }, [pop, stopPolling])

  const copyPhone = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(OCTOMO_SMS_PHONE)
      showSnackbar(snackbar, '번호를 복사했어요')
    } catch {
      showSnackbar(snackbar, '복사하지 못했어요', 'default')
    }
  }, [snackbar])

  const copyMessage = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(verificationMessage)
      showSnackbar(snackbar, '내용을 복사했어요')
    } catch {
      showSnackbar(snackbar, '복사하지 못했어요', 'default')
    }
  }, [snackbar, verificationMessage])

  return {
    phone: phoneParam || phone,
    maskedPhone: maskPhone(phoneParam || phone),
    authMethod,
    setAuthMethod,
    state,
    smsHref,
    verificationMessage,
    showSoftWaitingCopy,
    isChecking: state === 'CHECKING' || manualChecking,
    handlePrepareSmsOpen,
    handleManualRecheck,
    handleEditPhone,
    handleBack: handleEditPhone,
    copyPhone,
    copyMessage,
    ...exit,
  }
}
