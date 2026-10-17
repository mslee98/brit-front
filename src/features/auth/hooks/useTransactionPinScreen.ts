/**
 * useTransactionPinScreen
 *
 * 변경은 current → create → confirm, 분실은 verify → create → confirm.
 * 새 PIN은 replace 이후에도 맞추기 위해 모듈에 둔다. confirm은 API 없이 준비 중.
 */
import { useState, type MouseEvent } from 'react'
import { useActivityParams, useFlow } from '@stackflow/react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { showSnackbar } from '../../../shared/utils/showSnackbar'
import { ACCOUNT_ACTION_NOT_READY_MESSAGE, type TransactionPinMode, type TransactionPinStep } from '../constants'
import { formatPhoneInput } from '../utils/formatPhone'

const PIN_LENGTH = 6

type ResetIdentityDraft = {
  phone: string
  accountNumberLast4: string
  name: string
  birthDate: string
}

function emptyIdentity(): ResetIdentityDraft {
  return { phone: '', accountNumberLast4: '', name: '', birthDate: '' }
}

let newPinDraft = ''
let resetIdentityDraft = emptyIdentity()

export function resetTransactionPinDraft() {
  newPinDraft = ''
  resetIdentityDraft = emptyIdentity()
}

function defaultStep(mode: TransactionPinMode): TransactionPinStep {
  return mode === 'reset' ? 'verify' : 'current'
}

export function useTransactionPinScreen() {
  const params = useActivityParams<'TransactionPin'>()
  const mode: TransactionPinMode = params.mode ?? 'change'
  const step = params.step ?? defaultStep(mode)
  const { replace, pop } = useFlow()
  const snackbar = useSnackbarAdapter()
  const [entry, setEntry] = useState('')
  const [phone, setPhoneState] = useState(resetIdentityDraft.phone)
  const [accountNumberLast4, setLast4State] = useState(resetIdentityDraft.accountNumberLast4)
  const [name, setNameState] = useState(resetIdentityDraft.name)
  const [birthDate, setBirthDateState] = useState(resetIdentityDraft.birthDate)

  const go = (nextStep: TransactionPinStep) => {
    replace('TransactionPin', { mode, step: nextStep })
  }

  const handleDigit = (digit: string) => {
    if (entry.length >= PIN_LENGTH) return
    const next = entry + digit
    setEntry(next)
    if (next.length < PIN_LENGTH) return

    if (step === 'current') {
      go('create')
      return
    }
    if (step === 'create') {
      newPinDraft = next
      go('confirm')
      return
    }
    if (step === 'confirm') {
      if (next !== newPinDraft) {
        setEntry('')
        showSnackbar(snackbar, 'PIN이 일치하지 않아요. 다시 입력해 주세요.')
        return
      }
      setEntry('')
      showSnackbar(snackbar, ACCOUNT_ACTION_NOT_READY_MESSAGE)
    }
  }

  const handleBackspace = () => {
    setEntry((prev) => prev.slice(0, -1))
  }

  const setPhone = (value: string) => {
    const next = formatPhoneInput(value)
    resetIdentityDraft = { ...resetIdentityDraft, phone: next }
    setPhoneState(next)
  }

  const setAccountNumberLast4 = (value: string) => {
    const next = value.replace(/\D/g, '').slice(0, 4)
    resetIdentityDraft = { ...resetIdentityDraft, accountNumberLast4: next }
    setLast4State(next)
  }

  const setName = (value: string) => {
    resetIdentityDraft = { ...resetIdentityDraft, name: value }
    setNameState(value)
  }

  const setBirthDate = (value: string) => {
    resetIdentityDraft = { ...resetIdentityDraft, birthDate: value }
    setBirthDateState(value)
  }

  const handleVerifyNext = () => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10 || accountNumberLast4.length !== 4 || !name.trim() || !birthDate.trim()) {
      showSnackbar(snackbar, '휴대폰·계좌 끝 4자리·이름·생년월일을 모두 입력해 주세요.')
      return
    }
    go('create')
  }

  const handleBack = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    if (step === 'confirm') {
      go('create')
      return
    }
    if (step === 'create') {
      go(mode === 'reset' ? 'verify' : 'current')
      return
    }
    pop()
  }

  const copy = (() => {
    if (step === 'verify') {
      return {
        title: '거래 PIN을 다시 만들려면 본인 확인이 필요해요',
        description: '가입할 때 등록한 정보를 입력해 주세요.',
      }
    }
    if (step === 'current') {
      return {
        title: '현재 거래 PIN을 입력해 주세요',
        description: '확인 후 새 PIN을 만들 수 있어요.',
      }
    }
    if (step === 'create') {
      return {
        title: '새 거래 PIN을 만들어 주세요',
        description: '거래를 승인할 때 사용할 숫자 6자리를 입력해 주세요.',
      }
    }
    return {
      title: '한 번 더 입력해 주세요',
      description: '방금 입력한 거래 PIN과 같은지 확인할게요.',
    }
  })()

  return {
    mode,
    step,
    entry,
    pinLength: PIN_LENGTH,
    phone,
    accountNumberLast4,
    name,
    birthDate,
    copy,
    setPhone,
    setAccountNumberLast4,
    setName,
    setBirthDate,
    handleDigit,
    handleBackspace,
    handleVerifyNext,
    handleBack,
  }
}
