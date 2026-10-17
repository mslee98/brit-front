import { actions } from '../../../stackflow/stackflow'
import { openDisputeChatById } from '../../trade/utils/openDisputeChat'

const DISPUTE_CHAT_PATH = /^\/trade\/dispute\/([^/]+)$/

export function parseDisputeIdFromDeepLink(deepLink: string): string | null {
  const path = deepLink.split('?')[0] ?? deepLink
  return path.match(DISPUTE_CHAT_PATH)?.[1] ?? null
}

/**
 * 서버 deepLink → Stackflow 화면 이동.
 * `/trade/dispute/:id`는 `/trade`보다 먼저 매칭한다.
 */
export function navigateFromDeepLink(deepLink: string): void {
  const path = deepLink.split('?')[0] ?? deepLink
  const query = deepLink.includes('?')
    ? new URLSearchParams(deepLink.slice(deepLink.indexOf('?') + 1))
    : new URLSearchParams()

  const disputeId = parseDisputeIdFromDeepLink(deepLink)
  if (disputeId) {
    openDisputeChatById(disputeId)
    return
  }

  const sellMatch = path.match(/^\/trade\/sell\/([^/]+)$/)
  if (sellMatch?.[1]) {
    actions.push('SellOrderDetail', { sellOrderId: sellMatch[1] }, { animate: true })
    return
  }

  const matchingMatch = path.match(/^\/trade\/matching\/([^/]+)$/)
  if (matchingMatch?.[1]) {
    actions.push('MatchingWaiting', { buyOrderId: matchingMatch[1] }, { animate: true })
    return
  }

  if (path === '/trade' || path.startsWith('/trade')) {
    const tradeId = query.get('tradeId')
    if (tradeId) {
      actions.push('Trade', { tradeId }, { animate: true })
      return
    }
  }

  if (path === '/auth/login') {
    actions.push('Login', {}, { animate: true })
    return
  }

  if (path === '/auth/registration-status') {
    actions.push('RegistrationStatus', { mode: 'resubmit' }, { animate: true })
    return
  }

  if (path === '/home' || path === '/') {
    actions.replace('Home', {}, { animate: false })
  }
}
