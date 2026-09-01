/**
 * useSignupPinFlow
 *
 * 책임: 거래 PIN create/confirm + confirm 시 Nest completeSignup (PENDING, 세션 없음)
 */
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useActivityParams, useFlow } from '@stackflow/react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'
import { showSnackbar } from '../../../shared/utils/showSnackbar'
import { ApiError } from '../../../shared/api/errors'

import { register } from '../api/auth.api'
import type { CarrierCode } from '../constants'
import { getSignupDraft, resetSignupDraft } from '../stores/signupDraft.store'
import {
  getSignupSecrets,
  resetSignupSecrets,
  setTransactionPin,
} from '../stores/signupSecrets.store'
import { buildSignupConsentItems } from '../utils/buildSignupConsentItems'
import { formatResidentRegistrationNumber } from '../utils/formatRrn'
import { useSignupExitGuard } from './useSignupExitGuard'

const PIN_LENGTH = 6

export function useSignupPinFlow() {
  const { step = 'create' } = useActivityParams<'SignupPin'>()
  const { replace, pop } = useFlow()
  const snackbar = useSnackbarAdapter()
  const exit = useSignupExitGuard()
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const hasAdvancedToConfirmRef = useRef(false)
  const hasSubmittedRef = useRef(false)

  const currentValue = step === 'create' ? pin : confirmPin
  const setCurrentValue = step === 'create' ? setPin : setConfirmPin

  const handleDigit = (digit: string) => {
    if (isSubmitting) return
    setCurrentValue((prev) => (prev.length < PIN_LENGTH ? prev + digit : prev))
  }

  const handleBackspace = () => {
    if (isSubmitting) return
    setCurrentValue((prev) => prev.slice(0, -1))
  }

  useEffect(() => {
    if (step !== 'create') return

    if (pin.length < PIN_LENGTH) {
      hasAdvancedToConfirmRef.current = false
      hasSubmittedRef.current = false
      return
    }

    if (hasAdvancedToConfirmRef.current) return

    hasAdvancedToConfirmRef.current = true
    setTransactionPin(pin)
    replace('SignupPin', { step: 'confirm' })
  }, [pin, step, replace])

  useEffect(() => {
    if (step !== 'confirm' || confirmPin.length < PIN_LENGTH || isSubmitting) return
    if (hasSubmittedRef.current) return

    const secrets = getSignupSecrets()
    if (confirmPin !== secrets.transactionPin) {
      showSnackbar(snackbar, '비밀번호가 일치하지 않아요. 다시 입력해 주세요.')
      setConfirmPin('')
      return
    }

    hasSubmittedRef.current = true
    setTransactionPin(confirmPin)

    const submit = async () => {
      setIsSubmitting(true)
      const draft = getSignupDraft()
      const loginPassword = secrets.loginPassword

      try {
        if (!loginPassword || !draft.nickname || !draft.loginId) {
          showSnackbar(snackbar, '로그인 정보가 없어요. 아이디부터 다시 설정해 주세요.')
          hasSubmittedRef.current = false
          replace('SignupCredentials', { step: 'loginId' })
          return
        }

        if (!draft.bankCode || !draft.accountNumber) {
          showSnackbar(snackbar, '계좌 정보가 없어요. 계좌를 다시 연결해 주세요.')
          hasSubmittedRef.current = false
          replace('SignupAccount', { step: 'bank' })
          return
        }

        if (
          !draft.consents.service ||
          !draft.consents.privacy ||
          !draft.consents.uniqueIdentifier ||
          !draft.consents.bankAccount ||
          !draft.consentsAgreedAt
        ) {
          showSnackbar(snackbar, '약관 동의가 필요해요.')
          hasSubmittedRef.current = false
          replace('SignupTerms', {})
          return
        }

        if (!draft.name || draft.residentRegistrationNumber.length !== 13 || !draft.phone) {
          showSnackbar(snackbar, '본인 정보가 부족해요. 다시 입력해 주세요.')
          hasSubmittedRef.current = false
          replace('SignupIdentity', {})
          return
        }

        const carrier = (draft.carrier || 'SKT') as CarrierCode

        await register({
          loginId: draft.loginId,
          password: loginPassword,
          name: draft.name,
          residentRegistrationNumber: formatResidentRegistrationNumber(
            draft.residentRegistrationNumber,
          ),
          mobileCarrier: carrier,
          phone: draft.phone,
          nickname: draft.nickname,
          bankCode: draft.bankCode,
          bankAccountNumber: draft.accountNumber,
          bankAccountHolderName: draft.name,
          pin: confirmPin,
          consents: buildSignupConsentItems(draft.consents).map((item) => ({
            type: item.consentType,
            version: item.documentVersion,
            agreed: item.isAgreed,
          })),
        })

        resetSignupSecrets()
        resetSignupDraft()
        replace('SignupComplete', {})
      } catch (error) {
        hasSubmittedRef.current = false
        setConfirmPin('')
        if (!(error instanceof ApiError)) {
          showSnackbar(snackbar, '계정을 만들지 못했어요. 잠시 후 다시 시도해 주세요.')
          return
        }

        switch (error.code) {
          case 'LOGIN_ID_ALREADY_EXISTS':
            showSnackbar(snackbar, '이미 쓰는 아이디예요. 다른 아이디를 적어 주세요.')
            replace('SignupCredentials', { step: 'loginId' })
            break
          case 'NICKNAME_ALREADY_EXISTS':
            showSnackbar(snackbar, '이미 쓰는 이름이에요. 다른 이름을 적어 주세요.')
            replace('SignupCredentials', { step: 'nickname' })
            break
          case 'NAME_MISMATCH':
            showSnackbar(snackbar, '예금주가 이름과 같아야 해요. 계좌를 다시 확인해 주세요.')
            replace('SignupAccount', { step: 'accountNumber' })
            break
          case 'PHONE_ALREADY_EXISTS':
            showSnackbar(snackbar, '이미 가입된 휴대폰 번호예요.')
            break
          case 'RESIDENT_NUMBER_ALREADY_EXISTS':
            showSnackbar(snackbar, '이미 가입된 본인 정보예요.')
            break
          case 'CONSENT_REQUIRED':
            showSnackbar(snackbar, '필수 약관에 동의해 주세요.')
            replace('SignupTerms', {})
            break
          case 'INVALID_RRN':
            showSnackbar(snackbar, '주민등록번호를 확인해 주세요.')
            replace('SignupIdentity', {})
            break
          default:
            showSnackbar(
              snackbar,
              error.message || '계정을 만들지 못했어요. 잠시 후 다시 시도해 주세요.',
            )
        }
      } finally {
        setIsSubmitting(false)
      }
    }
    void submit()
  }, [confirmPin, isSubmitting, replace, snackbar, step])

  const handleStepBack = (e: MouseEvent<HTMLButtonElement>) => {
    if (isSubmitting) {
      e.preventDefault()
      return
    }

    if (step === 'confirm') {
      e.preventDefault()
      setConfirmPin('')
      hasSubmittedRef.current = false
      hasAdvancedToConfirmRef.current = false
      setTransactionPin('')
      replace('SignupPin', { step: 'create' })
      return
    }
    e.preventDefault()
    pop()
  }

  const openExitDialog = () => {
    if (isSubmitting) return
    exit.openExitDialog()
  }

  const setExitDialogOpen = (open: boolean) => {
    if (isSubmitting && open) return
    exit.setExitDialogOpen(open)
  }

  const copy = isSubmitting
    ? {
        title: '가입 신청을 접수하고 있어요',
        description: '잠시만 기다려 주세요.',
      }
    : step === 'create'
      ? {
          title: '거래 PIN을 만들어 주세요',
          description: '거래를 승인할 때 사용할 숫자 6자리를 입력해 주세요.',
        }
      : {
          title: '한 번 더 입력해 주세요',
          description: '방금 입력한 거래 PIN과 같은지 확인할게요.',
        }

  return {
    step,
    pinLength: PIN_LENGTH,
    currentValue,
    isSubmitting,
    copy,
    handleDigit,
    handleBackspace,
    handleStepBack,
    exitDialogOpen: exit.exitDialogOpen,
    setExitDialogOpen,
    openExitDialog,
    handleConfirmExit: exit.handleConfirmExit,
  }
}
