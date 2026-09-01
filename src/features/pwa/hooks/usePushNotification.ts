import { useCallback, useState, useSyncExternalStore } from 'react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { sendDevTestPush } from '../api/push.api'
import type { PushEligibility } from '../constants/pushNotificationCopy'
import {
  getPushEligibility,
  requestPushPermission,
  subscribePushNotification,
  unsubscribePushNotification,
} from '../services/pushNotificationService'
import { showSnackbar } from '../../../shared/utils/showSnackbar'

export function usePushNotification() {
  const eligibility = useSyncExternalStore(
    subscribePushNotification,
    getPushEligibility,
    (): PushEligibility => 'default',
  )

  const requestPermission = useCallback(async () => {
    return requestPushPermission()
  }, [])

  const unsubscribe = useCallback(async () => {
    return unsubscribePushNotification()
  }, [])

  return {
    eligibility,
    canShowWhileYouWait: eligibility === 'ready',
    requestPermission,
    unsubscribe,
  }
}

export function useNotificationSettingsScreen() {
  const { eligibility, requestPermission, unsubscribe } = usePushNotification()
  const snackbar = useSnackbarAdapter()
  const [busy, setBusy] = useState(false)

  const handleEnable = useCallback(async () => {
    setBusy(true)
    try {
      const next = await requestPermission()
      if (next === 'ready') {
        showSnackbar(snackbar, '이 기기에서 알림을 받도록 했어요', 'positive')
      } else if (next === 'denied') {
        showSnackbar(snackbar, '알림 권한이 거절됐어요', 'critical')
      }
    } finally {
      setBusy(false)
    }
  }, [requestPermission, snackbar])

  const handleDisable = useCallback(async () => {
    setBusy(true)
    try {
      await unsubscribe()
      showSnackbar(snackbar, '이 기기 알림을 껐어요', 'positive')
    } finally {
      setBusy(false)
    }
  }, [unsubscribe, snackbar])

  const handleTest = useCallback(async () => {
    setBusy(true)
    try {
      await sendDevTestPush()
      showSnackbar(snackbar, '테스트 알림을 보냈어요', 'positive')
    } catch {
      showSnackbar(snackbar, '테스트 알림을 보내지 못했어요', 'critical')
    } finally {
      setBusy(false)
    }
  }, [snackbar])

  return {
    eligibility,
    busy,
    handleEnable,
    handleDisable,
    handleTest,
  }
}
