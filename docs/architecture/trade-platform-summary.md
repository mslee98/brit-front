# Brit 거래·플랫폼 설계 종합 (대화 정리)

팀 합의 기준 **C2C MVP + Phase 2 C2B** 방향을 한 문서로 묶었습니다.  
상세는 링크된 하위 문서를 참고하세요.

**버전**: v0.3 (2026-07-09)

---

## 1. 제품 큰 그림

| Phase | 범위 | 핵심 |
|-------|------|------|
| **Phase 1 (MVP)** | C2C — 사용자 ↔ 사용자, 원화 ↔ MS P2P | 매칭·양쪽 승인(Binding)·입금·확인 |
| **Phase 2** | C2B — 사용자 → **업체** MS 충전 | 매칭 없음, iframe + 업체 API |
| **Phase 3+** | 코인 스왑, 기프티콘 등 | 별도 도메인 |

플랫폼 역할:

- **C2C:** 매칭·에스크로·분쟁 중재
- **C2B:** 결제 위젯·원장·업체 webhook (커미션 정책은 추후)

---

## 2. 확정 정책 (A~K)

| ID | 항목 | 결정 |
|----|------|------|
| **A** | Trade 진입 | `/trade?splitGroupId=...` (분할) / 단건 `tradeId` |
| **B** | 동시 거래 | split 전체 = **진행 중 1세트**. Home **새 거래 불가** |
| **C** | Binding 직후 | 구매자 **입금 지시 풀페이지** (계좌·금액 바로 노출, 시트 자동 오픈 없음) |
| **D** | Split UI | **탭 X** → 세로 **위젯 리스트** + 상세보기. 상단 `completedKrw / totalKrw` |
| **E** | 거래 시작 | Home **확인 다이얼로그** → Trade. `TradeConfirm` **deprecated** |
| **F** | Split 매칭 | 등록 직후 **모든 leg 동시 매칭** |
| **G** | 입금 | **leg 단위 독립** (동시 `PAYMENT_PENDING` 가능) |
| **H** | 매칭 대기 | Trade: 스피너·스켈레톤 + 스토어/커뮤니티. Trade 밖: 글로벌 배너 |
| **I** | 매칭 완료 알림 | **Binding 시점**. Trade 밖 → 배너/푸시 `매칭됐어요 · 이동할까요?` |
| **J** | Binding 이후 | 일반 **취소 API 불가** (`BINDING_LOCKED`) |
| **K** | 분쟁 | `DISPUTED` + 채팅·CS resolve. **해당 leg만** freeze |

**D 보완:** 미래 leg에서도 **매칭 병렬** 가능. 카드마다 **primary CTA**. 진행률은 **COMPLETED 금액만**.

---

## 3. 화면·Stackflow (목표)

```text
Home (/)                      잔액·퀵액션 — 탭
Transactions (/transactions)  거래내역 — 탭
My (/my)                      설정 허브 — 탭
TradeCompose (/trade/compose) 금액 입력
MatchingWaiting (/trade/matching/:id)  구매 매칭
SellOrderDetail (/trade/sell/:id)      판매 운영
Trade (/trade)                입금·분할
Store (/store)                푸시, 탭 없음
Community (/community)        푸시, 탭 없음
```

- 매칭 중 **타 사이트(스토어/커뮤니티) 탐색 OK**
- split Binding 알림: **30초 디바운스** (같은 `splitGroupId`)

상세: [docs/stackflow/README.md](../stackflow/README.md), [docs/porcess/trade-scenarios.md](../porcess/trade-scenarios.md)

---

## 4. C2C 도메인 모델

```text
TradeOrder      의사 (BUY/SELL)
     ↓
MatchProposal   후보·양쪽 승인 → CONFIRMED = Binding
     ↓
Trade           PAYMENT_PENDING → REPORTED → COMPLETED | DISPUTED
     ↑
SplitGroup      위젯 리스트·진행률
```

- **Binding** = 양쪽 승인 직후 `Trade` 생성. 이후 일반 cancel 불가.
- 매칭: `EXACT_AUTO` | `FLEXIBLE_LIST` (서버). Redis ZSET + FIFO.
- escrow: split 등록 시 **총액 잠금**, leg `COMPLETED` 시 해당 분만 차감.

상세: [docs/porcess/trade-api.md](../porcess/trade-api.md), [docs/domains/trade.md](../domains/trade.md)

---

## 5. Split 위젯 (요약)

```text
150만 원 판매 중
████████░░  500,000 / 1,500,000

[1건 ✓ 완료 · 상세보기]
[2건 ● 입금 확인 · 돈 받았어요]
[3건 ○ 매칭 중 · 매칭 보기]
```

