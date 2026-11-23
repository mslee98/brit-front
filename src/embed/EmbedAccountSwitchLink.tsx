import { useState } from 'react'
import { Text, VStack } from '@seed-design/react'
import { ActionButton } from 'seed-design/ui/action-button'

type EmbedAccountSwitchLinkProps = {
  disabled?: boolean
  onConfirmSwitch: () => void
}

/**
 * 다른 계정 로그인 — 즉시 clearSession 하지 않고 한 번 확인한다.
 */
export function EmbedAccountSwitchLink({
  disabled,
  onConfirmSwitch,
}: EmbedAccountSwitchLinkProps) {
  const [confirming, setConfirming] = useState(false)

  if (!confirming) {
    return (
      <button
        type="button"
        className="embed-text-link"
        disabled={disabled}
        onClick={() => setConfirming(true)}
      >
        다른 계정으로 로그인
      </button>
    )
  }

  return (
    <VStack gap="x2" width="full" className="embed-account-switch">
      <Text textStyle="t3Regular" color="fg.neutralMuted" align="center">
        지금 계정에서 로그아웃하고 다른 계정으로 로그인할까요?
      </Text>
      <div className="embed-account-switch__actions">
        <ActionButton
          type="button"
          size="medium"
          variant="neutralOutline"
          disabled={disabled}
          onClick={() => setConfirming(false)}
        >
          취소
        </ActionButton>
        <ActionButton
          type="button"
          size="medium"
          variant="brandSolid"
          disabled={disabled}
          onClick={() => {
            setConfirming(false)
            onConfirmSwitch()
          }}
        >
          전환
        </ActionButton>
      </div>
    </VStack>
  )
}
