/**
 * useAccountRecoveryScreen
 *
 * 책임: OCTOMO + 계좌/신원 2요소 이상 복구. OCTOMO만으로 비번 재설정 금지.
 */
import { useState, type MouseEvent } from 'react'
import { useActivityParams, useFlow } from '@stackflow/react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { recoverAccount } from '../api/auth.api'
import { setSensitiveLockUntil } from '../utils/sensitiveActionLock'
import { isValidLoginPassword } from '../utils/signupAuthValidation'
import { formatPhoneInput } from '../utils/formatPhone'
import { showSnackbar } from '../../../shared/utils/showSnackbar'

export function useAccountRecoveryScreen() {
  const { step = 'phone' } = useActivityParams<'AccountRecovery'>()
  const { replace, pop } = useFlow()
  const snackbar = useSnackbarAdapter()

  const [phone, setPhone] = useState('')
  const [octomoVerified, setOctomoVerified] = useState(false)
  const [accountNumberLast4, setAccountNumberLast4] = useState('')
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lockedUntil, setLockedUntil] = useState<string | null>(null)

  const handlePhoneNext = () => {
    if (formatPhoneInput(phone).length < 10) {
      showSnackbar(snackbar, '휴대폰 번호를 확인해 주세요.')
      return
    }
    replace('AccountRecovery', { step: 'verify' })
  }

  /** DEV/mock: OCTOMO 완료로 표시. 실서비스는 복구 전용 OCTOMO 연동 */
  const handleMarkOctomoVerified = () => {
    setOctomoVerified(true)
    showSnackbar(snackbar, '기기인증을 확인했어요. 계좌·신원 정보를 이어서 입력해 주세요.')
  }

  const handleVerifyNext = () => {
    if (!octomoVerified) {
      showSnackbar(snackbar, '먼저 휴대폰 기기인증을 완료해 주세요.')
      return
    }
    if (accountNumberLast4.length !== 4 || !name || !birthDate) {
      showSnackbar(snackbar, '계좌 끝 4자리·이름·생년월일을 모두 입력해 주세요.')
      return
    }
    replace('AccountRecovery', { step: 'password' })
  }

  const handleSubmitPassword = async () => {
    if (!isValidLoginPassword(newPassword) || newPassword !== passwordConfirm) {
      showSnackbar(snackbar, '비밀번호를 확인해 주세요. 영문·숫자 포함 8자 이상이어야 해요.')
      return
    }
    setIsSubmitting(true)
    try {
      const result = await recoverAccount({
        phone: formatPhoneInput(phone),
        octomoVerified: true,
        accountNumberLast4,
        name,
        birthDate,
        newLoginPassword: newPassword,
      })
      setSensitiveLockUntil(result.sensitiveActionsLockedUntil)
      setLockedUntil(result.sensitiveActionsLockedUntil)
      replace('AccountRecovery', { step: 'done' })
    } catch {
      showSnackbar(snackbar, '계정을 복구하지 못했어요. 입력 정보를 다시 확인해 주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const goLogin = () => replace('Login', {})

  const handleStepBack = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (step === 'password') {
      replace('AccountRecovery', { step: 'verify' })
      return
    }
    if (step === 'verify') {
      replace('AccountRecovery', { step: 'phone' })
      return
    }
    pop()
  }

  return {
    step,
    phone,
    octomoVerified,
    accountNumberLast4,
    name,
    birthDate,
    newPassword,
    passwordConfirm,
    isSubmitting,
    lockedUntil,
    setPhone,
    setAccountNumberLast4,
    setName,
    setBirthDate,
    setNewPassword,
    setPasswordConfirm,
    handlePhoneNext,
    handleMarkOctomoVerified,
    handleVerifyNext,
    handleSubmitPassword,
    handleStepBack,
    goLogin,
  }
}
