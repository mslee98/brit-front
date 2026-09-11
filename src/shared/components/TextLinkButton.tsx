import { Text } from '@seed-design/react'
import type { MouseEvent, ReactNode } from 'react'

type TextLinkTone = 'brand' | 'neutral'

interface TextLinkButtonProps {
  children: ReactNode
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  /** default: brand. skip/거절 등 2순위 액션은 neutral */
  tone?: TextLinkTone
}

export function TextLinkButton({
  children,
  onClick,
  disabled,
  tone = 'brand',
}: TextLinkButtonProps) {
  const color = disabled
    ? 'fg.neutralSubtle'
    : tone === 'neutral'
      ? 'fg.neutralMuted'
      : 'fg.brand'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="text-link-button"
    >
      <Text textStyle="t4Medium" color={color}>
        {children}
      </Text>
    </button>
  )
}
