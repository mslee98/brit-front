import type { TradeRecord } from '../types'
import type {
  SplitDashboardViewModel,
  SplitLegPrimaryAction,
  SplitLegUiPhase,
  SplitLegViewModel,
} from '../types/splitDashboard'
import type { SplitGroup } from '../types'

function resolveLegUiPhase(trade: TradeRecord | undefined): SplitLegUiPhase {
  if (!trade) return 'matching'
  if (trade.status === 'COMPLETED') return 'done'
  if (trade.status === 'DISPUTED') return 'disputed'
  if (trade.status === 'MATCHING') return 'matching'
  if (trade.status === 'PAYMENT_PENDING') return 'payment_pending'
  if (trade.status === 'PAYMENT_REPORTED') return 'payment_confirm'
  return 'matching'
}

function resolvePrimaryAction(
  trade: TradeRecord | undefined,
  uiPhase: SplitLegUiPhase,
): SplitLegPrimaryAction {
  if (uiPhase === 'disputed') return 'OPEN_CHAT'
  if (uiPhase === 'done') return 'VIEW_DETAIL'
  if (uiPhase === 'payment_confirm' && trade?.role === 'SELLER') return 'CONFIRM_PAYMENT'
  if (uiPhase === 'payment_confirm' && trade?.role === 'BUYER') return 'NONE'
  if (uiPhase === 'payment_pending' && trade?.role === 'BUYER') return 'REPORT_PAYMENT'
  if (uiPhase === 'payment_pending' && trade?.role === 'SELLER') return 'NONE'
  if (uiPhase === 'matching' || !trade) return 'VIEW_MATCHING'
  return 'VIEW_MATCHING'
}

function resolveStatusLine(
  trade: TradeRecord | undefined,
  uiPhase: SplitLegUiPhase,
  _side: SplitGroup['side'],
): string {
  if (uiPhase === 'disputed') return '입금 확인이 맞지 않아 검토 중이에요'
  if (uiPhase === 'done') return '입금을 확인했어요'
  if (uiPhase === 'payment_confirm') {
    if (trade?.role === 'BUYER') return '판매자가 입금을 확인하고 있어요'
    return '구매자가 입금했다고 알려왔어요'
  }
  if (uiPhase === 'payment_pending') {
    return trade?.role === 'BUYER' ? '입금해 주세요' : '구매자 입금을 기다리고 있어요'
  }
  if (uiPhase === 'matching') {
    return trade?.role === 'BUYER' ? '판매자를 찾고 있어요' : '구매자를 찾고 있어요'
  }
  return '거래를 이어하고 있어요'
}

function mapLeg(
  leg: SplitGroup['legs'][number],
  trade: TradeRecord | undefined,
  side: SplitGroup['side'],
): SplitLegViewModel {
  const uiPhase = resolveLegUiPhase(trade)
  return {
    index: leg.index,
    tradeId: leg.tradeId,
    amountKrw: leg.amountKrw,
    uiPhase,
    primaryAction: resolvePrimaryAction(trade, uiPhase),
    counterpartyNickname:
      trade && trade.status !== 'MATCHING' ? (trade.role === 'BUYER' ? '판매자' : '구매자') : null,
    statusLine: resolveStatusLine(trade, uiPhase, side),
  }
}

export function mapSplitGroupToDashboard(
  splitGroup: SplitGroup,
  tradesById: ReadonlyMap<string, TradeRecord>,
): SplitDashboardViewModel {
  const completedKrw = splitGroup.legs
    .filter((leg) => leg.status === 'COMPLETED')
    .reduce((sum, leg) => sum + leg.amountKrw, 0)

  const progressPercent =
    splitGroup.totalAmountKrw > 0
      ? Math.round((completedKrw / splitGroup.totalAmountKrw) * 100)
      : 0

  return {
    id: splitGroup.id,
    side: splitGroup.side,
    totalAmountKrw: splitGroup.totalAmountKrw,
    completedKrw,
    progressPercent,
    unitAmountKrw: splitGroup.unitAmountKrw,
    totalLegs: splitGroup.totalLegs,
    completedLegs: splitGroup.completedLegs,
    legs: splitGroup.legs.map((leg) => mapLeg(leg, tradesById.get(leg.tradeId), splitGroup.side)),
    createdAt: splitGroup.createdAt,
  }
}

export function getSplitLegActionLabel(action: SplitLegPrimaryAction): string {
  switch (action) {
    case 'VIEW_MATCHING':
      return '매칭 보기'
    case 'REPORT_PAYMENT':
      return '입금하기'
    case 'CONFIRM_PAYMENT':
      return '돈 받았어요'
    case 'VIEW_DETAIL':
      return '상세보기'
    case 'OPEN_DISPUTE':
      return '입금 문제 신고'
    case 'OPEN_CHAT':
      return '고객센터와 대화하기'
    case 'NONE':
      return ''
    default:
      return '이어하기'
  }
}
