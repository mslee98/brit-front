import {
  IconBellLine,
  IconChevronRightLine,
  IconLockLine,
  IconReceiptLine,
  IconSlider2HorizontalLine,
} from '@karrotmarket/react-monochrome-icon'
import { Icon, VStack } from '@seed-design/react'
import { List, ListButtonItem } from 'seed-design/ui/list'
import { ListHeader } from 'seed-design/ui/list-header'
import type { ReactElement } from 'react'

import type { MyMenuIconId, MyMenuItemConfig, MyMenuSectionConfig } from '../constants/myMenu.config'

const MENU_ICONS: Record<MyMenuIconId, ReactElement> = {
  bell: <IconBellLine />,
  receipt: <IconReceiptLine />,
  'notification-settings': <IconSlider2HorizontalLine />,
  lock: <IconLockLine />,
}

interface MyMenuSectionProps {
  section: MyMenuSectionConfig
  resolveDetail: (item: MyMenuItemConfig) => string | undefined
  onItemClick: (item: MyMenuItemConfig) => void
}

export function MyMenuSection({ section, resolveDetail, onItemClick }: MyMenuSectionProps) {
  return (
    <VStack gap="x2">
      <ListHeader as="h3" variant="mediumWeak">
        {section.header}
      </ListHeader>
      <List>
        {section.items.map((item) => (
          <ListButtonItem
            key={item.id}
            title={item.title}
            detail={resolveDetail(item)}
            prefix={
              <Icon svg={MENU_ICONS[item.icon]} size="x5" color="fg.neutralSubtle" />
            }
            suffix={<Icon svg={<IconChevronRightLine />} size="x5" color="fg.neutralSubtle" />}
            onClick={() => onItemClick(item)}
          />
        ))}
      </List>
    </VStack>
  )
}
