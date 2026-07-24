/**
 * useSignupCredentialsFlow
 *
 * 책임: loginId → nickname → password 수집. 회원 생성은 하지 않음.
 */
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useActivityParams, useFlow } from '@stackflow/react'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'

import {
  SIGNUP_CREDENTIALS_COPY,
  type LoginIdCheckState,
  type NicknameCheckState,
} from '../constants'
import { checkLoginId, checkNickname } from '../api/auth.api'
import { getSignupDraft, updateSignupDraft } from '../stores/signupDraft.store'
import { setLoginPassword } from '../stores/signupSecrets.store'
import {
  isValidLoginId,
  isValidLoginPassword,
  isValidNickname,
} from '../utils/signupAuthValidation'
import { showSnackbar } from '../../../shared/utils/showSnackbar'
import { useSignupExitGuard } from './useSignupExitGuard'

const DEBOUNCE_MS = 450

export function useSignupCredentialsFlow() {
  const { step = 'loginId' } = useActivityParams<'SignupCredentials'>()
  const { push, replace, pop } = useFlow()
  const snackbar = useSnackbarAdapter()
  const exit = useSignupExitGuard()

  const [loginId, setLoginId] = useState(getSignupDraft().loginId)
  const [loginIdState, setLoginIdState] = useState<LoginIdCheckState>(
    getSignupDraft().loginId ? 'available' : 'idle',
  )
  const [nickname, setNickname] = useState(getSignupDraft().nickname)
  const [nicknameState, setNicknameState] = useState<NicknameCheckState>(
    getSignupDraft().nickname ? 'available' : 'idle',
  )
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const checkSeqRef = useRef(0)

  const copy = SIGNUP_CREDENTIALS_COPY[step]

  useEffect(() => {
    if (step !== 'loginId') return

    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = loginId.trim().toLowerCase()
    if (!trimmed) {
      setLoginIdState('idle')
      return
    }
    if (!isValidLoginId(trimmed)) {
      setLoginIdState('invalid')
      return
    }

    setLoginIdState('checking')
    const seq = ++checkSeqRef.current
    debounceRef.current = setTimeout(() => {
      void (async () => {
        try {
          const { available } = await checkLoginId(trimmed)
          if (seq !== checkSeqRef.current) return
          setLoginIdState(available ? 'available' : 'duplicated')
        } catch {
          if (seq !== checkSeqRef.current) return
          setLoginIdState('error')
        }
      })()
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [loginId, step])

  useEffect(() => {
    if (step !== 'nickname') return

    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = nickname.trim()
    if (!trimmed) {
      setNicknameState('idle')
      return
    }
    if (!isValidNickname(trimmed)) {
      setNicknameState('invalid')
      return
    }

    setNicknameState('checking')
    const seq = ++checkSeqRef.current
    debounceRef.current = setTimeout(() => {
      void (async () => {
        try {
          const { available } = await checkNickname(trimmed)
          if (seq !== checkSeqRef.current) return
          setNicknameState(available ? 'available' : 'duplicated')
        } catch {
          if (seq !== checkSeqRef.current) return
          setNicknameState('error')
        }
      })()
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [nickname, step])

  const canSubmitLoginId = loginIdState === 'available' && isValidLoginId(loginId)
  const canSubmitNickname = nicknameState === 'available' && isValidNickname(nickname)
  const canSubmitPassword =
    isValidLoginPassword(password) && password === passwordConfirm && password.length > 0

  const handleLoginIdNext = () => {
    const normalized = loginId.trim().toLowerCase()
    if (!canSubmitLoginId) {
      if (loginIdState === 'duplicated') {
        showSnackbar(snackbar, '이미 쓰는 아이디예요. 다른 아이디를 적어 주세요.')
      } else {
        showSnackbar(snackbar, '소문자 영문·숫자·밑줄 4~20자로 입력해 주세요.')
      }
      return
    }
    updateSignupDraft({ loginId: normalized })
    setLoginId(normalized)
    replace('SignupCredentials', { step: 'nickname' })
  }

  const handleNicknameNext = () => {
    if (!canSubmitNickname) {
      if (nicknameState === 'duplicated') {
        showSnackbar(snackbar, '이미 쓰는 이름이에요. 다른 이름을 적어 주세요.')
      } else {
        showSnackbar(snackbar, '2~12자 한글·영문·숫자·밑줄로 입력해 주세요.')
      }
      return
    }
    updateSignupDraft({ nickname: nickname.trim() })
    replace('SignupCredentials', { step: 'password' })
  }

  const handlePasswordNext = () => {
    if (!canSubmitPassword) {
      if (password !== passwordConfirm) {
        showSnackbar(snackbar, '비밀번호가 일치하지 않아요.')
      } else {
        showSnackbar(snackbar, '영문과 숫자를 포함해 8자 이상으로 만들어 주세요.')
      }
      return
    }
    setLoginPassword(password)
    push('SignupAccount', { step: 'bank' })
  }

  const handleStepBack = (e: MouseEvent<HTMLButtonElement>) => {
    if (step === 'password') {
      e.preventDefault()
      replace('SignupCredentials', { step: 'nickname' })
      return
    }
    if (step === 'nickname') {
      e.preventDefault()
      replace('SignupCredentials', { step: 'loginId' })
      return
    }
    pop()
  }

  const loginIdHint =
    loginIdState === 'checking'
      ? '사용 가능한지 확인 중…'
      : loginIdState === 'available'
        ? '사용할 수 있는 아이디예요'
        : loginIdState === 'duplicated'
          ? '이미 쓰는 아이디예요'
          : loginIdState === 'invalid'
            ? '소문자 영문·숫자·밑줄 4~20자만 가능해요'
            : loginIdState === 'error'
              ? '확인하지 못했어요. 잠시 후 다시 시도해 주세요'
              : '소문자 영문·숫자·밑줄 4~20자'

  const nicknameHint =
    nicknameState === 'checking'
      ? '사용 가능한지 확인 중…'
      : nicknameState === 'available'
        ? '사용할 수 있는 이름이에요'
        : nicknameState === 'duplicated'
          ? '이미 쓰는 이름이에요'
          : nicknameState === 'invalid'
            ? '2~12자, 한글·영문·숫자·밑줄만 가능해요'
            : nicknameState === 'error'
              ? '확인하지 못했어요. 잠시 후 다시 시도해 주세요'
              : '2~12자, 한글·영문·숫자 사용 가능'

  return {
    step,
    copy,
    loginId,
    loginIdState,
    loginIdHint,
    nickname,
    nicknameState,
    nicknameHint,
    password,
    passwordConfirm,
    canSubmitLoginId,
    canSubmitNickname,
    canSubmitPassword,
    setLoginId: (value: string) => setLoginId(value.toLowerCase()),
    setNickname,
    setPassword,
    setPasswordConfirm,
    handleLoginIdNext,
    handleNicknameNext,
    handlePasswordNext,
    handleStepBack,
    ...exit,
  }
}
