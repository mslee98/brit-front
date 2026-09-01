# Auth Domain

회원가입·본인인증·로그인(패스키/비밀번호)·거래 PIN·세션 도메인 요약입니다.

## 인증 계층 (섞지 않음)

| 구분 | 용도 | 저장 |
|------|------|------|
| 로그인 아이디 | Auth 식별자 | Nest `users.login_id` |
| 로그인 비밀번호 | 아이디와 함께 1차 로그인 | Nest `users.password_hash` |
| 패스키 | 보조 로그인 (P2) | `user_passkeys` (예정) |
| 휴대폰 | 본인확인·고유 연락처 | Nest profile / E.164 (서버 변환) |
| 거래 PIN | 거래·환전·계좌 변경 | Nest profile `transaction_pin_hash` |
| 닉네임 | 거래 공개 이름 | Nest profile (로그인 ID 아님) |
| 세션 | JWT access/refresh | Nest `user_sessions` + 클라 `authSession.store` |

## 시작 파일

| 작업 | Activity | Hook | API / 유틸 |
|------|----------|------|------------|
| 약관 동의 | `SignupTermsActivity` | `useSignupTermsScreen` | draft consents → Nest items |
| 본인확인 | `SignupIdentityActivity` | `useSignupIdentityScreen` | draft (주민번호 13자리) |
| 아이디·닉네임·비번 | `SignupCredentialsActivity` | `useSignupCredentialsFlow` | check APIs + secrets |
| 계좌 | `SignupAccountActivity` | `useSignupAccountScreen` | 은행+계좌 입력만 (verify 없음) |
| 거래 PIN·최종 가입 | `SignupPinActivity` | `useSignupPinFlow` | `completeSignup` → PENDING |
| 완료 | `SignupCompleteActivity` | (Activity 내) | 승인 대기 → Login |
| 로그인 | `LoginActivity` | `useLoginScreen` | loginId + password (ACTIVE만) |
| 보안 설정 | `SecuritySettingsActivity` | `useSecuritySettingsScreen` | logout / passkey |
| 계정 복구 | `AccountRecoveryActivity` | `useAccountRecoveryScreen` | recovery API |

화면 순서: [docs/stackflow/README.md](../stackflow/README.md) 「화면 지도」

**API 스펙:** [docs/domains/api-spec.md](./api-spec.md) §3 Auth API  
**Fixture:** [docs/fixtures/auth/](../fixtures/auth/)  

## 코드 위치

| 역할 | 경로 |
|------|------|
| 상수·스텝 | `src/features/auth/constants.ts` |
| 가입 draft | `src/features/auth/stores/signupDraft.store.ts` |
| 가입 secrets | `src/features/auth/stores/signupSecrets.store.ts` (loginPassword·transactionPin, 메모리만) |
| 세션 | `src/features/auth/stores/authSession.store.ts` (tokens + user) |
| API facade | `src/features/auth/api/auth.api.ts`, `banks.api.ts` |
| API adapters | `src/features/auth/api/adapters/` (http / mock; supabase는 레거시·복구) |
| phone 정규화 | `src/features/auth/utils/phoneE164.ts` (표시용). **E.164 변환은 Nest** |
| Edge | `supabase/functions/octomo/` (계정 복구 등 레거시; **가입 본선 미사용**) |
| UI | `src/features/auth/components/` |
| Activity | `src/activities/auth/` |

## API 레이어

hook/UI는 facade만 호출합니다. Nest가 source of truth입니다.

**형제 API:** Nest.js. `VITE_USE_MOCK=true`가 아니면 HTTP adapter. `httpClient`는 same-origin `/v1`(Vite 프록시). 다른 origin일 때만 `VITE_API_BASE_URL`.

| 레이어 | 책임 | 예 |
|--------|------|-----|
| facade | 도메인 함수 시그니처·어댑터 선택 | `completeSignup`, `loginWithPassword` |
| adapters | HTTP / mock | `auth.http.ts`, `auth.mock.ts` |

