import { useState } from 'react'
import { HStack, Text, VStack } from '@seed-design/react'
import { Avatar } from 'seed-design/ui/avatar'
import { IdentityPlaceholder } from 'seed-design/ui/identity-placeholder'

import {
  chatDateKey,
  formatChatDateLabel,
  formatChatTimeLabel,
} from './formatChatTime'
import type { ChatMessage } from './types'

type Props = {
  messages: ChatMessage[]
  emptyText?: string
}

export function ChatThread({ messages, emptyText }: Props) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)

  if (messages.length === 0) {
    return (
      <Text textStyle="t4Regular" color="fg.neutralSubtle">
        {emptyText ?? '메시지를 보내 주세요.'}
      </Text>
    )
  }

  let lastDateKey = ''

  return (
    <>
      <VStack gap="x4" width="full">
        {messages.map((message) => {
          const dateKey = chatDateKey(message.createdAt)
          const showDate = dateKey !== lastDateKey
          lastDateKey = dateKey
          return (
            <VStack key={message.id} gap="x4" width="full">
              {showDate ? (
                <Text
                  textStyle="t2Regular"
                  color="fg.neutralSubtle"
                  style={{ textAlign: 'center' }}
                >
                  {formatChatDateLabel(message.createdAt)}
                </Text>
              ) : null}
              <ChatRow message={message} onPreviewImage={setPreviewSrc} />
            </VStack>
          )
        })}
      </VStack>
      {previewSrc ? (
        <button
          type="button"
          aria-label="이미지 닫기"
          onClick={() => setPreviewSrc(null)}
          style={{
            position: 'fixed',
            zIndex: 80,
            inset: 0,
            margin: 0,
            border: 'none',
            padding: 'var(--seed-dimension-x4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              'color-mix(in srgb, var(--seed-color-fg-neutral-inverted) 8%, #000 78%)',
          }}
        >
          <img
            src={previewSrc}
            alt=""
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        </button>
      ) : null}
    </>
  )
}

function bubbleBg(align: ChatMessage['align']) {
  if (align === 'mine') return 'bg.brandSolid'
  if (align === 'admin') return 'bg.warningWeak'
  return 'bg.neutralWeak'
}

function ChatRow({
  message,
  onPreviewImage,
}: {
  message: ChatMessage
  onPreviewImage: (src: string) => void
}) {
  if (message.align === 'system') {
    return (
      <Text
        textStyle="t2Regular"
        color="fg.neutralSubtle"
        style={{ textAlign: 'center' }}
      >
        {message.body}
      </Text>
    )
  }

  const mine = message.align === 'mine'
  const time = formatChatTimeLabel(message.createdAt)

  return (
    <HStack
      gap="x2"
      width="full"
      align="flex-end"
      justify={mine ? 'flex-end' : 'flex-start'}
    >
      {mine ? null : (
        <Avatar size="36" fallback={<IdentityPlaceholder />} />
      )}
      <VStack
        gap="x1"
        align={mine ? 'flex-end' : 'flex-start'}
        minWidth="0"
        style={{ maxWidth: '78%' }}
      >
        {mine || !message.authorName ? null : (
          <Text textStyle="t2Regular" color="fg.neutralSubtle">
            {message.authorName}
          </Text>
        )}
        <HStack gap="x1_5" align="flex-end" justify={mine ? 'flex-end' : 'flex-start'}>
          {mine ? (
            <Text textStyle="t2Regular" color="fg.neutralSubtle">
              {time}
            </Text>
          ) : null}
          {message.imageUrl ? (
            <button
              type="button"
              onClick={() => onPreviewImage(message.imageUrl as string)}
              style={{
                padding: 0,
                border: 'none',
                background: 'transparent',
                maxWidth: '100%',
                cursor: 'zoom-in',
              }}
            >
              <img
                src={message.imageUrl}
                alt={message.body || '첨부 이미지'}
                style={{
                  maxWidth: '100%',
                  borderRadius: 12,
                  display: 'block',
                }}
              />
            </button>
          ) : (
            <VStack
              px="x3"
              py="x2_5"
              borderRadius="r2"
              bg={bubbleBg(message.align)}
            >
              <Text
                textStyle="t4Regular"
                color={message.align === 'mine' ? 'fg.neutralInverted' : 'fg.neutral'}
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {message.body}
              </Text>
            </VStack>
          )}
          {mine ? null : (
            <Text textStyle="t2Regular" color="fg.neutralSubtle">
              {time}
            </Text>
          )}
        </HStack>
      </VStack>
    </HStack>
  )
}
