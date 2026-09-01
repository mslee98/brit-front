import { useCallback, useState, type ReactNode } from 'react'

import { AuthRequiredAlertDialog } from '../components/AuthRequiredAlertDialog'
import type { AuthRequiredReason } from '../constants/authRequiredCopy'
import { getAuthNextAction, isAuthenticated } from '../stores/authSession.store'

interface UseAuthRequiredPromptOptions {
  onNavigateToLogin: () => void
  layerIndex?: number
}

export function useAuthRequiredPrompt({
  onNavigateToLogin,
  layerIndex,
}: UseAuthRequiredPromptOptions) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<AuthRequiredReason>('default')

  const promptAuth = useCallback(
    (action: () => void, authReason: AuthRequiredReason = 'default') => {
      if (isAuthenticated()) {
        if (getAuthNextAction() !== 'NONE') {
          setReason('default')
          setOpen(true)
          return
        }
        action()
        return
      }
      setReason(authReason)
      setOpen(true)
    },
    [],
  )

  const authRequiredDialog: ReactNode = (
    <AuthRequiredAlertDialog
      open={open}
      onOpenChange={setOpen}
      reason={reason}
      onLogin={onNavigateToLogin}
      layerIndex={layerIndex}
    />
  )

  return { promptAuth, authRequiredDialog, authRequiredOpen: open }
}
