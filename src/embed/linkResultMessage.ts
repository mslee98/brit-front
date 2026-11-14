/**
 * 업체 창(window.opener)에 연결 결과를 알린다.
 * targetOrigin은 업체 서버가 세션 생성 시 등록한 returnOrigin만 쓴다.
 */
export type LinkResultStatus = 'LINKED' | 'REJECTED' | 'ERROR'

export interface LinkResultMessage {
  type: 'BRIT_LINK_RESULT'
  status: LinkResultStatus
  code?: string
  errorCode?: string
}

export function postLinkResult(
  returnOrigin: string,
  message: Omit<LinkResultMessage, 'type'>,
): boolean {
  const opener = window.opener as Window | null
  if (!opener || opener.closed) return false
  const payload: LinkResultMessage = { type: 'BRIT_LINK_RESULT', ...message }
  opener.postMessage(payload, returnOrigin)
  return true
}

const SESSION_STORAGE_KEY = 'brit-embed-link-session'

/**
 * 팝업 URL의 `#session=` 토큰을 읽고 주소창에서 지운다.
 * 새로고침에 대비해 이 탭의 sessionStorage에만 남긴다.
 */
export function takeSessionTokenFromHash(): string | null {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const fromHash = params.get('session')?.trim() || null
  if (fromHash) {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, fromHash)
    window.history.replaceState(null, '', window.location.pathname)
    return fromHash
  }
  return window.sessionStorage.getItem(SESSION_STORAGE_KEY)
}

export function forgetSessionToken() {
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
}
