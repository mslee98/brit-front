# Merchant Domain (Phase 2 — C2B)

> **문서 상태:** Draft v1.1  
> **대상:** BRIT 사용자·운영자·제휴 업체 개발자·업체 관리자  
> **목적:** 외부 업체와 BRIT MS의 연결, 충전, 환전, 수수료, 정산 및 운영 정책을 정의한다.  
> **설계 기준:** 기존 C2C 거래 도메인과 독립적으로 운영하며, 사용자 Coin/MS 원장은 재사용한다.

**관련 문서**
- 종합 아키텍처: `docs/architecture/trade-platform-summary.md`
- API 상세: `./api-spec.md` §6
- C2C UX: `../process/trade-payment-ux.md`
- C2C 시나리오: `../process/trade-scenarios.md`

---

## 1. 프로젝트 정의

### 1.1 한 줄 정의

외부 제휴 업체 사용자가 BRIT 계정을 연결하고, 보유한 MS를 해당 업체의 전용 포인트로 충전하거나 업체 포인트를 MS로 환전할 수 있도록 제공하는 **B2B2C 자산 전환 시스템**이다.

### 1.2 해결할 문제

| 현재 상황 | 문제 | 시스템 해결 방향 |
|---|---|---|
| 업체마다 별도 포인트 운영 | 서로 다른 포인트를 직접 연동하기 어려움 | BRIT MS를 공통 전환 자산으로 활용 |
| 업체별 독립 회원 계정 | 동일 사용자 식별이 어려움 | 업체 회원과 BRIT 회원 연결 |
| 업체마다 다른 연동 기술 | 개발 및 유지보수 부담 | 공통 SDK 및 API 계약 |
| 서로 다른 자산 원장 | 차감·지급 불일치 위험 | 양측 원장과 전환 상태 관리 |
| 업체별 별도 수수료 | 거래별 수익 추적 어려움 | 수수료 스냅샷 및 정산 원장 |

### 1.3 시스템 책임

**BRIT**
- 업체 Client 인증
- BRIT 사용자 로그인
- 업체 회원 계정 연결
- MS 잔액 및 원장 관리
- 충전·환전 상태 관리
- 외부 지급 결과 검증
- 수수료·정산 관리
- 감사 및 장애 복구

**제휴 업체**
- 업체 회원 인증
- 업체 회원 식별자 제공
- 자체 포인트 잔액 및 원장 관리
- BRIT의 전환 요청에 따른 포인트 지급·차감
- 외부 거래번호 기반 처리 결과 조회
- BRIT Webhook 수신 및 운영 처리

**BRIT SDK**
- BRIT 인증·전환 창 실행
- iframe/팝업 통신
- 결과 이벤트 전달
- 취소 및 오류 반환

SDK는 자산 원장을 직접 수정하지 않는다.

---

## 2. C2C와 C2B의 차이

| 항목 | C2C (Phase 1) | C2B (Phase 2) |
|---|---|---|
| 거래 상대 | 다른 사용자 | 제휴 업체 |
| 자산 이동 | 사용자 → 사용자 | 사용자 ↔ 업체 |
| 실제 결제 수단 | 원화 계좌이체 | BRIT MS·업체 포인트 |
| 매칭 | 필요 | 불필요 |
| 승인 | 구매자·판매자 | 사용자 PIN·업체 API |
| 완료 조건 | 입금 확인·MS 이전 | MS 원장·업체 원장 처리 확인 |
| 상태 머신 | Trade | Merchant Exchange |
| UI | Trade Activity | BRIT Embed |
| 실패 복구 | 분쟁 중심 | 외부 API 대사 중심 |
| 수익 | C2C 수수료 정책 | 업체별 전환 수수료 |

C2C의 `Trade`와 C2B의 `MerchantPayment/Exchange`는 동일한 상태 모델을 사용하지 않는다.

단, MS Wallet / Lot / Ledger는 공통 자산 도메인을 사용한다.

---

## 3. 핵심 사용자 및 역할

| 역할 | 목적 | 책임 |
|---|---|---|
| BRIT 사용자 | 업체 포인트 충전·환전 | 로그인, 연결 동의, PIN 승인 |
| BRIT 운영자 | 제휴 업체 운영 | 업체 승인, Client·수수료·정산 관리 |
| 업체 개발자 | BRIT 연동 구축 | SDK 설치, 서버 API·Webhook 구현 |
| 업체 관리자 | 업체 거래 운영 | 거래 조회, 실패 확인, 정산 조회 |
| 업체 서버 | 외부 자산 처리 | 포인트 예약·지급·차감·결과 조회 |

