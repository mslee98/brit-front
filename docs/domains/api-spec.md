# Brit API Spec (프론트 기준)

현재 프론트엔드 기능·ViewModel·mock/store를 기준으로 백엔드 API req/res와 fixture를 정의합니다.

**관련 문서**

- **플랫폼 종합:** [docs/architecture/trade-platform-summary.md](../architecture/trade-platform-summary.md)
- 시나리오 E2E: [docs/porcess/trade-scenarios.md](../porcess/trade-scenarios.md)
- 예외·분쟁: [docs/porcess/trade-disputes.md](../porcess/trade-disputes.md)
- 입금 UX: [docs/porcess/trade-payment-ux.md](../porcess/trade-payment-ux.md)
- C2B: [merchant.md](./merchant.md)
- 거래 구현 상세(상태 머신·매칭·Redis): [docs/porcess/trade-api.md](../porcess/trade-api.md)
- 거래 프로세스: [docs/porcess/trade-process.md](../porcess/trade-process.md)
- Auth 도메인: [auth.md](./auth.md)
- Trade 도메인: [trade.md](./trade.md)
- Fixture JSON: [docs/fixtures/](../fixtures/)

---

## 1. 프론트 기능 → API 매핑

| 프론트 | 현재 mock/store | API |
|--------|-----------------|-----|
| 홈 | `homeViewModel.mock.ts`, `homeWallet.store` | `GET /v1/me/home` |
| 가입 SMS (레거시) | `auth.api.ts` | `POST /v1/auth/sms/send`, `POST /v1/auth/sms/verify` |
| OCTOMO | `octomo.api.ts` | Edge `octomo` (proof는 draft) |
| 계좌 인증 | `auth.api.ts` | `POST /v1/auth/accounts/verify` |
| 최종 가입 | `completeSignup` | `POST /v1/auth/signup` (nested) |
| 로그인 | `loginWithPassword` | `POST /v1/auth/login` (loginId+PW) |
| 토큰 갱신 | `refreshTokens` | `POST /v1/auth/token/refresh` |
| 로그아웃 | `logout` | `POST /v1/auth/logout` |
| 거래 PIN 변경 | `changeTransactionPin` | `POST /v1/auth/pin` (가입 완료 아님) |
| 세션 | `authSession.store` + JWT | Bearer accessToken |
| 거래 진행 | `tradeSession.store` | `POST /v1/trade-orders`, `GET /v1/me/trades/active`, … |
| 거래 상세 | `TradeDetailViewModel` | `GET /v1/trades/{id}` |
| 분할 | `SplitGroup` | `GET /v1/split-groups/{id}` |
| 매칭 UI | `matchingSession.mock.ts` | `GET /v1/trades/{id}/matching` |
| 거래내역 | `transactions.mock.ts` | `GET /v1/me/trades/history` |
| 프로필 | `profile.mock.ts` | `GET /v1/me/profile` |

---

## 2. 공통 규약

### Headers

```http
Authorization: Bearer {accessToken}
Content-Type: application/json
Idempotency-Key: {uuid}        # POST 상태 변경 API
X-PIN-Token: {stepUpToken}     # confirm-payment 등 (향후)
```

### 에러 응답

```json
{
  "error": "TRADE_STATE_CONFLICT",
  "message": "이미 입금 확인된 거래예요.",
  "details": {},
  "trade": {}
}
```

| HTTP | 용도 |
|------|------|
| 400 | 입력 검증 실패 (`INVALID_CODE` 등) |
| 401 | 재로그인 필요 |
| 404 | 리소스 없음 |
| 409 | version/상태 충돌 — body에 최신 `trade` 포함 |
| 422 | 한도·잔액 부족 |

### 타입 기준 (프론트 1:1)

| 타입 | 경로 |
|------|------|
| `TradeStatus`, `TradeSide`, `SplitMode`, `HomeViewModel` | `src/features/home/types.ts` |
| `TradeRecord`, `TradeDetailViewModel`, `SplitGroup` | `src/features/trade/types.ts` |
| `TransactionItem` | `src/features/transactions/types.ts` |
| `ProfileViewModel` | `src/features/profile/types.ts` |
| `MatchingCandidate`, `MatchingSession` | `src/features/trade/matching/types.ts` |

