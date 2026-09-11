> **관련:** [trade-platform-summary.md](../architecture/trade-platform-summary.md), [trade-disputes.md](./trade-disputes.md), [trade-api.md](./trade-api.md)

# C2C 입금·확인 UX (MVP)

Binding 이후 **원화 입금**을 사용자가 편하게 하고, 판매자 확인 부담을 줄이는 방안입니다.  
**이체확인증 업로드는 MVP에서 강제하지 않습니다.**

---

## 1. 제약

| 사실 | 의미 |
|------|------|
| 은행 API 없음 | 앱이 **실제 입금 여부를 자동으로 알 수 없음** |
| P2P 방향 | 구매자 → 판매자 계좌 송금 |
| Binding 후 | 일반 취소 불가 → **실수 방지·분쟁** 중요 |

---

## 2. MVP 권장 플로우

```text
[PAYMENT_PENDING · 구매자] 풀페이지

  {금액}원을 입금해 주세요
  계좌 / 금액 / 복사 (페이지에 바로 노출)
  [입금했어요]
        ↓
  Confirm BottomSheet — 입금을 완료했나요?
        ↓
  report-payment → 판매자 확인 대기

[PAYMENT_REPORTED · 판매자]

  푸시: "○○님이 입금했다고 했어요"
  [돈 받았어요]  [못 받았어요]   ← confirm / deny-payment → DISPUTED
```

정보 확인·송금 지시 → Page. 송금 완료 확정 → BottomSheet.

---

## 3. 예방 장치

| 항목 | 목적 |
|------|------|
| **건 번호·금액·계좌** 3종 고정 표시 | split 동시 입금 실수 방지 |
| 「입금했어요」전 Confirm BottomSheet | 허위 신고 감소 |
| 「돈 받았어요」전 AlertDialog | 확인 실수 감소 |
| 구매자 신고 → 판매자 푸시 | 확인 지연 감소 |

---

## 4. API·정책 연동

| 동작 | API | 비고 |
|------|-----|------|
| 입금 신고 | `POST .../report-payment` | |
| 10분 내 철회 | `POST .../withdraw-payment-report` | 판매자 미확인만 |
| 미수신 | `POST .../deny-payment` | → `DISPUTED` |
| 기한 초과 | 크론 → `EXPIRED` | `DISPUTED` 시 크론 스킵 |

**초안 타이머:** `paymentDeadline` = Binding 후 **30분**.

---

## 5. 증빙

| 시점 | 정책 |
|------|------|
| 정상 플로우 | 이체확인증 **불필요** |
| 분쟁 채팅 | 스크린샷 **선택** 첨부 |

---

## 6. Phase 2 — 자동 입금 감지 (참고)

| 방식 | 장점 | 비용 |
|------|------|------|
| **가상계좌 1 leg 1번호** | webhook으로 `PAYMENT_REPORTED` 자동 | PG/에스크로 제휴 |
| **오픈뱅킹 입금 조회** | 구매자 UX 동일 | 인허가·동의 UX |

MVP는 **§2 수동 신고 + §3 예방**으로 충분합니다.

---

## 7. 구현 체크리스트 (프론트)

- [x] 구매자 `PAYMENT_PENDING` 풀페이지 입금 지시 (`TradePaymentBuyerPendingScreen`)
- [x] 「입금했어요」→ `TradePaymentSentConfirmSheet` → `report-payment`
- [ ] 은행 앱 딥링크 CTA (Phase 2)
- [x] `confirm-payment` 전 AlertDialog
- [x] 판매자 카드 `못 받았어요` → `deny-payment`
- [ ] `notifyTradeMatchedIfReady`와 별도 입금 신고 푸시
