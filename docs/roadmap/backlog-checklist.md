# Brit 미비 작업 체크리스트

작성일: 2026-10-17  
범위: `brit-front` + `brit-api` (코드·문서 기준)  
목적: 큰 틀 우선순위와 현재 단계 미비를 한눈에 본다. 진행되면 이 문서의 체크만 갱신한다.

범례

- `[ ]` 미착수 / 플레이스홀더
- `[~]` 부분 구현 (화면·API·문서 중 일부만)
- `[x]` 현재 범위에서 완료
- **FE** 프론트 / **API** 백엔드 / **DOC** 문서·가이드

---

## 0. 우선순위 한눈에

| 순위 | 큰 틀 | 한 줄 |
|------|--------|--------|
| 1 | **거래소** | 1차 browse·Apply 합류 완료. 금액 필터·페이지네이션은 후속 |
| 2 | **앱 설치 가이드** | 텍스트 설치 UX는 있음. OS별 시각 가이드·문서 정리가 남음 |
| 3 | **업체 연결** | Admin·포털·Sandbox CHARGE/REDEEM은 있음. Embed·SDK·FE merchant UI는 없음 |

현재 단계에서 같이 메울 것: 계정 변경 API, 거래내역 실연동, 알림 UX, 패스키(P2).

---

## 1. 큰 틀 — 거래소

매칭(Browse/Select·판매 수락)은 있다. 사용자가 “지금 시장에 Coin이 얼마나 나와 있는지”를 **거래소 화면**에서 보는 흐름이 없다.

| ID | 항목 | 상태 | 범위 | 현재 | 해야 할 일 |
|----|------|------|------|------|------------|
| EX-1 | 홈 「거래소」진입 | `[x]` | FE | 퀵액션 → `Market` Activity | — |
| EX-2 | 마켓 요약 API | `[x]` | API | `GET /v1/market/summary` (주문 수·총 Coin) | — |
| EX-3 | 공개 매도 목록 API | `[x]` | API | `seller` 통계(거래·완료율·분쟁·신규) 포함 | 정렬 쿼리·min/max는 후속 |
| EX-4 | 거래소 화면 | `[x]` | FE | 카드+통계 한 줄·정렬칩·Buy/Sell·Apply 합류 | min/max 필터·검색·이전거래 배지(viewer)는 후속 |
| EX-5 | 매칭 vs 마켓 분리 | `[x]` | DOC/FE | 거래소 카피·Market API / candidates 분리 | — |
| EX-6 | 양측 호가/depth | `[ ]` | API/FE | 없음 (Phase 2 개념) | 이번 큰 틀 밖. 필요 시 별도 |

**완료 기준 (1차):** 홈 → 거래소에서 `availableCoinAmount`와 공개 매도 목록을 볼 수 있다. 매칭 대기의 후보 리스트와 혼동되지 않는다.

관련: `brit-api/.../market/`, `brit-front/.../HomeQuickActions.tsx`, `SellOrderList.tsx`, `brit-api/docs/p0/p0-4-orders.md`

---

## 2. 큰 틀 — 앱 설치 가이드 (Android / iOS)

| ID | 항목 | 상태 | 범위 | 현재 | 해야 할 일 |
|----|------|------|------|------|------------|
| IN-1 | beforeinstallprompt / 배너 | `[x]` | FE | `HomeInstallBanner`, `usePwaInstallPrompt` | — |
| IN-2 | OS별 텍스트 가이드 시트 | `[x]` | FE | `InstallGuideBottomSheet` (iOS/Android/in-app/desktop) | — |
| IN-3 | 아이콘·manifest | `[x]` | FE | `public/app-icons/`, VitePWA | — |
| IN-4 | 스크린샷·단계 이미지 가이드 | `[ ]` | FE/DOC | 텍스트만 | OS별 캡처 + 시트/도움말 페이지 |
| IN-5 | 설치 가이드 문서 | `[x]` | DOC | `docs/pwa.md` → `features/pwa/` | Android·iOS 절 시각 자료는 IN-4 |
| IN-6 | iOS Chrome → Safari 안내 | `[~]` | FE/DOC | 카피에만 언급 | 설치 불가 시나리오 UX 강화 |
| IN-7 | 데스크톱 패널 가이드 | `[x]` | FE | `DesktopSidePanel` | 시각 자료만 보강 가능 |

