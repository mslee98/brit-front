/**
 * @deprecated 로컬 mock OS 알림은 제거됨. 서버 Web Push + SW만 사용한다.
 * 소켓 도입 시 NotificationSource adapter로 교체한다.
 */
export function initMockNotificationSource() {
  // no-op — P0에서 mock→new Notification / 로컬 상태 합성 알림 제거
}

export function setMockNotificationEmitHandler(_handler: unknown) {
  // no-op
}
