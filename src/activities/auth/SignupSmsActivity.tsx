/**
 * SignupSmsActivity — OCTOMO 기기인증 안내
 *
 * 책임: 상태·방법(문자/QR)별 UI·복구 CTA
 * 비책임: Edge Function / 폴링 스케줄
 *
 * @see docs/domains/auth.md
 */
import type { ActivityComponentType } from '@stackflow/react'
import { Text, VStack } from '@seed-design/react'
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

import { ActivityScreenLayout } from '../../app/layouts/ActivityScreenLayout'
import { SignupExitAlertDialog } from '../../features/auth/components/SignupExitAlertDialog'
import { SignupProgressHeader } from '../../features/auth/components/SignupProgressBar'
import { useSignupOctomoVerify } from '../../features/auth/hooks/useSignupOctomoVerify'
import {
  OCTOMO_SMS_DISPLAY_PHONE,
  OCTOMO_SMS_MESSAGE,
} from '../../features/auth/utils/createOctomoSmsUrl'
import { TextLinkButton } from '../../shared/components/TextLinkButton'
import { BottomActionButton } from '../../shared/ui/BottomActionButton'

const OCTOMO_SAMPLE_SRC = '/octomo/octomo-sample.png'

const GUIDE_STEPS_SMS = [
  '하단 [문자 보내기]를 눌러 주세요',
  '인증 문자가 자동으로 작성돼요',
  '문자 앱에서 전송만 한 뒤 이 화면으로 돌아와 주세요',
] as const

const GUIDE_STEPS_QR = [
  '아래 QR을 휴대폰 카메라로 스캔해 주세요',
  'QR을 스캔하면 문자 앱이 열려요',
  '인증 메시지를 그대로 보내면 이 화면에서 자동으로 확인해요',
] as const