업체 관리자와 BRIT 일반 사용자 계정은 동일 인물일 수 있지만, 업체 관리 권한과 개인 자산은 별도로 관리한다.

---

## 4. Merchant와 Client 구조

### 4.1 Merchant

`Merchant`는 제휴 업체 자체를 나타낸다.

주요 속성 (`partners`):
- `id`
- `code`
- `name`
- `status`
- `contactName` / `contactPhone` / `contactEmail` / `contactTelegram`
- `memo`
- `createdAt`

상태 (확정):

`ACTIVE ↔ SUSPENDED`, `ACTIVE|SUSPENDED → TERMINATED`  
관리자 등록 시 즉시 `ACTIVE`. 사업자등록번호는 MVP에서 수집하지 않는다.

업체 상태와 Client 상태는 독립적으로 관리한다.

### 4.2 Merchant Client

업체가 BRIT 시스템을 호출하기 위한 인증 단위다.

주요 속성:
- `clientId`
- `merchantId`
- `environment`
- `clientType`
- `status`
- `allowedOrigins`
- `scopes`
- `webhookUrl`

업체 하나가 Sandbox와 Production Client를 각각 가질 수 있다.

### 4.3 API Secret

- Secret은 업체 서버에서만 사용한다.
- 브라우저 SDK에 Secret을 전달하지 않는다.
- 서버에는 Secret 원문 대신 안전한 검증 정보만 저장한다.
- 최초 발급 시 원문을 한 번만 제공한다.
- 회전·폐기 이력을 보존한다.

인증 수단에 따라 API Secret 또는 비대칭키 서명 기반 인증을 사용할 수 있다.

### 4.4 업체 등록 프로세스 (1차 — 관리자 수동)

신청은 메신저·메일로 받는다. 시스템 내 셀프 온보딩은 없다.

1. BRIT 운영자가 관리자 페이지에서 업체 생성 → 즉시 `ACTIVE`
2. 업체 담당자가 일반 회원가입 후 승인(`users.ACTIVE`)
3. BRIT 운영자가 `partner_members`로 사용자↔업체 수동 연결
4. (후속) Sandbox Client 발급 · Origin · Scope
5. (후속) 연동 테스트 · Production Client · CHARGE/REDEEM

**1차 담당자 규칙** (`partner_members`)

- 연결 대상은 `users.status = ACTIVE`만
- 사용자당 ACTIVE 소속 업체 **1개**. 이미 소속이면 추가 금지, **재배정(변경)**만
- `SUSPENDED` 업체에도 신규 담당자 추가 가능
- `TERMINATED` 업체에는 추가 불가, 기존 담당자 역할 변경·해제만
- 역할: `OWNER` / `MANAGER`
- 최종 사용자 Embed 동의 연결(`user_partner_links`)은 1차 범위 밖

구현 SoT: `brit-api/docs/p0/p0-partner-admin-onboarding.md`  
정책 요약: `docs/roadmap/partner-onboarding-policy.md`

---

## 5. 업체 계정 연결 (Merchant Account Linking)

> **구분:** §4.4의 `partner_members`는 **업체 담당자(운영자)** 연결이다.  
> 이 절의 연결은 **최종 사용자**가 Embed에서 CHARGE/REDEEM 하기 위한 `user_partner_links`이며 **후속 단계**다.

### 5.1 기본 정책

BRIT 계정 하나는 여러 업체 계정과 연결할 수 있다.

예시:

| BRIT User | Merchant | Merchant Member | Status |
|---|---|---|---|
| USER-001 | SHOP-A | A-123 | ACTIVE |
| USER-001 | SHOP-B | B-456 | ACTIVE |
| USER-001 | SHOP-C | C-789 | ACTIVE |

업체별 연결은 독립적으로 생성·해제한다.

### 5.2 최초 연결 프로세스