### 환율 정책

현재 프론트 코드: `MS_TO_KRW = 1` → **`coinAmount = amountKrw`** (`src/features/home/constants.ts`).

> `trade-process.md`의 1:1,000 가정과 다를 수 있음. 백엔드·fixture 확정 전 팀에서 통일 필요.

---

## 3. Auth API

현재 facade: `src/features/auth/api/auth.api.ts`  
Nest: `VITE_API_BASE_URL` → HTTP. OCTOMO만 Supabase Edge.

**계층**

- 1차 로그인: 로그인 아이디 + 비밀번호 → Nest JWT (`tokens`)
- 패스키: P2
- 2차 거래 PIN: Nest profile hash
- Auth 식별자: `loginId`. 닉네임은 거래 공개 이름만.
- Phone E.164 변환·PIN/비번 해시는 Nest

### `POST /v1/auth/login-id/check`

**Request**

```json
{ "loginId": "brit_user01" }
```

규칙: `^[a-z0-9_]{4,20}$`

**Response `200`**

```json
{ "available": true }
```

**Error `400`:** `INVALID_LOGIN_ID`

---

### `POST /v1/auth/nickname/check`

**Request**

```json
{ "nickname": "브릿러4821" }
```

**Response `200`**

```json
{ "available": true }
```

---

### `POST /v1/auth/sms/send`

**Request**

```json
{ "phone": "01012345678" }
```

**Response `200`**

```json
{ "success": true, "expiresInSec": 180 }
```

> 가입 본선은 OCTOMO Edge. SMS OTP는 레거시/보조.

---

### `POST /v1/auth/sms/verify`

**Request**

```json
{ "phone": "01012345678", "code": "123456" }
```

**Response `200`**

```json
{ "verified": true, "signupToken": "st_xxx" }
```

**Error `400`:** `{ "error": "INVALID_CODE" }`

---

### `POST /v1/auth/accounts/verify`

토큰 없음(가입 전).

**Request**

```json
{
  "name": "김브릿",
  "bankCode": "090",
  "accountNumber": "3333012345673"
}
```

**Response `200`**

```json
{
  "verified": true,
  "holderName": "김브릿",
  "bankName": "카카오뱅크",
  "accountNumberMasked": "3333-**-******3",
  "accountVerifyToken": "eyJ...",
  "expiresInSec": 600
}
```

프론트는 `holderName` + **`accountVerifyToken`**을 draft에 저장합니다.

---

### `POST /v1/auth/signup`

최종 가입. **SignupPin confirm**에서 호출. Body는 **nested**.

**Request**

```json
{
  "identity": {
    "name": "김브릿",
    "rrnFront7": "9001011",
    "mobileCarrier": "SKT",
    "phone": "01012345678"
  },
  "credentials": {
    "loginId": "brit_user01",
    "loginPassword": "BritLogin!1",
    "nickname": "브릿러4821"
  },
  "bankAccount": {
    "bankCode": "090",
    "accountNumber": "3333012345673",
    "accountHolderName": "김브릿",
    "accountVerifyToken": "eyJ..."
  },
  "security": {
    "transactionPin": "123456"
  },
  "octomo": {
    "requestId": "oct_req_xxx",
    "verifiedAt": "2026-07-24T05:00:00.000Z"
  },
  "consents": {
    "service": true,
    "privacy": true,
    "identity": true,
    "marketing": false,
    "agreedAt": "2026-07-24T04:50:00.000Z"
  }
}
```

