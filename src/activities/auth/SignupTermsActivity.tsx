/**
 * SignupTermsActivity
 *
 * 책임: 필수·선택 약관 동의 UI
 * 비책임: 약관 법무 본문 (constants 플레이스홀더)
 */
import type { ActivityComponentType } from '@stackflow/react'
import { HStack, Text, VStack } from '@seed-design/react'
import { Checkbox } from 'seed-design/ui/checkbox'

import { ActivityScreenLayout } from '../../app/layouts/ActivityScreenLayout'
import { SignupExitAlertDialog } from '../../features/auth/components/SignupExitAlertDialog'
import { SignupTermsDetailSheet } from '../../features/auth/components/SignupTermsDetailSheet'
import { SIGNUP_TERMS_COPY, SIGNUP_TERMS_ITEMS } from '../../features/auth/constants'
import { useSignupTermsScreen } from '../../features/auth/hooks/useSignupTermsScreen'
import { TextLinkButton } from '../../shared/components/TextLinkButton'
import { BottomActionButton } from '../../shared/ui/BottomActionButton'

const SignupTermsActivity: ActivityComponentType<'SignupTerms'> = () => {
  const screen = useSignupTermsScreen()

  return (
    <>
      <ActivityScreenLayout
        title="약관 동의"
        leftAction="close"
        onClose={screen.openExitDialog}
        bottomCTABehavior="fixed"
        fixedBottom={
          <BottomActionButton
            size="large"
            variant="brandSolid"
            disabled={!screen.requiredChecked}
            onClick={screen.handleStart}
          >
            {SIGNUP_TERMS_COPY.cta}
          </BottomActionButton>
        }
      >
        <VStack px="spacingX.globalGutter" py="x4" gap="x6">
          <VStack gap="spacingY.betweenText">
            <Text textStyle="screenTitle" color="fg.neutral">
              {SIGNUP_TERMS_COPY.title}
            </Text>
            <Text textStyle="t3Regular" color="fg.neutralMuted">
              {SIGNUP_TERMS_COPY.description}
            </Text>
          </VStack>

          <VStack gap="x4">
            <Checkbox
              label="전체 동의"
              checked={screen.allChecked}
              onCheckedChange={(checked) => {
                screen.setAllChecked(checked)
              }}
            />

            <VStack gap="x3" pl="x2">
              {SIGNUP_TERMS_ITEMS.map((item) => (
                <HStack key={item.id} justify="space-between" align="center" gap="x3">
                  <Checkbox
                    label={`${item.required ? '(필수) ' : '(선택) '}${item.label}`}
                    checked={screen.checks[item.id]}
                    onCheckedChange={(checked) => {
                      screen.setItemChecked(item.id, checked)
                    }}
                  />
                  <TextLinkButton onClick={() => screen.setDetailId(item.id)}>
                    상세 보기
                  </TextLinkButton>
                </HStack>
              ))}
            </VStack>
          </VStack>
        </VStack>
      </ActivityScreenLayout>

      <SignupTermsDetailSheet
        item={screen.detailItem}
        open={screen.detailItem != null}
        onOpenChange={(open) => {
          if (!open) screen.setDetailId(null)
        }}
      />

      <SignupExitAlertDialog
        open={screen.exitDialogOpen}
        onOpenChange={screen.setExitDialogOpen}
        onConfirmExit={screen.handleConfirmExit}
      />
    </>
  )
}

export default SignupTermsActivity