1. 사용자가 업체 홈페이지에 로그인한다.
2. BRIT 충전 버튼을 선택한다.
3. 업체 서버가 회원 식별자와 요청 정보를 전달한다.
4. BRIT Embed가 실행된다.
5. 사용자는 BRIT 계정으로 로그인한다.
6. BRIT이 기존 연결 여부를 확인한다.
7. 연결이 없다면 업체명·연결 범위·동의 내용을 표시한다.
8. 사용자가 동의하면 연결 정보를 생성한다.
9. 이후 개별 충전·환전 승인으로 이동한다.

### 5.3 재방문

기존 연결이 ACTIVE이고 연결 당사자가 동일하면 연결 동의를 재요구하지 않는다.

단, 거래 승인은 별도로 수행한다.

### 5.4 연결 해제

사용자가 연결을 해제하면 이후 신규 전환 요청을 제한한다.

기존 완료 거래, 정산 근거와 감사 이력은 유지한다.

진행 중인 전환이 있을 경우 연결 해제가 해당 거래의 복구 책임을 없애서는 안 된다.

### 5.5 연결 예외

- BRIT 로그인 실패
- 사용자 연결 동의 거부
- 업체 회원 식별자 변경
- 이미 다른 BRIT 회원에 연결된 업체 계정
- 업체 Client 정지
- 연결 세션 만료
- 사용자 계정 정지
- 연결 해제 후 재연결

**협의 필요:** 동일 업체의 여러 회원 계정을 하나의 BRIT 계정에 연결할 수 있는지.

MVP 추천은 업체별 1:1 활성 연결이다.

---

## 6. SDK 및 Embed 구조

### 6.1 SDK의 책임

SDK는 업체 개발자가 BRIT의 인증 및 충전 기능을 쉽게 호출하도록 제공하는 Web 라이브러리다.

주요 기능:
- Client 초기화
- BRIT 창 실행
- iframe 및 팝업 관리
- Origin 검증
- `postMessage` 이벤트 처리
- 취소 및 오류 반환
- 모바일 리다이렉트 대응

### 6.2 SDK 사용 예시

```typescript
import { BritSDK } from "@brit/sdk";

const brit = new BritSDK({
  clientId: "shop_a_public_client",
  environment: "production",
});

const { sessionToken } =
  await shopApi.createBritIntent({
    orderId: "ORDER-991",
    amountMs: 50000,
  });

const result = await brit.openPayment({
  sessionToken,
});
```

업체 서버가 BRIT API를 호출해 Intent를 생성한다.

SDK는 서버가 발급한 단기 세션으로 BRIT Embed를 실행한다.

### 6.3 iframe 및 팝업 정책

지원 방식:
- iframe
- 데스크톱 팝업
- 모바일 리다이렉트

MVP에서는 iframe을 목표로 하되, 서드파티 쿠키 및 브라우저 보안 정책에 따라 팝업·리다이렉트로 전환할 수 있어야 한다.

iframe의 인증 세션은 브라우저에서 항상 유지된다고 가정하지 않는다.

### 6.4 iframe 내 사용자 과업

1. BRIT 로그인
2. 최초 업체 연결 동의
3. 요청 업체 및 충전 금액 확인
4. 사용 가능한 MS 잔액 확인
5. 수수료·실제 차감액 확인
6. PIN 승인
7. 처리 진행 상태 확인
8. 완료·실패·확인 중 안내

업체가 사용자 BRIT 잔액을 직접 조회하는 API는 MVP에서 제공하지 않는다.

---

## 7. Merchant Payment Intent

> **상태:** 목표 API·제품 설계. brit-api에 Intent/Embed 엔드포인트·`@brit/sdk` 패키지는 **아직 없음**.  
> 현재 구현된 동기 전환은 §17 `POST /v1/partner/exchanges/charge|redeem`.

### 7.1 정의

`MerchantPaymentIntent`는 업체가 사용자에게 BRIT MS 충전을 요청하기 위해 생성하는 **일회성 거래 의도**다.

Intent는 실제 자산 이전 결과와 구분한다.

### 7.2 생성 주체

업체 백엔드.

### 7.3 필수 데이터

- `intentId`
- `merchantId`
- `clientId`
- `externalOrderId`
- `merchantMemberKey`
- `chargeAmountMs`
- `feeAmountMs`
- `totalDebitMs`
- `status`
- `expiresAt`
- `createdAt`

추가 후보:
- `merchantAssetId`
- `merchantCreditAmount`
- `exchangeRateSnapshot`
- `commissionPolicyId`
- `returnUrl`
- `metadata`

