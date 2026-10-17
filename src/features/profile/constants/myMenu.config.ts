export type MyMenuIconId =
  | 'bell'
  | 'receipt'
  | 'notification-settings'
  | 'lock'

export type MyMenuActivityName =
  | 'NotificationCenter'
  | 'Transactions'
  | 'NotificationSettings'
  | 'AccountSettings'
  | 'SecuritySettings'

export type MyMenuItemConfig = {
  id: string
  title: string
  icon: MyMenuIconId
  activity: MyMenuActivityName
  params?: Record<string, string>
  /** 동적 detail — useMyScreen에서 resolve */
  detailKey?: 'unreadCount'
  /** 탭급 화면은 replace(하단 nav와 동일), 설정류는 push */
  navigationMode?: 'push' | 'replace'
}

export type MyMenuSectionConfig = {
  header: string
  items: MyMenuItemConfig[]
}

export const MY_TRADE_MENU_SECTION: MyMenuSectionConfig = {
  header: '내 거래',
  items: [
    {
      id: 'inbox',
      title: '알림함',
      icon: 'bell',
      activity: 'NotificationCenter',
      detailKey: 'unreadCount',
    },
    {
      id: 'transactions',
      title: '거래내역',
      icon: 'receipt',
      activity: 'Transactions',
      navigationMode: 'replace',
    },
    {
      id: 'notification-settings',
      title: '알림 설정',
      icon: 'notification-settings',
      activity: 'NotificationSettings',
    },
  ],
}

export const MY_SECURITY_MENU_SECTION: MyMenuSectionConfig = {
  header: '계정 및 보안',
  items: [
    {
      id: 'account-settings',
      title: '계정 설정',
      icon: 'lock',
      activity: 'AccountSettings',
    },
  ],
}

export const MY_NAVIGABLE_SECTIONS: MyMenuSectionConfig[] = [
  MY_TRADE_MENU_SECTION,
  MY_SECURITY_MENU_SECTION,
]
