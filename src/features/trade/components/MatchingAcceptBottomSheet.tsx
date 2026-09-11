import { useRef } from 'react'
import { IconChevronRightLine } from '@karrotmarket/react-monochrome-icon'
import { useActivityZIndexBase } from '@seed-design/stackflow'
import { Badge, Divider, HStack, Icon, Portal, Text, VStack } from '@seed-design/react'
import { useLoading } from 'react-simplikit'
import { Avatar } from 'seed-design/ui/avatar'
import { Callout } from 'seed-design/ui/callout'
import { IdentityPlaceholder } from 'seed-design/ui/identity-placeholder'
import { List, ListButtonItem } from 'seed-design/ui/list'
import { useSnackbarAdapter } from 'seed-design/ui/snackbar'
import {
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetFooter,
  BottomSheetRoot,
} from 'seed-design/ui/bottom-sheet'

import { useLayoutOverlay } from '../../../app/layouts/useLayoutOverlay'
import { TextLinkButton } from '../../../shared/components/TextLinkButton'
import { BottomActionButton } from '../../../shared/ui/BottomActionButton'
import { formatAmount, formatCoinAmount } from '../../../shared/utils/formatAmount'
import { showSnackbar } from '../../../shared/utils/showSnackbar'
import {
  getMatchingProposalCtaLabel,
  getMatchingProposalMatchBadge,
  getMatchingProposalSellerDetail,
  getMatchingProposalTitle,
  MATCHING_PROPOSAL_SKIP_LABEL,
  MATCHING_PROPOSAL_START_NOTICE_LINE1,
  MATCHING_PROPOSAL_START_NOTICE_LINE2,
} from '../copy'
import type { MatchingCandidate } from '../matching/types'

interface MatchingAcceptBottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidate: MatchingCandidate | null
  onConfirm: (candidateId: string) => void | Promise<void>
  onSkip: (candidateId: string) => void
}

function SummaryRow({
  label,
  value,
  emphasize = false,
}: {
  label: string
  value: string
  emphasize?: boolean
}) {
  return (
    <HStack justify="space-between" align="center" width="full">
      <Text textStyle="t4Regular" color="fg.neutral">
        {label}
      </Text>
      <Text
        textStyle="t5Bold"
        color={emphasize ? 'fg.brand' : 'fg.neutral'}
        className="tabular-nums"
      >
        {value}
      </Text>
    </HStack>
  )
}

/**
 * 거래 제안 Bottom Sheet — 금액·판매자·요청 CTA (문서 TradeProposalSheet).
 */
export function MatchingAcceptBottomSheet({
  open,
  onOpenChange,
  candidate,
  onConfirm,
  onSkip,
}: MatchingAcceptBottomSheetProps) {
  const portalContainerRef = useRef<HTMLElement | null>(
    typeof document !== 'undefined' ? document.getElementById('app-frame-portal') : null,
  )
  const layerIndex = useActivityZIndexBase({ activityOffset: 2 })
  const [loading, startLoading] = useLoading()
  const snackbar = useSnackbarAdapter()

  useLayoutOverlay(open)

  if (!candidate) return null

  const coinLabel = formatCoinAmount(candidate.amountKrw)
  const amountLabel = formatAmount(candidate.amountKrw)
  const title = getMatchingProposalTitle(coinLabel)
  const feeLabel = formatAmount(0)

  const handleConfirm = () => {
    void startLoading(Promise.resolve(onConfirm(candidate.id)))
  }

  const handleSkip = () => {
    onSkip(candidate.id)
  }

  const handleSellerDetail = () => {
    showSnackbar(snackbar, '판매자 정보는 곧 자세히 볼 수 있어요.')
  }

  return (
    <BottomSheetRoot open={open} onOpenChange={onOpenChange}>
      <Portal container={portalContainerRef}>
        <BottomSheetContent
          layerIndex={layerIndex}
          showHandle
          showCloseButton
          aria-label={title}
          aria-describedby={undefined}
        >
          <BottomSheetBody>
            <VStack gap="x4" width="full">
              <VStack gap="x2" align="flex-start" width="full" pt="x2">
                <Badge
                  tone={candidate.matchType === 'EXACT' ? 'brand' : 'neutral'}
                  variant="weak"
                  size="medium"
                >
                  {getMatchingProposalMatchBadge(candidate.matchType)}
                </Badge>
                <Text as="h2" textStyle="t7Bold" color="fg.neutral">
                  {title}
                </Text>
              </VStack>

              <VStack gap="x2" width="full">
                <List width="full">
                  <ListButtonItem
                    onClick={handleSellerDetail}
                    alignItems="center"
                    prefix={<Avatar size="42" fallback={<IdentityPlaceholder />} />}
                    title={candidate.nickname}
                    detail={getMatchingProposalSellerDetail(
                      candidate.tradeCount,
                      candidate.completionRatePct,
                    )}
                    suffix={
                      <Icon svg={<IconChevronRightLine />} size="x4" color="fg.neutralSubtle" />
                    }
                  />
                </List>
                <Divider />
              </VStack>

              <VStack gap="x2" width="full">
                <SummaryRow label="거래 금액" value={coinLabel} emphasize />
                <SummaryRow label="입금할 금액" value={amountLabel} />
                <SummaryRow label="수수료" value={feeLabel} />
              </VStack>

              <Callout
                tone="informative"
                description={
                  <>
                    {MATCHING_PROPOSAL_START_NOTICE_LINE1}
                    <br />
                    {MATCHING_PROPOSAL_START_NOTICE_LINE2}
                  </>
                }
              />
            </VStack>
          </BottomSheetBody>
          <BottomSheetFooter>
            <VStack gap="x2" width="full" align="stretch">
              <BottomActionButton
                size="large"
                variant="brandSolid"
                flexGrow
                loading={loading}
                disabled={loading}
                onClick={handleConfirm}
              >
                {getMatchingProposalCtaLabel(coinLabel)}
              </BottomActionButton>
              <VStack align="center" width="full" py="x1">
                <TextLinkButton disabled={loading} onClick={handleSkip}>
                  {MATCHING_PROPOSAL_SKIP_LABEL}
                </TextLinkButton>
              </VStack>
            </VStack>
          </BottomSheetFooter>
        </BottomSheetContent>
      </Portal>
    </BottomSheetRoot>
  )
}
