import { useEffect, useRef, type FocusEvent, type FormEvent, type ReactNode, type RefObject } from 'react'
import { Text, VStack } from '@seed-design/react'
import { motion } from 'motion/react'
import { TextField, TextFieldInput } from 'seed-design/ui/text-field'

import type { SignupIdentityStep } from '../constants'
import {
  CARRIERS,
  IDENTITY_STEP_COPY,
  isIdentityStepRevealed,
  SIGNUP_IDENTITY_FORM_ID,
} from '../constants'
import { formatPhoneInput } from '../utils/formatPhone'
import { formatRrnInput } from '../utils/formatRrn'
import { CarrierSelectSheet } from './CarrierSelectSheet'
import { PhoneWithCarrierField } from './PhoneWithCarrierField'
import type { CarrierCode } from '../constants'
import { ensureInputVisibleAboveKeyboard } from '../../../shared/keyboard/ensureInputVisible'

interface ActiveStepInputProps {
  activeStep: SignupIdentityStep
  name: string
  /** 숫자만 13자리 */
  residentRegistrationNumber: string
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

const FIELD_STACK_ORDER: Array<'phone' | 'rrn' | 'name'> = ['phone', 'rrn', 'name']

function RevealedField({ children, animate }: { children: ReactNode; animate?: boolean }) {
  if (!animate) {
    return <>{children}</>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.2, 0.1, 0.21, 0.99] }}
    >
      {children}
    </motion.div>
  )
}

