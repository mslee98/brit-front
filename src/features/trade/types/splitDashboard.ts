import type { TradeSide } from '../types'

/** fixture `docs/fixtures/trades/split-group-*.json` uiPhase */
export type SplitLegUiPhase =
  | 'done'
  | 'matching'
  | 'payment_pending'
  | 'payment_confirm'
  | 'disputed'

/** fixture primaryAction — leg 카드 CTA */
export type SplitLegPrimaryAction =
  | 'NONE'
  | 'VIEW_MATCHING'
  | 'REPORT_PAYMENT'
  | 'CONFIRM_PAYMENT'
  | 'VIEW_DETAIL'
  | 'OPEN_DISPUTE'
  | 'OPEN_CHAT'

/** store SplitLeg와 분리된 대시보드 전용 view model */
export interface SplitLegViewModel {
  index: number
  tradeId: string | null
  amountKrw: number
  uiPhase: SplitLegUiPhase
  primaryAction: SplitLegPrimaryAction
  counterpartyNickname: string | null
  statusLine: string
}

export interface SplitDashboardViewModel {
  id: string
  side: TradeSide
  totalAmountKrw: number
  completedKrw: number
  progressPercent: number
  unitAmountKrw: number
  totalLegs: number
  completedLegs: number
  legs: SplitLegViewModel[]
  createdAt: string
}
