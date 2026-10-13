-- 2026-10-13 보안 점검 A 2단계 — 새 화면(인증 메일은 send-email이 토큰 생성, 비밀번호 찾기는 대조 없이 재설정 메일)
-- 배포 직후 적용: 이메일 인증 토큰을 화면에 돌려주던 함수와 회원 존재 여부를 알려주던 함수의 외부 실행 권한 회수.
revoke execute on function public.create_email_verification_token(uuid) from public, anon, authenticated;
revoke execute on function public.verify_reset_identity(text, text, text) from public, anon, authenticated;
