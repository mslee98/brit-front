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
| `TRADE_PAYMENT_REPORT_WITHDRAWN` | 판매자 | O | O | 구매자 입금 신고 철회 |
| `TRADE_COMPLETED` | 구매·판매 | O | O | 거래 완료 (역할별 카피) |
| `USER_REGISTRATION_REQUESTED` | 관리자 | O | — | 가입 심사 요청 |
| `USER_REGISTRATION_APPROVED` | 신청자 | O | — | 가입 승인 (P1 Push) |
| `USER_REGISTRATION_REJECTED` | 신청자 | O | — | 가입 반려 (P1 Push) |
| `TRADE_EXPIRED` | 구매·판매 | O | O | 입금 기한 만료 |
| `TRADE_CANCELLED` | 구매·판매 | O | O | 거래 취소 |
| `DISPUTE_OPENED` | 구매·판매 | O | O | 분쟁 접수. deepLink `/trade/dispute/:id` |
| `DISPUTE_RESOLVED` | 구매·판매 | O | O | 분쟁 판결 |

P1 예정이던 `TRADE_EXPIRED`·`TRADE_CANCELLED`·`DISPUTE_*`는 정책·푸시에 포함된다.

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
| **SSE (연동됨)** | `GET /v1/me/notifications/stream` + FE `sseNotificationSource` — Inbox 갱신. 다중 인스턴스 스케일은 backlog NT-4 |
| **WS** | 분쟁 상담 등 도메인별. 알림 Inbox와 분리 |

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

## 3-1. 저장 모델 · Inbox API

**사건 1건 + 수신자 N건.** `notification_events`는 (type, referenceType, referenceId)로 유일하다.
구매·판매 양쪽이 받는 알림(거래 완료·취소·만료·분쟁)은 같은 사건에 수신자 행이 2개 붙는다.
역할별 문구·이동 경로·스냅샷은 `notification_recipients`(`recipient_role`, `title`, `message`, `action_path`, `payload`)에 두고, 없으면 사건 값을 쓴다.

> 이전에는 수신자마다 사건을 새로 만들다가 두 번째(판매자)가 unique 충돌로 조용히 버려졌다.
> 변경 전 데이터는 한쪽 수신자만 있다 (백필 안 함).

| API | 설명 |
|-----|------|
| `GET /v1/me/notifications?page&size&filter=all\|unread\|action` | 최신순. `action` = 지금 처리 필요 |
| `GET /v1/me/notifications/counts` | `{ unreadCount, actionRequiredCount }` — 알림 화면 필터 칩 (`fetchNotificationCounts`) |
| `GET /v1/me/notifications/unread-count` | `{ count }` — 홈·마이 배지 (`fetchUnreadNotificationCount`) |

서버 구현 메모: [brit-api/docs/p0/p0-notifications.md](../../../brit-api/docs/p0/p0-notifications.md).

목록 항목 추가 필드:

| 필드 | 의미 |
|------|------|
| `actionState` | `REQUIRED` 지금 처리 필요 · `DONE` 처리·종료됨 · `NONE` 정보성. **읽음과 별개** |
| `recipientRole` | `BUYER` / `SELLER` |
| `coinAmount` | 발송 시점 거래 수량 |
| `counterpartyNicknameMasked` | 상대방 닉네임 (`김**`) |

`actionState`는 조회 시점 업무 상태로 계산한다 (`notification-action-state.ts`).

| type | REQUIRED 조건 |
|------|---------------|
| `TRADE_REQUEST_CREATED` | 요청이 `PENDING_SELLER`이고 만료 전 |
| `TRADE_PAYMENT_REPORTED` | 거래가 `WAITING_SELLER_CONFIRMATION` |
| `TRADE_REQUEST_ACCEPTED` | 거래가 `WAITING_BUYER_PAYMENT` |

SSE로 막 도착한 알림은 위 세 종류면 `REQUIRED`로 보낸다.

### 알림 화면 (`NotificationCenterActivity`)

- 상단 우측 텍스트 「모두 읽음」 (안 읽음 0이면 비활성)
- 필터 칩: 전체 / 안 읽음 N / 확인 필요 N
- 일자별 그룹(오늘 · 어제 · 11월 3일 (월), 다른 해는 연도 포함) + 시간(방금 전·N분 전·시각)
- 종류별 아이콘·색, 안 읽음 점 + 옅은 배경 + 굵은 제목
- 거래 알림은 「300,000 Coin · 구매자 김**」 메타 줄, `REQUIRED`면 행동 배지(응답 필요·입금 필요·입금 확인 필요), `DONE`이면 「처리됨」
- 탭 → 읽음 처리 후 deepLink로 이동 (알림 화면은 스택에 남는다). 돌아오면 목록·카운트 재조회
- 20건씩 「더 보기」, SSE 새 알림은 현재 필터에 맞으면 맨 위에 붙인다
- 행 오른쪽 「⋯」 → 보관 확인 시트(`NotificationItemMenuSheet`) → 목록에서 제거 + 건수 재조회. 스와이프 보관은 back 스와이프와 겹쳐 쓰지 않는다

| 파일 | 역할 |
|------|------|
| `hooks/useNotificationCenterScreen.ts` | 목록·필터·건수·SSE·복귀 새로고침 |
| `components/NotificationItem.tsx` | `ListButtonItem` 한 행 |
| `constants/notificationPresentation.tsx` | 종류별 아이콘·톤·행동 라벨, 필터 라벨, 빈 화면 문구 |
| `utils/formatNotification.ts` | 메타 줄·시간·날짜 묶음 (`shared/utils/formatDate` 사용) |
| `shared/ui/FilterChips.tsx` | 필터 칩 (거래 내역과 공용) |

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