- `VITE_USE_MOCK=true`가 아니면 HTTP (Nest)
- `true`이면 mock
- `httpClient`가 Bearer accessToken 자동 부착 · 에러는 `code ?? error` 파싱
- signup 응답: `{ id, loginId, status: "PENDING" }` — **세션/토큰 없음**
- login 응답: `{ user, tokens }` (`success` 없음) → `setSession` (ACTIVE만)
- refresh: `POST /v1/auth/refresh`
- Swagger: `http://localhost:3000/docs`

## Phone 정규화

| 위치 | 형식 |
|------|------|
| 가입 draft / UI | `01012345678` (숫자만) |
| Nest DB | E.164 `+821012345678` (서버 변환) |

프론트는 draft를 숫자로 유지합니다.

## 가입 Activity 체인

```mermaid
flowchart LR
  SignupTerms --> SignupIdentity
  SignupIdentity --> SignupCredentials
  SignupCredentials --> SignupAccount
  SignupAccount --> SignupPin
  SignupPin --> SignupComplete
  SignupComplete --> Login
```

| Activity | Route | Params | 설명 |
|----------|-------|--------|------|
| `SignupTerms` | `/auth/signup/terms` | — | 필수 4종(SERVICE/PRIVACY/UNIQUE_IDENTIFIER/BANK_ACCOUNT) + MARKETING |
| `SignupIdentity` | `/auth/signup/identity` | — | 이름·주민번호(13)·통신사·휴대폰 |
| `SignupCredentials` | `/auth/signup/credentials` | `step?`: `loginId` \| `nickname` \| `password` | 계정 설정 (제출 없음) |
| `SignupAccount` | `/auth/signup/account` | `step?`: `bank` \| `accountNumber` | 은행+계좌 입력만 (`accounts/verify` 없음) |
| `SignupPin` | `/auth/signup/pin` | `step?`: `create` \| `confirm` | PIN + **nested completeSignup** |
| `SignupComplete` | `/auth/signup/complete` | — | 승인 대기 안내 → Login |
| `Login` | `/auth/login` | — | 아이디+비번 Primary · 패스키 Secondary(P2) |
| `SecuritySettings` | `/auth/security` | — | 패스키·세션·logout |
| `AccountRecovery` | `/auth/recovery` | `step?` | 복구 |

### SignupCredentials 내부

```text
loginId → nickname → password(+confirm)
```

- `loginId`: debounce `checkLoginId` → draft
- `nickname`: debounce `checkNickname` → draft
- `password`: secrets에 loginPassword → `push SignupAccount`
- 회원 생성하지 않음

### PIN flow (거래 PIN + 최종 제출)

- `create` 6자리 → secrets.transactionPin → `replace confirm`
- confirm 일치 → nested `POST /v1/auth/signup` → **세션 없음** → `SignupComplete`
- 응답 `status: PENDING` — 관리자 승인 후 ACTIVE에서만 로그인

최종 제출 시점은 **Pin confirm**입니다.

> OCTOMO(`SignupSms`)·`accounts/verify`는 가입 플로우에서 제거됐습니다.
## Identity progressive form

내부 스텝 (`SignupIdentityStep`): `name` → `rrn` → `carrier` → `phone`

- UI: `SignupProgressiveForm` + `ActiveStepInput`
- CTA: form submit (`SIGNUP_IDENTITY_FORM_ID`)
- RRN: 숫자 13자리 수집, 제출 시 `900101-1234567` (`residentRegistrationNumber`)
- phone 다음 → `push('SignupCredentials')` (Sms 없음)
- Progress 헤더: `SignupProgressHeader`

## PIN flow (거래 PIN)

- `create` 6자리 → secrets 저장 → `replace('SignupPin', { step: 'confirm' })`
- confirm 불일치 → snackbar + 재입력
- confirm 일치 → 등록 중 UI → `completeSignup` → **세션 없음** → `SignupComplete`
- 뒤로: confirm → `replace` create

