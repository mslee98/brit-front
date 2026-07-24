import { VStack } from '@seed-design/react'

import type { SignupIdentityStep } from '../constants'
import { CTA_LABEL_BY_IDENTITY_STEP } from '../constants'
import { ActiveStepInput } from './ActiveStepInput'
import type { CarrierCode } from '../constants'

interface SignupProgressiveFormProps {
  activeStep: SignupIdentityStep
  name: string
  rrnFront7: string
  carrier: CarrierCode | ''
  phone: string
  onNameChange: (value: string) => void
  onRrnChange: (value: string) => void
  onCarrierSelect: (carrier: CarrierCode) => void
  onPhoneChange: (value: string) => void
  onSubmit?: () => void
  canSubmit?: boolean
  carrierSheetOpen: boolean
  onCarrierSheetOpenChange: (open: boolean) => void
}

export function SignupProgressiveForm({
  activeStep,
  name,
  rrnFront7,
  carrier,
  phone,
  onNameChange,
  onRrnChange,
  onCarrierSelect,
  onPhoneChange,
  onSubmit,
  canSubmit,
  carrierSheetOpen,
  onCarrierSheetOpenChange,
}: SignupProgressiveFormProps) {
  return (
    <VStack px="spacingX.globalGutter" py="x4" gap="x6">
      <ActiveStepInput
        activeStep={activeStep}
        name={name}
        rrnFront7={rrnFront7}
        carrier={carrier}
        phone={phone}
        onNameChange={onNameChange}
        onRrnChange={onRrnChange}
        onCarrierSelect={onCarrierSelect}
        onPhoneChange={onPhoneChange}
        onSubmit={onSubmit}
        canSubmit={canSubmit}
        carrierSheetOpen={carrierSheetOpen}
        onCarrierSheetOpenChange={onCarrierSheetOpenChange}
      />
    </VStack>
  )
}

export function getIdentityCtaLabel(step: SignupIdentityStep): string {
  return CTA_LABEL_BY_IDENTITY_STEP[step]
}
