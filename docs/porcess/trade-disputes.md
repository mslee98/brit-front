> **문서 위치 안내:** 구현 SoT는 [brit-api/docs/p0/p0-7-disputes.md](../../../brit-api/docs/p0/p0-7-disputes.md). 종합 [trade-platform-summary.md](../architecture/trade-platform-summary.md). 정상 플로우 [trade-scenarios.md](./trade-scenarios.md). 입금 UX [trade-payment-ux.md](./trade-payment-ux.md).

# Brit 거래 예외·분쟁 처리

Binding 이후 **오조작·미입금·허위 신고**와 **CS 중재**를 정의합니다.  
서버 상태명은 Nest enum 기준입니다. 프론트 매핑: `WAITING_BUYER_PAYMENT`→`PAYMENT_PENDING`, `WAITING_SELLER_CONFIRMATION`→`PAYMENT_REPORTED`.

**버전**: v0.6 (2026-09-23) — UX 갭 목록. 1단계 U1·U4 (분쟁 전환 시 채팅 진입).

---

## 1. 설계 원칙

| 원칙 | 설명 |
|------|------|
| **1번(미입금·미신고)은 분쟁 아님** | `cancel` / `mark-unpaid`로 종료. CS 큐에 넣지 않음 |
| **돈·코인은 서버 resolve만** | 채팅/UI 임의 조작 불가 |
| **분쟁 중 타이머 정지** | `DISPUTED`는 Worker timeout 대상이 아님 (상태 필터) |
| **채팅 ≠ 판결** | 채팅은 소통(M3). 종료는 CS `resolve`만 |
| **예방 우선** | 입금/확인 CTA는 확인 다이얼로그 + 금액·계좌 고정 |

---

## 2. 상황 분류

| # | 실제 입금 | 구매자 report | 판매자 | 처리 |
|---|-----------|---------------|--------|------|
| 1 | 없음 | 없음 | 「돈을 못 받았어요」 | `cancel` / `mark-unpaid` → `CANCELLED` |
| 2-1 | 없음 | 있음 | 「못 받았어요」 / 무응답 | `DISPUTED` → CS 대개 `FORCE_CANCEL` |
| 2-2 | 있음 | 있음 | 승인 안 함 / deny | `DISPUTED` → CS 대개 `FORCE_COMPLETE` |

2-1과 2-2는 상태만으로 구분 불가 → 증빙·삼자 확인 필요.

---

## 3. 상태 다이어그램

```text
WAITING_BUYER_PAYMENT
  ├ cancel / (timeout→PAYMENT_TIMEOUT→mark-unpaid) → CANCELLED   … 1번
  └ payment-report → WAITING_SELLER_CONFIRMATION
       ├ confirm-payment → COIN_TRANSFERRING → COMPLETED
       ├ deny-payment (seller) / disputes (buyer) / seller timeout → DISPUTED
       └ 쌍방취소 4단계 → CANCELLED

DISPUTED
  ├ FORCE_COMPLETE → COMPLETED
  ├ FORCE_CANCEL   → CANCELLED
  └ RESUME         → WAITING_BUYER_PAYMENT (기한 연장)
```

### 프론트 TradeStatus (매핑)

```typescript
export type TradeStatus =
  | 'PAYMENT_PENDING'      // WAITING_BUYER_PAYMENT
  | 'PAYMENT_REPORTED'     // WAITING_SELLER_CONFIRMATION
  | 'PAYMENT_TIMEOUT'
  | 'COIN_TRANSFERRING'
  | 'DISPUTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'MATCHING'             // UI only
```

### 상태별 사용자 액션 (M1)

| 서버 상태 | 구매자 | 판매자 | 타이머 |
|-----------|--------|--------|--------|
| `WAITING_BUYER_PAYMENT` | 입금했어요, 취소 | 대기, 취소 | 동작 |
| `PAYMENT_TIMEOUT` | late report | mark-unpaid | — |
| `WAITING_SELLER_CONFIRMATION` | 대기, **입금 문제 신고** | 돈 받았어요, **못 받았어요** | 동작 |
| `DISPUTED` | 고객센터와 대화하기 | 고객센터와 대화하기 | 정지 |
| terminal | — | — | — |

---

## 4. 엔티티 (현재 구현)

```text
Trade 1건
  └── trade_disputes (0..1, trade_id unique)
        ├── reasonCode, status, priority
        ├── requestedByUserId, assignedAdminUserId
        ├── resolution, resolutionReason, resolvedAt
        └── trade_dispute_actions (MESSAGE | INTERNAL_NOTE)
```

채팅은 ERD `trade_dispute_actions`. 배정/판결 이력은 `trade_events`.

### reasonCode

| 값 | 설명 | 제기자 |
|----|------|--------|
| `NOT_RECEIVED` | 입금 신고됐으나 미수신 | 판매자 deny |
| `SELLER_NO_CONFIRM` | 판매자 확인 지연·거부 | 구매자 |
| `SELLER_CONFIRMATION_TIMEOUT` | 확인 기한 초과 | Worker |
| `FALSE_REPORT` / `WRONG_AMOUNT` / `WRONG_ACCOUNT` | 예약·관리자 | — |
| `ADMIN_OPENED` | 관리자 수동 접수 | CS |

