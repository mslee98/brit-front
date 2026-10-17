import {
  resolveDisputeAssetUrl,
  type PartyDisputeMessage,
} from '../api/disputes.api'
import type { ChatMessage } from '../../../shared/chat'

export function toChatMessage(message: PartyDisputeMessage): ChatMessage {
  const align =
    message.actorRole === 'SYSTEM'
      ? 'system'
      : message.isMine
        ? 'mine'
        : message.actorRole === 'ADMIN'
          ? 'admin'
          : 'other'

  return {
    id: message.id,
    align,
    authorName: message.isMine ? undefined : message.displayName,
    body: message.body,
    imageUrl: resolveDisputeAssetUrl(message.imageUrl),
    createdAt: message.createdAt,
  }
}
