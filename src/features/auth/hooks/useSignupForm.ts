import { useCallback } from 'react'

import type { CarrierCode, SignupIdentityStep } from '../constants'
import type { SignupDraft } from '../stores/signupDraft.store'
import { getSignupDraft, updateSignupDraft, useSignupDraft } from '../stores/signupDraft.store'
import { extractPhoneDigits } from '../utils/formatPhone'
import { extractRrnDigits, isValidFullRrn } from '../utils/formatRrn'

export function useSignupForm() {
  const draft = useSignupDraft()

  const setName = useCallback((name: string) => updateSignupDraft({ name }), [])
  const setResidentRegistrationNumber = useCallback(
    (value: string) =>
      updateSignupDraft({ residentRegistrationNumber: extractRrnDigits(value) }),
    [],
  )
  const setCarrier = useCallback(
    (carrier: CarrierCode) => updateSignupDraft({ carrier }),
    [],
  )
  const setPhone = useCallback(
    (value: string) => updateSignupDraft({ phone: extractPhoneDigits(value) }),
    [],
  )

  return {
    draft,
    setName,
    setResidentRegistrationNumber,
    setCarrier,
    setPhone,
  }
}

export function isValidName(name: string): boolean {
  return name.trim().length >= 2
}

export function isValidRrn(digits: string): boolean {
  return isValidFullRrn(digits)
}

export function isValidCarrier(carrier: string): boolean {
  return carrier.length > 0
}

export function isValidPhone(phone: string): boolean {
  return /^01\d{8,9}$/.test(phone)
}

export function canProceedIdentityStep(
  step: SignupIdentityStep,
  draft: SignupDraft = getSignupDraft(),
): boolean {
  switch (step) {
    case 'name':
      return isValidName(draft.name)
    case 'rrn':
      return isValidRrn(draft.residentRegistrationNumber)
    case 'carrier':
      return isValidCarrier(draft.carrier)
    case 'phone':
      return isValidPhone(draft.phone)
    default:
      return false
  }
}
