import { useSyncExternalStore } from 'react'

import type { CarrierCode, SignupTermsItemId } from '../constants'

export type SignupConsents = Record<SignupTermsItemId, boolean>

export interface SignupDraft {
  name: string
  rrnFront7: string
  carrier: CarrierCode | ''
  phone: string
  loginId: string
  bankCode: string
  bankName: string
  accountNumber: string
  accountHolderName: string
  accountVerifyToken: string
  nickname: string
  octomoRequestId: string
  octomoVerifiedAt: string
  consents: SignupConsents
  consentsAgreedAt: string
}

const initialConsents: SignupConsents = {
  service: false,
  privacy: false,
  identity: false,
  marketing: false,
}

const initialDraft: SignupDraft = {
  name: '',
  rrnFront7: '',
  carrier: '',
  phone: '',
  loginId: '',
  bankCode: '',
  bankName: '',
  accountNumber: '',
  accountHolderName: '',
  accountVerifyToken: '',
  nickname: '',
  octomoRequestId: '',
  octomoVerifiedAt: '',
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
