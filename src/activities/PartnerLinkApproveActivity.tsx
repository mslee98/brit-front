/**
 * PartnerLinkApproveActivity — 업체 연결 코드를 PIN 키패드로 입력 (MC-P9).
 */
import type { ActivityComponentType } from '@stackflow/react'
import { Text, VStack } from '@seed-design/react'
import { PinField } from 'seed-design/ui/pin-field'

import { ActivityScreenLayout } from '../app/layouts/ActivityScreenLayout'
import { NumericKeypad } from '../features/auth/components/NumericKeypad'
import { usePartnerLinkApproveScreen } from '../features/partners/hooks/usePartnerLinkApproveScreen'
import { BottomActionButton } from '../shared/ui/BottomActionButton'

const PartnerLinkApproveActivity: ActivityComponentType<'PartnerLinkApprove'> = () => {
  const screen = usePartnerLinkApproveScreen()

  if (screen.step === 'done') {
    return (
      <ActivityScreenLayout
        title="업체 연결"
        onBack={screen.handleDone}
        bottomCTABehavior="fixed"
        fixedBottom={
          <BottomActionButton size="large" variant="brandSolid" onClick={screen.handleDone}>
            확인
          </BottomActionButton>
        }
      >
        <VStack px="spacingX.globalGutter" py="x8" gap="x3">
          <Text textStyle="screenTitle" color="fg.neutral">
            {screen.doneTitle}
          </Text>
          <Text textStyle="t3Regular" color="fg.neutralMuted">
            {screen.doneMessage}
          </Text>
        </VStack>
      </ActivityScreenLayout>
    )
  }

  if (screen.step === 'confirm' && !screen.preview) {
    return (
      <ActivityScreenLayout title="업체 연결" onBack={screen.handleBack}>
        <VStack px="spacingX.globalGutter" py="x8">
          <Text textStyle="t4Regular" color="fg.neutralMuted">
            연결 요청을 확인하고 있어요…
          </Text>
        </VStack>
      </ActivityScreenLayout>
    )
  }

  if (screen.step === 'confirm' && screen.preview) {
    const member = screen.preview.partnerUserLabel
      ? `${screen.preview.partnerUserLabel} (${screen.preview.partnerUserKeyMasked})`
      : screen.preview.partnerUserKeyMasked
    return (
      <ActivityScreenLayout
        title="업체 연결"
        onBack={screen.handleBack}
        bottomCTABehavior="fixed"
        fixedBottom={
          <VStack gap="x2">
            <BottomActionButton
              size="large"
              variant="brandSolid"
              loading={screen.submitting}
              onClick={() => void screen.handleApprove()}
            >
              승인하고 연결
            </BottomActionButton>
            <BottomActionButton
              size="large"
              variant="neutralWeak"
              disabled={screen.submitting}
              onClick={() => void screen.handleReject()}
            >
              거절
            </BottomActionButton>
          </VStack>
        }
      >
        <VStack px="spacingX.globalGutter" py="x4" gap="x6">
          <VStack gap="spacingY.betweenText">
            <Text textStyle="screenTitle" color="fg.neutral">
              {screen.preview.partnerName}와 연결할까요?
            </Text>
            <Text textStyle="t3Regular" color="fg.neutralMuted">
              연결하면 이 업체에서 내 BRIT MS로 포인트 충전을 요청할 수 있어요.
            </Text>
          </VStack>
          <VStack gap="x3">
            <Text textStyle="t4Bold" color="fg.neutral">
              업체 회원
            </Text>
            <Text textStyle="t4Regular" color="fg.neutralMuted">
              {member}
            </Text>
          </VStack>
          {screen.error ? (
            <Text textStyle="t3Regular" color="fg.critical">
              {screen.error}
            </Text>
          ) : null}
        </VStack>
      </ActivityScreenLayout>
    )
  }

  return (
    <ActivityScreenLayout title="업체 연결" onBack={screen.handleBack}>
      <VStack px="spacingX.globalGutter" py="x4" gap="x6" flexGrow>
        <VStack gap="spacingY.betweenText">
          <Text textStyle="screenTitle" color="fg.neutral">
            연결 코드를 입력해 주세요
          </Text>
          <Text textStyle="t3Regular" color="fg.neutralMuted">
            업체에서 연 BRIT 팝업에 보이는 숫자 4자리예요.
          </Text>
        </VStack>
        <PinField
          length={screen.codeLength}
          value={screen.pairingCode}
          aria-label="연결 코드"
        />
        {screen.error ? (
          <Text textStyle="t3Regular" color="fg.critical">
            {screen.error}
          </Text>
        ) : null}
        <VStack flexGrow justify="flex-end">
          <NumericKeypad
            onDigit={screen.handleDigit}
            onBackspace={screen.handleBackspace}
            disabled={screen.submitting}
          />
        </VStack>
      </VStack>
    </ActivityScreenLayout>
  )
}

export default PartnerLinkApproveActivity
