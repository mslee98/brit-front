import { getTopActivitySnapshot } from '../../../stackflow/plugins/bottomNavChromePlugin'
import { actions } from '../../../stackflow/stackflow'

/** 분쟁 채팅 입장. 홈·거래내역·배너·Trade CTA가 같은 경로를 탄다. */
export function openDisputeChatById(
  disputeId: string,
  options?: { animate?: boolean },
): void {
  const top = getTopActivitySnapshot()
  if (top?.name === 'DisputeChat' && top.params?.disputeId === disputeId) {
    return
  }
  actions.push('DisputeChat', { disputeId }, { animate: options?.animate ?? true })
}
