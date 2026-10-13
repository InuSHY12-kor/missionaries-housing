-- 2026-10-13 보안 점검 B6 (2단계) — 화면이 get_my_profile / admin_list_users / get_member_contacts를 쓰도록 배포된 뒤 적용.
-- 로그인 회원이 users 표에서 직접 읽을 수 있는 칸을 공개용으로 제한합니다(행 단위 정책은 그대로).

-- 1) 칸 단위 읽기 권한
revoke select on public.users from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public.users from anon;
revoke truncate, references, trigger on public.users from authenticated;
grant select (id, full_name, role, church_name, bio, status, created_at, email_verified_at)
  on public.users to anon, authenticated;

