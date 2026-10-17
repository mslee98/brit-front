import type { KeyboardEvent } from 'react'
import { IconArrowUpLine, IconPlusLine } from '@karrotmarket/react-monochrome-icon'
import { Icon } from '@seed-design/react'
import { ActionButton } from 'seed-design/ui/action-button'
import { TextField, TextFieldTextarea } from 'seed-design/ui/text-field'

import type { ChatComposerState } from './types'
import './chat-composer.css'

type Props = ChatComposerState

/**
 * 모바일 키보드는 Enter가 줄바꿈이다. 물리 키보드에서만 Enter로 보낸다.
 * 한글 조합 중 Enter는 전송으로 보지 않는다.
 */
function shouldSendOnEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
  if (event.key !== 'Enter' || event.shiftKey) return false
  if (event.nativeEvent.isComposing || event.keyCode === 229) return false
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

export function ChatComposer({
  draft,
  onDraftChange,
  onSend,
  onAttach,
  sending = false,
  placeholder = '메시지를 입력해 주세요',
}: Props) {
  const canSend = draft.trim().length > 0 && !sending

  return (
    <div className="chat-composer">
      <ActionButton
        className="chat-composer__attach"
        size="medium"
        variant="ghost"
        layout="iconOnly"
        aria-label="사진 첨부"
        disabled={sending}
        onClick={onAttach}
      >
        <Icon svg={<IconPlusLine />} size="x4" />
      </ActionButton>
      <div className="chat-composer__field">
        <TextField
          size="medium"
          label="메시지"
          labelVisuallyHidden
          hideCharacterCount
          maxGraphemeCount={2000}
          value={draft}
          onValueChange={({ value }) => onDraftChange(value)}
          disabled={sending}
        >
          <TextFieldTextarea
            /* SEED 타입이 rows를 빼 두었다. 기본값 2면 빈 칸이 두 줄이 된다. */
            {...({ rows: 1 } as { rows?: number })}
            aria-label="메시지 입력"
            placeholder={placeholder}
            onKeyDown={(event) => {
              if (!shouldSendOnEnter(event)) return
              event.preventDefault()
              onSend()
            }}
          />
        </TextField>
      </div>
      <ActionButton
        className="chat-composer__send"
        size="medium"
        variant="brandSolid"
        layout="iconOnly"
        aria-label="메시지 보내기"
        disabled={!canSend}
        loading={sending}
        onClick={onSend}
      >
        <Icon svg={<IconArrowUpLine />} size="x4" />
      </ActionButton>
    </div>
  )
}
