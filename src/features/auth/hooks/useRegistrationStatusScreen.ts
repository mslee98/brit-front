import { useEffect, useState } from 'react'
import { useActivityParams, useFlow } from '@stackflow/react'

import { getMe, getRegistrationStatus, logoutAll, resubmitRegistration } from '../api/auth.api'
import type { Institution } from '../data/institutions'
import type { RegistrationStatus } from '../types/signup'
import { clearSession } from '../stores/authSession.store'

export function useRegistrationStatusScreen() {
  const { mode = 'wait' } = useActivityParams<'RegistrationStatus'>()
  const { replace, pop } = useFlow()
  const [status, setStatus] = useState<RegistrationStatus>('UNDER_REVIEW')
  const [name, setName] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState<'bank' | 'account'>('bank')

  useEffect(() => {
    void (async () => {
      try {
        const [me, registration] = await Promise.all([getMe(), getRegistrationStatus()])
        setName(me.name)
        setStatus(registration.registrationStatus)
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  const handleSelectInstitution = (institution: Institution) => {
    setBankCode(institution.code)
    setBankName(institution.name)
    setAccountNumber('')
    setStep('account')
  }

  const handleSubmitResubmission = async () => {
    if (!bankCode || accountNumber.replace(/\D/g, '').length < 10 || !name || isSubmitting) {
      return
    }
    setIsSubmitting(true)
    try {
      const result = await resubmitRegistration({
        bankAccount: {
          bankCode,
          accountNumber: accountNumber.replace(/\D/g, ''),
          holderName: name,
        },
      })
      setStatus(result.registrationStatus)
      replace('RegistrationStatus', { mode: 'wait' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResubmitBankBack = () => {
    if (bankCode) {
      setStep('account')
      return
    }
    pop()
  }

  const handleLogout = async () => {
    try {
      await logoutAll()
    } finally {
      clearSession()
      replace('Login', {})
    }
  }

  return {
    mode,
    status,
    isLoading,
    isSubmitting,
    step,
    bankCode,
    bankName,
    accountNumber,
    setStep,
    setAccountNumber,
    handleSelectInstitution,
    handleSubmitResubmission,
    handleResubmitBankBack,
    handleLogout,
  }
}
