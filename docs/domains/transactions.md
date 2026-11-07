# 거래내역

하단 탭 「거래내역」과 상세·분석 화면입니다.  
**데이터 SoT는 서버 통합 API `GET /v1/me/transactions`** 입니다. 정의는 `brit-api/docs/p0/p0-transactions.md`.

---

## 1. 데이터

| 화면 | API | 비고 |
|------|-----|------|
| 목록 | `GET /me/transactions?month=YYYY-MM[&date=YYYY-MM-DD]&type&status&cursor&size=30` | `(occurredAt, id)` 내림차순 keyset. `nextCursor`가 있으면 「더 보기」 |
| 월 요약·캘린더 | `GET /me/transactions/summary?month=YYYY-MM[&type&status]` | `inflow`/`outflow`/`net`은 완료 건만, `count`는 전체. `byDay`로 캘린더 표시 |
| 상세 | `GET /me/transactions/:transactionId` | 상대·계좌(마스킹)·환율·`timeline` |
| 분석 | summary `byKind` (이번 달 + 지난달) | 종류별 비중과 전월 대비 |

- 서버 금액은 문자열 bigint → `api/transactions.api.ts`에서 number로 바꾼다.
- `VITE_USE_MOCK=true`면 같은 함수가 `mocks/history.mock.ts`를 쓴다.
- id 접두사: `trade-`·`purchase-`·`exchange-`·`adjust-`. 화면은 id를 해석하지 않는다(`tradeId`만 사용).

### 종류 (`TransactionKind`)

| kind | 방향 | 제목 예 |
|------|------|---------|
| `P2P_BUY` | 들어옴 | 테** 님에게 구매 |
| `P2P_SELL` | 나감 | 테** 님에게 판매 |
| `BRIT_PURCHASE` | 들어옴 | Brit에서 구매 |
| `PARTNER_CHARGE` | 나감 | {자산} 충전 |
| `PARTNER_REDEEM` | 들어옴 | {자산} 환전 |
| `ADMIN_ADJUSTMENT` | 금액 부호 | Coin 조정 |

유형 칩은 전체·구매·판매·충전·환전. 구매에는 `BRIT_PURCHASE`, 조정은 「전체」에서만 보인다.

---

## 2. 날짜 기준

- **끝난 시각** 기준(완료·취소·실패). 진행 중이면 시작 시각.
- 서버는 KST로 월·일을 자른다. FE `toDateKey`는 기기 시간대(국내 사용 전제).
- 미래 달로는 이동할 수 없다(다음 달 화살표 비활성).

---

## 3. 화면 규칙

순서: 월 선택(◀ ▶) → 월 요약 → **진행 중 N건** → 유형 칩(스크롤 시 상단 고정) → 제목 행 + [목록|달력] → 목록 또는 달력.

- 월 제목을 누르면 월 선택 시트. 거래내역은 ◀ ▶가 있어 ▼ 표시를 두지 않고, 화살표가 없는 분석 화면만 ▼를 보인다.
- 월 선택 시트는 연·월 휠(`shared/ui/WheelPicker`)과 「확인」. 연도는 올해 포함 최근 6년, 올해는 이번 달까지만 보인다. 올해로 바꿀 때 미래 달이면 이번 달로 맞춘다.
- 기본은 **목록**. 달력에서 날짜를 누르면 목록으로 돌아가 그 날만 보여준다. 「날짜 해제」로 월 전체 복귀.
- 날짜를 고른 동안은 날짜 묶음 제목을 숨긴다(제목 행과 중복).
- 진행 중(`PROCESSING`·`CHECKING`)은 날짜 미선택 시 위로 올린다.
- 취소·실패는 금액에 취소선 + 흐린 색. 부제에 상태를 붙인다(완료는 생략).
- 요약은 유형/상태 필터와 무관한 월 전체. 필터가 있으면 제목 행 건수만 필터 기준.
- 행 탭: 진행 중 P2P → `Trade` 화면, 그 외 → `TransactionDetail`.
- 상세: 진행 중 P2P면 「거래 화면으로 이동」, 그 외 「문의하기」(준비 중 snackbar, TX-6).
- 다른 화면에서 돌아오면(`useActivity().isActive`) 요약·첫 페이지를 다시 불러온다.

---

## 4. 파일

| 파일 | 역할 |
|------|------|
| `api/transactions.api.ts` | list / summary / detail, wire 변환, mock 분기 |
| `hooks/useTransactionHistoryScreen.ts` | 월·날짜·유형·상태·보기 상태, 페이지 로딩, 진행 중 분리, 날짜 묶음 |
| `hooks/useTransactionDetailScreen.ts` | 상세 로딩·재시도, 거래 화면 이동 |
| `hooks/useTransactionAnalysisScreen.ts` | 이번 달/지난달 `byKind` |
| `utils/historyCopy.ts` | 행 제목·상태 라벨·부제·타임라인 라벨·날짜 묶음 |
| `utils/coinFlow.ts` | 월/날짜 키, 금액 포맷 |
| `components/TransactionList.tsx` | 행·진행 중 섹션·목록(로딩/오류/빈/더 보기) |
| `components/TransactionCalendar.tsx` | `byDay` 기반 달력 |
