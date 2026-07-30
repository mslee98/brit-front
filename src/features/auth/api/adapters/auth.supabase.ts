import { ApiError, API_ERROR_CODES } from '../../../../shared/api/errors'
import { getSupabaseClient } from '../../../../shared/lib/supabase'
import { toKoreaE164 } from '../../utils/phoneE164'
import type {
  CompleteSignupPayload,
  CompleteSignupResult,
  PasskeyListItem,
  RecoverAccountPayload,
  RecoverAccountResult,
  SessionListItem,
} from '../../types/signup'

function mapSignupError(message: string, status?: number): ApiError {
  if (message.includes('NICKNAME_TAKEN')) {
    return new ApiError(API_ERROR_CODES.NICKNAME_TAKEN, message, status ?? 409)
  }
  if (message.includes('PHONE_EXISTS')) {
    return new ApiError(API_ERROR_CODES.PHONE_EXISTS, message, status ?? 409)
  }
  if (message.includes('IDENTITY_EXISTS')) {
    return new ApiError(API_ERROR_CODES.IDENTITY_EXISTS, message, status ?? 409)
  }
  return new ApiError(API_ERROR_CODES.SIGNUP_FAILED, message, status)
}

export async function completeSignupSupabase(
  _payload: CompleteSignupPayload,
): Promise<CompleteSignupResult> {
  // Nest가 signup SoT — Edge signup 경로 미사용
  throw new ApiError(
    API_ERROR_CODES.SIGNUP_FAILED,
    '가입은 Nest API를 사용해 주세요.',
  )
}

export async function signInAfterSignupSupabase(payload: {
  phoneE164: string
  loginPassword: string
}): Promise<{ success: true }> {
  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.signInWithPassword({
    phone: payload.phoneE164,
    password: payload.loginPassword,
  })
  if (error) {
    throw new ApiError(API_ERROR_CODES.LOGIN_FAILED, error.message)
  }
  return { success: true }
}

export async function loginWithPasswordSupabase(payload: {
  phone: string
  password: string
}): Promise<{ success: true }> {
  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.signInWithPassword({
    phone: toKoreaE164(payload.phone),
    password: payload.password,
  })
  if (error) {
    throw new ApiError(API_ERROR_CODES.LOGIN_FAILED, error.message)
  }
  return { success: true }
}

export async function loginWithPasskeySupabase(): Promise<{ success: true }> {
  const supabase = getSupabaseClient()
  // Experimental API — typed loosely until GA
  const auth = supabase.auth as typeof supabase.auth & {
    signInWithPasskey: () => Promise<{ error: Error | null }>
  }
  const { error } = await auth.signInWithPasskey()
  if (error) {
    throw new ApiError(API_ERROR_CODES.PASSKEY_FAILED, error.message)
  }
  return { success: true }
}

export async function registerPasskeySupabase(): Promise<{ success: true }> {
  const supabase = getSupabaseClient()
  const auth = supabase.auth as typeof supabase.auth & {
    registerPasskey: () => Promise<{ error: Error | null }>
  }
  const { error } = await auth.registerPasskey()
  if (error) {
    throw new ApiError(API_ERROR_CODES.PASSKEY_FAILED, error.message)
  }
  return { success: true }
}

export async function markPasskeyRegisteredSupabase(): Promise<{ success: true }> {
  const supabase = getSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: true }

  await supabase
    .from('user_profiles')
    .update({ passkey_registered_at: new Date().toISOString() })
    .eq('user_id', user.id)
  return { success: true }
}

export async function dismissPasskeyPromptSupabase(): Promise<{ success: true }> {
  const supabase = getSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: true }

  await supabase
    .from('user_profiles')
    .update({ passkey_prompt_dismissed_at: new Date().toISOString() })
    .eq('user_id', user.id)
  return { success: true }
}

export async function listPasskeysSupabase(): Promise<PasskeyListItem[]> {
  const supabase = getSupabaseClient()
  const auth = supabase.auth as typeof supabase.auth & {
    passkey: {
      list: () => Promise<{
        data: Array<{
          id: string
          friendly_name?: string
          created_at: string
          last_used_at?: string
        }> | null
        error: Error | null
      }>
    }
  }
  const { data, error } = await auth.passkey.list()
  if (error) {
    throw new ApiError(API_ERROR_CODES.PASSKEY_FAILED, error.message)
  }
  return (data ?? []).map((item) => ({
    id: item.id,
    friendlyName: item.friendly_name ?? '패스키',
    createdAt: item.created_at,
    lastUsedAt: item.last_used_at,
  }))
}

export async function deletePasskeySupabase(id: string): Promise<{ success: true }> {
  const supabase = getSupabaseClient()
  const auth = supabase.auth as typeof supabase.auth & {
    passkey: {
      remove: (opts: { id: string }) => Promise<{ error: Error | null }>
    }
  }
  const { error } = await auth.passkey.remove({ id })
  if (error) {
    throw new ApiError(API_ERROR_CODES.PASSKEY_FAILED, error.message)
  }
  return { success: true }
}

export async function renamePasskeySupabase(
  id: string,
  friendlyName: string,
): Promise<{ success: true }> {
  const supabase = getSupabaseClient()
  const auth = supabase.auth as typeof supabase.auth & {
    passkey: {
      update: (opts: {
        id: string
        friendly_name: string
      }) => Promise<{ error: Error | null }>
    }
  }
  const { error } = await auth.passkey.update({ id, friendly_name: friendlyName })
  if (error) {
    throw new ApiError(API_ERROR_CODES.PASSKEY_FAILED, error.message)
  }
  return { success: true }
}

/**
 * Supabase JS는 전체 세션 목록 Admin API를 클라이언트에 노출하지 않음.
 * 현재 세션만 표시하고, 타 기기 강제 종료는 Edge/HTTP로 위임.
 */
export async function listSessionsSupabase(): Promise<SessionListItem[]> {
  const supabase = getSupabaseClient()
  const { data } = await supabase.auth.getSession()
  if (!data.session) return []
  return [
    {
      id: data.session.access_token.slice(0, 12),
      createdAt: new Date((data.session.user as { created_at?: string }).created_at ?? Date.now()).toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      isCurrent: true,
    },
  ]
}

export async function revokeSessionSupabase(id: string): Promise<{ success: true }> {
  void id
  const supabase = getSupabaseClient()
  await supabase.auth.signOut({ scope: 'local' })
  return { success: true }
}

export async function revokeOtherSessionsSupabase(): Promise<{ success: true }> {
  const supabase = getSupabaseClient()
  // global sign-out then re-login is destructive; prefer scope global when available
  await supabase.auth.signOut({ scope: 'others' })
  return { success: true }
}

export async function recoverAccountSupabase(
  payload: RecoverAccountPayload,
): Promise<RecoverAccountResult> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.functions.invoke('recovery', {
    body: payload,
  })
  if (error) {
    throw new ApiError(API_ERROR_CODES.RECOVERY_FAILED, error.message)
  }
  const body = data as RecoverAccountResult & { error?: string }
  if (!body?.success) {
    throw new ApiError(API_ERROR_CODES.RECOVERY_FAILED, body?.error)
  }
  return body
}

export async function fetchSensitiveLockSupabase(): Promise<string | null> {
  const supabase = getSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('user_profiles')
    .select('sensitive_actions_locked_until')
    .eq('user_id', user.id)
    .maybeSingle()

  return (data as { sensitive_actions_locked_until?: string } | null)
    ?.sensitive_actions_locked_until ?? null
}
