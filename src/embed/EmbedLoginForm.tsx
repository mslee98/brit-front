import { useState, type FormEvent } from 'react'
import { Text, VStack } from '@seed-design/react'
import { ActionButton } from 'seed-design/ui/action-button'
import { TextField, TextFieldInput } from 'seed-design/ui/text-field'

import { loginWithPassword } from '../features/auth/api/auth.api'
import { setSession } from '../features/auth/stores/authSession.store'
import { ApiError } from '../shared/api/errors'

type EmbedLoginFormProps = {
  /** 로그인 안내 부제 */
  subtitle: string
  /** nextAction !== NONE 일 때 메시지 */
  pendingMessage: string
}

export function EmbedLoginForm({ subtitle, pendingMessage }: EmbedLoginFormProps) {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const normalized = loginId.trim().toLowerCase()
    if (!normalized || !password) {
      setError('아이디와 비밀번호를 입력해 주세요.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const result = await loginWithPassword({ loginId: normalized, password })
      if (result.nextAction !== 'NONE') {
        setError(pendingMessage)
        return
      }
      setSession(result.tokens, result.user, result.nextAction)
    } catch (err) {
      setError(
        err instanceof ApiError && err.status !== undefined && err.status >= 500
          ? '잠시 후 다시 시도해 주세요.'
          : '아이디 또는 비밀번호를 확인해 주세요.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <VStack as="form" gap="x5" onSubmit={submit} flexGrow>
      <div className="embed-hero">
        <h1 className="embed-hero__title">BRIT 로그인</h1>
        <p className="embed-hero__subtitle">{subtitle}</p>
      </div>
      <TextField label="아이디" value={loginId} onValueChange={({ value }) => setLoginId(value)}>
        <TextFieldInput
          placeholder="아이디를 입력해 주세요"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
        />
      </TextField>
      <TextField label="비밀번호" value={password} onValueChange={({ value }) => setPassword(value)}>
        <TextFieldInput
          type="password"
          placeholder="비밀번호를 입력해 주세요"
          autoComplete="current-password"
        />
      </TextField>
      {error ? (
        <Text textStyle="t3Regular" color="fg.critical">
          {error}
        </Text>
      ) : null}
      <div style={{ marginTop: 'auto' }}>
        <ActionButton type="submit" size="large" variant="brandSolid" loading={submitting}>
          로그인
        </ActionButton>
      </div>
    </VStack>
  )
}
