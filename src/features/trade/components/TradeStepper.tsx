/**
 * TradeStepper — TDS식 세로 거래 진행 Stepper.
 * 대기/행동 상태를 같은 구조로 표현. right slot은 확인 CTA 등 확장용.
 */
import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { IconCheckmarkFill } from '@karrotmarket/react-monochrome-icon'
import { Box, HStack, Icon, Text, VStack } from '@seed-design/react'

export type TradeStepStatus = 'completed' | 'current' | 'pending' | 'error'

const MARKER_SIZE = 24

export interface TradeStepProps {
  status: TradeStepStatus
  stepNumber: number
  title: string
  description?: string
  meta?: string
  /** 현재 단계 액션 등 — 입금 대기에서는 미사용 */
  right?: ReactNode
  /** TradeStepper가 children에 주입 */
  isLast?: boolean
}

function StepMarker({ status, stepNumber }: { status: TradeStepStatus; stepNumber: number }) {
  if (status === 'completed') {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="full"
        bg="bg.brandSolid"
        flexShrink={0}
        style={{ width: MARKER_SIZE, height: MARKER_SIZE }}
        aria-hidden
      >
        <Icon svg={<IconCheckmarkFill />} size="x3" color="fg.onColor" />
      </Box>
    )
  }

  if (status === 'current') {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="full"
        bg="bg.brandSolid"
        flexShrink={0}
        style={{ width: MARKER_SIZE, height: MARKER_SIZE }}
        aria-hidden
      >
        <Text textStyle="t3Bold" color="fg.onColor">
          {stepNumber}
        </Text>
      </Box>
    )
  }

  if (status === 'error') {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="full"
        bg="bg.criticalSolid"
        flexShrink={0}
        style={{ width: MARKER_SIZE, height: MARKER_SIZE }}
        aria-hidden
      >
        <Text textStyle="t3Bold" color="fg.onColor">
          {stepNumber}
        </Text>
      </Box>
    )
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      borderRadius="full"
      borderWidth="1"
      borderColor="stroke.neutralMuted"
      bg="bg.layerDefault"
      flexShrink={0}
      style={{ width: MARKER_SIZE, height: MARKER_SIZE }}
      aria-hidden
    >
      <Text textStyle="t3Medium" color="fg.neutralMuted">
        {stepNumber}
      </Text>
    </Box>
  )
}

export function TradeStep({
  status,
  stepNumber,
  title,
  description,
  meta,
  right,
  isLast = false,
}: TradeStepProps) {
  const isCurrent = status === 'current'
  const titleStyle = isCurrent ? 't5Bold' : 't4Medium'
  const titleColor =
    status === 'pending' ? 'fg.neutralMuted' : status === 'error' ? 'fg.critical' : 'fg.neutral'
  const descriptionStyle = isCurrent ? 't4Regular' : 't3Regular'
  const lineColor = status === 'completed' || status === 'current' ? 'bg.brandSolid' : 'stroke.neutralWeak'

  return (
    <HStack align="stretch" gap="x3" width="full">
      <VStack align="center" flexShrink={0} style={{ width: MARKER_SIZE }}>
        <StepMarker status={status} stepNumber={stepNumber} />
        {!isLast && (
          <Box
            flexGrow
            width="2px"
            bg={lineColor}
            style={{ minHeight: 16, marginTop: 4 }}
            aria-hidden
          />
        )}
      </VStack>

      <HStack align="flex-start" justify="space-between" gap="x3" flexGrow minWidth="0" pb={isLast ? 'x0' : 'x5'}>
        <VStack gap="x1" align="flex-start" flexGrow minWidth="0">
          <Text textStyle={titleStyle} color={titleColor}>
            {title}
          </Text>
          {description && (
            <Text
              textStyle={descriptionStyle}
              color="fg.neutralMuted"
              style={{ whiteSpace: 'pre-line' }}
            >
              {description}
            </Text>
          )}
          {meta && (
            <Text textStyle="t4Medium" color="fg.brand" className="tabular-nums">
              {meta}
            </Text>
          )}
        </VStack>
        {right ? <Box flexShrink={0}>{right}</Box> : null}
      </HStack>
    </HStack>
  )
}

interface TradeStepperProps {
  /** 기본: 거래 진행 */
  title?: string
  children: ReactNode
}

export function TradeStepper({ title = '거래 진행', children }: TradeStepperProps) {
  const items = Children.toArray(children).filter(isValidElement) as ReactElement<TradeStepProps>[]

  return (
    <VStack gap="x3" width="full" aria-label={title}>
      <Text textStyle="t5Bold" color="fg.neutral">
        {title}
      </Text>
      <VStack gap="x0" width="full">
        {items.map((child, index) =>
          cloneElement(child, {
            key: child.key ?? index,
            isLast: index === items.length - 1,
          }),
        )}
      </VStack>
    </VStack>
  )
}
