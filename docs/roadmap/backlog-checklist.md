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

완료: 2026-11-07 (TX-1~5). 날짜 기준은 끝난 시각, 기본 보기는 목록.

| ID | 항목 | 상태 | 범위 | 현재 | 해야 할 일 |
|----|------|------|------|------|------------|
| TX-1 | 통합 내역 API | `[x]` | API | `GET /v1/me/transactions` — trades·coin_purchases·partner_exchanges·관리자 조정을 서버 `UNION ALL`로 합침. keyset 커서 | — |
| TX-2 | 월/일 Coin 집계 API | `[x]` | API | `GET /v1/me/transactions/summary` — `inflow`/`outflow`/`net`(완료 건)·`count`·`openCount`·`byKind`·`byDay` (KST) | — |
| TX-3 | history P2P 필터 | `[x]` | API | 통합 API의 `type`/`status` 필터로 대체. `coins/history`는 원장 조회용으로 유지 | — |
| TX-4 | FE mock 제거 | `[x]` | FE | API 연동 + 로딩/오류/빈 상태·더 보기. mock은 `VITE_USE_MOCK`에서만 | — |
| TX-5 | 상세 보조 필드 | `[x]` | API/FE | 상대(마스킹)·은행/계좌(마스킹)·포인트·환율·진행 기록 `timeline` | — |
| TX-6 | 문의하기 | `[ ]` | FE | snackbar만 | CS/문의 연결 |
| TX-7 | 화면 실검증 | `[~]` | FE | 2026-11-07 브라우저: 10·11월 데이터, 취소 행 취소선, 유형 칩, 목록↔달력, 날짜 선택→그 날 목록·해제, 상세 진행 기록, 분석, 월 화살표 | 「더 보기」는 한 달 30건 넘는 데이터가 없어 화면 미확인(API 2페이지는 확인). 충전·환전 행은 데이터 없음 |

관련: `features/transactions/`, `docs/domains/transactions.md`, `brit-api/docs/p0/p0-transactions.md`

---

## 6. 현재 단계 — 알림

| ID | 항목 | 상태 | 범위 | 현재 | 해야 할 일 |
|----|------|------|------|------|------------|
| NT-1 | 인박스 목록·읽음 | `[x]` | FE/API | list / mark read / read-all | — |
| NT-2 | 보관(archive) UI | `[x]` | FE | 행 「⋯」 → 확인 시트 → 보관 + snackbar, 건수 재조회 | 스와이프 삭제는 보류(2026-11-07): SEED에 스와이프 행 컴포넌트가 없어 직접 구현 필요 |
| NT-3 | 페이지네이션 | `[x]` | FE/API | 20건씩 「더 보기」 + `filter` 쿼리 | 무한 스크롤은 필요 시 |
| NT-4 | SSE 다중 인스턴스 | `[~]` | API | 단일 인스턴스 P1 | Redis pub/sub (P2) |
| NT-5 | Push 문서 정합 | `[x]` | DOC | `p0-notifications.md` 추가. `p0-5b`·`p0-6`·README의 “M7 stub” 문구 정리, m1-m4 지시서는 작성 시점 문서임을 명시 | — |
| NT-6 | 알림 센터 UX | `[x]` | FE | 날짜 묶음·아이콘·필터(전체/안 읽음/확인 필요)·처리 상태·빈 상태·모두 읽음·보관 | 문구 보강은 NT-10 |
| NT-7 | 알림 화면 실검증 | `[x]` | FE | 2026-11-07 브라우저 확인: 목록·필터 3종·빈 상태·더 보기(날짜 묶음 이어짐)·보관 시트 열기/닫기·탭→읽음+딥링크·헤더 뒤로/브라우저 뒤로 복귀 후 재조회. 「⋯」가 행 버튼 `::after`에 가려지던 문제 수정 | 「보관하기」 실제 실행은 데이터 보존을 위해 미실행 |
| NT-8 | 양쪽 알림 기존 데이터 | `[x]` | API | **백필 안 함 (결정 2026-11-07).** 수정 전 양쪽 알림은 한쪽 수신자만 있다. 지난 알림을 소급 발송하면 오래된 알림이 「새 알림」으로 뜨고, 거래 상태는 거래 화면에서 확인 가능 | 운영 데이터 이관 시 재검토 |
| NT-9 | 전환 중 화면 이동 실검증 | `[~]` | FE | 진입 전환 중 뒤로·퇴장 중 push 지연, 알림→거래→뒤로(헤더·브라우저) 확인 | MatchingWaiting back guard는 구매 주문을 새로 만들어야 해서 미확인 |
| NT-10 | 알림 문구·메타 보강 | `[x]` | API | 구매 신청·수락·취소 본문을 다음 행동 위주로 변경(「시간 안에 수락하면 거래가 시작돼요」 등). 문구는 수신자별로 저장되므로 이전 알림은 예전 문구 그대로 | — |