**완료 기준 (1차):** Android·iOS 각각 “설치하는 방법”을 이미지 단계로 볼 수 있고, `docs/pwa.md`가 실제 코드 경로와 일치한다.

관련: `src/features/pwa/`, `docs/pwa.md`

---

## 3. 큰 틀 — 업체 연결 · SDK · 파트너 페이지

| ID | 항목 | 상태 | 범위 | 현재 | 해야 할 일 |
|----|------|------|------|------|------------|
| MC-1 | Partner ERD·온보딩 정책 | `[x]` | DOC | `p0-partner-admin-onboarding.md`, ERD §6 확정 | — |
| MC-1b | 업체 등록·담당자 Admin | `[x]` | API/Admin | `PartnersModule` + `/partners` 화면 | — |
| MC-1c | Client 발급 | `[x]` | API/Admin | Admin 발급·회전·폐기·scopes/origins | 업체 포털에서 키 UX 노출 |
| MC-1d | 수수료 정책·포털 골격 | `[x]` | API/Admin/Partner | exchanges/fees 스키마 + `/partner/*` + `brit-partner` | CHARGE 연동 시 실데이터 |
| MC-2 | CHARGE / REDEEM API | `[~]` | API | Sandbox 동기 `POST /partner/exchanges/charge|redeem` + 업체 원장·수수료·partner-scope idempotency·테스트 | 외부 업체 API·lock 테이블·Intent |
| MC-3 | Merchant 프론트 feature | `[ ]` | FE | `features/merchant/` 없음 | Intent/embed 결제 화면 |
| MC-4 | 홈 「사용처」 | `[~]` | FE | 퀵액션이 **My**로 간다 | 사용처/가맹 목록 또는 안내 |
| MC-5 | 업체 SDK + 설치 가이드 | `[ ]` | DOC | `docs/domains/merchant.md` 초안 | SDK 연동 가이드 (웹/앱), 샘플 |
| MC-6 | 업체 파트너 페이지 | `[~]` | FE | `brit-partner` 대시보드·수수료·전환 조회 | CHARGE 후 실데이터·키 UX |
| MC-7 | `canUsePartnerExchange` | `[~]` | FE/API | 타입·목 필드만 | 실권한·실기능 |

**완료 기준 (1차 온보딩):** 관리자가 업체 등록·담당자 연결까지 한다.  
**완료 기준 (1차 문서·제품 CHARGE):** 업체가 Brit에 붙는 순서와 CHARGE/REDEEM 원장 1건.

관련: `docs/roadmap/partner-onboarding-policy.md`, `docs/domains/merchant.md`, `brit-api/docs/p0/p0-partner-admin-onboarding.md`, `brit_erd_v4_mvp_45_tables.md` §6

---

## 4. 현재 단계 — 계정·보안

| ID | 항목 | 상태 | 범위 | 현재 | 해야 할 일 |
|----|------|------|------|------|------------|
| AC-1 | 비밀번호 변경 UI | `[~]` | FE | 화면 있음 → `준비 중이에요` | `PATCH/POST` 비밀번호 API + 연동 |
| AC-2 | 계좌 변경 UI | `[~]` | FE | pin→bank→account 플로우 | ACTIVE 후 계좌 변경·심사 API |
| AC-3 | 거래 PIN 변경/재설정 | `[~]` | FE | 입력 플로우. API 함수만 있고 미연결 | PIN 변경 API + 화면 연결 |
| AC-4 | 아이디 찾기 | `[~]` | FE | verify 후 snackbar | 조회 API |
| AC-5 | AccountSettings 로그아웃 | `[~]` | FE | 「이 기기/다른 기기」미연결 | SecuritySettings와 통일 |
| AC-6 | 패스키 로그인 | `[ ]` | FE/API | `PASSKEY_LOGIN_ENABLED=false`, mock | WebAuthn 등록·로그인 (P2) |
| AC-7 | 패스키 관리 | `[~]` | FE | SecuritySettings UI 골격 | Nest `user_passkeys` + API |

관련: `ACCOUNT_ACTION_NOT_READY_MESSAGE`, `docs/domains/auth.md`, `brit-api/docs/p0/p0-1-auth.md`

---

## 5. 현재 단계 — 거래내역 실연동

