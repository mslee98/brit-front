/**
 * useChangeBankAccountScreen
 *
 * PIN → 은행 → 계좌번호. replace는 Activity를 새로 만들므로 은행·계좌는 모듈에 둔다.
 * 심사 요청 API 전에는 done으로 넘어가지 않는다.
 */
import { useState, type MouseEvent } from 'react'
import { useActivityParams, useFlow } from '@stackflow/react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { showSnackbar } from '../../../shared/utils/showSnackbar'
import { ACCOUNT_ACTION_NOT_READY_MESSAGE } from '../constants'
import type { Institution } from '../data/institutions'

const PIN_LENGTH = 6

type BankAccountDraft = {
  bankCode: string
  bankName: string
  accountNumber: string
}

function emptyDraft(): BankAccountDraft {
  return { bankCode: '', bankName: '', accountNumber: '' }
}

let bankAccountDraft = emptyDraft()

export function resetChangeBankAccountDraft() {
  bankAccountDraft = emptyDraft()
}

export function useChangeBankAccountScreen() {
  const { step = 'pin' } = useActivityParams<'ChangeBankAccount'>()
  const { replace, pop } = useFlow()
  const snackbar = useSnackbarAdapter()
  const [pin, setPin] = useState('')
  const [accountNumber, setAccountNumber] = useState(bankAccountDraft.accountNumber)

  const handleDigit = (digit: string) => {
    if (pin.length >= PIN_LENGTH) return
    const next = pin + digit
    setPin(next)
    if (next.length === PIN_LENGTH) {
      replace('ChangeBankAccount', { step: 'bank' })
    }
  }

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1))
  }

  const handleInstitutionSelect = (institution: Institution) => {
    bankAccountDraft = {
      bankCode: institution.code,
      bankName: institution.name,
      accountNumber: '',
    }
    setAccountNumber('')
    replace('ChangeBankAccount', { step: 'accountNumber' })
  }

  const handleAccountNumberChange = (value: string) => {
    const next = value.replace(/\D/g, '')
    bankAccountDraft = { ...bankAccountDraft, accountNumber: next }
    setAccountNumber(next)
  }

  const handleReselectBank = () => {
    replace('ChangeBankAccount', { step: 'bank' })
  }

  const canSubmit = Boolean(bankAccountDraft.bankCode && accountNumber.length >= 10)

  const handleSubmit = () => {
    if (!canSubmit) return
    showSnackbar(snackbar, ACCOUNT_ACTION_NOT_READY_MESSAGE)
  }

  const handleBack = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    if (step === 'done') {
      replace('ChangeBankAccount', { step: 'accountNumber' })
      return
    }
    if (step === 'accountNumber') {
      replace('ChangeBankAccount', { step: 'bank' })
      return
    }
    if (step === 'bank') {
      replace('ChangeBankAccount', { step: 'pin' })
      return
    }
    pop()
  }

  return {
    step,
    pin,
    pinLength: PIN_LENGTH,
    bankName: bankAccountDraft.bankName,
    accountNumber,
    canSubmit,
    handleDigit,
    handleBackspace,
    handleInstitutionSelect,
    handleAccountNumberChange,
    handleReselectBank,
    handleSubmit,
    handleBack,
  }
}
