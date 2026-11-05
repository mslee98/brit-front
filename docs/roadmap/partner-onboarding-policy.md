# Partner 온보딩 정책 (확정)

작성일: 2026-11-05  
구현 SoT: `brit-api/docs/p0/p0-partner-admin-onboarding.md`

## 운영 흐름

1. 메신저·메일로 제휴 신청을 받는다 (시스템 밖).
2. BRIT 관리자가 관리자 페이지에서 업체를 등록한다 → 즉시 `ACTIVE`.
3. 업체 담당자는 일반 사용자로 회원가입·승인한다.
4. BRIT 관리자가 해당 사용자를 `partner_members`로 업체에 연결한다.
5. Client 발급 → (후속) SDK → CHARGE/REDEEM.
6. 업체 포털(`brit-partner`): 대시보드, 일일/누적 수수료, 산정 근거, 충전·환전 내역 조회.

## 확정 요약

- 용어·API: `partners`
- 연락처: 이름 / 전화 / 이메일 / 텔레그램 (+ memo). 사업자등록번호 없음
- 담당자: ACTIVE 사용자만, 사용자당 활성 업체 1개 (추가는 재배정으로만)
- SUSPENDED 업체: 담당자 추가 가능, 포털 **조회만** / TERMINATED: 변경·해제만·포털 차단
- CHARGE/REDEEM: 업체 `ACTIVE` + Client scope 필요
- Client: 발급·회전·폐기 Admin API 구현
- 수수료 정책: Admin 등록·비활성 / 포털·전환 동일 선택 규칙 (exact → ALL)
- 관리자 권한: ADMIN + SYS_ADMIN
- 포털 인증: 일반 `/auth/login` + `PartnerMemberGuard`
- 코드 위치: `brit-api/.../partners`, `brit-admin/.../partners`, `brit-partner`
