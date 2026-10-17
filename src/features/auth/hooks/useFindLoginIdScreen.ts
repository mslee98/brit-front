/**
 * useFindLoginIdScreen
 *
 * 아이디 찾기. phone → verify까지 이동하고, 조회 API 전에는 done으로 넘기지 않는다.
 */
import { useState, type MouseEvent } from 'react'
import { useActivityParams, useFlow } from '@stackflow/react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { showSnackbar } from '../../../shared/utils/showSnackbar'
import { ACCOUNT_ACTION_NOT_READY_MESSAGE } from '../constants'
import { formatPhoneInput } from '../utils/formatPhone'

type FindLoginIdDraft = {
  phone: string
  accountNumberLast4: string
  name: string
  birthDate: string
}

function emptyDraft(): FindLoginIdDraft {
  return { phone: '', accountNumberLast4: '', name: '', birthDate: '' }
}

let findLoginIdDraft = emptyDraft()

export function resetFindLoginIdDraft() {
  findLoginIdDraft = emptyDraft()
}

export function useFindLoginIdScreen() {
  const { step = 'phone' } = useActivityParams<'FindLoginId'>()
  const { replace, pop } = useFlow()
  const snackbar = useSnackbarAdapter()
  const [phone, setPhoneState] = useState(findLoginIdDraft.phone)
  const [accountNumberLast4, setLast4State] = useState(findLoginIdDraft.accountNumberLast4)
  const [name, setNameState] = useState(findLoginIdDraft.name)
  const [birthDate, setBirthDateState] = useState(findLoginIdDraft.birthDate)

  const setPhone = (value: string) => {
    const next = formatPhoneInput(value)
    findLoginIdDraft = { ...findLoginIdDraft, phone: next }
    setPhoneState(next)
  }

  const setAccountNumberLast4 = (value: string) => {
    const next = value.replace(/\D/g, '').slice(0, 4)
    findLoginIdDraft = { ...findLoginIdDraft, accountNumberLast4: next }
    setLast4State(next)
  }

  const setName = (value: string) => {
    findLoginIdDraft = { ...findLoginIdDraft, name: value }
    setNameState(value)
  }

  const setBirthDate = (value: string) => {
    findLoginIdDraft = { ...findLoginIdDraft, birthDate: value }
    setBirthDateState(value)
  }

  const handlePhoneNext = () => {
    if (phone.replace(/\D/g, '').length < 10) {
      showSnackbar(snackbar, '휴대폰 번호를 확인해 주세요.')
      return
    }
    replace('FindLoginId', { step: 'verify' })
  }

  const handleVerify = () => {
    if (accountNumberLast4.length !== 4 || !name.trim() || !birthDate.trim()) {
      showSnackbar(snackbar, '계좌 끝 4자리·이름·생년월일을 모두 입력해 주세요.')
      return
    }
    showSnackbar(snackbar, ACCOUNT_ACTION_NOT_READY_MESSAGE)
  }

  const handleBack = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    if (step === 'done') {
      replace('FindLoginId', { step: 'verify' })
      return
    }
    if (step === 'verify') {
      replace('FindLoginId', { step: 'phone' })
      return
    }
    pop()
  }

  const goLogin = () => replace('Login', {})

  return {
    step,
    phone,
    accountNumberLast4,
    name,
    birthDate,
    setPhone,
    setAccountNumberLast4,
    setName,
    setBirthDate,
    handlePhoneNext,
    handleVerify,
    handleBack,
    goLogin,
  }
}
