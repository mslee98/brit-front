/**
 * PartnerLinksActivity — 내 업체 연결 목록·상세·해지 (B2).
 */
import type { ActivityComponentType } from '@stackflow/react'
import { Text, VStack } from '@seed-design/react'
import { List } from 'seed-design/ui/list'

import { ActivityScreenLayout } from '../app/layouts/ActivityScreenLayout'
import { PartnerLinkDetailSheet } from '../features/partners/components/PartnerLinkDetailSheet'
import { PartnerLinkRevokeAlertDialog } from '../features/partners/components/PartnerLinkRevokeAlertDialog'
import { PartnerLinkRow } from '../features/partners/components/PartnerLinkRow'
import { usePartnerLinksScreen } from '../features/partners/hooks/usePartnerLinksScreen'
import { TextLinkButton } from '../shared/components/TextLinkButton'

const PartnerLinksActivity: ActivityComponentType<'PartnerLinks'> = () => {
  const screen = usePartnerLinksScreen()

  return (
    <>
      <ActivityScreenLayout title="연결된 업체" onBack={screen.handleBack}>
        <VStack
          px="spacingX.globalGutter"
          pt="x4"
          gap="x5"
          style={{ paddingBottom: 'var(--app-content-bottom-padding)' }}
        >
          <VStack gap="x1">
            <Text textStyle="t7Bold" color="fg.neutral">
              내 계정과 연결된 업체
            </Text>
            <Text textStyle="t4Regular" color="fg.neutralMuted">
              연결된 업체에서 Brit 잔액으로 포인트를 이용할 수 있어요.
            </Text>
          </VStack>

          {screen.loading ? (
            <Text textStyle="t4Regular" color="fg.neutralSubtle">
              불러오는 중…
            </Text>
          ) : screen.items.length === 0 ? (
            <VStack gap="x2" py="x10" align="center">
              <Text textStyle="t5Bold" color="fg.neutral">
                연결된 업체가 없어요
              </Text>
              <Text
                textStyle="t4Regular"
                color="fg.neutralSubtle"
                align="center"
              >
                업체에서 Brit 연결을 시작하면 여기에 나타나요.
              </Text>
            </VStack>
          ) : (
            <VStack gap="x2" width="full">
              <Text textStyle="t3Bold" color="fg.neutralMuted">
                연결된 업체 {screen.items.length}
              </Text>
              <List>
                {screen.items.map((item) => (
                  <PartnerLinkRow
                    key={item.linkId}
                    item={item}
                    onSelect={() => screen.openDetail(item)}
                    disabled={screen.revokingId === item.linkId}
                  />
                ))}
              </List>
            </VStack>
          )}

          <VStack gap="x1" pt="x2" align="flex-start">
            <TextLinkButton onClick={screen.openApprove}>
              연결 코드로 업체 추가
            </TextLinkButton>
            <Text textStyle="t3Regular" color="fg.neutralSubtle">
              업체 서비스에서 Brit 연결을 시작할 수도 있어요.
            </Text>
          </VStack>
        </VStack>
      </ActivityScreenLayout>

      <PartnerLinkDetailSheet
        open={screen.detailOpen}
        item={screen.selected}
        revoking={Boolean(
          screen.selected && screen.revokingId === screen.selected.linkId,
        )}
        onOpenChange={screen.handleDetailOpenChange}
        onRequestRevoke={screen.requestRevoke}
      />

      <PartnerLinkRevokeAlertDialog
        open={screen.revokeConfirmOpen}
        partnerName={screen.selected?.partnerName ?? ''}
        loading={Boolean(
          screen.selected && screen.revokingId === screen.selected.linkId,
        )}
        onOpenChange={screen.handleRevokeConfirmOpenChange}
        onConfirm={() => void screen.confirmRevoke()}
      />
    </>
  )
}

export default PartnerLinksActivity
