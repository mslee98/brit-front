import { IconChevronRightLine } from '@karrotmarket/react-monochrome-icon'
import { Badge, Icon } from '@seed-design/react'
import { List, ListButtonItem } from 'seed-design/ui/list'
import { useMemo } from 'react'

import { useLayout } from '../../../app/layouts/LayoutContext'
import { formatAmount } from '../../../shared/utils/formatAmount'
import { usePendingNotifications } from '../../notifications/hooks/useNotifications'
import { actions } from '../../../stackflow/stackflow'
import { useActiveSplitGroup } from '../hooks/useActiveSplitGroup'
import { useActiveTrade } from '../hooks/useActiveTrade'
import { isSplitGroupInProgress, blocksNewTradeCompose } from '../stores/tradeSession.store'
import { getTradeUiPhase } from '../utils/getTradeUiPhase'
import { formatSplitLegSuffix } from '../utils/splitProgressCopy'

export function GlobalActiveTradeBanner() {
  const { pathname } = useLayout()
  const activeTrade = useActiveTrade()
  const splitGroup = useActiveSplitGroup()
  const pendingNotifications = usePendingNotifications()

  const hasActiveSplit = isSplitGroupInProgress()
  const hasActiveSingleTrade =
    activeTrade !== null && blocksNewTradeCompose(activeTrade) && !hasActiveSplit

  const pendingBanner = useMemo(() => {
    if (pendingNotifications.length === 0) return null
    return [...pendingNotifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0]
  }, [pendingNotifications])

  if (pathname === '/' || pathname.startsWith('/trade')) {
    return null
  }

  if (!hasActiveSplit && !hasActiveSingleTrade && !pendingBanner) {
    return null
  }

  const handleNavigateTrade = () => {
    if (pendingBanner?.splitGroupId && splitGroup) {
      actions.push(
        'Trade',
        {
          splitGroupId: pendingBanner.splitGroupId,
          focusLeg: pendingBanner.focusLeg ? String(pendingBanner.focusLeg) : undefined,
        },
        { animate: true },
      )
      return
    }

    if (
      activeTrade?.status === 'MATCHING' &&
      activeTrade.role === 'BUYER' &&
      (!pendingBanner?.tradeId || pendingBanner.tradeId === activeTrade.id)
    ) {
      actions.push(
        'MatchingWaiting',
        {
          buyOrderId: activeTrade.id,
          requestedAmountKrw: activeTrade.amountKrw,
        },
        { animate: true },
      )
      return
    }

    const targetTradeId = pendingBanner?.tradeId ?? activeTrade?.id
    if (targetTradeId) {
      actions.push('Trade', { tradeId: targetTradeId }, { animate: true })
    }
  }

  if (pendingBanner && !hasActiveSplit && !hasActiveSingleTrade) {
    return (
      <div className="global-active-trade-banner">
        <List>
          <ListButtonItem
            title={pendingBanner.title ?? pendingBanner.message}
            detail={pendingBanner.title ? pendingBanner.message : '거래 화면에서 확인해 주세요.'}
            prefix={
              <Badge tone="warning" variant="weak" size="medium">
                알림
              </Badge>
            }
            suffix={<Icon svg={<IconChevronRightLine />} size="x5" color="fg.neutralSubtle" />}
            onClick={handleNavigateTrade}
          />
        </List>
      </div>
    )
  }

  if (hasActiveSplit && splitGroup) {
    const completedLabel = `${formatAmount(splitGroup.totalAmountKrw)} · ${splitGroup.completedLegs}/${splitGroup.totalLegs}건 진행 중`
    const detail = pendingBanner?.message ?? '거래 화면에서 이어할 수 있어요'
    return (
      <div className="global-active-trade-banner">
        <List>
          <ListButtonItem
            title={completedLabel}
            detail={detail}
            prefix={
              <Badge tone="warning" variant="weak" size="medium">
                진행 중
              </Badge>
            }
            suffix={<Icon svg={<IconChevronRightLine />} size="x5" color="fg.neutralSubtle" />}
            onClick={handleNavigateTrade}
          />
        </List>
      </div>
    )
  }

  if (!activeTrade) return null

  const phase = getTradeUiPhase(activeTrade.status)
  if (phase === 'idle') return null

  const legSuffix =
    splitGroup && activeTrade.splitLegIndex
      ? formatSplitLegSuffix(activeTrade.splitLegIndex, splitGroup.totalLegs)
      : ''

  const title =
    pendingBanner?.title ??
    (activeTrade.status === 'PAYMENT_REPORTED'
      ? '입금 확인이 필요해요'
      : activeTrade.status === 'PAYMENT_PENDING' && activeTrade.role === 'SELLER'
        ? `${formatAmount(activeTrade.amountKrw)} · 입금 대기${legSuffix}`
        : phase === 'matching_order'
          ? `${formatAmount(activeTrade.amountKrw)} · 매칭 중${legSuffix}`
          : `${formatAmount(activeTrade.amountKrw)} · 거래 이어하기${legSuffix}`)
  const detail =
    pendingBanner?.message ??
    (activeTrade.status === 'PAYMENT_REPORTED'
      ? '구매자 입금 여부를 확인해 주세요.'
      : activeTrade.status === 'PAYMENT_PENDING' && activeTrade.role === 'SELLER'
        ? '구매자 입금을 기다리고 있어요'
        : undefined)

  return (
    <div className="global-active-trade-banner">
      <List>
        <ListButtonItem
          title={title}
          detail={detail}
          prefix={
            <Badge
              tone={
                pendingBanner?.type === 'TRADE_REQUEST_CREATED' ||
                pendingBanner?.type === 'TRADE_PAYMENT_REPORTED'
                  ? 'critical'
                  : 'warning'
              }
              variant="weak"
              size="medium"
            >
              {pendingBanner?.type === 'TRADE_REQUEST_CREATED' ||
              pendingBanner?.type === 'TRADE_PAYMENT_REPORTED'
                ? '확인 필요'
                : phase === 'matching_order'
                  ? '매칭 중'
                  : '진행 중'}
            </Badge>
          }
          suffix={<Icon svg={<IconChevronRightLine />} size="x5" color="fg.neutralSubtle" />}
          onClick={handleNavigateTrade}
        />
      </List>
    </div>
  )
}
