/**
 * 이 기기에서 Web Push를 받을 수 있는지.
 * 데스크톱/모바일 채널 분기가 아니라 구독 가능 상태만 표현한다.
 */
export type PushEligibility =
  | 'unsupported'
  | 'ios_install_required'
  | 'default'
  | 'denied'
  | 'ready'

export const PUSH_SUBSCRIPTION_STORAGE_KEY = 'nt-push-subscription-ready'

export const WHILE_YOU_WAIT_COPY = {
  title: '매칭되면 알림을 보내드릴게요',
  description:
    '그동안 Brit 스토어나 커뮤니티를 구경해보시는 건 어때요?',
} as const

export const PUSH_ENABLE_COPY = {
  title: '더 좋은 상대가 나타나면 알려드릴게요',
  description: '알림을 켜두면 바로 확인할 수 있어요.',
  cta: '알림 설정',
  denied: '알림이 꺼져 있어요. 기기 설정에서 Brit 알림을 켜주세요.',
} as const

export const PUSH_ENABLE_PENDING_COPY = {
  title: '수락하면 바로 알려드릴까요?',
  description: '알림을 켜두면 바로 확인할 수 있어요.',
  cta: '알림 설정',
  denied: PUSH_ENABLE_COPY.denied,
} as const

export const PUSH_ENABLE_SELL_EMPTY_COPY = {
  title: '요청이 오면 알려드릴까요?',
  description: '알림을 켜두면 바로 확인할 수 있어요.',
  cta: '알림 설정',
  denied: PUSH_ENABLE_COPY.denied,
} as const

export const PUSH_ENABLE_SELL_PENDING_COPY = {
  title: '다음 요청도 바로 알려드릴까요?',
  description: '알림을 켜두면 바로 확인할 수 있어요.',
  cta: '알림 설정',
  denied: PUSH_ENABLE_COPY.denied,
} as const

export const PUSH_IOS_INSTALL_COPY = {
  title: 'iPhone에서는 홈 화면에 추가해야 알림을 받을 수 있어요',
  steps: [
    'Safari 하단 공유 버튼을 눌러 주세요',
    '홈 화면에 추가를 선택해 주세요',
    '홈 화면의 Brit을 연 뒤 알림을 켜 주세요',
  ],
} as const

export const NOTIFICATION_SETTINGS_COPY = {
  title: '알림 설정',
  enableCta: '이 기기에서 알림 받기',
  disableCta: '이 기기 알림 끄기',
  testCta: '테스트 알림 보내기',
  subscribed: '이 기기에서 알림을 받고 있어요',
  permissionDenied:
    '브라우저에서 알림이 차단되어 있어요. 설정에서 Brit 알림을 허용해 주세요.',
  unsupported: '이 브라우저에서는 알림을 지원하지 않아요.',
} as const