화면(요약·캘린더·필터·상세·분석)은 mock으로 개편 완료.

| ID | 항목 | 상태 | 범위 | 현재 | 해야 할 일 |
|----|------|------|------|------|------------|
| TX-1 | 통합 내역 API | `[ ]` | API | `GET /v1/trades` + `GET /v1/coins/history` 분리 | 구매·판매·충전·환전 통합 또는 FE 병합 규칙 |
| TX-2 | 월/일 Coin 집계 API | `[ ]` | API | 없음. FE가 mock에서 합산 | `inflow`/`outflow`/`net`/`byDay` |
| TX-3 | history P2P 필터 | `[~]` | API | `BRIT_PURCHASE`/`ADMIN`만. P2P는 ALL에만 | `p0-3-coins.md` 주의 반영 |
| TX-4 | FE mock 제거 | `[ ]` | FE | `HISTORY_TRANSACTIONS` 고정 | API 연동 + 빈/로딩/에러 |
| TX-5 | 상세 보조 필드 | `[~]` | API/FE | mock에 상대·계좌·포인트 | 목록/상세 DTO 보강 |
| TX-6 | 문의하기 | `[ ]` | FE | snackbar만 | CS/문의 연결 |

관련: `features/transactions/`, `brit-api/docs/p0/p0-3-coins.md`

---

## 6. 현재 단계 — 알림

| ID | 항목 | 상태 | 범위 | 현재 | 해야 할 일 |
|----|------|------|------|------|------------|
| NT-1 | 인박스 목록·읽음 | `[x]` | FE/API | list / mark read / read-all | — |
| NT-2 | 보관(archive) UI | `[~]` | FE | hook만, 버튼 없음 | 스와이프/메뉴 연결 |
| NT-3 | 페이지네이션 | `[ ]` | FE | page=1 size=50 고정 | 더 보기 / 무한 스크롤 |
| NT-4 | SSE 다중 인스턴스 | `[~]` | API | 단일 인스턴스 P1 | Redis pub/sub (P2) |
| NT-5 | Push 문서 정합 | `[~]` | DOC | 코드에 Push/Outbox 있음. 일부 p0 문서 stale | `p0-5b` 등 “M7 stub” 문구 수정 |
| NT-6 | 알림 센터 UX | `[~]` | FE | 기본 목록 | 필터(거래/분쟁)·빈 상태·딥링크 검증 |

관련: `features/notifications/`, `brit-api/.../notifications/`, `docs/domains/notifications.md`

---

## 7. 기타 남은 제품 갭

| ID | 항목 | 상태 | 메모 |
|----|------|------|------|
| OT-1 | Store / Community | `[ ]` | 플레이스홀더 “준비 중” |
| OT-2 | Split 진행률 UI | `[ ]` | 문서상 “3건 중 2건” 위젯 미구현 |
| OT-3 | trade→home wallet 결합 | `[~]` | overview상 `features/wallet/` 분리 예정 |
| OT-4 | 분쟁 당사자 증빙 HTTP | `[~]` | 서비스 있음, 사용자 controller 미노출(관리자만) |
| OT-5 | seller-accept 문서 | `[x]` | `trade-seller-accept-flow.md` 헤더를 Apply/Accept 구현 상태로 맞춤 |

---

## 8. 추천 진행 순서

```text
1) 거래소 1차 — 완료 (EX-1~5). 후속: 금액 필터·페이지네이션

2) 현재 단계 메움 (병렬 가능)
   TX-1~4 거래내역 실연동
   AC-1~5 계정 변경 API
   NT-2·3·6 알림 UX

3) 앱 설치 가이드 보강
   IN-4·5 (시각 + 문서)

4) 업체 큰 틀
   MC-5 문서/SDK → MC-1·2 API → MC-3·6 제품

5) P2
   AC-6·7 패스키, EX-6 호가, OT-1 Store/Community
```

---

## 9. 체크 갱신 규칙

- 화면/API가 main에 머지되면 해당 행을 `[x]` 또는 `[~]`로 바꾼다.
- 큰 틀 1차 완료 기준을 만족하면 섹션 상단에 `완료: YYYY-MM-DD`를 적는다.
- API만 있고 FE가 없으면 `[~]`로 두고 “FE 연동”을 남긴다.