업체 회원 식별자는 업체 서버에서 인증한 값으로 고정한다.

### 7.4 Intent 생성 API

```http
POST /v1/merchant/payments/intents
Authorization: Bearer {server_access_token}
Idempotency-Key: {unique_request_key}
```

Request:

```json
{
  "merchantCode": "GAME_SHOP_A",
  "externalOrderId": "shop-order-991",
  "merchantMemberKey": "A-123",
  "chargeAmountMs": 50000,
  "returnUrl": "https://shop.example/charge/callback",
  "metadata": {
    "productName": "게임 포인트 충전"
  }
}
```

Response:

```json
{
  "intentId": "mpi_xxx",
  "widgetUrl": "https://brit.app/embed/pay?intent=mpi_xxx",
  "chargeAmountMs": 50000,
  "feeAmountMs": 0,
  "totalDebitMs": 50000,
  "status": "CREATED",
  "expiresAt": "2026-11-03T12:00:00Z",
  "expiresInSec": 600
}
```

위 금액과 수수료는 정책 미확정 상태의 예시다.

BRIT 서버는 인증된 Client에서 업체를 결정해야 하며, 요청 본문의 `merchantCode`는 인증 주체와 일치하는지 검증한다.

### 7.5 Intent 멱등성

- 같은 업체의 같은 `externalOrderId`는 동일 거래로 식별한다.
- 같은 주문번호에 다른 금액이 전달되면 거절한다.
- 이미 완료된 Intent는 다시 처리하지 않는다.
- HTTP 재시도는 기존 결과를 반환한다.

---

## 8. Merchant Payment 및 충전 프로세스

### 8.1 CHARGE 정의

사용자의 BRIT MS를 차감하고, 해당 업체가 관리하는 포인트를 지급한다.

**전제:** 1 MS = 1포인트 상당으로 가정한다.

### 8.2 정상 흐름

| 단계 | 주체 | 처리 | 데이터 |
|---|---|---|---|
| 1 | 사용자 | 충전 요청 | 외부 주문 |
| 2 | 업체 서버 | Intent 생성 | MerchantPaymentIntent |
| 3 | BRIT | 로그인·계정 연결 확인 | UserMerchantLink |
| 4 | 사용자 | PIN 승인 | Authorization |
| 5 | BRIT | MS 잠금 | Wallet / Ledger |
| 6 | BRIT | 업체 포인트 지급 요청 | MerchantPayment |
| 7 | 업체 | 포인트 지급 및 결과 반환 | 업체 포인트 원장 |
| 8 | BRIT | MS 차감 확정 | MS Ledger |
| 9 | BRIT | 완료 및 수수료 기록 | Payment / Fee |
| 10 | BRIT | 완료 Webhook 전송 | Webhook Delivery |

### 8.3 자산 책임

**BRIT 원장**
- 사용자 MS 차감
- 업체 MS 증감
- 수수료 수익
- 전환 거래번호

**업체 원장**
- 업체 회원의 포인트 증감
- 전환 처리 결과
- 중복 처리 방지
- 업체 내 포인트 사용 내역

BRIT의 `merchantCreditMs`와 실제 업체 포인트 지급은 동일한 데이터가 아니다.

### 8.4 실패 복구

업체 포인트 지급 API가 타임아웃되었다고 해서 곧바로 MS를 반환하지 않는다.

결과 확인 프로세스를 사용한다.

- 업체 처리 성공 확인 → MS 차감 확정
- 업체 미처리 확정 → MS 잠금 해제
- 처리 여부 불명 → `RECONCILIATION_REQUIRED`
- 장기 불일치 → 운영자 조사

---

## 9. 상태 모델

### 9.1 Intent 상태

권장 상태:

```text
CREATED
  ├─ USER_AUTHORIZED
  ├─ CANCELLED
  └─ EXPIRED

USER_AUTHORIZED
  └─ PAYMENT_PROCESSING
```

사용자가 PIN을 승인했다고 해서 실제 거래가 완료되었다는 뜻은 아니다.

### 9.2 Payment 상태

```text
REQUESTED
  → ASSET_LOCKED
  → MERCHANT_PROCESSING
      ├─ COMPLETED
      ├─ FAILED_CONFIRMED
      └─ RECONCILIATION_REQUIRED
            ├─ COMPLETED
            └─ FAILED_CONFIRMED
```

