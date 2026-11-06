import { Text, VStack } from '@seed-design/react'
import { ActionButton } from 'seed-design/ui/action-button'
import { List, ListButtonItem } from 'seed-design/ui/list'

import { formatAmount } from '../../../shared/utils/formatAmount'
import { BottomActionButton } from '../../../shared/ui/BottomActionButton'
import type { TransactionItem } from '../types'
import { formatSignedCoin } from '../utils/coinFlow'
import {
  transactionStatusTone,
  transactionSubtitle,
  transactionTitle,
  type TransactionDateGroup,
} from '../utils/historyCopy'
import { TransactionKindIcon } from './TransactionKindIcon'

const TONE_COLOR = {
  neutral: 'fg.neutralSubtle',
  warning: 'fg.warning',
  critical: 'fg.critical',
} as const

function TransactionRow({
  item,
  onClick,
}: {
  item: TransactionItem
  onClick: (item: TransactionItem) => void
}) {
  const settled = item.status === 'COMPLETED'
  const voided = item.status === 'CANCELLED' || item.status === 'FAILED'
  const amountColor = !settled ? 'fg.neutralSubtle' : item.direction === 'IN' ? 'fg.brand' : 'fg.neutral'

  return (
    <ListButtonItem
      alignItems="center"
      title={transactionTitle(item)}
      prefix={<TransactionKindIcon kind={item.kind} />}
      detail={
        <Text textStyle="t4Regular" color={TONE_COLOR[transactionStatusTone(item.status)]}>
          {transactionSubtitle(item)}
        </Text>
      }
      suffix={
        <VStack align="flex-end" gap="x0_5">
          <Text
            textStyle="t5Bold"
            color={amountColor}
            className={voided ? 'tabular-nums tx-amount--void' : 'tabular-nums'}
          >
            {formatSignedCoin(item.direction, item.coinAmount)}
          </Text>
          {item.cashAmount != null ? (
            <Text textStyle="t3Regular" color="fg.neutralSubtle" className="tabular-nums">
              {formatAmount(item.cashAmount)}
            </Text>
          ) : null}
        </VStack>
      }
      onClick={() => onClick(item)}
    />
  )
}

/** 처리 중·확인 중. 누르면 거래 화면으로 간다. */
export function OpenTransactionSection({
  items,
  onItemClick,
}: {
  items: TransactionItem[]
  onItemClick: (item: TransactionItem) => void
}) {
  if (items.length === 0) return null
  return (
    <section aria-label="진행 중인 거래">
      <VStack px="spacingX.globalGutter" pt="x4" pb="x1">
        <Text textStyle="t5Bold" color="fg.neutral">
          진행 중 {items.length}건
        </Text>
      </VStack>
      <List>
        {items.map((item) => (
          <TransactionRow key={item.id} item={item} onClick={onItemClick} />
        ))}
      </List>
    </section>
  )
}

interface TransactionListProps {
  groups: TransactionDateGroup[]
  showDateLabels?: boolean
  state: 'loading' | 'ready' | 'error'
  emptyMessage: string
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
  onRetry: () => void
  onItemClick: (item: TransactionItem) => void
}

export function TransactionList({
  groups,
  showDateLabels = true,
  state,
  emptyMessage,
  hasMore,
  loadingMore,
  onLoadMore,
  onRetry,
  onItemClick,
}: TransactionListProps) {
  if (state === 'loading') {
    return (
      <VStack px="spacingX.globalGutter" py="x6">
        <Text textStyle="t4Regular" color="fg.neutralSubtle">
          불러오는 중…
        </Text>
      </VStack>
    )
  }

  if (state === 'error') {
    return (
      <VStack align="center" gap="x3" px="spacingX.globalGutter" py="x10">
        <Text textStyle="t5Regular" color="fg.neutralMuted">
          거래내역을 불러오지 못했어요
        </Text>
        <ActionButton size="small" variant="neutralWeak" onClick={onRetry}>
          다시 시도
        </ActionButton>
      </VStack>
    )
  }

  if (groups.length === 0) {
    return (
      <VStack align="center" justify="center" px="spacingX.globalGutter" py="x8">
        <Text textStyle="t5Regular" color="fg.neutralMuted">
          {emptyMessage}
        </Text>
      </VStack>
    )
  }

  return (
    <VStack pb="x2">
      {groups.map((group) => (
        <section key={group.dateKey} aria-label={group.label}>
          {showDateLabels ? (
            <VStack px="spacingX.globalGutter" pt="x4" pb="x1">
              <Text textStyle="t3Bold" color="fg.neutralSubtle">
                {group.label}
              </Text>
            </VStack>
          ) : null}
          <List>
            {group.items.map((item) => (
              <TransactionRow key={item.id} item={item} onClick={onItemClick} />
            ))}
          </List>
        </section>
      ))}
      {hasMore ? (
        <VStack px="spacingX.globalGutter" pt="x4">
          <BottomActionButton
            size="medium"
            variant="neutralWeak"
            loading={loadingMore}
            onClick={onLoadMore}
          >
            더 보기
          </BottomActionButton>
        </VStack>
      ) : null}
    </VStack>
  )
}
