/**
 * PartnerLinkDetailSheet — 업체 연결 정보 + 연결 해제 진입.
 */
import { useRef } from 'react'
import { useActivityZIndexBase } from '@seed-design/stackflow'
import { Badge, HStack, Portal, Text, VStack } from '@seed-design/react'
import { Avatar } from 'seed-design/ui/avatar'
import {
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetFooter,
  BottomSheetRoot,
} from 'seed-design/ui/bottom-sheet'
import { IdentityPlaceholder } from 'seed-design/ui/identity-placeholder'

import { useLayoutOverlay } from '../../../app/layouts/useLayoutOverlay'
import { BottomActionButton } from '../../../shared/ui/BottomActionButton'
import type { MePartnerLinkItem } from '../api/partnerLinks.api'
import { formatPartnerLinkedAt } from '../utils/formatPartnerLinkedAt'

type PartnerLinkDetailSheetProps = {
  open: boolean
  item: MePartnerLinkItem | null
  revoking: boolean
  onOpenChange: (open: boolean) => void
  onRequestRevoke: () => void
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <HStack justify="space-between" align="baseline" gap="x4" width="full">
      <Text textStyle="t4Regular" color="fg.neutralMuted">
        {label}
      </Text>
      <Text textStyle="t4Medium" color="fg.neutral" align="right">
        {value}
      </Text>
    </HStack>
  )
}

export function PartnerLinkDetailSheet({
  open,
  item,
  revoking,
  onOpenChange,
  onRequestRevoke,
}: PartnerLinkDetailSheetProps) {
  const portalContainerRef = useRef<HTMLElement | null>(
    typeof document !== 'undefined'
      ? document.getElementById('app-frame-portal')
      : null,
  )
  const layerIndex = useActivityZIndexBase({ activityOffset: 2 })
  useLayoutOverlay(open)

  if (!item) return null

  const statusLabel = item.status === 'ACTIVE' ? '정상' : '해제됨'

  return (
    <BottomSheetRoot open={open} onOpenChange={onOpenChange}>
      <Portal container={portalContainerRef}>
        <BottomSheetContent
          title="업체 연결 정보"
          layerIndex={layerIndex}
          showHandle
          aria-describedby={undefined}
        >
          <BottomSheetBody>
            <VStack gap="x5" width="full">
              <HStack gap="x3" align="center" width="full">
                <Avatar size="48" fallback={<IdentityPlaceholder />} />
                <VStack gap="x1" align="flex-start" minWidth="0">
                  <Text textStyle="t6Bold" color="fg.neutral" maxLines={1}>
                    {item.partnerName}
                  </Text>
                  {item.status === 'ACTIVE' ? (
                    <Badge tone="informative" variant="weak" size="medium">
                      연결됨
                    </Badge>
                  ) : (
                    <Badge tone="neutral" variant="weak" size="medium">
                      해제됨
                    </Badge>
                  )}
                </VStack>
              </HStack>

              <VStack gap="x3" width="full">
                <DetailRow
                  label="연결된 계정"
                  value={item.partnerUserKeyMasked}
                />
                <DetailRow
                  label="연결 날짜"
                  value={formatPartnerLinkedAt(item.linkedAt)}
                />
                <DetailRow label="연결 상태" value={statusLabel} />
              </VStack>

              <Text textStyle="t3Regular" color="fg.neutralMuted">
                연결을 해제하면 Brit을 통한 새 포인트 전환 요청이 제한돼요.
                다시 이용하려면 업체에서 계정을 연결해야 해요.
              </Text>
            </VStack>
          </BottomSheetBody>
          {item.status === 'ACTIVE' ? (
            <BottomSheetFooter>
              <BottomActionButton
                size="large"
                variant="criticalSolid"
                loading={revoking}
                disabled={revoking}
                onClick={onRequestRevoke}
              >
                연결 해제하기
              </BottomActionButton>
            </BottomSheetFooter>
          ) : null}
        </BottomSheetContent>
      </Portal>
    </BottomSheetRoot>
  )
}
