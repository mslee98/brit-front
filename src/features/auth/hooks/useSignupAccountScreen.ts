/**
 * useSignupAccountScreen
 *
 * 책임: 금융기관·계좌번호 수집 후 Pin 진입 (외부 계좌 verify 없음)
 */
import { useActivityParams, useFlow } from '@stackflow/react'
import type { MouseEvent } from 'react'

import type { Institution } from '../data/institutions'
import { useSignupForm } from './useSignupForm'
import { updateSignupDraft } from '../stores/signupDraft.store'
import { useSignupExitGuard } from './useSignupExitGuard'

export function useSignupAccountScreen() {
  const { step = 'bank' } = useActivityParams<'SignupAccount'>()
  const { push, replace, pop } = useFlow()
  const exit = useSignupExitGuard()
  const { draft } = useSignupForm()

  const handleInstitutionSelect = (institution: Institution) => {
    updateSignupDraft({
      bankCode: institution.code,
      bankName: institution.name,
      accountNumber: '',
    })
    replace('SignupAccount', { step: 'accountNumber' })
  }

  const handleAccountNumberChange = (value: string) => {
    updateSignupDraft({
      accountNumber: value.replace(/\D/g, ''),
    })
  }

  const canSubmit = Boolean(draft.bankCode && draft.accountNumber.length >= 10)

  const handleGoPin = () => {
    if (!canSubmit) return
    push('SignupPin', { step: 'create' })
  }

  const handleBack = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (step === 'accountNumber') {
      replace('SignupAccount', { step: 'bank' })
      return
    }
    pop()
  }

  const handleReselectBank = () => {
    replace('SignupAccount', { step: 'bank' })
  }

  return {
    step,
    draft,
    canSubmit,
    handleInstitutionSelect,
    handleAccountNumberChange,
    handleGoPin,
    handleBack,
    handleReselectBank,
    ...exit,
  }
}
