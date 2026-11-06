# Trade Domain

Brit P2P 거래(매칭·결제·분할) 도메인 요약입니다.

**시나리오 (E2E):** [docs/process/trade-scenarios.md](../process/trade-scenarios.md)  
**판매자 수락 매칭:** [docs/process/trade-seller-accept-flow.md](../process/trade-seller-accept-flow.md)  
**예외·분쟁:** [docs/process/trade-disputes.md](../process/trade-disputes.md)  
**입금 UX:** [docs/process/trade-payment-ux.md](../process/trade-payment-ux.md)  
**플랫폼 종합:** [docs/architecture/trade-platform-summary.md](../architecture/trade-platform-summary.md)  
**Phase 2 C2B:** [docs/domains/merchant.md](./merchant.md)  
API 스펙 (req/res·fixture): [docs/domains/api-spec.md](./api-spec.md)  
거래 API·매칭·Redis: [docs/process/trade-api.md](../process/trade-api.md)

## 시작 파일

| 작업 | Activity | Hook | 비고 |
|------|----------|------|------|
| 홈→금액 | `HomeActivity` | `useHomeScreen` | `push TradeCompose` |
| 홈→거래소 | `HomeActivity` | `useHomeScreen` | `push Market` (공개 매도 browse) |
| 거래소 | `MarketActivity` | `useMarketScreen` | 선택 → `requestMarketTrade`(BuyOrder+Apply 원자) → MatchingWaiting |
| 금액 입력 | `TradeComposeActivity` | `useTradeComposeScreen` | BUY → MatchingWaiting, SELL → SellOrderDetail |
| 구매 매칭 | `MatchingWaitingActivity` | `useMatchingWaitingScreen` | Apply 후 대기 → 수락 시 `replace Trade` |
| 판매 운영 | `SellOrderDetailActivity` | `useSellOrderDetailScreen` | 등록 직후·히스토리·Accept |
| 판매 진입 | (홈·거래소) | `useOpenSellEntry` | 활성 판매 있으면 SellOrderDetail, 없으면 TradeCompose SELL |
| 입금·분할 | `TradeActivity` | `useTradeScreen` | split/단건 분기 |
| 단건 상세 | (동일 Trade) | `useTradeDetail` | `tradeId` 있을 때 |

화면 순서: [docs/stackflow/README.md](../stackflow/README.md) 「화면 지도」

## 확정 정책 (MVP)

| 항목 | 결정 |
|------|------|
| Trade 진입 | `/trade?splitGroupId=...` 또는 `/trade?tradeId=...` |
| 동시 거래 | split 전체 1세트, Home 신규 거래 불가 |
| Split UI | 세로 위젯 리스트 + 카드 CTA, 상단 `completedKrw / totalKrw` |
| Split 매칭 | 등록 직후 **전 leg 동시** 매칭 |
| Binding | 양쪽 승인 후 취소 불가, 구매자 입금은 풀페이지 |
| 분쟁 | `DISPUTED` + CS 채팅·resolve, **leg 단위** freeze |
| 매칭 대기 | Trade 밖 탐색 OK, Binding 시 배너/푸시 복귀 |
| 판매 | 1인 1활성. 서버 `ACTIVE_SELL_ORDER_EXISTS`(409) → 내 판매로 이동 |
| 판매 상세 | 매칭은 항상 잔량 전액(분할 판매 없음)이라 금액 현황은 두지 않음. 구매 요청 카드 → 맥락 블록 1개(알림 미설정 → 알림 카드 / 첫 판매 → 진행 3단계 / 그 외 → 거래소 카드 미리보기). 보는 중 거래 시작·완료·취소되면 결과 한 줄 + 홈으로 |

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
| `PAYMENT_PENDING` | 구매자: 입금 지시 풀페이지 / 판매자: 입금 대기 풀페이지 |
| `PAYMENT_REPORTED` | 판매자 확인 / **못 받았어요** |
| `DISPUTED` | 분쟁 채팅, CTA 잠금 |
| `COMPLETED` | terminal |
| `CANCELLED` / `EXPIRED` | terminal |

타입 SoT: `src/features/trade/types.ts` (`TradeStatus`, `ServerTradeStatus`, `serverStatusToClientStatus`).  
`src/features/home/types.ts`는 Trade 타입을 import만 한다.

## 화면 구성 (현재)

| UI | 컴포넌트 | 위치 |
|----|----------|------|
| 금액 입력·확인 | `TradeComposeActivity`, `TradeConfirmAlertDialog` | Trade compose |
| Split 대시보드 | `SplitTradeDashboard` (진행률 위젯 OT-2 보강 여지) | Trade |
| 매칭 피드 | `MatchingFeed` | Trade / MatchingWaiting |
| 글로벌 배너 | `GlobalActiveTradeBanner` | App (Trade 복귀) |
| 구매자 입금 지시 | `TradePaymentBuyerPendingScreen` | Trade 풀페이지 |
| 판매자 확인 시트 | `TradePaymentBottomSheet` | Trade |

매칭·입금·분할 UI는 **Trade feature + 전용 Activity**에 있다. Home은 잔액·퀵액션·매칭 독 등 진입/요약만 담당한다.

## Activity ↔ route (trade 관련)

| Activity | Route | 용도 |
|----------|-------|------|
| `Home` | `/` | 잔액·퀵액션 (탭) |
| `Transactions` | `/transactions` | 거래내역 (탭) |
| `My` | `/my` | 설정 허브 (탭) |
| `TradeCompose` | `/trade/compose` | 금액 입력 |
| `Market` | `/market` | 거래소 browse |
| `MatchingWaiting` | `/trade/matching/:buyOrderId` | 구매 매칭 / Apply 대기 |
| `SellOrderDetail` | `/trade/sell/:sellOrderId` | 판매 운영 |
| `Trade` | `/trade` | 입금·분할 |
| `Store` | `/store` | 탐색 플레이스홀더 (푸시) |
| `Community` | `/community` | 탐색 플레이스홀더 (푸시) |

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
- [docs/process/trade-scenarios.md](../process/trade-scenarios.md)
- [docs/process/trade-disputes.md](../process/trade-disputes.md)
- [docs/process/trade-payment-ux.md](../process/trade-payment-ux.md)
- [docs/domains/merchant.md](./merchant.md)
- [docs/stackflow/README.md](../stackflow/README.md)
- [docs/pwa/trade-motion-diagnosis.md](../pwa/trade-motion-diagnosis.md)
