import { IconBellFill } from '@karrotmarket/react-monochrome-icon'
import { Box, HStack, Icon, Text, VStack } from '@seed-design/react'
import { useState } from 'react'
import { Callout } from 'seed-design/ui/callout'

import { TextLinkButton } from '../../../shared/components/TextLinkButton'
import type { PushEligibility } from '../constants/pushNotificationCopy'
import { PUSH_ENABLE_COPY, PUSH_IOS_INSTALL_COPY } from '../constants/pushNotificationCopy'

type PushEnableCopy = {
  title: string
  description: string
  cta: string
  denied: string
}

interface PushEnableCardProps {
  eligibility: PushEligibility
  onRequestPermission: () => Promise<PushEligibility>
  copy?: PushEnableCopy
}

export function PushEnableCard({
  eligibility,
  onRequestPermission,
  copy = PUSH_ENABLE_COPY,
}: PushEnableCardProps) {
  const [loading, setLoading] = useState(false)

  if (eligibility === 'ready' || eligibility === 'unsupported') {
    return null
  }

  if (eligibility === 'ios_install_required') {
    return (
      <Callout
        tone="informative"
        prefixIcon={<IconBellFill />}
        title={PUSH_IOS_INSTALL_COPY.title}
        description={PUSH_IOS_INSTALL_COPY.steps.map((step, index) => `${index + 1}. ${step}`).join(' · ')}
      />
    )
  }

  const handleClick = async () => {
    setLoading(true)
    try {
      await onRequestPermission()
    } finally {
      setLoading(false)
    }
  }

  if (eligibility === 'denied') {
    return (
      <Callout
        tone="warning"
        prefixIcon={<IconBellFill />}
        description={copy.denied}
      />
    )
  }

  return (
    <HStack
      width="full"
      gap="x3"
      align="center"
      p="x3"
      bg="bg.neutralWeak"
      borderRadius="r3"
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        width="x10"
        height="x10"
        borderRadius="full"
        bg="bg.brandWeak"
        flexShrink={0}
      >
        <Icon svg={<IconBellFill />} size="x5" color="fg.brand" />
      </Box>
      <VStack gap="x0_5" align="flex-start" flexGrow minWidth="0">
        <Text textStyle="t5Bold" color="fg.neutral">
          {copy.title}
        </Text>
        <Text textStyle="t3Regular" color="fg.neutralMuted">
          {copy.description}
        </Text>
      </VStack>
      <Box flexShrink={0}>
        <TextLinkButton onClick={handleClick} disabled={loading}>
          {copy.cta}
        </TextLinkButton>
      </Box>
    </HStack>
  )
}
