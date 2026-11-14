/**
 * PartnerLinksActivity — 내 업체 연결 목록·해지 (B2).
 */
import type { ActivityComponentType } from '@stackflow/react'
import { Text, VStack } from '@seed-design/react'
import { List, ListButtonItem } from 'seed-design/ui/list'

import { ActivityScreenLayout } from '../app/layouts/ActivityScreenLayout'
import { usePartnerLinksScreen } from '../features/partners/hooks/usePartnerLinksScreen'
import { BottomActionButton } from '../shared/ui/BottomActionButton'

function formatLinkedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

const PartnerLinksActivity: ActivityComponentType<'PartnerLinks'> = () => {
  const screen = usePartnerLinksScreen()

  return (
    <ActivityScreenLayout
      title="업체 연결"
      onBack={screen.handleBack}
      bottomCTABehavior="fixed"
      fixedBottom={
        <BottomActionButton
          size="large"
          variant="neutralWeak"
          onClick={screen.openApprove}
        >
          연결 코드 승인
        </BottomActionButton>
      }
    >
      <VStack
        px="spacingX.globalGutter"
        pt="x4"
        gap="x4"
        style={{ paddingBottom: 'var(--app-content-bottom-padding)' }}
      >
        <Text textStyle="t3Regular" color="fg.neutralMuted">
          연결된 업체에서 BRIT MS로 포인트 충전을 요청할 수 있어요. 해제한 뒤에는
          다시 연결해야 해요.
        </Text>

        {screen.loading ? (
          <Text textStyle="t4Regular" color="fg.neutralSubtle">
            불러오는 중…
          </Text>
        ) : screen.items.length === 0 ? (
          <VStack gap="x1" py="x10" align="center">
            <Text textStyle="t5Bold" color="fg.neutral">
              연결된 업체가 없어요
            </Text>
            <Text textStyle="t4Regular" color="fg.neutralSubtle" align="center">
              업체에서 「BRIT 계정 연결」을 시작하면 여기에 나타나요.
            </Text>
          </VStack>
        ) : (
          <List>
            {screen.items.map((item) => (
              <ListButtonItem
                key={item.linkId}
                title={item.partnerName}
                detail={`회원 ${item.partnerUserKeyMasked} · ${formatLinkedAt(item.linkedAt)}`}
                onClick={() => void screen.handleRevoke(item)}
                disabled={screen.revokingId === item.linkId}
              />
            ))}
          </List>
        )}

        {screen.items.length > 0 ? (
          <Text textStyle="t3Regular" color="fg.neutralSubtle">
            항목을 누르면 연결을 해제해요.
          </Text>
        ) : null}
      </VStack>
    </ActivityScreenLayout>
  )
}

export default PartnerLinksActivity