const SignupSmsActivity: ActivityComponentType<'SignupSms'> = () => {
  const {
    phone,
    maskedPhone,
    authMethod,
    setAuthMethod,
    state,
    smsHref,
    showSoftWaitingCopy,
    isChecking,
    handlePrepareSmsOpen,
    handleManualRecheck,
    handleEditPhone,
    handleBack,
    copyPhone,
    copyMessage,
    exitDialogOpen,
    setExitDialogOpen,
    openExitDialog,
    handleConfirmExit,
  } = useSignupOctomoVerify()

  const [manualOpen, setManualOpen] = useState(false)
  const isVerified = state === 'VERIFIED'
  const isDelayed = state === 'DELAYED'
  const isWaitingLike = state === 'WAITING' || state === 'CHECKING' || state === 'ERROR'
  const showSmsReady = authMethod === 'sms' && state === 'READY'
  const showQrSurface = authMethod === 'qr' && !isVerified

  const statusCopy = (() => {
    if (isVerified) return '휴대폰 인증이 완료됐어요'
    if (state === 'CHECKING') return '인증을 확인하고 있어요'
    if (state === 'ERROR') return '잠시 연결이 불안정해요. 곧 다시 확인할게요.'
    if (isDelayed) return '아직 문자가 확인되지 않았어요'
    if (isWaitingLike) {
      return showSoftWaitingCopy
        ? '문자를 보냈다면 잠시만 기다려 주세요.'
        : '인증을 확인하고 있어요'
    }
    return null
  })()

  const fixedBottom = (() => {
    if (isVerified) return undefined

    if (isDelayed) {
      return (
        <VStack gap="x2" width="full">
          <BottomActionButton
            size="large"
            variant="brandSolid"
            flexGrow
            disabled={isChecking}
            onClick={() => void handleManualRecheck()}
          >
            {isChecking ? '확인하고 있어요' : '다시 확인하기'}
          </BottomActionButton>
          {authMethod === 'sms' ? (
            <a
              href={smsHref}
              onClick={handlePrepareSmsOpen}
              className="flex w-full items-center justify-center rounded-r3 no-underline"
              style={{
                minHeight: 52,
                backgroundColor: 'var(--seed-color-bg-neutral-weak)',
                color: 'var(--seed-color-fg-neutral)',
              }}
            >
              <Text textStyle="t5Bold" color="fg.neutral">
                문자 앱 다시 열기
              </Text>
            </a>
          ) : null}
        </VStack>
      )
    }

    if (
      authMethod === 'sms' &&
      (state === 'READY' || state === 'WAITING' || state === 'CHECKING' || state === 'ERROR')
    ) {
      return (
        <a
          href={smsHref}
          onClick={handlePrepareSmsOpen}
          className="flex w-full items-center justify-center rounded-r3 no-underline"
          style={{
            minHeight: 52,
            backgroundColor: 'var(--seed-color-bg-brand-solid)',
            color: 'var(--seed-color-fg-neutral-inverted)',
          }}
        >
          <Text textStyle="t5Bold" color="fg.neutralInverted">
            문자 보내기
          </Text>
        </a>
      )
    }

    if (authMethod === 'qr') {
      return (
        <BottomActionButton
          size="large"
          variant="brandSolid"
          onClick={() => setAuthMethod('sms')}
        >
          문자 앱으로 인증하기
        </BottomActionButton>
      )
    }

    return undefined
  })()

  return (
    <>
      <ActivityScreenLayout
        title="휴대폰 인증"
        onBack={handleBack}
        onFlowClose={openExitDialog}
        progress={<SignupProgressHeader type="sms" />}
        bottomCTABehavior="fixed"
        fixedBottom={fixedBottom}
      >
        <VStack px="spacingX.globalGutter" py="x4" gap="x6" pb="x4">
          {isVerified ? (
            <VStack gap="spacingY.betweenText">
              <Text textStyle="screenTitle" color="fg.neutral">
                휴대폰 인증이 완료됐어요
              </Text>
              <Text textStyle="t3Regular" color="fg.neutralMuted">
                {maskedPhone} 번호로 확인했어요. 잠시 후 계정 설정으로 이동해요.
              </Text>
            </VStack>
          ) : (
            <>
              <VStack gap="spacingY.betweenText">
                <Text textStyle="screenTitle" color="fg.neutral">
                  {authMethod === 'qr'
                    ? '휴대폰으로 QR을 스캔해 주세요'
                    : '휴대폰에서 문자를 보내 주세요'}
                </Text>
                <Text textStyle="t3Regular" color="fg.neutralMuted">
                  {authMethod === 'qr'
                    ? 'QR을 스캔하면 문자 앱이 열려요.'
                    : `인증 문자가 자동으로 작성돼요. 문자 앱에서 전송만 하면 돼요. (${phone})`}
                </Text>
              </VStack>

              {(showSmsReady || (authMethod === 'sms' && isWaitingLike)) && (
                <VStack gap="x3">
                  {GUIDE_STEPS_SMS.map((step, index) => (
                    <Text key={step} textStyle="t4Regular" color="fg.neutral">
                      {index + 1}. {step}
                    </Text>
                  ))}
                </VStack>
              )}

              {showQrSurface && (
                <VStack gap="x3">
                  {GUIDE_STEPS_QR.map((step, index) => (
                    <Text key={step} textStyle="t4Regular" color="fg.neutral">
                      {index + 1}. {step}
                    </Text>
                  ))}
                </VStack>
              )}

              {authMethod === 'sms' ? (
                <VStack gap="x3" align="center">
                  <img
                    src={OCTOMO_SAMPLE_SRC}
                    alt="문자 앱에 인증 메시지가 자동으로 입력된 예시"
                    width={280}
                    height={320}
                    className="max-w-full object-contain"
                    style={{ maxHeight: 320 }}
                  />
                  {statusCopy ? (
                    <Text textStyle="t3Regular" color="fg.neutralMuted" align="center">
                      {statusCopy}
                    </Text>
                  ) : (
                    <Text textStyle="t3Regular" color="fg.neutralMuted" align="center">
                      문자를 전송한 뒤 이 화면으로 돌아오면 자동으로 확인할게요.
                    </Text>
                  )}
                </VStack>
              ) : (
                <VStack gap="x4" align="center" py="x2">
                  <div className="rounded-r4 border border-solid border-stroke-neutral-weak bg-bg-layer-default p-x4">
                    <QRCodeSVG value={smsHref} size={200} level="M" includeMargin />
                  </div>
                  <VStack gap="x1" align="center">
                    <Text textStyle="t2Regular" color="fg.neutralMuted">
                      받는 번호 {OCTOMO_SMS_DISPLAY_PHONE}
                    </Text>
                    <Text textStyle="t2Regular" color="fg.neutralMuted">
                      보낼 내용 {OCTOMO_SMS_MESSAGE}
                    </Text>
                  </VStack>
                  {statusCopy ? (
                    <Text textStyle="t3Regular" color="fg.neutralMuted" align="center">
                      {statusCopy}
                    </Text>
                  ) : null}
                </VStack>
              )}

              {isDelayed ? (
                <VStack gap="x2" align="center">
                  <Text textStyle="t3Regular" color="fg.neutralMuted" align="center">
                    문자를 보내지 않았다면 다시 열어 주세요. 이미 보냈다면 다시 확인해 주세요.
                  </Text>
                  <TextLinkButton onClick={handleEditPhone}>번호 수정하기</TextLinkButton>
                </VStack>
              ) : null}

              <Text textStyle="t2Regular" color="fg.neutralSubtle">
                · 이용 중인 통신 요금제에 따라 문자 메시지 발송 비용이 청구될 수 있어요.
              </Text>

              {!isDelayed && !isVerified ? (
                <VStack gap="x2" align="center">
                  {authMethod === 'sms' ? (
                    <TextLinkButton onClick={() => setAuthMethod('qr')}>
                      QR 코드로 인증하기
                    </TextLinkButton>
                  ) : (
                    <>
                      <TextLinkButton onClick={() => setManualOpen((prev) => !prev)}>
                        QR을 사용할 수 없어요
                      </TextLinkButton>
                      {manualOpen ? (
                        <VStack gap="x2" align="center" pt="x2">
                          <Text textStyle="t3Regular" color="fg.neutralMuted" align="center">
                            받는 번호와 보낼 내용을 복사해 문자로 보내 주세요.
                          </Text>
                          <TextLinkButton onClick={() => void copyPhone()}>
                            번호 복사하기 ({OCTOMO_SMS_DISPLAY_PHONE})
                          </TextLinkButton>
                          <TextLinkButton onClick={() => void copyMessage()}>
                            내용 복사하기 ({OCTOMO_SMS_MESSAGE})
                          </TextLinkButton>
                        </VStack>
                      ) : null}
                    </>
                  )}
                </VStack>
              ) : null}
            </>
          )}
        </VStack>
      </ActivityScreenLayout>

      <SignupExitAlertDialog
        open={exitDialogOpen}
        onOpenChange={setExitDialogOpen}
        onConfirmExit={handleConfirmExit}
      />
    </>
  )
}

export default SignupSmsActivity