관련: `features/notifications/`, `brit-api/.../notifications/`, `docs/domains/notifications.md`, `brit-api/docs/p0/p0-notifications.md`

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

## 8. 코드 품질 경고 (기존 부채)

2026-11-07 기준 측정. 대부분 이번 작업 이전부터 있던 항목이다. 새 코드는 이 경고를 늘리지 않는다.

| ID | 항목 | 상태 | 범위 | 현재 | 해야 할 일 |
|----|------|------|------|------|------------|
| QA-1 | FE eslint 오류 | `[ ]` | FE | `eslint src` 90 errors · 3 warnings. `react-hooks/refs` 33, `set-state-in-effect` 27, `no-empty-object-type` 17, `only-export-components` 6, `no-unused-vars` 5, 기타 5 | 파일 단위로 정리. 우선 `useHomeViewModel`·`useMyScreen`(effect 안 setState), `mockNotificationSource`·`sseNotificationSource`(미사용 변수) |
| QA-2 | FE prettier 설정 없음 | `[ ]` | FE | `.prettierrc` 없음 → 기본값(큰따옴표·세미콜론)과 실제 스타일이 달라 `prettier --check`가 무의미 | 현재 스타일(작은따옴표·세미콜론 없음)로 설정 추가 후 포맷 기준 확정 |
| QA-3 | API prettier 불일치 | `[ ]` | API | 113개 파일 `prettier/prettier` 316건 (`trade.service`·`matching.service`·`notification.service` 등 큰 파일) | 기능 변경과 섞지 않고 포맷 전용 커밋으로 일괄 정리 |
| QA-4 | API eslint 타입 규칙 | `[ ]` | API | `require-await` 132, `no-unsafe-*` 60, `no-unsafe-enum-comparison` 12, `no-unused-vars` 11, `no-unnecessary-type-assertion` 10, `no-base-to-string` 8 | 규칙별로 나눠 정리. `require-await`는 규칙 완화 여부부터 결정 |
| QA-5 | API spec 타입 오류 | `[ ]` | API | jest는 184건 통과하지만 `tsc --noEmit`에서 spec 5개 파일 18건 실패: `coin.service.spec` 9, `partner-exchange.service.spec` 4, `notification-outbox.worker.spec` 3, `orders.service.spec` 1, `trade.service.spec` 1 | 저장소 mock 타입 정리, `MatchingPolicyEntity.tradeRequestTimeoutSeconds` 등 누락 필드 보강 |
| QA-6 | history-sync 내부 형식 의존 | `[~]` | FE | `backGuard`가 `@stackflow/plugin-history-sync` 1.11.x의 history state 형식을 직접 읽음 (코드·`docs/stackflow/README.md`에 메모) | 업그레이드 시 형식 재확인 또는 버전 고정 |
| QA-7 | Stackflow 플러그인 정리 | `[ ]` | FE | `navigationSchedulerPlugin`과 `stackSnapshotPlugin`이 비슷한 전환 상태를 각각 추적 | 동작 검증 후 합칠지 결정 (선택) |

---

## 9. 추천 진행 순서

```text
1) 거래소 1차 — 완료 (EX-1~5). 후속: 금액 필터·페이지네이션

2) 현재 단계 메움 (병렬 가능)
   거래내역 실연동 — 완료 (TX-1~5). 후속: TX-6 문의, TX-7 더 보기·충전/환전 실데이터 확인
   AC-1~5 계정 변경 API
   NT-9 MatchingWaiting back guard (NT-10 완료) · NT-2 스와이프 삭제(보류)
   QA-5 spec 타입 오류 → QA-2·3 포맷 기준 → QA-1·4 lint (기능 작업과 분리)

3) 앱 설치 가이드 보강
   IN-4·5 (시각 + 문서)

4) 업체 큰 틀
   MC-5 문서/SDK → MC-1·2 API → MC-3·6 제품

5) P2
   AC-6·7 패스키, EX-6 호가, OT-1 Store/Community
```

---

## 10. 체크 갱신 규칙

- 화면/API가 main에 머지되면 해당 행을 `[x]` 또는 `[~]`로 바꾼다.
- 큰 틀 1차 완료 기준을 만족하면 섹션 상단에 `완료: YYYY-MM-DD`를 적는다.
- API만 있고 FE가 없으면 `[~]`로 두고 “FE 연동”을 남긴다.