### 9.3 상태 정책

- Intent는 만료 후 새로 승인할 수 없다.
- 이미 자산 처리에 진입한 거래는 Intent 만료만으로 취소하지 않는다.
- 사용자 PIN 승인 전에는 취소할 수 있다.
- 외부 지급 진행 중에는 임의 취소를 제한한다.
- 완료된 Payment는 직접 수정하지 않는다.
- 완료 후 취소는 별도 환불·보정 거래를 생성한다.
- 상태 변경은 이벤트로 기록한다.

Intent와 Payment는 상태 소유 주체를 분리한다.

---

## 10. Webhook

### 10.1 목적

Webhook은 BRIT이 업체 서버에 거래의 확정 결과 또는 주요 상태 변경을 전달하는 서버 간 통지 수단이다.

### 10.2 완료 이벤트 예시

```json
{
  "eventId": "evt_001",
  "event": "MERCHANT_PAYMENT_COMPLETED",
  "intentId": "mpi_xxx",
  "paymentId": "mp_xxx",
  "externalOrderId": "shop-order-991",
  "chargeAmountMs": 50000,
  "completedAt": "2026-11-03T12:00:00Z"
}
```

업체는 BRIT 사용자 실명·전화번호를 받지 않는다.

회원 식별이 필요한 경우 업체가 생성한 `externalOrderId`와 자신의 내부 주문 기록을 사용한다.

### 10.3 보안

- HMAC-SHA256 서명
- Timestamp 검증
- 이벤트 식별자 기반 중복 방지
- HTTPS 사용
- 서명 키 회전 지원

### 10.4 전송 정책

- Webhook 실패 시 재시도한다.
- 같은 `eventId`를 중복 수신해도 안전해야 한다.
- 업체는 별도 거래 결과 조회 API를 사용할 수 있다.
- Webhook 전송 실패가 이미 완료된 자산 거래를 취소하지 않는다.

---

## 11. iframe 메시지 통신

### 11.1 완료 메시지

```javascript
window.parent.postMessage(
  {
    type: "BRIT_PAYMENT_SUCCESS",
    intentId: "mpi_xxx",
    paymentId: "mp_xxx"
  },
  "https://shop.example"
);
```

### 11.2 메시지 종류

| 메시지 | 의미 |
|---|---|
| `BRIT_WIDGET_READY` | Embed 준비 완료 |
| `BRIT_PAYMENT_SUCCESS` | BRIT 기준 거래 완료 |
| `BRIT_PAYMENT_CANCELLED` | 사용자 취소 |
| `BRIT_PAYMENT_PENDING` | 처리 결과 확인 중 |
| `BRIT_PAYMENT_ERROR` | 오류 발생 |

### 11.3 원칙

- BRIT은 사전 등록된 업체 Origin으로만 메시지를 전송한다.
- SDK는 메시지 Origin과 Source를 검증한다.
- iframe 메시지는 UI 갱신용으로 사용한다.
- 실제 거래 완료 여부는 업체 서버에서 BRIT API를 통해 확인한다.

---

## 12. REDEEM — 업체 포인트 환전

> **구현 상태:** Sandbox **서버 동기** `POST /v1/partner/exchanges/redeem` 는 구현됨 (§17).  
> 아래 흐름·Embed 승인 UI·비동기 Intent 환전은 **제품/후속** 설계다.

### 12.1 정의

업체 포인트를 차감하고 BRIT MS로 전환한다.

### 12.2 정상 흐름

1. 사용자가 업체에서 환전을 요청한다.
2. 업체가 환전 세션을 생성한다.
3. BRIT에서 계정 연결을 확인한다.
4. 사용자가 환전을 승인한다.
5. 업체가 포인트 사용 가능 여부를 확인한다.
6. 업체가 포인트를 예약·차감한다.
7. BRIT이 MS 지급을 확정한다.
8. 전환 결과와 수수료를 기록한다.

### 12.3 기존 BRIT 원장 연결

환전으로 지급된 MS는 `PARTNER_REDEEM` 출처 Lot으로 관리하는 방안을 유지한다.

기존 정책에 따라 판매 가능 자산으로 취급할 수 있다.

단, 업체의 지급 의무와 Coin 공급·발행 근거를 별도로 검증해야 한다.

---

## 13. 수수료 및 정산

### 13.1 수수료 정책

