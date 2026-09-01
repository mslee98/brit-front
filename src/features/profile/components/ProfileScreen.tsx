import { Badge, Text, VStack } from '@seed-design/react'
import { List, ListButtonItem, ListItem } from 'seed-design/ui/list'
import { useFlow } from '@stackflow/react'

import { formatAmount, formatCoinUnit } from '../../../shared/utils/formatAmount'
import { useProfileViewModel } from '../hooks/useProfileViewModel'

export function ProfileScreen() {
  const profile = useProfileViewModel()
  const { push } = useFlow()

  return (
    <VStack
      px="spacingX.globalGutter"
      pt="x4"
      gap="x6"
      style={{ paddingBottom: 'var(--app-content-bottom-padding)' }}
    >
      <VStack
        p="x5"
        gap="x3"
        bg="bg.layerDefault"
        borderWidth="1"
        borderColor="stroke.neutralWeak"
        borderRadius="r5"
      >
        <VStack gap="x1">
          <Text textStyle="t6Bold" color="fg.neutral">
            {profile.nickname}
          </Text>
          <Badge tone={profile.isVerified ? 'positive' : 'neutral'} variant="weak" size="medium">
            {profile.isVerified ? '본인 인증 완료' : '미인증'}
          </Badge>
        </VStack>

        {profile.isVerified && (
          <VStack gap="x0_5">
            <Text textStyle="t4Regular" color="fg.neutralMuted">
              등록 계좌
            </Text>
            <Text textStyle="t5Medium" color="fg.neutral">
              {profile.bankName} {profile.accountNumberMasked}
            </Text>
          </VStack>
        )}

        <VStack gap="x0_5">
          <Text textStyle="t4Regular" color="fg.neutralMuted">
            보유 코인
          </Text>
          <Text textStyle="t5Bold" color="fg.neutral" className="tabular-nums">
            {formatCoinUnit(profile.coinBalance)}
          </Text>
          <Text textStyle="t4Regular" color="fg.neutralSubtle" className="tabular-nums">
            약 {formatAmount(profile.estimatedKrwValue)}
          </Text>
        </VStack>
      </VStack>

      <List>
        <ListButtonItem
          title="로그인 및 보안"
          detail="패스키·세션"
          onClick={() => push('SecuritySettings', {})}
        />
        <ListButtonItem
          title="알림 설정"
          detail="거래·입금 알림"
          onClick={() => push('NotificationSettings', {})}
        />
        <ListItem title="고객센터" detail="문의하기" />
        <ListItem title="약관 및 정책" detail="이용약관, 개인정보 처리방침" />
      </List>
    </VStack>
  )
}
