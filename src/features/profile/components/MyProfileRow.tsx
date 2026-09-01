import { IconChevronRightLine } from '@karrotmarket/react-monochrome-icon'
import { Icon } from '@seed-design/react'
import { Avatar } from 'seed-design/ui/avatar'
import { IdentityPlaceholder } from 'seed-design/ui/identity-placeholder'
import { List, ListButtonItem } from 'seed-design/ui/list'

interface MyProfileRowProps {
  nickname: string
  verificationLabel: string
  onClick?: () => void
}

export function MyProfileRow({ nickname, verificationLabel, onClick }: MyProfileRowProps) {
  return (
    <List>
      <ListButtonItem
        title={nickname}
        detail={verificationLabel}
        prefix={<Avatar size="48" fallback={<IdentityPlaceholder />} />}
        suffix={<Icon svg={<IconChevronRightLine />} size="x5" color="fg.neutralSubtle" />}
        onClick={onClick}
      />
    </List>
  )
}
