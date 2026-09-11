/**
 * BankAccountSection — 입금 계좌 블록. 거래 입금 지시·확정 시트에서 재사용.
 */
import { Box, HStack, PrefixIcon, Text, VStack } from '@seed-design/react'
import { ActionButton } from 'seed-design/ui/action-button'
import { IconSquare2StackedLine } from '@karrotmarket/react-monochrome-icon'

import { BankIcon } from '../../../shared/ui/BankIcon'
import { formatAccountNumberDisplay } from '../utils/formatAccountNumber'

interface BankAccountSectionProps {
  bankName: string
  accountNumber: string
  accountHolder: string
  iconUrl?: string | null
  onCopyAccount?: () => void
}

export function BankAccountSection({
  bankName,
  accountNumber,
  accountHolder,
  iconUrl,
  onCopyAccount,
}: BankAccountSectionProps) {
  const accountDisplay = formatAccountNumberDisplay(accountNumber)

  return (
    <VStack gap="x3" width="full" align="stretch">
      <Text textStyle="t4Medium" color="fg.neutralMuted">
        입금 계좌
      </Text>
      <HStack justify="space-between" align="center" width="full" gap="x3">
        <HStack gap="x2" align="center" minWidth="0">
          <BankIcon bankName={bankName} iconUrl={iconUrl} size={42} />
          <VStack gap="x0" align="flex-start" minWidth="0">
            <Text textStyle="t4Medium" color="fg.neutral">
              {bankName}
            </Text>
            <Text textStyle="t3Regular" color="fg.neutralMuted">
              예금주 {accountHolder}
            </Text>
          </VStack>
        </HStack>
        {onCopyAccount && (
          <Box flexShrink={0}>
            <ActionButton size="xsmall" variant="neutralWeak" onClick={onCopyAccount}>
              <PrefixIcon svg={<IconSquare2StackedLine />} />
              계좌번호 복사
            </ActionButton>
          </Box>
        )}
      </HStack>
      <Text textStyle="t7Bold" color="fg.neutral" className="tabular-nums">
        {accountDisplay}
      </Text>
    </VStack>
  )
}