**Response `201`**

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "loginId": "brit_user01",
    "nickname": "브릿러4821",
    "phoneE164": "+821012345678"
  },
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "rt_...",
    "expiresInSec": 3600
  }
}
```

클라이언트는 응답 tokens로 `setSession` — 별도 login 불필요.

**Error**

| HTTP | error |
|------|--------|
| 400 | `CONSENT_REQUIRED` / `INVALID_*` |
| 401 | `OCTOMO_INVALID` |
| 403 | `OCTOMO_EXPIRED` |
| 409 | `LOGIN_ID_TAKEN` / `NICKNAME_TAKEN` / `PHONE_EXISTS` / `IDENTITY_EXISTS` |
| 422 | `ACCOUNT_VERIFY_EXPIRED` / `NAME_MISMATCH` |

가입 체인: Terms → Identity → Sms → Credentials(loginId·닉네임·비번) → Account → Pin → Complete  

Fixture: [docs/fixtures/auth/signup-complete.json](../fixtures/auth/signup-complete.json)

---

### `POST /v1/auth/login`

**Request**

```json
{ "loginId": "brit_user01", "password": "BritLogin!1" }
```

**Response `200`** — signup과 동일 (`success` + `user` + `tokens`)

**Error `401`:** `INVALID_CREDENTIALS`

---

### `POST /v1/auth/token/refresh`

**Request**

```json
{ "refreshToken": "rt_..." }
```

**Response `200`**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "rt_새값...",
  "expiresInSec": 3600
}
```

refresh는 회전됩니다.

---

### `POST /v1/auth/logout`

`Authorization: Bearer {accessToken}`

**Response `204`**

---

### `POST /v1/auth/pin` (거래 PIN 변경)

가입 완료 API가 **아닙니다**. 로그인된 사용자의 거래 PIN 설정·변경용.

**Request**

```json
{ "currentPin": "123456", "newPin": "654321" }
```

**Response `200`**

```json
{ "success": true }
```

**Error `400`:** `{ "error": "INVALID_PIN" }`  
**Error `423`:** `{ "error": "SENSITIVE_LOCKED", "lockedUntil": "..." }` (복구 쿨다운)

---

### 로그인 (패스키 P2)

패스키는 P2. P0는 `POST /v1/auth/login` (loginId + password)만 사용합니다.

레거시 Supabase Auth 참고 (미사용):

```ts
await supabase.auth.signInWithPasskey()
```

휴대폰 + 로그인 비밀번호:

```ts
await supabase.auth.signInWithPassword({
  phone: "+821012345678",
  password: loginPassword,
})
```

패스키 등록 (활성 세션 필요):

```ts
await supabase.auth.registerPasskey()
```

---

### `POST /v1/auth/recovery`

OCTOMO만으로 비밀번호를 재설정하지 않습니다. 최소 2요소.

**Request (예시)**

```json
{
  "phone": "01012345678",
  "octomoVerified": true,
  "accountNumberLast4": "5673",
  "name": "김브릿",
  "birthDate": "1990-01-01",
  "newLoginPassword": "BritLogin!2"
}
```

**Response `200`**

```json
{
  "success": true,
  "sensitiveActionsLockedUntil": "2026-07-24T15:00:00+09:00"
}
```

---

### `GET /v1/me`

**Response `200`**

```json
{
  "id": "user-1",
  "nickname": "Brit유저",
  "isVerified": true,
  "unreadNotificationCount": 2
}
```

Fixture: [docs/fixtures/users.json](../fixtures/users.json)

---

## 4. Home / Wallet API

### `GET /v1/me/home`

`HomeViewModel` shape. PTR·홈 진입 시 호출 (`fetchHomeViewModel` 대체).

**Response `200`**

```json
{
  "user": {
    "id": "user-1",
    "nickname": "Brit유저",
    "isVerified": true
  },
  "wallet": {
    "coinBalance": 2000000,
    "estimatedKrwValue": 2000000
  },
  "unreadNotificationCount": 2,
  "activeTrade": {
    "id": "trade-active-1",
    "role": "BUYER",
    "status": "PAYMENT_REPORTED",
    "amountKrw": 100000,
    "coinAmount": 100000,
    "updatedAt": "2026-07-09T08:00:00+09:00"
  },
  "recentTrades": []
}
```

- `activeTrade`는 `GET /me/trades/active`와 동일 소스 (요약만)
- `activeTrade: null` — 진행 중 거래 없음

