import { useSyncExternalStore } from 'react'

import type { CarrierCode, SignupTermsItemId } from '../constants'

export type SignupConsents = Record<SignupTermsItemId, boolean>

export interface SignupDraft {
  name: string
  /** 주민번호 숫자만 13자리 */
  residentRegistrationNumber: string
  carrier: CarrierCode | ''
  phone: string
  loginId: string
  bankCode: string
  bankName: string
  accountNumber: string
  nickname: string
  consents: SignupConsents
  consentsAgreedAt: string
}

const initialConsents: SignupConsents = {
  service: false,
  privacy: false,
  uniqueIdentifier: false,
  bankAccount: false,
  marketing: false,
}

const initialDraft: SignupDraft = {
  name: '',
  residentRegistrationNumber: '',
  carrier: '',
  phone: '',
  loginId: '',
  bankCode: '',
  bankName: '',
  accountNumber: '',
  nickname: '',
  consents: { ...initialConsents },
  consentsAgreedAt: '',
}

type Listener = () => void

let draft: SignupDraft = {
  ...initialDraft,
  consents: { ...initialConsents },
}
const listeners = new Set<Listener>()

function notify() {
  listeners.forEach((listener) => listener())
}

export function getSignupDraft(): SignupDraft {
  return draft
}

export function updateSignupDraft(patch: Partial<SignupDraft>) {
  draft = {
    ...draft,
    ...patch,
    consents: patch.consents ? { ...patch.consents } : draft.consents,
  }
  notify()
}

export function resetSignupDraft() {
  draft = {
    ...initialDraft,
    consents: { ...initialConsents },
  }
  notify()
}

export function subscribeSignupDraft(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useSignupDraft(): SignupDraft {
  return useSyncExternalStore(subscribeSignupDraft, getSignupDraft, () => ({
    ...initialDraft,
    consents: { ...initialConsents },
  }))
}
