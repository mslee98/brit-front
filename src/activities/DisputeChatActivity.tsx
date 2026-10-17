/**
 * DisputeChatActivity — 분쟁 삼자 채팅 (구매자·판매자·Brit 분쟁조정팀).
 */
import { useRef, useState } from 'react'
import { useActivity, type ActivityComponentType } from '@stackflow/react'
import { IconILowercaseSerifCircleLine } from '@karrotmarket/react-monochrome-icon'
import { Icon, Text, VStack } from '@seed-design/react'
import { ActionButton } from 'seed-design/ui/action-button'
import { AppBarIconButton } from 'seed-design/ui/app-bar'

import { ChatScreen } from '../shared/chat'
import { DisputeCaseBanner } from '../features/trade/components/DisputeCaseBanner'
import { DisputeTradeInfoSheet } from '../features/trade/components/DisputeTradeInfoSheet'
import { useDisputeChatScreen } from '../features/trade/hooks/useDisputeChatScreen'
import {
  getDisputeChatEmptyText,
  getDisputeChatResultCta,
} from '../features/trade/copy'
import { pickDisputeEvidenceFiles } from '../features/trade/utils/disputeEvidenceFiles'

const DisputeChatActivity: ActivityComponentType<'DisputeChat'> = () => {
  const { isActive } = useActivity()
  const screen = useDisputeChatScreen()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [infoOpen, setInfoOpen] = useState(false)
  const canChat = screen.room?.canChat === true

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  return (
    <ChatScreen
      identity={{
        title: screen.room?.displayName ?? 'Brit 분쟁조정팀',
      }}
      right={
        <AppBarIconButton
          aria-label="거래 정보"
          type="button"
          onClick={() => setInfoOpen(true)}
        >
          <Icon svg={<IconILowercaseSerifCircleLine />} size="x5" color="fg.neutralSubtle" />
        </AppBarIconButton>
      }
      banner={
        screen.room ? (
          <DisputeCaseBanner
            canChat={canChat}
            role={screen.trade?.role ?? null}
            onViewTrade={() => setInfoOpen(true)}
          />
        ) : null
      }
      messages={screen.messages}
      loading={screen.loading}
      emptyText={getDisputeChatEmptyText()}
      canWrite={canChat}
      composer={{
        draft: screen.draft,
        onDraftChange: screen.setDraft,
        onSend: () => void screen.handleSend(),
        onAttach: openFilePicker,
        sending: screen.sending,
      }}
      closedFooter={
        screen.room ? (
          <VStack gap="x3" width="full">
            <Text textStyle="t3Regular" color="fg.neutralSubtle">
              검토가 끝나 메시지를 보낼 수 없어요.
            </Text>
            {screen.room.tradeId ? (
              <ActionButton
                size="medium"
                variant="brandSolid"
                onClick={() => screen.handleViewTradeResult()}
              >
                {getDisputeChatResultCta()}
              </ActionButton>
            ) : null}
          </VStack>
        ) : null
      }
      onFiles={(files) => {
        const picked = pickDisputeEvidenceFiles(files)
        if (picked.length > 0) void screen.handleAttachEvidence(picked)
      }}
      dropEnabled={isActive && canChat && !screen.sending}
      extras={
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={(event) => {
              const files = pickDisputeEvidenceFiles(event.target.files)
              event.target.value = ''
              if (files.length > 0) void screen.handleAttachEvidence(files)
            }}
          />
          <DisputeTradeInfoSheet
            open={infoOpen}
            onOpenChange={setInfoOpen}
            trade={screen.trade}
          />
        </>
      }
    />
  )
}

export default DisputeChatActivity