Fixture: [docs/fixtures/home-default.json](../fixtures/home-default.json), [home-active-trade.json](../fixtures/home-active-trade.json)

---

### `GET /v1/me/wallet` (선택 분리)

**Response `200`**

```json
{
  "coinBalance": 2000000,
  "estimatedKrwValue": 2000000,
  "availableCoin": 2000000,
  "escrowCoin": 0
}
```

Fixture: [docs/fixtures/wallets.json](../fixtures/wallets.json)

---

## 5. Trade API

거래 상태 머신·멱등·escrow 상세는 [trade-api.md](../porcess/trade-api.md) 참고.

### `GET /v1/me/trades/active`

앱 시작·foreground 복귀 시 **필수**.

**Response `200`**

```json
{
  "trades": [
    {
      "id": "trade-active-1",
      "side": "BUY",
      "role": "BUYER",
      "status": "PAYMENT_REPORTED",
      "amountKrw": 100000,
      "coinAmount": 100000,
      "version": 4,
      "matchingStartedAt": "2026-07-09T08:00:00+09:00",
      "updatedAt": "2026-07-09T08:10:00+09:00",
      "paymentDeadline": "2026-07-09T08:40:00+09:00",
      "splitGroupId": null
    }
  ],
  "splitGroups": [],
  "resumeHint": {
    "primaryTradeId": "trade-active-1",
    "primarySplitGroupId": null
  },
  "pendingNotifications": []
}
```

`pendingNotifications`: Trade 밖일 때 `TRADE_BOUND` 등 복귀 배너용. [trade-api.md §4.6](../porcess/trade-api.md).

---

### `GET /v1/trades/{tradeId}`

`TradeDetailViewModel` 반환.

**Response `200`**

```json
{
  "id": "trade-abc",
  "side": "BUY",
  "role": "BUYER",
  "status": "PAYMENT_PENDING",
  "amountKrw": 100000,
  "coinAmount": 100000,
  "version": 3,
  "matchingStartedAt": "2026-07-09T08:00:00+09:00",
  "updatedAt": "2026-07-09T08:05:00+09:00",
  "paymentDeadline": "2026-07-09T08:35:00+09:00",
  "splitGroupId": null,
  "splitLegIndex": null,
  "splitTotalLegs": null,
  "actions": ["REPORT_PAYMENT", "CANCEL"],
  "counterpartyNickname": "판매자",
  "sellerAccount": {
    "bankName": "카카오뱅크",
    "accountNumber": "3333012345673",
    "accountNumberMasked": "3333-**-******3",
    "holderName": "김브릿"
  }
}
```

**`actions` 계산 규칙** (서버, 프론트 `getActionsForTrade`와 동일):

| status | BUYER | SELLER |
|--------|-------|--------|
| `MATCHING` | `CANCEL` | `CANCEL` |
| `PAYMENT_PENDING` | `REPORT_PAYMENT`, `OPEN_DISPUTE` | `OPEN_DISPUTE` |
| `PAYMENT_REPORTED` | `WITHDRAW_PAYMENT_REPORT`* | `CONFIRM_PAYMENT`, `DENY_PAYMENT` |
| `DISPUTED` | `OPEN_DISPUTE_CHAT` | `OPEN_DISPUTE_CHAT` |
| terminal | — | — |

\* `WITHDRAW_PAYMENT_REPORT`: `reportedAt` 후 10분 이내·판매자 미확인만.

Binding 이후 `CANCEL` **불가** → `409 BINDING_LOCKED`.

- `MATCHING`일 때 `sellerAccount` omit

Fixtures: [docs/fixtures/trades/](../fixtures/trades/)

---

### `POST /v1/trade-orders`

**Headers:** `Idempotency-Key`

**Request** (`CreateTradeOrderInput`)

```json
{
  "side": "BUY",
  "amountKrw": 100000,
  "splitMode": "NONE"
}
```

판매 분할 예:

```json
{
  "side": "SELL",
  "amountKrw": 1500000,
  "splitMode": "AUTO"
}
```