예정 속성:

```text
merchantId
exchangeType
commissionBps
fixedFeeMs
minFeeMs
maxFeeMs
feePayer
settlementCycle
effectiveFrom
effectiveTo
```

`commissionBps = 70`이면 수수료율은 0.7%다.

### 13.2 거래별 수수료 스냅샷

수수료는 Intent 생성 또는 거래 승인 시점에 계산·고정한다.

확정 시점을 결정해야 하며, 현재 추천은 **Intent 생성 시 견적을 고정하고 거래 완료 시 수수료 발생을 확정**하는 방식이다.

완료된 거래에는 이후 수수료 정책 변경을 소급 적용하지 않는다.

### 13.3 정산 프로세스

```text
완료된 Merchant Payment
  → 거래별 수수료 확정
  → 정산 대상 등록
  → 정산 기간 종료
  → 정산서 생성
  → BRIT 운영자 확인
  → 업체 청구
  → 입금 확인
  → 정산 완료
```

### 13.4 파트너 관리자 제공 정보

- 기간별 거래 건수
- 충전·환전 총액
- 거래별 수수료
- 확정 정산금
- 미납 금액
- 입금 완료 금액
- 정산 상태
- 실패·확인 필요 거래

### 13.5 미결정

- 수수료 부담 주체
- 수수료율
- 최소·최대 수수료
- 정산 방식
- 환불 시 수수료 반환
- 연체 처리
- 음수 업체 잔액 허용 범위

---

## 14. 예외 처리

| 상황 | 시스템 처리 | 사용자 안내 |
|---|---|---|
| Intent 만료 | 승인 차단 | 요청 시간이 만료됨 |
| 로그인 실패 | 재인증 | 다시 로그인 필요 |
| 연결 거절 | 연결 종료 | 연결이 취소됨 |
| 잔액 부족 | 차감 중단 | 충전 가능한 MS 부족 |
| PIN 오류 | 재시도 제한 | PIN 확인 필요 |
| 업체 지급 실패 | 잠금 해제 | 충전이 완료되지 않음 |
| 업체 API 타임아웃 | 결과 조회·대사 | 충전 결과 확인 중 |
| Webhook 미전달 | 재전송 | BRIT 완료 상태 유지 |
| 중복 Intent | 기존 결과 반환 또는 충돌 거절 | 중복 충전 방지 |
| 이미 완료된 거래 취소 | 환불 업무로 분리 | 취소 절차 안내 |
| 업체 Client 중지 | 신규 요청 거부 | 일시적으로 이용 불가 |

모든 예외에서 현재 거래의 상태, 자산 잠금 여부, 복구 책임자를 식별할 수 있어야 한다.

---

## 15. 운영자와 업체 관리자 권한

| 기능 | BRIT 운영자 | 업체 관리자 |
|---|---|---|
| 업체 등록·중지 | 가능 | 불가 |
| Client 발급 | 가능 | 요청 |
| Client Secret 폐기 | 가능 | 정책에 따른 요청 |
| 업체 담당자 관리 | 가능 | 소속 업체 범위 |
| 수수료 정책 변경 | 가능 | 불가 |
| 전환 거래 조회 | 전체 | 소속 업체 |
| 정산 조회 | 전체 | 소속 업체 |
| 강제 보정 | 별도 권한·승인 | 불가 |
| 감사 로그 | 권한 범위 | 제한된 업무 이력 |

업체 담당자는 다른 업체의 거래 및 정산 정보를 조회할 수 없다.

관리자 강제 보정에는 변경 사유, 변경 전후 값, 관련 거래번호, 처리자를 기록한다.

---

## 16. ERD 구성 방향

### 16.1 기존 ERD v4 재사용

| Merchant 개념 | 기존 ERD v4 |
|---|---|
| Merchant | `partners` |
| Merchant Manager | `partner_members` |
| Merchant Client | `partner_clients` |
| Client Secret | `partner_client_secrets` |
| Client Scope | `partner_client_scopes` |
| Allowed Origin | `partner_client_origins` |
| Account Link Session | `partner_link_sessions` |
| User Merchant Link | `user_partner_links` |
| Merchant Asset | `partner_assets` |
| Merchant Exchange | `partner_exchanges` |
| Exchange Events | `partner_exchange_events` |
| External Attempts | `partner_exchange_attempts` |
| Commission Policy | `partner_fee_policies` |
| Commission Accrual | `partner_fee_accruals` |
| Settlement | `partner_settlements` |
| Settlement Items | `partner_settlement_items` |
| Settlement Payments | `partner_settlement_payments` |
| Merchant Wallet | `partner_coin_wallets` |
| Merchant Ledger | `partner_coin_ledger_entries` |

