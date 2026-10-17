import { Text, VStack } from '@seed-design/react'
import { List, ListButtonItem } from 'seed-design/ui/list'

import type { HistoryTransaction } from '../types'
import { historyKindLabel, historyListSubtitle } from '../utils/historyCopy'
import { coinDirection, formatSignedCoin } from '../utils/coinFlow'
import { TransactionKindIcon } from './TransactionKindIcon'

interface TransactionListProps {
  heading: string
  items: HistoryTransaction[]
  emptyMessage: string
  onItemClick: (item: HistoryTransaction) => void
}

function amountColor(item: HistoryTransaction): 'fg.brand' | 'fg.neutral' | 'fg.neutralSubtle' {
  if (item.status !== 'COMPLETED') return 'fg.neutralSubtle'
  return coinDirection(item.kind) === 'IN' ? 'fg.brand' : 'fg.neutral'
}

export function TransactionList({
  heading,
  items,
  emptyMessage,
  onItemClick,
}: TransactionListProps) {
  return (
    <VStack pt="x4" pb="x2" gap="x2">
      <VStack px="spacingX.globalGutter">
        <Text textStyle="t5Bold" color="fg.neutral">
          {heading}
        </Text>
      </VStack>
      {items.length === 0 ? (
        <VStack align="center" justify="center" px="spacingX.globalGutter" py="x8">
          <Text textStyle="t5Regular" color="fg.neutralMuted">
            {emptyMessage}
          </Text>
        </VStack>
      ) : (
        <List>
          {items.map((item) => {
            const subtitle = historyListSubtitle(item)
            return (
              <ListButtonItem
                key={item.id}
                alignItems="center"
                title={historyKindLabel(item)}
                prefix={<TransactionKindIcon kind={item.kind} />}
                detail={
                  <Text
                    textStyle="t4Regular"
                    color={subtitle.emphasize ? 'fg.warning' : 'fg.neutralSubtle'}
                  >
                    {subtitle.text}
                  </Text>
                }
                suffix={
                  <Text
                    textStyle="t5Bold"
                    color={amountColor(item)}
                    className="tabular-nums"
                  >
                    {formatSignedCoin(item.kind, item.coinAmount)}
                  </Text>
                }
                onClick={() => onItemClick(item)}
              />
            )
          })}
        </List>
      )}
    </VStack>
  )
}
