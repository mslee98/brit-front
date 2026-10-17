import { Text, VStack } from '@seed-design/react'

import { formatAmount } from '../../../shared/utils/formatAmount'
import { historyKindLabel, historyStatusLabel } from '../utils/historyCopy'
import {
  coinDirection,
  formatOccurredAt,
  formatPointAmount,
  formatSignedCoin,
} from '../utils/coinFlow'
import type { HistoryTransaction } from '../types'

interface TransactionDetailScreenProps {
  item: HistoryTransaction | null
  onInquiry: () => void
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <VStack gap="x1">
      <Text textStyle="t3Regular" color="fg.neutralSubtle">
        {label}
      </Text>
      <Text textStyle="t5Regular" color="fg.neutral">
        {value}
      </Text>
    </VStack>
  )
}

export function TransactionDetailScreen({ item, onInquiry }: TransactionDetailScreenProps) {
  if (!item) {
    return (
      <VStack flexGrow align="center" justify="center" px="spacingX.globalGutter" py="x10">
        <Text textStyle="t5Bold" color="fg.neutral">
          거래를 찾을 수 없어요
        </Text>
      </VStack>
    )
  }

  const settled = item.status === 'COMPLETED'
  const inflow = coinDirection(item.kind) === 'IN'
  const amountColor = !settled ? 'fg.neutralSubtle' : inflow ? 'fg.brand' : 'fg.neutral'
  const merchant = item.kind === 'MERCHANT_CHARGE' || item.kind === 'MERCHANT_REDEEM'
  const cashLabel = item.kind === 'USER_SALE' ? '받은 금액' : '지출한 금액'

  return (
    <VStack px="spacingX.globalGutter" pt="x6" pb="x8" gap="x6">
      <VStack gap="x1">
        <Text textStyle="t4Regular" color="fg.neutralSubtle">
          {historyKindLabel(item)}
        </Text>
        <Text textStyle="t9Bold" color={amountColor} className="tabular-nums">
          {formatSignedCoin(item.kind, item.coinAmount)}
        </Text>
        <Text
          textStyle="t4Medium"
          color={
            item.status === 'FAILED'
              ? 'fg.critical'
              : item.status === 'PROCESSING' || item.status === 'CHECKING'
                ? 'fg.warning'
                : 'fg.neutralMuted'
          }
        >
          {historyStatusLabel(item.status, item.kind)}
        </Text>
        <Text textStyle="t4Regular" color="fg.neutralSubtle">
          {formatOccurredAt(item.occurredAt)}
        </Text>
      </VStack>

      <div className="tx-separator" />

      <VStack gap="x4">
        {merchant && item.pointName ? <DetailRow label="포인트" value={item.pointName} /> : null}
        {merchant && item.pointAmount != null ? (
          <DetailRow label="포인트 수량" value={formatPointAmount(item.pointAmount)} />
        ) : null}
        {merchant ? <DetailRow label="전환 비율" value="1 Coin = 1 Point" /> : null}
        {!merchant && item.cashAmount != null ? (
          <DetailRow label={cashLabel} value={formatAmount(item.cashAmount)} />
        ) : null}
        {!merchant && item.counterpartyName ? (
          <DetailRow label="거래 상대" value={item.counterpartyName} />
        ) : null}
        {item.kind === 'USER_SALE' && item.bankName ? (
          <DetailRow
            label="입금 계좌"
            value={`${item.bankName} ${item.accountMask ?? ''}`.trim()}
          />
        ) : null}
        <DetailRow label="거래번호" value={item.tradeNumber} />
      </VStack>

      <button type="button" className="tx-period-row" onClick={onInquiry}>
        <Text textStyle="t5Medium" color="fg.neutral">
          문의하기
        </Text>
      </button>
    </VStack>
  )
}