### resolution (CS)

| 값 | Trade | Coin |
|----|-------|------|
| `FORCE_COMPLETE` | `COMPLETED` | 원장 이전 |
| `FORCE_CANCEL` | `CANCELLED` | 예약 해제 |
| `RESUME` | `WAITING_BUYER_PAYMENT` | 유지·기한 연장 |

`FORCE_REVERSAL`은 P0 제외.

---

## 5. API (M1 + M2 + M3)

구현 상세: [p0-7-disputes.md](../../../brit-api/docs/p0/p0-7-disputes.md).

| API | 액터 | 용도 |
|-----|------|------|
| `POST /v1/trades/{id}/deny-payment` | 판매자 | 미수신 → `DISPUTED` |
| `POST /v1/trades/{id}/disputes` | 구매자 | 확인 문제 → `DISPUTED` |
| `POST /v1/admin/trades/{id}/open-dispute` | CS | 수동 접수 |
| `POST /v1/admin/trades/{id}/resolve-dispute` | CS (리더) | 판결 |
| `GET /v1/admin/disputes` | CS | 분쟁 큐 |
| `GET /v1/admin/disputes/{id}` | CS | 진단 상세 |
| `POST /v1/admin/disputes/{id}/assign` | CS | 배정 |
| `POST /v1/admin/disputes/{id}/takeover` | CS (리더) | 인수 |
| `GET /v1/disputes/{id}` | 당사자 | 채팅방 요약 |
| `GET/POST /v1/disputes/{id}/messages` | 당사자 | 채팅 (내부메모 숨김) |
| `GET/POST /v1/admin/disputes/{id}/messages` | CS | 채팅 + 내부 메모 |

---

## 6. 예방 UX

1. 「입금했어요」「돈 받았어요」— AlertDialog 2단 확인
2. 입금 시트 — 금액·계좌 고정
3. `PAYMENT_REPORTED` — 판매자 「못 받았어요」→ **deny-payment** (로컬 상태 위조 금지)
4. `DISPUTED` — 입금/확인 CTA 잠금. 상태가 `DISPUTED`로 **바뀌는 순간** 양측 `DisputeChat`으로 들어간다. 이미 분쟁인 거래를 다시 열면 「고객센터와 대화하기」.

---

## 7. 로드맵

| 단계 | 범위 | 상태 |
|------|------|------|
| **M1** | deny / open / resolve API, 프론트 HTTP, 어드민 resolve CTA | 완료 |
| **M2** | 분쟁 큐·배정·Workbench(인박스) | 완료 |
| **M3** | `trade_dispute_actions` REST 쓰기 + Socket 수신 | 완료 |
| **M4** | 입금신고 철회, 이미지 증빙, 매크로 **API** | 완료 (업로드·매크로 HTTP. 채팅 UX는 §9) |

M4를 “채팅 UX 완료”로 읽지 말 것. 증빙 파일 선택·매크로 composer는 있으나 복귀·드롭·미배정 강조는 없다.

---

## 8. 관련 문서

| 문서 | 내용 |
|------|------|
| [p0-7-disputes.md](../../../brit-api/docs/p0/p0-7-disputes.md) | **구현 SoT** |
| [p0-6-trade.md](../../../brit-api/docs/p0/p0-6-trade.md) | Trade 진행 |
| [trade-scenarios.md](./trade-scenarios.md) | E2E 시나리오 |
| [trade-payment-ux.md](./trade-payment-ux.md) | 입금 UX |

---

## 9. UX 갭 (API는 있고 화면이 부족한 것)

채팅 REST/Socket·증빙 업로드는 있다. 아래는 그 기능을 자연스럽게 타지 못하는 부분이다.  
구현 순서는 표 위부터.

### 사용자 앱

| ID | 문제 | 현재 | 기대 | 상태 |
|---|---|---|---|---|
| **U1** | 상대가 분쟁을 열어도 채팅으로 안 감 | 판매자 deny 후 placeholder. 구매자는 `POST /disputes`를 다시 눌러야 입장 | `DISPUTED`로 **전이되면** 양측 `DisputeChat`. 이미 열린 방은 open API 없이 `dispute.id`로 입장 | **적용** |
| **U2** | 앱/탭을 닫으면 채팅 복귀 불가 | 홈이 `DISPUTED`를 activeTrade에서 제거. 딥링크에 `/trade/dispute/:id` 없음 | 홈·거래내역·배너·푸시에서 채팅 복귀 | **적용** |
| **U3** | 알림이 채팅이 아님 | `DISPUTE_OPENED` deepLink `/trade?tradeId=`. `navigateFromDeepLink`에 DisputeChat 없음 | `/trade/dispute/:disputeId` | **적용** (U2와 같이) |
| **U4** | DISPUTED 화면이 대기 화면 | 시트 CTA 「분쟁 안내 보기」. 결제 시트가 분쟁에서도 자동 오픈 | 주 CTA 「고객센터와 대화하기」. 분쟁 시 결제 시트 자동 오픈 없음 | **적용** |
| **U5** | 증빙이 파일 선택만 | `type=file` 한 장 | 여러 장·붙여넣기 (드래그는 부가) | **적용** |
| **U6** | placeholder 잔존 | `DisputePlaceholderBottomSheet` 「실구현 전」 | 삭제 또는 채팅 진입으로 교체 | **적용** |
| **U7** | 실시간 끼어들기 | 거래 화면에 있는 상대는 폴링 전까지 대기 화면 | U1 폴링 전이로 일부 해소. 소켓 `opened`는 이후 | **적용** |
| **U8** | 종료 후 다음 화면 | 채팅만 「더 이상 보낼 수 없어요」 | 판결별 Trade 복귀 | **적용** |

