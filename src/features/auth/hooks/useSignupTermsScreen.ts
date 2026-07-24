/**
 * useSignupTermsScreen
 *
 * 책임: 약관 동의 상태·전체동의·필수 충족 시 Identity 진입
 */
import { useFlow } from '@stackflow/react'
import { useMemo, useState } from 'react'

import {
  SIGNUP_TERMS_ITEMS,
  type SignupTermsItemId,
} from '../constants'
import { updateSignupDraft } from '../stores/signupDraft.store'
import { useSignupExitGuard } from './useSignupExitGuard'

type TermsChecks = Record<SignupTermsItemId, boolean>

const INITIAL_CHECKS: TermsChecks = {
  service: false,
  privacy: false,
  identity: false,
  marketing: false,
}

export function useSignupTermsScreen() {
  const { push } = useFlow()
  const exit = useSignupExitGuard()
  const [checks, setChecks] = useState<TermsChecks>(INITIAL_CHECKS)
  const [detailId, setDetailId] = useState<SignupTermsItemId | null>(null)

  const requiredIds = useMemo(
    () => SIGNUP_TERMS_ITEMS.filter((item) => item.required).map((item) => item.id),
    [],
  )

  const allChecked = SIGNUP_TERMS_ITEMS.every((item) => checks[item.id])
  const requiredChecked = requiredIds.every((id) => checks[id])

  const setItemChecked = (id: SignupTermsItemId, checked: boolean) => {
    setChecks((prev) => ({ ...prev, [id]: checked }))
  }

  const setAllChecked = (checked: boolean) => {
    setChecks({
      service: checked,
      privacy: checked,
      identity: checked,
      marketing: checked,
    })
  }

  const handleStart = () => {
    if (!requiredChecked) return
    updateSignupDraft({
      consents: { ...checks },
      consentsAgreedAt: new Date().toISOString(),
    })
    push('SignupIdentity', {})
  }

  const detailItem = detailId
    ? SIGNUP_TERMS_ITEMS.find((item) => item.id === detailId) ?? null
    : null

  return {
    checks,
    allChecked,
    requiredChecked,
    detailItem,
    setItemChecked,
    setAllChecked,
    setDetailId,
    handleStart,
    ...exit,
  }
}
