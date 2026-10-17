import {
  IconArrowDownLine,
  IconArrowUpLine,
  IconArrowUpRightLine,
  IconBuilding2Line,
} from '@karrotmarket/react-monochrome-icon'
import { Icon } from '@seed-design/react'

import { coinDirection } from '../utils/coinFlow'
import type { HistoryKind } from '../types'

interface TransactionKindIconProps {
  kind: HistoryKind
}

export function TransactionKindIcon({ kind }: TransactionKindIconProps) {
  const inflow = coinDirection(kind) === 'IN'
  const merchant = kind === 'MERCHANT_CHARGE' || kind === 'MERCHANT_REDEEM'
  const MainIcon = merchant
    ? IconBuilding2Line
    : kind === 'USER_PURCHASE'
      ? IconArrowDownLine
      : IconArrowUpLine
  const BadgeIcon = kind === 'MERCHANT_CHARGE' ? IconArrowUpRightLine : IconArrowDownLine

  return (
    <span
      className="tx-kind-icon"
      style={{
        background: inflow
          ? 'var(--seed-color-bg-brand-weak)'
          : 'var(--seed-color-bg-neutral-weak)',
      }}
    >
      <Icon svg={<MainIcon />} size="x5" color={inflow ? 'fg.brand' : 'fg.neutral'} />
      {merchant ? (
        <span className="tx-kind-icon__badge">
          <Icon svg={<BadgeIcon />} size="x3" color={inflow ? 'fg.brand' : 'fg.neutral'} />
        </span>
      ) : null}
    </span>
  )
}
