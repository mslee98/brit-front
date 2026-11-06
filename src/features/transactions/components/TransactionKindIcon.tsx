import {
  IconArrowDownLine,
  IconArrowUpLine,
  IconArrowUpRightLine,
  IconBuilding2Line,
} from '@karrotmarket/react-monochrome-icon'
import { Icon } from '@seed-design/react'

import { kindDirection } from '../utils/coinFlow'
import type { TransactionKind } from '../types'

interface TransactionKindIconProps {
  kind: TransactionKind
}

/** Coin이 들어오면 브랜드 톤. 업체 전환·Brit·조정은 건물 아이콘에 방향 배지를 붙인다. */
export function TransactionKindIcon({ kind }: TransactionKindIconProps) {
  const inflow = kindDirection(kind) === 'IN'
  const p2p = kind === 'P2P_BUY' || kind === 'P2P_SELL'
  const MainIcon = !p2p ? IconBuilding2Line : inflow ? IconArrowDownLine : IconArrowUpLine
  const BadgeIcon = inflow ? IconArrowDownLine : IconArrowUpRightLine
  const color = inflow ? 'fg.brand' : 'fg.neutral'

  return (
    <span
      className="tx-kind-icon"
      style={{
        background: inflow ? 'var(--seed-color-bg-brand-weak)' : 'var(--seed-color-bg-neutral-weak)',
      }}
    >
      <Icon svg={<MainIcon />} size="x5" color={color} />
      {p2p ? null : (
        <span className="tx-kind-icon__badge">
          <Icon svg={<BadgeIcon />} size="x3" color={color} />
        </span>
      )}
    </span>
  )
}
