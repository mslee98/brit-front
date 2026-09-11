/**
 * WaitingStateLayout — 거래 대기 상태 공통 레이아웃 (A/B 1차).
 * 카피·모션·취소·상대 블록만 variant별로 주입한다.
 */
import type { ReactNode } from 'react'
import { Text, VStack } from '@seed-design/react'

import { TextLinkButton } from '../../../shared/components/TextLinkButton'

export type WaitingCountdownTone = 'informative' | 'warning'

export interface WaitingStateLayoutProps {
  illustration: ReactNode
  title: string
  descriptionLines: readonly string[]
  countdownLabel?: string | null
  countdownTone?: WaitingCountdownTone
  timeoutCaption?: string | null
  /** UserSummary 등 */
  counterparty?: ReactNode
  /** 예: `300,000 Coin · 300,000원` */
  amountLine?: string | null
  footerExtra?: ReactNode
  cancelLabel?: string
  cancelDisabled?: boolean
  onCancel?: () => void
}

const HERO_MAX_WIDTH = 300

export function WaitingStateLayout({
  illustration,
  title,
  descriptionLines,
  countdownLabel,
  countdownTone = 'informative',
  timeoutCaption,
  counterparty,
  amountLine,
  footerExtra,
  cancelLabel,
  cancelDisabled,
  onCancel,
}: WaitingStateLayoutProps) {
  const countdownColor =
    countdownTone === 'warning' ? 'fg.warning' : 'fg.informative'

  return (
    <VStack
      flexGrow
      minHeight="full"
      px="spacingX.globalGutter"
      pt="spacingY.navToTitle"
      pb="spacingY.screenBottom"
      width="full"
      gap="x0"
    >
      <VStack flexGrow width="full" align="center" justify="center" gap="x5" py="x4">
        {illustration}

        <VStack gap="x2" width="full" align="center" style={{ maxWidth: HERO_MAX_WIDTH }}>
          <Text textStyle="t7Bold" color="fg.neutral" style={{ textAlign: 'center' }}>
            {title}
          </Text>
          <VStack gap="x0_5" width="full" align="center">
            {descriptionLines.map((line) => (
              <Text
                key={line}
                textStyle="t4Regular"
                color="fg.neutralMuted"
                style={{ textAlign: 'center' }}
              >
                {line}
              </Text>
            ))}
          </VStack>
        </VStack>

        {countdownLabel ? (
          <VStack gap="x1" width="full" align="center">
            <Text textStyle="t5Bold" color={countdownColor} className="tabular-nums">
              {countdownLabel}
            </Text>
            {timeoutCaption ? (
              <Text
                textStyle="t3Regular"
                color="fg.neutralSubtle"
                style={{ textAlign: 'center', whiteSpace: 'pre-line' }}
              >
                {timeoutCaption}
              </Text>
            ) : null}
          </VStack>
        ) : null}

        {counterparty ? (
          <VStack width="full" align="stretch">
            {counterparty}
          </VStack>
        ) : null}

        {amountLine ? (
          <Text
            textStyle="t4Medium"
            color="fg.neutralMuted"
            className="tabular-nums"
            style={{ textAlign: 'center' }}
          >
            {amountLine}
          </Text>
        ) : null}
      </VStack>

      {footerExtra}

      {cancelLabel && onCancel ? (
        <VStack width="full" align="center" pt="x2" pb="x1">
          <TextLinkButton tone="neutral" disabled={cancelDisabled} onClick={onCancel}>
            {cancelLabel}
          </TextLinkButton>
        </VStack>
      ) : null}
    </VStack>
  )
}
