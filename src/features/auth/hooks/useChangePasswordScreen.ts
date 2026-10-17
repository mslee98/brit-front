/**
 * useChangePasswordScreen
 *
 * 로그인된 상태에서 비밀번호를 바꾸는 입력. 변경 API 전에는 제출하지 않는다.
 */
import { useState } from 'react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import { showSnackbar } from '../../../shared/utils/showSnackbar'
import { ACCOUNT_ACTION_NOT_READY_MESSAGE } from '../constants'
import { isValidLoginPassword } from '../utils/signupAuthValidation'

export function useChangePasswordScreen() {
  const snackbar = useSnackbarAdapter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  const handleSubmit = () => {
    if (!currentPassword) {
      showSnackbar(snackbar, '현재 비밀번호를 입력해 주세요.')
      return
    }
    if (!isValidLoginPassword(newPassword) || newPassword !== passwordConfirm) {
      showSnackbar(snackbar, '비밀번호를 확인해 주세요. 영문·숫자 포함 8자 이상이어야 해요.')
      return
    }
    showSnackbar(snackbar, ACCOUNT_ACTION_NOT_READY_MESSAGE)
  }

  return {
    currentPassword,
    newPassword,
    passwordConfirm,
    setCurrentPassword,
    setNewPassword,
    setPasswordConfirm,
    handleSubmit,
  }
}
