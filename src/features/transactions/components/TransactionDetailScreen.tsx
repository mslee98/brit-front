import type { ReactNode } from 'react'
import { HStack, Text, VStack } from '@seed-design/react'
import { ActionButton } from 'seed-design/ui/action-button'

import { formatAmount } from '../../../shared/utils/formatAmount'
import { TRANSACTION_KIND_LABEL } from '../constants'
import type { TransactionDetail } from '../types'
import { formatOccurredAt, formatPointAmount, formatSignedCoin } from '../utils/coinFlow'
import {
  TIMELINE_STEP_LABEL,
  transactionStatusLabel,
  transactionStatusTone,
  transactionTitle,
} from '../utils/historyCopy'

const TONE_COLOR = {
  neutral: 'fg.neutralMuted',
  warning: 'fg.warning',
  critical: 'fg.critical',
} as const

interface TransactionDetailScreenProps {
  state: { status: 'loading' } | { status: 'error' } | { status: 'ready'; item: TransactionDetail }
  canOpenTrade: boolean
  onOpenTrade: () => void
  onInquiry: () => void
  onRetry: () => void
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <HStack justify="space-between" align="flex-start" gap="x4">
      <Text textStyle="t4Regular" color="fg.neutralSubtle">
        {label}
      </Text>
      <Text textStyle="t4Medium" color="fg.neutral" align="right" className="tabular-nums">
        {value}
      </Text>
    </HStack>
  )
}

function CenterMessage({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <VStack flexGrow align="center" justify="center" gap="x3" px="spacingX.globalGutter" py="x10">
      <Text textStyle="t5Bold" color="fg.neutral">
        {title}
      </Text>
      {action}
    </VStack>
  )
}

export function TransactionDetailScreen({
  state,
  canOpenTrade,
  onOpenTrade,
  onInquiry,
  onRetry,
}: TransactionDetailScreenProps) {
  if (state.status === 'loading') return <CenterMessage title="불러오는 중…" />
  if (state.status === 'error') {
    return (
      <CenterMessage
        title="거래를 찾을 수 없어요"
        action={
          <ActionButton size="small" variant="neutralWeak" onClick={onRetry}>
            다시 시도
          </ActionButton>
        }
      />
    )
  }

  const { item } = state
  const settled = item.status === 'COMPLETED'
  const amountColor = !settled ? 'fg.neutralSubtle' : item.direction === 'IN' ? 'fg.brand' : 'fg.neutral'
  const p2p = item.kind === 'P2P_BUY' || item.kind === 'P2P_SELL'
  const partner = item.kind === 'PARTNER_CHARGE' || item.kind === 'PARTNER_REDEEM'
  const cashLabel = item.kind === 'P2P_SELL' ? '받은 금액' : '보낸 금액'

  return (
    <VStack px="spacingX.globalGutter" pt="x6" pb="x8" gap="x6">
      <VStack gap="x1">
        <Text textStyle="t4Regular" color="fg.neutralSubtle">
          {transactionTitle(item)}
        </Text>
        <Text textStyle="t9Bold" color={amountColor} className="tabular-nums">
          {formatSignedCoin(item.direction, item.coinAmount)}
        </Text>
        <Text textStyle="t4Medium" color={TONE_COLOR[transactionStatusTone(item.status)]}>
          {transactionStatusLabel(item.status)}
        </Text>
      </VStack>

      <div className="tx-separator" />

      <VStack gap="x4">
        <DetailRow label="종류" value={TRANSACTION_KIND_LABEL[item.kind]} />
        {p2p && item.counterpartyNickname ? (
          <DetailRow label="거래 상대" value={item.counterpartyNickname} />
        ) : null}
        {p2p && item.cashAmount != null ? (
          <DetailRow label={cashLabel} value={formatAmount(item.cashAmount)} />
        ) : null}
        {p2p && item.bankName ? (
          <DetailRow
            label="입금 계좌"
            value={`${item.bankName} ${item.accountNumberMasked ?? ''}`.trim()}
          />
        ) : null}
        {partner && item.assetName ? <DetailRow label="포인트" value={item.assetName} /> : null}
        {partner && item.pointAmount != null ? (
          <DetailRow label="포인트 수량" value={formatPointAmount(item.pointAmount)} />
        ) : null}
        {partner && item.exchangeRate ? (
          <DetailRow
            label="전환 비율"
            value={`${item.exchangeRate.numerator} Coin = ${item.exchangeRate.denominator} Point`}
          />
        ) : null}
        {item.referenceNumber ? <DetailRow label="거래번호" value={item.referenceNumber} /> : null}
      </VStack>

      {item.timeline.length > 0 ? (
        <VStack gap="x3">
          <Text textStyle="t4Bold" color="fg.neutral">
            진행 기록
          </Text>
          <ol className="tx-timeline">
            {item.timeline.map((step) => (
              <li key={step.step} className="tx-timeline__item">
                <span className="tx-timeline__dot" aria-hidden />
                <HStack justify="space-between" flexGrow>
                  <Text textStyle="t4Regular" color="fg.neutral">
                    {TIMELINE_STEP_LABEL[step.step]}
                  </Text>
                  <Text textStyle="t4Regular" color="fg.neutralSubtle" className="tabular-nums">
                    {formatOccurredAt(step.at)}
                  </Text>
                </HStack>
              </li>
            ))}
          </ol>
        </VStack>
      ) : null}

      {canOpenTrade ? (
        <ActionButton size="large" variant="brandSolid" onClick={onOpenTrade}>
          거래 화면으로 이동
        </ActionButton>
      ) : (
        <button type="button" className="tx-period-row" onClick={onInquiry}>
          <Text textStyle="t5Medium" color="fg.neutral">
            문의하기
          </Text>
        </button>
      )}
    </VStack>
  )
}
