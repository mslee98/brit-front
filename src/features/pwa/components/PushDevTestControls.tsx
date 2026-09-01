import { Text, VStack } from '@seed-design/react'
import { useState } from 'react'

import { ApiError } from '../../../shared/api/errors'
import { TextLinkButton } from '../../../shared/components/TextLinkButton'
import { useAuthStatus } from '../../auth/stores/authSession.store'
import { sendDevTestPush } from '../api/push.api'
import { usePushNotification } from '../hooks/usePushNotification'

function permissionLabel(): string {
  if (typeof Notification === 'undefined') return '-'
  return Notification.permission
}

/** DEV 패널: 구독 + 서버 Web Push 테스트 */
export function PushDevTestControls() {
  const authStatus = useAuthStatus()
  const { eligibility, requestPermission } = usePushNotification()
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const subscribe = async () => {
    setBusy(true)
    setStatus(null)
    try {
      const next = await requestPermission()
      if (next === 'ready') {
        setStatus('구독됐어요. OS 알림 테스트를 눌러 주세요.')
        return
      }
      setStatus(`구독 실패 (eligibility: ${next})`)
    } catch (error) {
      setStatus(error instanceof ApiError ? error.message : '구독에 실패했어요.')
    } finally {
      setBusy(false)
    }
  }

  const sendTest = async () => {
    if (authStatus !== 'authenticated') {
      setStatus('로그인한 뒤 테스트할 수 있어요.')
      return
    }
    setBusy(true)
    setStatus(null)
    try {
      const next = await requestPermission()
      if (next !== 'ready') {
        setStatus(`먼저 알림을 허용해 주세요. (eligibility: ${next})`)
        return
      }
      await sendDevTestPush()
      setStatus('큐에 넣었어요. 2초 안에 Mac 알림을 확인하세요.')
    } catch (error) {
      setStatus(error instanceof ApiError ? error.message : '테스트 푸시에 실패했어요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <VStack gap="x2" width="full">
      <Text textStyle="t3Bold" color="fg.neutral">
        [DEV] OS 알림
      </Text>
      <Text textStyle="t2Regular" color="fg.neutralMuted">
        eligibility: {eligibility}
      </Text>
      <Text textStyle="t2Regular" color="fg.neutralMuted">
        permission: {permissionLabel()}
      </Text>
      <TextLinkButton onClick={() => void subscribe()} disabled={busy}>
        알림 구독하기
      </TextLinkButton>
      <TextLinkButton onClick={() => void sendTest()} disabled={busy}>
        OS 알림 테스트
      </TextLinkButton>
      {status ? (
        <Text textStyle="t2Regular" color="fg.brand">
          {status}
        </Text>
      ) : null}
    </VStack>
  )
}
