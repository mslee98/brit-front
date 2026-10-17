import { useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { HStack, Text, VStack } from '@seed-design/react'
import { Avatar } from 'seed-design/ui/avatar'
import { IdentityPlaceholder } from 'seed-design/ui/identity-placeholder'

import { ActivityScreenLayout } from '../../app/layouts/ActivityScreenLayout'
import { ChatComposer } from './ChatComposer'
import { ChatThread } from './ChatThread'
import { filesFromDataTransfer, isFileDrag } from './isFileDrag'
import type { ChatComposerState, ChatIdentity, ChatMessage } from './types'

type Props = {
  identity: ChatIdentity
  right?: ReactNode
  banner?: ReactNode
  messages: ChatMessage[]
  loading?: boolean
  emptyText?: string
  canWrite: boolean
  composer: ChatComposerState
  closedFooter?: ReactNode
  onFiles?: (files: File[]) => void
  dropEnabled?: boolean
  extras?: ReactNode
}

export function ChatScreen({
  identity,
  right,
  banner,
  messages,
  loading = false,
  emptyText,
  canWrite,
  composer,
  closedFooter,
  onFiles,
  dropEnabled = false,
  extras,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!dropEnabled) setDragging(false)
  }, [dropEnabled])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  function handleFileDragEnter(event: DragEvent) {
    if (!dropEnabled) return
    if (!isFileDrag(event.dataTransfer)) return
    event.preventDefault()
    setDragging(true)
  }

  function handleFileDragOver(event: DragEvent) {
    if (!dropEnabled) return
    if (!isFileDrag(event.dataTransfer)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  function handleFileDrop(event: DragEvent) {
    event.preventDefault()
    setDragging(false)
    if (!dropEnabled) return
    const files = filesFromDataTransfer(event.dataTransfer)
    if (files.length > 0) onFiles?.(files)
  }

  const identityMain = (
    <HStack gap="x2" align="center" minWidth="0">
      <Avatar
        size="24"
        src={identity.avatarSrc}
        alt=""
        fallback={<IdentityPlaceholder />}
      />
      <VStack minWidth="0" align="flex-start">
        <Text textStyle="t5Bold" color="fg.neutral">
          {identity.title}
        </Text>
        {identity.subtitle ? (
          <Text textStyle="t2Regular" color="fg.neutralMuted">
            {identity.subtitle}
          </Text>
        ) : null}
      </VStack>
    </HStack>
  )

  const dropOverlay =
    dragging && dropEnabled ? (
      <HStack
        position="absolute"
        style={{
          inset: 0,
          background:
            'color-mix(in srgb, var(--seed-color-fg-neutral-inverted) 8%, #000 78%)',
        }}
        zIndex={70}
        align="center"
        justify="center"
        px="x4"
        onDragOver={handleFileDragOver}
        onDragLeave={(event) => {
          const related = event.relatedTarget
          if (related instanceof Node && event.currentTarget.contains(related)) {
            return
          }
          setDragging(false)
        }}
        onDrop={handleFileDrop}
      >
        <Text textStyle="t4Medium" color="fg.neutralInverted">
          이미지를 놓으면 첨부돼요
        </Text>
      </HStack>
    ) : null

  return (
    <ActivityScreenLayout
      main={identityMain}
      leftAction="back"
      right={right}
      progress={banner}
      bottomCTABehavior="keyboardAdaptive"
      overlay={dropOverlay}
      extras={extras}
      appScreenProps={{
        onDragEnter: handleFileDragEnter,
        onDragOver: handleFileDragOver,
      }}
      fixedBottom={
        canWrite ? (
          <VStack
            width="full"
            onPasteCapture={(event) => {
              const files = filesFromDataTransfer(event.clipboardData)
              if (files.length === 0) return
              event.preventDefault()
              onFiles?.(files)
            }}
          >
            <ChatComposer {...composer} />
          </VStack>
        ) : (
          closedFooter
        )
      }
    >
      <VStack
        px="spacingX.globalGutter"
        pt="spacingY.navToTitle"
        pb="spacingY.screenBottom"
        gap="x4"
      >
        {loading ? (
          <Text textStyle="t4Regular" color="fg.neutralSubtle">
            불러오는 중이에요…
          </Text>
        ) : (
          <ChatThread messages={messages} emptyText={emptyText} />
        )}
        <div ref={bottomRef} />
      </VStack>
    </ActivityScreenLayout>
  )
}