**Response `201`**

```json
{
  "trade": {
    "id": "trade-new-1",
    "side": "BUY",
    "role": "BUYER",
    "status": "MATCHING",
    "amountKrw": 100000,
    "coinAmount": 100000,
    "version": 1,
    "matchingStartedAt": "2026-07-09T08:00:00+09:00",
    "updatedAt": "2026-07-09T08:00:00+09:00"
  },
  "splitGroup": null
}
```

**Error `422`:** `ACTIVE_TRADE_LIMIT`, `INSUFFICIENT_BALANCE`

한도: `TRADE_LIMITS` — min 10,000 / max 5,000,000 KRW

---

### `GET /v1/trade-orders/split-preview`

**Query:** `amountKrw=1500000`

**Response `200`**

```json
{
  "totalAmountKrw": 1500000,
  "unitAmountKrw": 500000,
  "legCount": 3,
  "message": "150만 원을 3번에 나눠 거래해요 (50만 원씩)"
}
```

---

### `GET /v1/trade-orders/{orderId}/matching`

leg·단건 매칭 피드. `GET /v1/trades/{id}/matching` 대신 **order 기준** (신규).

**Response `200`**

```json
{
  "orderId": "order-leg-3",
  "tradeId": null,
  "requestedAmountKrw": 500000,
  "matchMode": "FLEXIBLE_LIST",
  "phase": "BROWSING",
  "candidates": [],
  "pendingMatch": null,
  "proposalExpiresAt": null,
  "startedAt": "2026-07-09T08:00:00+09:00"
}
```

`matchMode`: `EXACT_AUTO` | `FLEXIBLE_LIST` (서버 결정).

Fixture: [docs/fixtures/matching/candidates-100000.json](../fixtures/matching/candidates-100000.json)

---

### `POST /v1/trade-orders/{orderId}/proposals`

**Request**

```json
{ "candidateOrderId": "order-buy-1" }
```

**Response `201`**

```json
{
  "proposal": {
    "id": "prop-1",
    "status": "PENDING_APPROVAL",
    "myApprovedAt": "2026-07-09T08:05:00+09:00",
    "counterpartyApprovedAt": null,
    "expiresAt": "2026-07-09T08:20:00+09:00"
  }
}
```

---

### `POST /v1/trade-orders/{orderId}/proposals/{proposalId}/approve`

**Request:** `{ "version": 1 }`

**Response `200` (양쪽 승인 완료 — Binding)**

```json
{
  "proposal": { "id": "prop-1", "status": "CONFIRMED" },
  "trade": {
    "id": "t2",
    "status": "PAYMENT_PENDING",
    "amountKrw": 500000,
    "version": 1,
    "paymentDeadline": "2026-07-09T08:35:00+09:00"
  }
}
```

---

### `POST /v1/trade-orders/{orderId}/proposals/{proposalId}/withdraw`

Binding 전 제안 철회. **Response `200`:** `{ "proposal": { "status": "WITHDRAWN" } }`

---

### `POST /v1/trades/{tradeId}/report-payment`

**Request**

```json
{ "version": 3 }
```

**Response `200`**

```json
{
  "trade": {
    "id": "trade-abc",
    "status": "PAYMENT_REPORTED",
    "version": 4,
    "reportedAt": "2026-07-09T08:15:00+09:00"
  }
}
```

---

### `POST /v1/trades/{tradeId}/confirm-payment`

**Request**

```json
{ "version": 4 }
```

**Response `200`**

```json
{
  "trade": {
    "id": "trade-abc",
    "status": "COMPLETED",
    "version": 5,
    "completedAt": "2026-07-09T08:20:00+09:00"
  },
  "wallet": {
    "coinBalance": 2100000,
    "estimatedKrwValue": 2100000
  }
}
```

---

### `POST /v1/trades/{tradeId}/cancel`

**Request**

```json
{
  "version": 2,
  "reason": "USER_REQUEST"
}
```

**Response `200`**