| leg | 판매자 CTA | 구매자 CTA |
|-----|-----------|-----------|
| 매칭 중 | 매칭 보기 | 매칭 보기 |
| 입금 대기 | 대기 | 입금하기 |
| 입금 신고됨 | 돈 받았어요 | 대기 |
| 분쟁 | 분쟁 채팅 | 분쟁 채팅 |

---

## 6. 입금·확인 UX (C2C)

은행 연동 없이는 **실제 입금 자동 감지 불가** → 구매자 신고 + 판매자 확인이 기본.

**MVP 편의 (이체확인증 강제 X):** [trade-payment-ux.md](../porcess/trade-payment-ux.md)

- 은행 앱 딥링크 (계좌·금액 prefill)
- CTA 전 확인 다이얼로그
- 판매자 푸시 (신고 시)
- 분쟁 시에만 스크린샷 선택

**타이머 (초안):** 입금 30분, 신고 철회 10분, 판매자 무응답 시 자동 완료 없음.

**Phase 2:** 가상계좌 1 leg 1번호, 오픈뱅킹 입금 조회.

---

## 7. 예외·분쟁

- 상태 `DISPUTED` — 만료 크론 정지
- CS resolution: `RESUME` | `VOID_TRADE` | `FORCE_COMPLETE` | `FORCE_REVERSAL`
- split: **분쟁 leg만** freeze

상세: [docs/porcess/trade-disputes.md](../porcess/trade-disputes.md)

---

## 8. Phase 2 C2B (업체 충전)

**업체 사이트:** 「Brit으로 충전하기」버튼 + 금액 UI.  
**Brit:** iframe에서 로그인·PIN·MS 차감. **매칭·원화 없음.**

**업체 최소 연동:** Intent 생성 → iframe → webhook.

**수익·커미션:** 업체별 `commissionBps`, `feePayer` — **정책 미정 (추후)**.

상세: [docs/domains/merchant.md](../domains/merchant.md)

---

## 9. 문서 맵

| 문서 | 내용 |
|------|------|
| [trade-scenarios.md](../porcess/trade-scenarios.md) | E2E S1–S11 |
| [trade-disputes.md](../porcess/trade-disputes.md) | 예외·분쟁 |
| [trade-payment-ux.md](../porcess/trade-payment-ux.md) | 입금 UX |
| [trade-api.md](../porcess/trade-api.md) | 백엔드·Redis·매칭 |
| [api-spec.md](../domains/api-spec.md) | req/res·fixture |
| [merchant.md](../domains/merchant.md) | C2B·iframe |
| [fixtures/](../fixtures/) | DEV 시나리오 |

---

## 10. 코드 vs 목표 (Gap)

| 항목 | 현재 | 목표 |
|------|------|------|
| 거래 UI | `HomeActivity` + `useHomeScreen` | `TradeActivity` + 위젯 |
| 배너 복귀 | → Home | → `/trade?splitGroupId` |
| Split | `SplitProgressBar` | 위젯 리스트 |
| 상태 | `MATCHING` 혼재 | Order / Proposal / Trade |
| 분쟁 | 없음 | `DISPUTED`, 채팅 |
| C2B | 없음 | embed + Merchant Intent |
| App | trade on Home | `TradeSessionScope` |

---

## 11. 구현 우선순위

### 백엔드

1. TradeOrder + Proposal + Trade 상태 머신  
2. `GET active` + `GET split-groups`  
3. Redis 매칭 + propose/approve  
4. Escrow + Ledger  
5. 만료 크론 + `pendingNotifications`  
6. 분쟁 API·채팅 (M2)  

### 프론트

1. `TradeSessionScope` + Trade route  
2. Home 슬림화 + 확인 다이얼로그  
3. Split 위젯 + leg 상세  
4. 매칭 대기·배너·복귀  
5. 입금 UX (딥링크·다이얼로그)  
6. 분쟁 UI  

### C2B

C2C 핵심 이후 — Intent + embed (커미션 확정 후 정산 필드 고정).

---

## 12. 미결정·보류

| # | 주제 | 상태 |
|---|------|------|
| 1 | C2B 수수료 부담·요율·환불 시 fee | **보류** |
| 2 | `MS_TO_KRW` 1:1 vs 1:1000 | fixture 1:1 |
| 3 | NEAR_TOLERANCE | MVP 0원 |
| 4 | leg EXPIRED 후 재매칭 vs split 중단 | 초안: leg만 |
| 5 | 구매(BUY) split | MVP 판매만 |
| 6 | 가상계좌·오픈뱅킹 | Phase 2 |

---

## 13. 한 줄 요약

> **C2C:** Home은 허브, Trade는 leg 위젯 대시보드, Binding 후 예외는 분쟁·CS만.  
> **C2B:** 업체는 버튼 하나, Brit iframe에서 MS만 이동, 수익은 업체별 커미션(추후 확정).
