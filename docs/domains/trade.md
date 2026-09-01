# Trade Domain

Brit P2P 거래(매칭·결제·분할) 도메인 요약입니다.

**시나리오 (E2E):** [docs/porcess/trade-scenarios.md](../porcess/trade-scenarios.md)  
**판매자 수락 매칭 제안:** [docs/porcess/trade-seller-accept-flow.md](../porcess/trade-seller-accept-flow.md)  
**예외·분쟁:** [docs/porcess/trade-disputes.md](../porcess/trade-disputes.md)  
**입금 UX:** [docs/porcess/trade-payment-ux.md](../porcess/trade-payment-ux.md)  
**플랫폼 종합:** [docs/architecture/trade-platform-summary.md](../architecture/trade-platform-summary.md)  
**Phase 2 C2B:** [docs/domains/merchant.md](./merchant.md)  
API 스펙 (req/res·fixture): [docs/domains/api-spec.md](./api-spec.md)  
거래 API·매칭·Redis: [docs/porcess/trade-api.md](../porcess/trade-api.md)

## 시작 파일

| 작업 | Activity | Hook | 비고 |
|------|----------|------|------|
| 홈→금액 | `HomeActivity` | `useHomeScreen` | `push TradeCompose` |
| 금액 입력 | `TradeComposeActivity` | `useTradeComposeScreen` | `replace Trade` |
| 매칭·결제 | `TradeActivity` | `useTradeScreen` | split/단건 분기 |
| 단건 상세 | (동일 Trade) | `useTradeDetail` | `tradeId` 있을 때 |

화면 순서: [docs/stackflow/README.md](../stackflow/README.md) 「화면 지도」

## 확정 정책 (MVP)

| 항목 | 결정 |
|------|------|
| Trade 진입 | `/trade?splitGroupId=...` (위젯 대시보드) |
| 동시 거래 | split 전체 1세트, Home 신규 거래 불가 |
| Split UI | 세로 위젯 리스트 + 카드 CTA, 상단 `completedKrw / totalKrw` |
| Split 매칭 | 등록 직후 **전 leg 동시** 매칭 |
| Binding | 양쪽 승인 후 취소 불가, 구매자 입금 시트 자동 |
| 분쟁 | `DISPUTED` + CS 채팅·resolve, **leg 단위** freeze |
| 매칭 대기 | Trade 밖 탐색 OK, Binding 시 배너/푸시 복귀 |

## 코드 위치

| 역할 | 경로 |
|------|------|
| 타입·상수 | `src/features/trade/types.ts`, `constants.ts` |
| 거래 세션 store | `src/features/trade/stores/tradeSession.store.ts` |
| 매칭 세션 | `src/features/trade/matching/` |
| UI (독, 피드, 시트) | `src/features/trade/components/` |
| 홈 연동 hook | `src/features/home/hooks/useHomeScreen.ts` |

## TradeStatus 상태 머신

```text
PAYMENT_PENDING → PAYMENT_REPORTED → COMPLETED
       │                  │
       │                  └──→ DISPUTED → (CS resolve)
    ↓              ↓
CANCELLED*     EXPIRED
```
\* Binding 전·Proposal 단계만. Binding 후는 CS `VOID_TRADE`만.

| Status | UX |
|--------|-----|
| `PAYMENT_PENDING` | 입금 시트, 분쟁 신고 |
| `PAYMENT_REPORTED` | 판매자 확인 / **못 받았어요** |
| `DISPUTED` | 분쟁 채팅, CTA 잠금 |
| `COMPLETED` | terminal |
| `CANCELLED` / `EXPIRED` | terminal |

타입 정의: `src/features/home/types.ts` (`TradeStatus`)

## 홈 화면 ↔ Trade 연동 (목표)

| UI | 컴포넌트 | 위치 |
|----|----------|------|
| 금액 입력·확인 다이얼로그 | `HomeTradeInput`, `TradeConfirmAlertDialog` | Home |
| Split 위젯 리스트 | `SplitTradeLegCards` (예정) | Trade |
| 매칭 피드 | `MatchingFeed` — 가로 히어로(APNG)·leave-ok 바·후보 리스트·인라인 Push·결과 시 하단 제안 CTA | Trade leg 상세 |
| 글로벌 배너 | `GlobalActiveTradeBanner` | App (Trade 복귀) |
| 결제 시트 | `TradePaymentBottomSheet` | Trade |

현재 구현: 매칭·독이 Home에 있음 → Trade Activity로 이전 예정.  
Activity: [`HomeActivity`](../../src/activities/HomeActivity.tsx) → [`TradeActivity`](../../src/activities/TradeActivity.tsx) (예정)

## Activity ↔ route (trade 관련)

| Activity | Route | 용도 |
|----------|-------|------|
| `Home` | `/` | 잔액·금액 입력·확인 다이얼로그 (허브) |
| `Trade` | `/trade?splitGroupId=` | 위젯 리스트·매칭·입금 (C2C 핵심) |
| `Detail` | `/detail/:id` | 거래내역, MY, 스토어, 커뮤니티 |
| `TradeConfirm` | `/trade/confirm` | **deprecated** — Home 확인 다이얼로그로 대체 |

## 주요 store API (tradeSession)

- `createTradeOrder` — 주문 생성 → MATCHING
- `cancelTrade` — 매칭 취소
- `confirmPayment` — 결제 확인 → COMPLETED (+ wallet 반영)
- `getActiveTrade` / `useActiveTrade` — 진행 중 거래 구독

## Wallet coupling (개선 예정)

거래 완료 시 `applyCompletedTrade` → `features/home/stores/homeWallet.store`  
향후 `features/wallet/` 분리 검토. [architecture/overview.md](../architecture/overview.md)

## Consumer UX

- 매칭 피드 = Trade 안 **대기/결과 모드** 분리 (찾는 중 → 정확 일치·비슷한 상대 → 승인 대기), 결과 시 하단 제안 CTA + 히어로 APNG 1곳
- 매칭 독 = 홈 **핵심 모션 1곳** (피드에서는 `matchingSearch` APNG만)
- 매칭 중 잔액 숫자 replay 억제 (`useHomeScreen`)
- Push: `PushEnableCard` 인라인만 (진입 직후 권한 X). leave-ok는 「요청 유지」만 (푸시 단정·시간 약속 금지)

## 관련 문서

- [docs/architecture/trade-platform-summary.md](../architecture/trade-platform-summary.md)
- [docs/porcess/trade-scenarios.md](../porcess/trade-scenarios.md)
- [docs/porcess/trade-disputes.md](../porcess/trade-disputes.md)
- [docs/porcess/trade-payment-ux.md](../porcess/trade-payment-ux.md)
- [docs/domains/merchant.md](../domains/merchant.md)
- [docs/stackflow/README.md](../stackflow/README.md)
- [docs/pwa/trade-motion-diagnosis.md](../pwa/trade-motion-diagnosis.md)
