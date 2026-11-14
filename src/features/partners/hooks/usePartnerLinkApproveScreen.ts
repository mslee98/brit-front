/**
 * BRIT 클라이언트 — 팝업 연결 코드를 PIN 키패드로 입력·승인 (MC-P9).
 * 알림/배너 deepLink의 sessionId가 있으면 코드 입력 생략.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useActivityParams, useFlow } from '@stackflow/react'

import { ApiError } from '../../../shared/api/errors'
import {
  approvePartnerLink,
  previewPartnerLinkApproval,
  rejectPartnerLink,
  type PartnerLinkApprovalPreview,
} from '../api/partnerLinkApproval.api'

const CODE_LENGTH = 4

type Step = 'code' | 'confirm' | 'done'

export function usePartnerLinkApproveScreen() {
  const { pop } = useFlow()
  const params = useActivityParams<'PartnerLinkApprove'>()
  const sessionIdParam =
    typeof params.sessionId === 'string' && params.sessionId.length > 0
      ? params.sessionId
      : null

  const [step, setStep] = useState<Step>(sessionIdParam ? 'confirm' : 'code')
  const [pairingCode, setPairingCodeState] = useState('')
  const [preview, setPreview] = useState<PartnerLinkApprovalPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [doneTitle, setDoneTitle] = useState('')
  const [doneMessage, setDoneMessage] = useState('')
  const previewStartedRef = useRef(false)
  const sessionPreviewStartedRef = useRef(false)

  useEffect(() => {
    if (!sessionIdParam || sessionPreviewStartedRef.current) return
    sessionPreviewStartedRef.current = true
    setSubmitting(true)
    setError(null)
    void previewPartnerLinkApproval({ sessionId: sessionIdParam })
      .then((next) => {
        setPreview(next)
        setStep('confirm')
      })
      .catch((err: unknown) => {
        sessionPreviewStartedRef.current = false
        setStep('code')
        const code = err instanceof ApiError ? err.code : undefined
        if (
          code === 'PARTNER_LINK_SESSION_EXPIRED' ||
          code === 'PARTNER_LINK_SESSION_NOT_FOUND' ||
          code === 'PARTNER_LINK_SESSION_ALREADY_USED'
        ) {
          setError(
            '연결 요청이 끝났거나 만료됐어요. 업체에서 다시 연결을 시작해 주세요.',
          )
          return
        }
        setError(
          err instanceof ApiError && err.message
            ? err.message
            : '연결 요청을 불러오지 못했어요. 코드를 입력해 주세요.',
        )
      })
      .finally(() => setSubmitting(false))
  }, [sessionIdParam])

  const handleBack = useCallback(() => {
    if (step === 'confirm' && !sessionIdParam) {
      setStep('code')
      setPairingCodeState('')
      setPreview(null)
      setError(null)
      previewStartedRef.current = false
      return
    }
    pop()
  }, [pop, sessionIdParam, step])

  const runPreview = useCallback(async (code: string) => {
    if (previewStartedRef.current) return
    previewStartedRef.current = true
    setSubmitting(true)
    setError(null)
    try {
      const next = await previewPartnerLinkApproval({ pairingCode: code })
      setPreview(next)
      setStep('confirm')
    } catch (err) {
      previewStartedRef.current = false
      setPairingCodeState('')
      setError(err instanceof ApiError && err.message ? err.message : '코드를 확인해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }, [])

  const handleDigit = useCallback(
    (digit: string) => {
      if (step !== 'code' || submitting) return
      setPairingCodeState((prev) => {
        if (prev.length >= CODE_LENGTH) return prev
        const next = prev + digit
        setError(null)
        if (next.length === CODE_LENGTH) {
          void runPreview(next)
        }
        return next
      })
    },
    [runPreview, step, submitting],
  )

  const handleBackspace = useCallback(() => {
    if (step !== 'code' || submitting) return
    previewStartedRef.current = false
    setPairingCodeState((prev) => prev.slice(0, -1))
    setError(null)
  }, [step, submitting])

  const approvalInput = useCallback(() => {
    if (sessionIdParam) return { sessionId: sessionIdParam }
    if (pairingCode) return { pairingCode }
    if (preview?.sessionId) return { sessionId: preview.sessionId }
    return null
  }, [pairingCode, preview?.sessionId, sessionIdParam])

  const handleApprove = useCallback(async () => {
    const input = approvalInput()
    if (!preview || !input) return
    setSubmitting(true)
    setError(null)
    try {
      await approvePartnerLink(input)
      setDoneTitle('연결했어요')
      setDoneMessage(`${preview.partnerName}와 BRIT 계정을 연결했어요. 업체 팝업이 곧 닫혀요.`)
      setStep('done')
    } catch (err) {
      setError(err instanceof ApiError && err.message ? err.message : '승인에 실패했어요.')
    } finally {
      setSubmitting(false)
    }
  }, [approvalInput, preview])

  const handleReject = useCallback(async () => {
    const input = approvalInput()
    if (!preview || !input) return
    setSubmitting(true)
    setError(null)
    try {
      await rejectPartnerLink(input)
      setDoneTitle('연결하지 않았어요')
      setDoneMessage('업체 화면으로 돌아가 주세요.')
      setStep('done')
    } catch (err) {
      setError(err instanceof ApiError && err.message ? err.message : '거절에 실패했어요.')
    } finally {
      setSubmitting(false)
    }
  }, [approvalInput, preview])

  return {
    step,
    pairingCode,
    codeLength: CODE_LENGTH,
    preview,
    error,
    submitting,
    doneTitle,
    doneMessage,
    skipCodeEntry: Boolean(sessionIdParam),
    handleBack,
    handleDigit,
    handleBackspace,
    handleApprove,
    handleReject,
    handleDone: () => pop(),
  }
}
