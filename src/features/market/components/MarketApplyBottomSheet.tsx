import { useRef } from 'react'
import { useActivityZIndexBase } from '@seed-design/stackflow'
import { Box, Divider, HStack, Portal, Text, VStack } from '@seed-design/react'
import { useLoading } from 'react-simplikit'
import {
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetFooter,
  BottomSheetRoot,
} from 'seed-design/ui/bottom-sheet'

import { useLayoutOverlay } from '../../../app/layouts/useLayoutOverlay'
import { BottomActionButton } from '../../../shared/ui/BottomActionButton'
import { formatCoinAmount } from '../../../shared/utils/formatAmount'
import {
  MARKET_SHEET_AMOUNT,
  MARKET_SHEET_COMPLETION_HINT,
  MARKET_SHEET_CTA,
  MARKET_SHEET_CTA_LOADING,
  MARKET_SHEET_NEW_SELLER_HINT,
  MARKET_SHEET_PROCESS_STEPS,
  MARKET_SHEET_PROCESS_TITLE,
  MARKET_SHEET_TITLE,
} from '../copy'
import type { MarketListing } from '../types'
import { MarketSellerIdentity } from './MarketSellerIdentity'

interface MarketApplyBottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listing: MarketListing | null
  onConfirm: (listing: MarketListing) => void | Promise<void>
}

/**
 * 거래소 매도글 → 거래 요청 최종 확인 시트.
 * 누구에게 / 얼마를 / 요청 후 무엇이 일어나는지만 보여 준다. 닫기는 X·스와이프.
 */
export function MarketApplyBottomSheet({
  open,
  onOpenChange,
  listing,
  onConfirm,
}: MarketApplyBottomSheetProps) {
  const portalContainerRef = useRef<HTMLElement | null>(
    typeof document !== 'undefined' ? document.getElementById('app-frame-portal') : null,
  )
  const layerIndex = useActivityZIndexBase({ activityOffset: 2 })
  const [loading, startLoading] = useLoading()

  useLayoutOverlay(open)

  if (!listing) return null

  const { seller } = listing
  const coinLabel = formatCoinAmount(listing.remainingCoinAmount)
  const showsCompletionRate =
    (seller.completedTradeCount ?? 0) > 0 && typeof seller.completionRatePct === 'number'

  const handleConfirm = () => {
    void startLoading(Promise.resolve(onConfirm(listing)))
  }

  return (
    <BottomSheetRoot open={open} onOpenChange={onOpenChange}>
      <Portal container={portalContainerRef}>
        <BottomSheetContent
          layerIndex={layerIndex}
          showHandle
          showCloseButton
          aria-label={MARKET_SHEET_TITLE}
          aria-describedby={undefined}
        >
          <BottomSheetBody>
            <VStack gap="x4" width="full">
              <Text textStyle="t6Bold" color="fg.neutral">
                {MARKET_SHEET_TITLE}
              </Text>

              <VStack
                gap="x4"
                width="full"
                p="x4"
                borderRadius="r3"
                bg="bg.neutralWeak"
                align="flex-start"
              >
                <MarketSellerIdentity
                  seller={seller}
                  emptyStatsText={MARKET_SHEET_NEW_SELLER_HINT}
                >
                  {showsCompletionRate ? (
                    <Text textStyle="t2Regular" color="fg.neutralSubtle">
                      {MARKET_SHEET_COMPLETION_HINT}
                    </Text>
                  ) : null}
                </MarketSellerIdentity>

                <Divider />

                <VStack gap="x1" align="flex-start">
                  <Text textStyle="t3Regular" color="fg.neutralMuted">
                    {MARKET_SHEET_AMOUNT}
                  </Text>
                  <Text textStyle="t8Bold" color="fg.neutral" className="tabular-nums">
                    {coinLabel}
                  </Text>
                </VStack>
              </VStack>

              <VStack gap="x2" width="full" align="flex-start">
                <Text textStyle="t4Bold" color="fg.neutral">
                  {MARKET_SHEET_PROCESS_TITLE}
                </Text>
                <VStack
                  as="ol"
                  gap="x1_5"
                  width="full"
                  align="flex-start"
                  style={{ margin: 0, padding: 0, listStyle: 'none' }}
                >
                  {MARKET_SHEET_PROCESS_STEPS.map((step, index) => (
                    <HStack as="li" key={step} gap="x2" align="flex-start" width="full">
                      <Box flexShrink={0}>
                        <Text textStyle="t3Bold" color="fg.neutralMuted" className="tabular-nums">
                          {index + 1}
                        </Text>
                      </Box>
                      <Text textStyle="t3Regular" color="fg.neutralMuted">
                        {step}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </VStack>
            </VStack>
          </BottomSheetBody>
          <BottomSheetFooter>
            <BottomActionButton
              size="large"
              variant="brandSolid"
              disabled={loading}
              onClick={handleConfirm}
            >
              {loading ? MARKET_SHEET_CTA_LOADING : MARKET_SHEET_CTA(coinLabel)}
            </BottomActionButton>
          </BottomSheetFooter>
        </BottomSheetContent>
      </Portal>
    </BottomSheetRoot>
  )
}