### 16.2 신규 개념 검토

- `MerchantPaymentIntent`: 업체의 일회성 충전 요청
- `MerchantPayment`: 자산 처리 결과
- `MerchantWebhookDelivery`: Webhook 전송 이력
- `MerchantReconciliation`: 외부 원장 대사 작업

`MerchantPayment`와 기존 `partner_exchanges`를 각각 독립된 루트로 만들지 여부는 미확정이다.

**추천:** 단순 충전·환전이라면 `partner_exchanges`를 실제 거래 루트로 재사용하고, Intent만 독립적으로 추가한다. 중복된 원장·상태 관리 테이블은 만들지 않는다.

---

## 17. API 구성 방향

> **확정:** 관리자·DB·코드 네임스페이스는 `partner`로 통일한다.  
> 구현 SoT: `brit-api/docs/p0/p0-partner-admin-onboarding.md`

### BRIT 운영자 (구현됨)

```text
GET|POST   /v1/admin/partners
GET|PATCH  /v1/admin/partners/:partnerId
POST       /v1/admin/partners/:partnerId/suspend|resume|terminate
GET|POST   /v1/admin/partners/:partnerId/members
POST       /v1/admin/partners/:partnerId/members/reassign
PATCH|POST /v1/admin/partners/:partnerId/members/:memberId(|/remove)
GET|POST   /v1/admin/partners/:partnerId/clients
GET|PATCH  /v1/admin/partners/:partnerId/clients/:partnerClientId
POST       /v1/admin/partners/:partnerId/clients/:partnerClientId/rotate-secret|revoke
GET|POST   /v1/admin/partners/:partnerId/fee-policies
POST       /v1/admin/partners/:partnerId/fee-policies/:policyId/deactivate
```

### 업체 포털 (담당자 JWT · 구현됨)

```text
GET    /v1/partner/me
GET    /v1/partner/dashboard
GET    /v1/partner/fee-policies
GET    /v1/partner/fee-accruals
GET    /v1/partner/exchanges
```

앱: `brit-partner` (일반 `/auth/login` + `partner_members` ACTIVE).

### 업체 서버 — CHARGE/REDEEM (Sandbox 동기 · 구현됨)

인증: `X-Partner-Client-Id` + `X-Partner-Api-Secret` (SERVER Client, scope 필요)

```text
POST   /v1/partner/exchanges/charge   # EXCHANGE_CHARGE
POST   /v1/partner/exchanges/redeem   # EXCHANGE_REDEEM
```

Admin 준비: `POST /v1/admin/partners/:id/assets`, `POST .../user-links`  
전제: ACTIVE 링크·자산·수수료 정책. 멱등: `idempotencyKey` (또는 `Idempotency-Key` 헤더).

후속(비동기·Intent):

```text
POST   /v1/partner/payments/intents
GET    /v1/partner/payments/intents/:id
```

### BRIT Embed 사용자 (후속)

```text
GET    /v1/embed/intents/:id
POST   /v1/embed/intents/:id/authorize
POST   /v1/embed/intents/:id/cancel
GET    /v1/embed/intents/:id/status
```

### 사용자 계정 연결 (후속 · user_partner_links)

```text
GET    /v1/me/partner-links
POST   /v1/partner/link-sessions/:id/consent
POST   /v1/me/partner-links/:id/revoke
```

### 정산 (후속)

```text
GET    /v1/partner/settlements
GET    /v1/partner/settlements/:id
GET    /v1/partner/payments
```

---

## 18. 단계별 구현 계획

> Sandbox **서버 동기** CHARGE/REDEEM·Admin Client·포털 조회는 §17 기준으로 **이미 있음**.  
> 아래 표의 남은 단계는 Embed·Intent·계정 연결·비동기 복구·정산 제품화다.