```json
{
  "trade": {
    "id": "trade-abc",
    "status": "CANCELLED",
    "version": 3
  }
}
```

Binding 이후 `PAYMENT_*` 에서 호출 시 `409 BINDING_LOCKED`.

---

## 5.5 분쟁 API

상세: [trade-disputes.md](../porcess/trade-disputes.md)

### `POST /v1/trades/{tradeId}/withdraw-payment-report`

구매자 입금 신고 철회. `PAYMENT_REPORTED` + 10분 이내 + 판매자 미확인.

**Response `200`**

```json
{
  "trade": {
    "id": "trade-abc",
    "status": "PAYMENT_PENDING",
    "version": 4
  }
}
```

---

### `POST /v1/trades/{tradeId}/deny-payment`

판매자 미수신 신고.

**Request**

```json
{
  "version": 4,
  "reason": "NOT_RECEIVED",
  "message": "입금 내역이 없어요"
}
```

**Response `200`**

```json
{
  "trade": { "id": "trade-abc", "status": "DISPUTED", "version": 5 },
  "dispute": {
    "id": "disp-1",
    "status": "OPEN",
    "reason": "NOT_RECEIVED"
  }
}
```

Fixture: [docs/fixtures/disputes/dispute-open.json](../fixtures/disputes/dispute-open.json)

---

### `POST /v1/trades/{tradeId}/disputes`

**Request**

```json
{
  "reason": "WRONG_ACCOUNT",
  "message": "다른 건으로 보낸 것 같아요"
}
```

**Response `201`:** `deny-payment`와 동일 shape.

---

### `GET /v1/disputes/{disputeId}`

**Response `200`**

```json
{
  "id": "disp-1",
  "tradeId": "t2",
  "splitLegIndex": 2,
  "status": "UNDER_REVIEW",
  "reason": "NOT_RECEIVED",
  "resolution": null,
  "participants": [
    { "role": "BUYER", "nickname": "김○○" },
    { "role": "SELLER", "nickname": "판매자" },
    { "role": "CS_AGENT", "nickname": "고객센터" }
  ],
  "createdAt": "2026-07-09T09:00:00+09:00"
}
```

---

### `GET /v1/disputes/{disputeId}/messages`

**Response `200`**

```json
{
  "items": [
    {
      "id": "msg-1",
      "senderRole": "SELLER",
      "body": "입금 내역이 없어요",
      "createdAt": "2026-07-09T09:01:00+09:00"
    },
    {
      "id": "msg-2",
      "senderRole": "CS_AGENT",
      "body": "이체 확인서를 첨부해 주세요",
      "createdAt": "2026-07-09T09:15:00+09:00"
    }
  ]
}
```

Fixture: [docs/fixtures/disputes/dispute-open-messages.json](../fixtures/disputes/dispute-open-messages.json)

---

### `POST /v1/disputes/{disputeId}/messages`

**Request**

```json
{ "body": "이체 확인서 첨부했어요", "attachmentId": "att-1" }
```

---

### `POST /v1/internal/disputes/{disputeId}/resolve` (CS)

**Request**

```json
{
  "resolution": "RESUME",
  "targetStatus": "PAYMENT_PENDING",
  "extendPaymentDeadlineMinutes": 30,
  "comment": "기한 연장 후 재입금 안내"
}
```

**Response `200`**

```json
{
  "dispute": { "id": "disp-1", "status": "RESOLVED", "resolution": "RESUME" },
  "trade": {
    "id": "t2",
    "status": "PAYMENT_PENDING",
    "paymentDeadline": "2026-07-09T10:00:00+09:00"
  }
}
```

| `resolution` | Trade 결과 |
|--------------|-----------|
| `RESUME` | `PAYMENT_PENDING` 또는 `PAYMENT_REPORTED` |
| `VOID_TRADE` | `CANCELLED` |
| `FORCE_COMPLETE` | `COMPLETED` |
| `FORCE_REVERSAL` | 역정산 (COMPLETED 후) |

---

### `GET /v1/split-groups/{splitGroupId}`

Trade **위젯 리스트** 데이터 소스.

