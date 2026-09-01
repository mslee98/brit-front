import { Text, VStack } from '@seed-design/react'

import { TextLinkButton } from '../../../shared/components/TextLinkButton'
import { actions } from '../../../stackflow/stackflow'
import { useDeviceContext } from '../hooks/useDeviceContext'
import { useRuntimeEnvironment } from '../hooks/useRuntimeEnvironment'
import { PushDevTestControls } from './PushDevTestControls'

function formatValue(value: string | boolean | null | undefined): string {
  if (value === null || value === undefined) return '-'
  return String(value)
}

/** Desktop 패널·모바일 시트 공통 본문 */
export function DeviceContextDevDetails() {
  const runtime = useRuntimeEnvironment()
  const device = useDeviceContext()

  return (
    <VStack gap="x2" width="full">
      <Text textStyle="t3Bold" color="fg.brand">
        runtime: {runtime}
      </Text>

      {!device ? (
        <Text textStyle="t2Regular" color="fg.neutralSubtle">
          DeviceContext 로딩 중…
        </Text>
      ) : (
        <VStack gap="x1" width="full">
          {(
            [
              ['category', device.category],
              ['osFamily', device.osFamily],
              ['browserFamily', device.browserFamily],
              ['manufacturer', device.manufacturer],
              ['model', device.model],
              ['platformVersion', device.platformVersion],
              ['isPwaStandalone', device.isPwaStandalone],
              ['webAuthnSupported', device.webAuthnSupported],
              ['platformAuthenticator', device.platformAuthenticatorAvailable],
              ['confidence', device.confidence],
            ] as const
          ).map(([label, value]) => (
            <Text key={label} textStyle="t2Regular" color="fg.neutralMuted">
              {label}: {formatValue(value)}
            </Text>
          ))}
        </VStack>
      )}

      <Text textStyle="t2Regular" color="fg.neutralSubtle">
        브라우저 힌트이며 개발자 도구로 변경할 수 있어요. 보안 증거로 쓰지 않아요.
      </Text>

      <TextLinkButton onClick={() => actions.push('SmsSchemePoc', {})}>
        SMS 문자 앱 PoC 열기
      </TextLinkButton>

      <PushDevTestControls />
    </VStack>
  )
}

/** DEV 전용: 데스크탑 사이드 패널용 */
export function DeviceContextDevPanel() {
  if (!import.meta.env.DEV) return null

  return (
    <VStack
      gap="x2"
      className="w-full max-w-[280px] rounded-r3 border border-stroke-neutral-weak bg-bg-layer-basement p-x4"
    >
      <Text textStyle="t4Bold" color="fg.neutral">
        [DEV] 기기 판별
      </Text>
      <DeviceContextDevDetails />
    </VStack>
  )
}
