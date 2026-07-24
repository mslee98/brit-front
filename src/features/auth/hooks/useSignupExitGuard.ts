/**
 * useSignupExitGuard
 *
 * 책임: 가입 플로우 닫기(X) → 이탈 확인 → draft/secrets 초기화 후 Login
 * 비책임: 헤더 뒤로가기(이전 step/Activity)
 */
import { useStack } from '@stackflow/react'
import { useState } from 'react'

import { resetSignupDraft } from '../stores/signupDraft.store'
import { resetSignupSecrets } from '../stores/signupSecrets.store'
import { actions } from '../../../stackflow/stackflow'

export function useSignupExitGuard() {
  const { activities } = useStack()
  const [exitDialogOpen, setExitDialogOpen] = useState(false)

  const openExitDialog = () => setExitDialogOpen(true)

  const handleConfirmExit = () => {
    resetSignupDraft()
    resetSignupSecrets()
    const popCount = Math.max(0, activities.length - 1)
    if (popCount > 0) {
      actions.pop(popCount, { animate: false })
    }
    actions.replace('Login', {}, { animate: true })
  }

  return {
    exitDialogOpen,
    setExitDialogOpen,
    openExitDialog,
    handleConfirmExit,
  }
}