### 관리자 인박스

| ID | 문제 | 기대 | 상태 |
|---|---|---|---|
| **A1** | 기본 필터 「내 담당」, 미배정이 약함 | 미배정 우선·SLA 강조 | **적용** |
| **A2** | 이미지 클립+file만 | 드롭존·붙여넣기·여러 장 | **적용** |
| **A3** | 미배정 공개 메시지 409 | 첫 메시지 시 배정 또는 「맡기」를 앞에 | **적용** (공개 전송·증빙 시 자동 배정) |
| **A4** | 안읽음·토스트 없음 | 큐 안읽음 | **적용** (브라우저 저장. 기기·계정 간 공유 없음) |
| **A5** | 매크로가 composer에만 | 원클릭 전송·증빙 요청 템플릿 | **적용** (클릭 즉시 전송. 증빙 요청은 기존 매크로) |
| **A6** | 채팅 안 증빙 확대·드롭 약함 | 버블 확대, 드롭=증빙 | **적용** |

### 1단계 구현 메모 (U1·U4)

- Trade 화면에서 상태가 `PAYMENT_*` → `DISPUTED`로 바뀌면 `dispute.id`로 `DisputeChat` push.
- 처음부터 `DISPUTED`인 거래(히스토리)는 자동 입장하지 않음. CTA만.
- 이미 `dispute.id`가 있으면 `POST .../disputes`를 다시 치지 않음.
- `shouldOpenPaymentSheet(DISPUTED)` = false.

### 2단계 구현 메모 (U2·U3)

- `GET /trades` 목록에 `dispute` 요약. 홈 attention·거래내역 클릭 시 `dispute.id`로 `DisputeChat`.
- `DISPUTE_OPENED` deepLink `/trade/dispute/:disputeId`. `navigateFromDeepLink`가 `/trade`보다 먼저 매칭.
- 배너·푸시 클릭은 deepLink를 따른다. 채팅 화면에 있으면 배너 생략.

### 3단계 구현 메모 (체감 수정)

- 구매자 직접 접수와 U1 자동 입장이 같은 방을 두 번 push하지 않음 (`skipAutoEnter`).
- 스플릿 대시보드에서도 leg가 `DISPUTED`로 바뀌면 채팅 입장.
- 입장 경로는 `openDisputeChatById` 하나. placeholder 시트 삭제.
- 홈은 일반 목록 + `status=DISPUTED`를 합쳐 분쟁 카드가 최근 20건 밖에 있어도 남음.
- 사용자·관리자 채팅: jpeg/png/webp 여러 장·붙여넣기.
- 미배정 공개 메시지·증빙은 전송 전 `assign` 후 진행.

### 4단계 구현 메모 (판결 복귀·실시간·인박스)

- 채팅에서 판결이 나면 Trade로 복귀. 바로 아래가 Trade면 pop, 아니면 replace.
- 이미 종료된 방을 다시 열면 자동 이동하지 않고 「거래 결과 보기」만.
- `dispute.opened`를 당사자 `user:{id}` 룸에도 보낸다. Trade는 폴링 없이 상태를 받아 U1 자동 입장.
- 인박스 기본 큐는 미배정. 오래된 건 위, 미배정 15분 초과는 「대기 지연」.
- 새 접수 토스트. 다른 건 공개 메시지는 안읽음 배지(세션 한정).
- 매크로 클릭은 composer에 넣지 않고 바로 전송. 채팅 이미지는 클릭 확대.

### 5단계 구현 메모 (드롭·안읽음 유지)

- 사용자·관리자 채팅 화면에 파일을 놓으면 jpeg/png/webp를 증빙으로 업로드.
- 인박스 안읽음은 상담원 id 기준 localStorage. 새로고침해도 남고, 건을 열면 지움.

### 6단계 구현 메모 (상담 채팅 UI)

- 살아 있는 분쟁은 바로 채팅. 민원함·고객센터 허브 없음.
- 채팅 셸은 `shared/chat`. 앱바는 Brit 분쟁조정팀, 배너+스레드+카메라 입력.
- Trade `DISPUTED`는 채팅에서 뒤로 나온 멈춘 거래. CTA는 「대화 계속하기」.
