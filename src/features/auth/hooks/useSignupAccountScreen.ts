/**
 * useSignupAccountScreen
 *
 * 책임: 금융기관·계좌번호 step·예금주 검증·Pin 진입
 * 비책임: InstitutionSelectPanel / 계좌 입력 UI
 */
import { useActivityParams, useFlow } from '@stackflow/react'
import { useState } from 'react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { verifyAccount } from '../api/auth.api'
import type { Institution } from '../data/institutions'
import { useSignupForm } from './useSignupForm'
import { updateSignupDraft } from '../stores/signupDraft.store'
import { showSnackbar } from '../../../shared/utils/showSnackbar'
import { useSignupExitGuard } from './useSignupExitGuard'

export function useSignupAccountScreen() {
  const { step = 'bank' } = useActivityParams<'SignupAccount'>()
  const { push, replace, pop } = useFlow()
  const snackbar = useSnackbarAdapter()
  const exit = useSignupExitGuard()
  const { draft } = useSignupForm()
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(
    Boolean(draft.accountHolderName && draft.accountVerifyToken),
  )

  const handleInstitutionSelect = (institution: Institution) => {
    updateSignupDraft({
      bankCode: institution.code,
      bankName: institution.name,
      accountHolderName: '',
      accountVerifyToken: '',
    })
    setIsVerified(false)
    replace('SignupAccount', { step: 'accountNumber' })
  }

  const handleAccountNumberChange = (value: string) => {
    updateSignupDraft({
      accountNumber: value.replace(/\D/g, ''),
      accountHolderName: '',
      accountVerifyToken: '',
    })
    setIsVerified(false)
  }

  const canSubmit = Boolean(draft.bankCode && draft.accountNumber.length >= 10)

  const handleVerify = async () => {
    if (!canSubmit || isVerifying) return
    setIsVerifying(true)
    try {
      const result = await verifyAccount({
        name: draft.name,
        bankCode: draft.bankCode,
        accountNumber: draft.accountNumber,
      })
      updateSignupDraft({
        accountHolderName: result.holderName,
        accountVerifyToken: result.accountVerifyToken,
        bankName: result.bankName || draft.bankName,
      })
      setIsVerified(true)
    } catch {
      showSnackbar(snackbar, '계좌를 확인하지 못했어요. 다시 시도해 주세요.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleGoPin = () => {
    if (!isVerified) return
    push('SignupPin', { step: 'create' })
  }

  const handleBack = () => {
    if (isVerified && step === 'accountNumber') {
      setIsVerified(false)
      return
    }
    if (step === 'accountNumber') {
      replace('SignupAccount', { step: 'bank' })
      return
    }
    pop()
  }

  const handleReselectBank = () => {
    setIsVerified(false)
    replace('SignupAccount', { step: 'bank' })
  }

  return {
    step,
    draft,
    isVerifying,
    isVerified,
    canSubmit,
    handleInstitutionSelect,
    handleAccountNumberChange,
    handleVerify,
    handleGoPin,
    handleBack,
    handleReselectBank,
    ...exit,
  }
}
