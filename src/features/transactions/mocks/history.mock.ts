import type { TransactionDetail, TransactionKind, TransactionStatus } from '../types'

type Seed = [
  kind: TransactionKind,
  status: TransactionStatus,
  coinAmount: number,
  occurredAt: string,
  who: string,
]

/** VITE_USE_MOCK 전용. who = 상대 닉네임 또는 포인트 이름 */
const SEEDS: Seed[] = [
  ['P2P_BUY', 'COMPLETED', 600_000, '2026-09-03T11:20:00+09:00', '김**'],
  ['P2P_SELL', 'COMPLETED', 500_000, '2026-09-08T16:05:00+09:00', '박**'],
  ['PARTNER_CHARGE', 'COMPLETED', 400_000, '2026-09-12T13:40:00+09:00', 'ABC 포인트'],
  ['PARTNER_REDEEM', 'COMPLETED', 350_000, '2026-09-18T09:15:00+09:00', 'XYZ 포인트'],
  ['P2P_BUY', 'CANCELLED', 80_000, '2026-09-25T10:11:00+09:00', '최**'],
  ['PARTNER_REDEEM', 'FAILED', 40_000, '2026-10-01T08:40:00+09:00', '브릿샵 포인트'],
  ['P2P_BUY', 'COMPLETED', 200_000, '2026-10-02T14:12:00+09:00', '김**'],
  ['P2P_SELL', 'COMPLETED', 50_000, '2026-10-03T11:05:00+09:00', '박**'],
  ['P2P_SELL', 'CANCELLED', 70_000, '2026-10-04T18:22:00+09:00', '이**'],
  ['BRIT_PURCHASE', 'COMPLETED', 300_000, '2026-10-05T10:00:00+09:00', ''],
  ['PARTNER_CHARGE', 'CHECKING', 60_000, '2026-10-09T17:06:00+09:00', 'ABC 포인트'],
  ['P2P_SELL', 'COMPLETED', 300_000, '2026-10-12T11:16:00+09:00', '최**'],
  ['P2P_BUY', 'COMPLETED', 100_000, '2026-10-12T19:48:00+09:00', '이**'],
  ['ADMIN_ADJUSTMENT', 'COMPLETED', 10_000, '2026-10-13T09:00:00+09:00', ''],
  ['P2P_BUY', 'PROCESSING', 90_000, '2026-10-14T21:14:00+09:00', '김**'],
  ['PARTNER_REDEEM', 'COMPLETED', 120_000, '2026-10-15T15:02:00+09:00', 'ABC 포인트'],
]

const IN_KINDS: TransactionKind[] = ['P2P_BUY', 'BRIT_PURCHASE', 'PARTNER_REDEEM', 'ADMIN_ADJUSTMENT']

function toDetail([kind, status, coinAmount, occurredAt, who]: Seed, index: number): TransactionDetail {
  const p2p = kind === 'P2P_BUY' || kind === 'P2P_SELL'
  const partner = kind === 'PARTNER_CHARGE' || kind === 'PARTNER_REDEEM'
  const id = `${p2p ? 'trade' : partner ? 'exchange' : kind === 'BRIT_PURCHASE' ? 'purchase' : 'adjust'}-00000000-0000-0000-0000-${String(index).padStart(12, '0')}`
  const iso = new Date(occurredAt).toISOString()
  const requestedAt = new Date(new Date(occurredAt).getTime() - 5 * 60_000).toISOString()
  const completedAt = status === 'COMPLETED' ? iso : null

  return {
    id,
    kind,
    direction: IN_KINDS.includes(kind) ? 'IN' : 'OUT',
    status,
    coinAmount,
    cashAmount: p2p ? coinAmount : null,
    pointAmount: partner ? coinAmount : null,
    occurredAt: iso,
    requestedAt,
    completedAt,
    referenceNumber: p2p ? `TO-${occurredAt.slice(0, 10).replaceAll('-', '')}-${String(index).padStart(6, '0')}` : null,
    tradeId: p2p ? id.slice('trade-'.length) : null,
    counterpartyNickname: p2p ? who : null,
    partnerName: partner ? who.replace(' 포인트', '') : null,
    assetName: partner ? who : null,
    bankName: p2p ? '국민은행' : null,
    accountNumberMasked: p2p ? '1234-**-****5' : null,
    exchangeRate: partner ? { numerator: 1, denominator: 1 } : null,
    timeline: [
      { step: 'REQUESTED', at: requestedAt },
      ...(completedAt ? [{ step: 'COMPLETED' as const, at: completedAt }] : []),
      ...(status === 'CANCELLED' ? [{ step: 'CANCELLED' as const, at: iso }] : []),
      ...(status === 'FAILED' ? [{ step: 'FAILED' as const, at: iso }] : []),
    ],
  }
}

export const MOCK_TRANSACTIONS: TransactionDetail[] = SEEDS.map(toDetail).sort((a, b) =>
  b.occurredAt.localeCompare(a.occurredAt),
)
