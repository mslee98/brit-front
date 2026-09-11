# AGENTS.md

Cursor 등 AI 에이전트가 Brit 코드베이스에서 작업할 때 따를 요약 가이드입니다.

## 프로젝트 요약

- **Brit**: Stackflow + Vite + React + SEED Design P2P 거래 미니앱
- **네비게이션**: Next.js 아님 → Stackflow Activity 패턴 ([docs/stackflow/README.md](docs/stackflow/README.md))
- **디자인**: SEED Design (`.cursor/rules/seed-design.mdc`, `.agents/skills/seed-design/`)

## 작업 전 읽을 것

1. [docs/architecture/overview.md](docs/architecture/overview.md)
2. [docs/architecture/trade-platform-summary.md](docs/architecture/trade-platform-summary.md) — 거래·C2B 종합
3. [docs/stackflow/README.md](docs/stackflow/README.md) — **화면 순서(가입·거래)는 여기 「화면 지도」**
4. 변경 도메인: [docs/domains/trade.md](docs/domains/trade.md), [docs/domains/merchant.md](docs/domains/merchant.md), [docs/domains/auth.md](docs/domains/auth.md)
5. API·fixture: [docs/domains/api-spec.md](docs/domains/api-spec.md), [docs/fixtures/](docs/fixtures/)
6. 시나리오·백엔드: [docs/porcess/trade-scenarios.md](docs/porcess/trade-scenarios.md), [docs/porcess/trade-api.md](docs/porcess/trade-api.md), [docs/porcess/trade-disputes.md](docs/porcess/trade-disputes.md), [docs/porcess/trade-payment-ux.md](docs/porcess/trade-payment-ux.md), [docs/porcess/trade-seller-accept-flow.md](docs/porcess/trade-seller-accept-flow.md) (M0 정책), [brit-api M1~M4 계획](../brit-api/docs/p0/p0-5b-m1-m4-plan.md)
7. 타이포: [docs/conventions/typography.md](docs/conventions/typography.md)
8. UX/PWA: `.cursor/rules/consumer-ux.mdc`, `.cursor/rules/pwa.mdc`

## 코드 작성 원칙

### Activity는 얇게

- `src/activities/*` — JSX 조립 + `useXxxScreen()` hook 호출
- orchestration·effect·handler는 `src/features/{domain}/hooks/useXxxScreen.ts`

### Feature-sliced

```text
features/{domain}/
  components/  hooks/  stores/  api/  utils/  mocks/  types.ts
```

- `shared/` — 2개 이상 domain에서 재사용
- 다른 feature store 직접 mutate 지양 (현재 trade→home wallet coupling은 개선 예정)

### Mock

- `features/*/mocks/`에만
- Activity에 DEV 테스트 버튼 남기지 않기

### 주석

- public hook/store/Activity 헤더 + **왜**만
- 자명한 JSX/prop 주석 금지 → [docs/conventions/comments.md](docs/conventions/comments.md)

## Stackflow 빠른 참조

| 상황 | API |
|------|-----|
| Activity 안에서 다음 화면 | `useFlow().push('Name', params)` |
| 히스토리 정리 | `replace` (예: PIN confirm) |
| Stack 밖 (탭, 배너) | `actions` from `src/stackflow/stackflow.ts` |
| params 타입 | `src/stackflow/config.ts` → `Register` |

가입: Terms → Identity → **Credentials**(loginId·닉네임·로그인 비번) → **Account**(입력만) → **Pin**(6자리, 최종 제출) → Complete(PENDING·승인 대기) → Login  
로그인: `Login` (아이디+비번 Primary / 패스키 Secondary·P2) — Nest JWT. PENDING 계정은 로그인 불가. [docs/domains/auth.md](docs/domains/auth.md)  
거래: Home → TradeCompose → MatchingWaiting(BUY) / SellOrderDetail(SELL) → Trade(입금·분할). 탭: Home / Transactions / My. 푸시: Store, Community.

## Consumer UX (차단급)

- 진입 직후 전면 시트/권한 X
- dismiss 라벨 `닫기`
- 화면당 핵심 모션 1곳 (거래: 매칭 독)
- 카피 해요체

## PWA

- 신규 PWA 코드: `src/features/pwa/` 검토
- SW 캐싱: `vite.config.ts` Workbox
- 상세: `.agents/skills/pwa/`

## 커밋·PR

- [CONTRIBUTING.md](CONTRIBUTING.md) 따름
- 사용자가 명시적으로 요청하기 전까지 git commit/push 하지 않음
- plan 파일(`.cursor/plans/*`) 수정 금지 (사용자 지시 시만)

## 스킬

| 스킬 | 용도 |
|------|------|
| `.agents/skills/seed-design/` | SEED 컴포넌트·CLI |
| `.agents/skills/pwa/` | PWA 진단·구현 |