**Response `200`**

```json
{
  "id": "split-xyz",
  "side": "SELL",
  "status": "IN_PROGRESS",
  "totalAmountKrw": 1500000,
  "completedKrw": 500000,
  "progressPercent": 33,
  "unitAmountKrw": 500000,
  "totalLegs": 3,
  "completedLegs": 1,
  "legs": [
    {
      "index": 1,
      "orderId": "o1",
      "tradeId": "t1",
      "amountKrw": 500000,
      "status": "COMPLETED",
      "uiPhase": "done",
      "primaryAction": "VIEW_DETAIL",
      "counterpartyNickname": "김○○",
      "statusLine": "입금을 확인했어요"
    },
    {
      "index": 2,
      "orderId": "o2",
      "tradeId": "t2",
      "amountKrw": 500000,
      "status": "PAYMENT_REPORTED",
      "uiPhase": "payment_confirm",
      "primaryAction": "CONFIRM_PAYMENT",
      "counterpartyNickname": "이○○",
      "statusLine": "이○○님이 입금했어요를 눌렀어요"
    },
    {
      "index": 3,
      "orderId": "o3",
      "tradeId": null,
      "amountKrw": 500000,
      "status": "BROWSING",
      "uiPhase": "matching",
      "primaryAction": "VIEW_MATCHING",
      "counterpartyNickname": null,
      "statusLine": "구매자를 찾고 있어요"
    }
  ],
  "createdAt": "2026-07-09T08:00:00+09:00"
}
```

| `primaryAction` | 카드 CTA |
|-----------------|----------|
| `VIEW_MATCHING` | 매칭 보기 |
| `REPORT_PAYMENT` | 입금하기 |
| `CONFIRM_PAYMENT` | 돈 받았어요 |
| `VIEW_DETAIL` | 상세보기 |
| `OPEN_DISPUTE_CHAT` | 분쟁 채팅 열기 |

Fixture: [docs/fixtures/trades/split-group-in-progress.json](../fixtures/trades/split-group-in-progress.json)

---

### `GET /v1/trades/{tradeId}/matching` (레거시)

단건·`tradeId` 기준. 신규는 `GET /trade-orders/{orderId}/matching` 우선.

---

## 6. Transactions / Profile

### `GET /v1/me/trades/history?cursor=&limit=20`

**Response `200`**

```json
{
  "items": [
    {
      "id": "trade-1",
      "type": "BUY",
      "status": "COMPLETED",
      "amountKrw": 50000,
      "coinAmount": 50000,
      "completedAt": "2026-07-05T14:30:00.000Z"
    }
  ],
  "nextCursor": null
}
```

Fixture: [docs/fixtures/trades/history.json](../fixtures/trades/history.json)

---

### `GET /v1/me/profile`

**Response `200`** (`ProfileViewModel`)

```json
{
  "nickname": "Brit유저",
  "isVerified": true,
  "bankName": "카카오뱅크",
  "accountNumberMasked": "3333-**-******3",
  "coinBalance": 2000000,
  "estimatedKrwValue": 2000000
}
```

Fixture: [docs/fixtures/profile-authenticated.json](../fixtures/profile-authenticated.json)

---

## 7. Fixture 카탈로그

MSW·백엔드 stub·통합 테스트에서 공통 사용.

