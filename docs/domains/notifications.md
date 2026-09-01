# 알림 · 실시간 이벤트

Brit P2P 거래 미니앱의 **알림 아키텍처**입니다.  
**Wire SoT는 서버 `NotificationEventType`** 입니다. Web Push와 향후 SSE/WS가 동일한 `type` 문자열을 사용합니다.

---

## 1. 이벤트 카탈로그 (서버 SoT)

| type | 수신 | Inbox | Push | 설명 |
|------|------|------:|-----:|------|
| `TRADE_REQUEST_CREATED` | 판매자 | O | O | 구매 신청 |
| `TRADE_REQUEST_ACCEPTED` | 구매자 | O | O | 판매자 수락 → 입금 |
| `TRADE_PAYMENT_REPORTED` | 판매자 | O | O | 구매자 입금 신고 |
| `TRADE_COMPLETED` | 구매·판매 | O | O | 거래 완료 (역할별 카피) |
| `USER_REGISTRATION_REQUESTED` | 관리자 | O | — | 가입 심사 요청 |
| `USER_REGISTRATION_APPROVED` | 신청자 | O | — | 가입 승인 (P1 Push) |
| `USER_REGISTRATION_REJECTED` | 신청자 | O | — | 가입 반려 (P1 Push) |

P1 예정(타입만 예약 가능): `TRADE_EXPIRED`, `TRADE_CANCELLED`, `DISPUTE_OPENED`, `DISPUTE_RESOLVED`.

`TradeEventCode`(예: `BUYER_REPORTED_PAYMENT`)는 업무 사실이고, 알림 `type`과 1:1이 아닐 수 있습니다. 매핑은 서버 `NOTIFICATION_POLICY`에만 둡니다.

### Wire 페이로드 (Push = 향후 소켓)

```ts
{
  notificationId: string
  type: NotificationEventType
  title: string
  body: string
  deepLink: string
  // 호환: eventType, message, url
  tradeId?: string
  sellOrderId?: string
  buyOrderId?: string
}
```

---

## 2. 채널 역할

| 채널 | 용도 |
|------|------|
| **snackbar** | 사용자가 방금 한 행동의 결과만 (알림센터 미저장) |
| **attention / banner / pending** | P1 Inbox·소켓 연동 전 로컬 UX (서버 이벤트와 분리) |
| **Web Push** | 백그라운드·다른 탭·잠금 화면 — SW `showNotification`만 |
| **SSE/WS (P1)** | 동일 `type`·`notificationId`로 Inbox 갱신 |

**금지:** 클라이언트 `new Notification()` mock OS 알림.

---

## 3. 클라이언트

```text
src/features/notifications/   # 인앱 dispatch·store (소켓 도입 시 adapter만 교체)
src/features/pwa/             # 구독·권한·PushCapability UX
src/sw.ts                     # Web Push → OS 알림
```

프로필 → **알림 설정**에서 이 기기 구독·권한·iOS 홈 화면 설치 안내.

---

## 4. Outbox

| 상황 | status |
|------|--------|
| 구독 없음 | `SKIPPED` (`NO_SUBSCRIPTION`) — 재시도 안 함 |
| 404/410 | 구독 삭제, 다른 구독으로 계속 |
| 429/5xx | 지수 백오프 후 `FAILED` |

---

## 5. 관련 코드

- API: `brit-api/src/modules/notifications/`
- 정책: `domain/constants/notification.constants.ts` → `NOTIFICATION_POLICY`
- Front 설정: `NotificationSettings` Activity
