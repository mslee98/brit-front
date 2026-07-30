/**
 * draft consents → Nest consents.items
 */
import {
  CONSENT_DOCUMENT_VERSION,
  SIGNUP_TERMS_ITEMS,
  TERMS_ID_TO_CONSENT_TYPE,
} from '../constants'
import type { SignupConsents } from '../stores/signupDraft.store'
import type { SignupConsentItem } from '../types/signup'

export function buildSignupConsentItems(consents: SignupConsents): SignupConsentItem[] {
  return SIGNUP_TERMS_ITEMS.map((item) => ({
    consentType: TERMS_ID_TO_CONSENT_TYPE[item.id],
    documentVersion: CONSENT_DOCUMENT_VERSION,
    isAgreed: Boolean(consents[item.id]),
  }))
}
