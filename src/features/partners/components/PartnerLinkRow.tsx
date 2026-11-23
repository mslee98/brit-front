/**
 * PartnerLinkRow — 연결된 업체 목록 행 (아바타·업체명·상태·계정 요약).
 */
import { IconChevronRightLine } from '@karrotmarket/react-monochrome-icon'
import { Badge, HStack, Icon, Text } from '@seed-design/react'
import { Avatar } from 'seed-design/ui/avatar'
import { IdentityPlaceholder } from 'seed-design/ui/identity-placeholder'
import { ListButtonItem } from 'seed-design/ui/list'

import type { MePartnerLinkItem } from '../api/partnerLinks.api'
import { formatPartnerLinkedAt } from '../utils/formatPartnerLinkedAt'

type PartnerLinkRowProps = {
  item: MePartnerLinkItem
  onSelect: () => void
  disabled?: boolean
}

export function PartnerLinkRow({ item, onSelect, disabled }: PartnerLinkRowProps) {
  const title = (
    <HStack gap="x2" align="center" minWidth="0">
      <Text textStyle="t5Bold" color="fg.neutral" maxLines={1}>
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
    </HStack>
  )

  return (
    <ListButtonItem
      alignItems="center"
      prefix={<Avatar size="36" fallback={<IdentityPlaceholder />} />}
      title={title}
      detail={`회원 ${item.partnerUserKeyMasked} · ${formatPartnerLinkedAt(item.linkedAt)}`}
      suffix={
        <Icon svg={<IconChevronRightLine />} size="x4" color="fg.neutralSubtle" />
      }
      disabled={disabled}
      onClick={onSelect}
    />
  )
}