| 파일 | 용도 | 대응 프론트 |
|------|------|-------------|
| [fixtures/users.json](../fixtures/users.json) | 사용자 | `authSession`, signup |
| [fixtures/wallets.json](../fixtures/wallets.json) | 지갑 | `homeWallet.store` |
| [fixtures/home-default.json](../fixtures/home-default.json) | 홈 기본 | `MOCK_SCENARIO=default` |
| [fixtures/home-active-trade.json](../fixtures/home-active-trade.json) | 홈 + active trade | `MOCK_SCENARIO=activeTrade` |
| [fixtures/scenarios.json](../fixtures/scenarios.json) | 시나리오 스위치 | DEV 시나리오 전환 |
| [fixtures/trades/*.json](../fixtures/trades/) | 거래 상태별 | `tradeSession.store` |
| [fixtures/matching/*.json](../fixtures/matching/) | 매칭 후보 | `matchingSession.mock` |
| [fixtures/trades/history.json](../fixtures/trades/history.json) | 거래내역 | `transactions.mock` |
| [fixtures/profile-authenticated.json](../fixtures/profile-authenticated.json) | 프로필 | `profile.mock` |
| [fixtures/auth/*.json](../fixtures/auth/) | auth 응답 | `auth.api.ts` |

---

## 8. 앱 시작 API 호출 순서

```text
[앱 시작]
  1. (있으면) Auth refresh
  2. GET /v1/me/trades/active          ← 필수
  3. resumeHint → GET /v1/trades/{id} 또는 GET /v1/split-groups/{id}
  4. GET /v1/me/home (또는 home에 activeTrade 포함)

[거래 시작]
  5. POST /v1/trade-orders (Idempotency-Key)
  6. GET /v1/trades/{id} (+ matching polling)

[입금 신고 / 확인]
  7. POST .../report-payment (version)
  8. POST .../confirm-payment (version)

[foreground 복귀]
  → 2, 3, 4 반복
```

---

## 9. 프론트 전환 순서

| 순서 | 작업 | 대상 파일 |
|------|------|-----------|
| 1 | Auth API real fetch + MSW | `auth.api.ts` |
| 2 | `GET /me/home` | `useHomeViewModel`, `homeViewModel.mock.ts` |
| 3 | Trade active + actions | `tradeSession.store.ts` |
| 4 | History / profile | `transactions.mock.ts`, `profile.mock.ts` |
| 5 | Matching polling | `matchingSession.store.ts` |

---

## 10. MVP 백엔드 우선순위

| 순서 | API |
|------|-----|
| 1 | Auth signup 4종 + `GET /me` |
| 2 | `GET /me/home`, `GET /me/trades/active` |
| 3 | `POST /trade-orders`, `GET /trades/{id}`, report/confirm/cancel |
| 4 | `GET /me/trades/history`, `GET /me/profile` |
| 5 | Split + matching |
| 6 | Push / WebSocket |

---

## 11. 확정·미결정 정책

| # | 항목 | 결정 |
|---|------|------|
| 1 | `MS_TO_KRW` | fixture는 1:1 (`coinAmount = amountKrw`) |
| 2 | 동시 active | **split 1세트** |
| 3 | 입금 기한 | **30분** (초안) |
| 4 | Binding 후 취소 | **불가** (`BINDING_LOCKED`) |
| 5 | 매칭 알고리즘 | Redis ZSET + FIFO, [trade-api.md §4.4–4.5](../porcess/trade-api.md) |
| 6 | 분쟁 | [trade-disputes.md](../porcess/trade-disputes.md) — `DISPUTED`, CS resolve, leg freeze |
| 7 | C2B 커미션 | **보류** — [merchant.md](./merchant.md) |

---

## 12. Merchant API (Phase 2 — 초안)

상세: [merchant.md](./merchant.md). 커미션·`feeMs` 필드는 **정책 확정 후** fixture 반영.

### `POST /v1/merchant/payments/intents`

**Request**

```json
{
  "merchantCode": "GAME_SHOP_A",
  "chargeAmountMs": 50000,
  "externalOrderId": "shop-order-991",
  "returnUrl": "https://shop.com/charge/callback"
}
```

**Response `201`**

```json
{
  "intentId": "mpi_xxx",
  "widgetUrl": "https://brit.app/embed/pay?intent=mpi_xxx",
  "chargeAmountMs": 50000,
  "expiresInSec": 600
}
```

### Webhook `MERCHANT_PAYMENT_COMPLETED`

```json
{
  "event": "MERCHANT_PAYMENT_COMPLETED",
  "intentId": "mpi_xxx",
  "externalOrderId": "shop-order-991",
  "chargeAmountMs": 50000,
  "userId": "user-1",
  "completedAt": "2026-07-09T12:00:00+09:00"
}
```
