/**
 * useSignupIdentityScreen
 *
 * 책임: 본인확인 step 머신·가입 이탈 dialog·OCTOMO 안내 진입
 * 비책임: 폼 필드 UI (→ SignupProgressiveForm), OCTOMO 문자 URI
 */
import { useFlow } from '@stackflow/react'
import { useState, type MouseEvent } from 'react'

import type { CarrierCode, SignupIdentityStep } from '../constants'
import { NEXT_IDENTITY_STEP, PREV_IDENTITY_STEP } from '../constants'
import { formatPhoneInput } from '../utils/formatPhone'
import { canProceedIdentityStep, useSignupForm } from './useSignupForm'
import { useSignupExitGuard } from './useSignupExitGuard'

export function useSignupIdentityScreen() {
  const { push, pop } = useFlow()
  const { draft, setName, setRrnFront7, setCarrier, setPhone } = useSignupForm()
  const exit = useSignupExitGuard()
  const [activeStep, setActiveStep] = useState<SignupIdentityStep>('name')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [carrierSheetOpen, setCarrierSheetOpen] = useState(false)

  const canGoNext = canProceedIdentityStep(activeStep, draft)

  const advanceStep = () => {
    const next = NEXT_IDENTITY_STEP[activeStep]
    if (next) {
      setActiveStep(next)
      if (next === 'carrier') {
        setCarrierSheetOpen(true)
      }
    }
  }

  const handleBack = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    const prev = PREV_IDENTITY_STEP[activeStep]
    if (prev) {
      setCarrierSheetOpen(false)
      setActiveStep(prev)
      return
    }
    pop()
  }

  const handleCarrierSelect = (carrier: CarrierCode) => {
    setCarrier(carrier)
    setCarrierSheetOpen(false)
    setActiveStep('phone')
  }

  const openCarrierSheet = () => setCarrierSheetOpen(true)

  const goNext = async () => {
    if (activeStep === 'carrier') {
      openCarrierSheet()
      return
    }

    if (!canGoNext || isSubmitting) return

    if (activeStep === 'phone') {
      setIsSubmitting(true)
      try {
        push('SignupSms', { phone: formatPhoneInput(draft.phone) })
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    advanceStep()
  }

  return {
    draft,
    activeStep,
    isSubmitting,
    canGoNext,
    carrierSheetOpen,
    setCarrierSheetOpen,
    setName,
    setRrnFront7,
    setPhone,
    handleBack,
    handleCarrierSelect,
    goNext,
    ...exit,
  }
}