export function ActiveStepInput({
  activeStep,
  name,
  residentRegistrationNumber,
  carrier,
  phone,
  onNameChange,
  onRrnChange,
  onCarrierSelect,
  onPhoneChange,
  onSubmit,
  canSubmit = false,
  carrierSheetOpen,
  onCarrierSheetOpenChange,
}: ActiveStepInputProps) {
  const nameInputRef = useRef<HTMLInputElement>(null)
  const rrnInputRef = useRef<HTMLInputElement>(null)
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const carrierButtonRef = useRef<HTMLButtonElement>(null)
  const prevActiveStepRef = useRef(activeStep)

  const carrierLabel = CARRIERS.find((c) => c.code === carrier)?.label ?? ''
  const activeCopy = IDENTITY_STEP_COPY[activeStep]
  const phoneCopy = IDENTITY_STEP_COPY.phone
  const carrierCopy = IDENTITY_STEP_COPY.carrier
  const rrnDisplay = formatRrnInput(residentRegistrationNumber)
  const rrnReadOnly = isIdentityStepRevealed(activeStep, 'rrn') && activeStep !== 'rrn'

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (activeStep === 'carrier') {
      onSubmit?.()
      return
    }
    if (canSubmit) onSubmit?.()
  }

  useEffect(() => {
    const prev = prevActiveStepRef.current
    if (prev === activeStep) return

    const focusMap: Partial<Record<SignupIdentityStep, RefObject<HTMLInputElement | null>>> = {
      name: nameInputRef,
      rrn: rrnInputRef,
      phone: phoneInputRef,
    }

    requestAnimationFrame(() => {
      if (activeStep === 'carrier') {
        carrierButtonRef.current?.focus()
        return
      }
      const input = focusMap[activeStep]?.current
      if (!input) return
      input.focus()
      ensureInputVisibleAboveKeyboard(input)
    })

    prevActiveStepRef.current = activeStep
  }, [activeStep])

  const handleFormFocusCapture = (e: FocusEvent<HTMLFormElement>) => {
    const target = e.target
    if (!(target instanceof HTMLElement)) return
    if (!target.matches('input, textarea')) return
    ensureInputVisibleAboveKeyboard(target)
  }

  const isPhoneBlockActive = activeStep === 'carrier' || activeStep === 'phone'
  const isPhoneBlockLocked =
    isIdentityStepRevealed(activeStep, 'phone') &&
    activeStep !== 'phone' &&
    activeStep !== 'carrier'

  const renderFieldSection = (step: 'phone' | 'rrn' | 'name') => {
    if (step === 'phone') {
      if (!isIdentityStepRevealed(activeStep, 'carrier')) return null
    } else if (!isIdentityStepRevealed(activeStep, step)) {
      return null
    }

    const animate =
      (step === 'phone' && isPhoneBlockActive && activeStep === 'carrier') ||
      (step !== 'phone' && step === activeStep && step !== 'name')

    switch (step) {
      case 'phone':
        return (
          <RevealedField key="phone" animate={animate}>
            <PhoneWithCarrierField
              label="휴대폰번호"
              description={
                isPhoneBlockActive
                  ? activeStep === 'carrier'
                    ? carrierCopy.fieldDescription
                    : phoneCopy.fieldDescription
                  : undefined
              }
              carrierLabel={carrierLabel}
              carrierPlaceholder={carrierCopy.placeholder}
              phoneDisplay={formatPhoneInput(phone)}
              phonePlaceholder={phoneCopy.placeholder}
              onPhoneChange={onPhoneChange}
              onCarrierClick={() => onCarrierSheetOpenChange(true)}
              carrierButtonRef={carrierButtonRef}
              phoneInputRef={phoneInputRef}
              carrierDisabled={isPhoneBlockLocked}
              phoneReadOnly={isPhoneBlockLocked || activeStep === 'carrier'}
            />
            <CarrierSelectSheet
              open={carrierSheetOpen}
              onOpenChange={onCarrierSheetOpenChange}
              value={carrier}
              onSelect={onCarrierSelect}
            />
          </RevealedField>
        )

      case 'rrn':
        return (
          <RevealedField key="rrn" animate={animate}>
            <TextField
              variant="underline"
              label={IDENTITY_STEP_COPY.rrn.fieldLabel}
              description={
                activeStep === 'rrn' ? IDENTITY_STEP_COPY.rrn.fieldDescription : undefined
              }
              value={rrnDisplay}
              onValueChange={({ value }) => onRrnChange(value)}
              readOnly={rrnReadOnly}
            >
              <TextFieldInput
                ref={rrnInputRef}
                placeholder={IDENTITY_STEP_COPY.rrn.placeholder}
                inputMode="numeric"
                autoComplete="off"
                enterKeyHint="next"
                readOnly={rrnReadOnly}
                tabIndex={rrnReadOnly ? -1 : 0}
              />
            </TextField>
          </RevealedField>
        )

      case 'name':
        return (
          <RevealedField key="name" animate={false}>
            <TextField
              variant="underline"
              label={IDENTITY_STEP_COPY.name.fieldLabel}
              description={
                activeStep === 'name' ? IDENTITY_STEP_COPY.name.fieldDescription : undefined
              }
              value={name}
              onValueChange={({ value }) => onNameChange(value)}
              readOnly={isIdentityStepRevealed(activeStep, 'name') && activeStep !== 'name'}
            >
              <TextFieldInput
                ref={nameInputRef}
                placeholder="이름 입력"
                enterKeyHint="next"
                readOnly={isIdentityStepRevealed(activeStep, 'name') && activeStep !== 'name'}
                tabIndex={
                  isIdentityStepRevealed(activeStep, 'name') && activeStep !== 'name' ? -1 : 0
                }
              />
            </TextField>
          </RevealedField>
        )

      default:
        return null
    }
  }

  return (
    <VStack gap="x6">
      <VStack gap="spacingY.betweenText">
        <Text textStyle="screenTitle" color="fg.neutral">
          {activeCopy.screenTitle}
        </Text>
        <Text textStyle="t3Regular" color="fg.neutralMuted">
          {activeCopy.screenSubtitle}
        </Text>
      </VStack>

      <VStack
        as="form"
        id={SIGNUP_IDENTITY_FORM_ID}
        gap="x4"
        onSubmit={handleFormSubmit}
        onFocusCapture={handleFormFocusCapture}
      >
        {FIELD_STACK_ORDER.map((step) => renderFieldSection(step))}
      </VStack>
    </VStack>
  )
}