| 단계 | 구현 범위 | 상태 | 완료 기준 |
|---|---|---|---|
| B0 | Merchant 도메인·원장·정책 확정 | 완료 | 상태 및 책임 경계 합의 |
| B1 | 업체 등록·Client·수수료 Admin | 완료 | Sandbox Client 발급·인증·정책 등록 |
| B1s | 동기 CHARGE/REDEEM + 포털 조회 | 완료 | `POST /partner/exchanges/*` + brit-partner 목록 |
| B2 | 계정 연결·Embed 인증 | 미착수 | A/B업체 연결·해제 성공 |
| B3 | Intent + Embed CHARGE UX | 미착수 | Intent 생성·승인·Mock 포인트 충전 |
| B4 | 실패 복구·Webhook | 미착수 | 중복·타임아웃 복구 검증 |
| B5 | Embed/비동기 REDEEM UX | 부분(동기 API만) | 사용자 승인 UX + 업체 포인트→MS |
| B6 | 수수료·정산 | 부분(정책·accrual) | 업체별 정산서·정산 API |
| B7 | 환불·자동화 | 미착수 | 반대 거래·대사·운영 자동화 |

**다음 제품 MVP:** B2~B4 (연결 + Intent/Embed CHARGE + 복구).  
양방향 환전 UX가 필수면 B5도 함께 본다.

---

## 19. 출시 전 검증 시나리오

- A업체 최초 연결
- A업체 재방문
- B업체 추가 연결
- 업체 연결 거절
- 연결 해제 후 재연결
- 정상 MS 충전
- MS 잔액 부족
- PIN 연속 오류
- 동일 Intent 중복 승인
- 업체 포인트 지급 후 응답 타임아웃
- 업체 API 명시적 실패
- MS 차감 확정 중 서버 장애
- 동일 Webhook 중복 수신
- Webhook 미전달 후 재전송
- Client 폐기 후 API 호출
- 업체 A가 업체 B의 Intent 조회
- 포인트 환전 중 업체 잔액 부족
- 수수료 정책 변경 전후 거래
- 정산 불일치 발생
- 완료 후 환불·보정

### 검증 기준

- 동일 거래의 이중 지급 0건
- 동일 MS의 이중 사용 0건
- 완료 거래의 이력 누락 0건
- 타임아웃 거래의 복구 경로 확보
- 업체 간 데이터 접근 차단
- 실패·재시도 이력 추적 가능

---

## 20. 미결정 정책

| 번호 | 정책 | 권장 방향 |
|---|---|---|
| D1 | Merchant와 Partner 용어 | **확정:** DB·Admin API·코드는 `partner`. 제품 카피의 “업체”는 한글 표기 |
| D2 | C2B의 최종 범위 | 업체 포인트 충전·환전 우선 |
| D3 | Intent와 Exchange 관계 | Intent 별도, Exchange 루트 재사용 |
| D4 | 계정 연결 정책 | 업체별 최초 동의 필수 |
| D5 | iframe 인증 | Popup/Redirect fallback 필수 |
| D6 | 포인트 지급 책임 | 업체 API가 실제 원장 처리 |
| D7 | Webhook 역할 | 확정 결과 통지 중심 |
| D8 | 수수료 부담 | 업체 부담 우선 검토 |
| D9 | 환전 기능 | 별도 REDEEM 프로세스 |
| D10 | 완료 거래 취소 | 별도 환불·보정 거래 |
| D11 | 업체 Coin 음수 | 한도·채무·정산 정책 검증 |
| D12 | 정산 자동화 | 초기 수동 확인 후 확장 |

정책 미확정 항목은 실제 구현 시 임의로 확정하지 않는다.

---

## 21. UX 설계에 전달할 사용자 과업

이 문서의 상태·정책이 확정된 후 다음 과업을 기준으로 User Flow를 설계한다.

1. 사용자가 업체에서 BRIT 충전을 시작한다.
2. BRIT에 로그인한다.
3. 최초 업체 연결에 동의하거나 거부한다.
4. 충전 금액과 수수료를 확인한다.
5. PIN으로 승인한다.
6. 처리 중 상태를 확인한다.
7. 성공·실패·확인 중 결과를 확인한다.
8. 업체 화면으로 돌아간다.
9. BRIT에서 연결된 업체를 확인·해제한다.
10. 업체 포인트를 BRIT MS로 환전한다.

관리자 UX는 업체 등록, Client 발급, 거래 조회, 실패 복구, 수수료 정책, 정산 확인 업무를 기반으로 별도 정의한다.