Hook: `src/features/auth/hooks/useSignupPinFlow.ts`

## Progress bar

`SignupProgressHeader` — Activity 단위 `type` (필드별 step은 번호에 영향 없음):

| type | n / 5 | label |
|------|-------|-------|
| identity | 1 | 본인정보 |
| credentials | 2 | 계정 설정 |
| account | 3 | 계좌 연결 |
| pin | 4 | 거래 PIN |
| complete | 5 | 승인 대기 |

`SignupTerms`는 진행률 미표시. 닫기(X)만 이탈 확인 (`useSignupExitGuard`).

## 뒤로가기 vs 닫기

- 헤더 뒤로가기 → 이전 step/Activity (경고 없음)
- 오른쪽 닫기(X) → `SignupExitAlertDialog` → draft/secrets reset → Login
- Identity `carrier`처럼 선택 UI여도 하단 CTA는 유지
- Account `bank`(풀스크린 기관 선택)만 CTA 없음 — 이탈은 헤더 X

## 로그인

- Primary: 아이디 + 비밀번호 (`loginWithPassword`) → Nest JWT → `setSession` → `navigateToRootHome`
- Secondary: 패스키 (`PASSKEY_LOGIN_ENABLED`, 미구현 시 버튼 비활성 + `곧 사용할 수 있어요`)
- CTA: `bottomCTABehavior="keyboardAdaptive"` (키패드 위)
- 보조: `아이디·비밀번호 찾기` 시트 → `AccountRecovery` / `계정이 없으신가요? 회원가입` → `SignupTerms`
- 실패: `INVALID_CREDENTIALS` 등은 뭉뚱그린 메시지, 네트워크/5xx는 `잠시 후 다시 시도해 주세요.` (아이디 존재 여부 미노출)
- **PENDING/미승인**: `USER_PENDING` / `ACCOUNT_PENDING` / 403 → `가입 승인 대기 중이에요. 승인되면 로그인해 주세요.`

## 계정 복구 (P1)

OCTOMO만으로 비밀번호를 즉시 재설정하지 않습니다. 최소 2요소:

```text
OCTOMO + (계좌 예금주 확인 | 이름·생년월일 | 기존 기기 승인 | 복구 이메일)
```

복구 후 `sensitive_actions_locked_until` 동안 계좌 변경·고액 거래·출금·거래 PIN 변경을 막습니다.

## 인증 가드

- `useRequireAuth(reason)` — 거래 등 인증 필요 액션
- `useAuthRequiredPrompt` — 탭에서 로그인 유도
- `AuthRequiredAlertDialog` — **`닫기` / `로그인`만** (가입은 Login에서)
- `assertSensitiveActionAllowed` — 복구 쿨다운 검사

가입 진입: Login → `회원가입` → `SignupTerms`

## Stack 밖 네비게이션

- 탭·가드에서 미인증: `actions.push('Login', {})` ([GlobalBottomNavigation](../../src/app/layouts/GlobalBottomNavigation.tsx))
- 가입: Login → `회원가입` → `SignupTerms`
- 가입 완료: `replace('Login')` ([SignupCompleteActivity](../../src/activities/auth/SignupCompleteActivity.tsx))

## Consumer UX

- 가입 이탈: `SignupExitAlertDialog` (닫기 X에서만, 헤더 뒤로가기는 이전 화면)
- 가입 하단 CTA: Identity carrier에서도 1차 행동 유지
- 카피 해요체 (`constants.ts`)
- AlertDialog 왼쪽: `닫기`
- Complete CTA: **로그인하러 가기** (홈/패스키 유도 없음)

## 관련 문서

- [docs/stackflow/README.md](../stackflow/README.md)
- [CONTRIBUTING.md](../../CONTRIBUTING.md) — Consumer UX 체크리스트
