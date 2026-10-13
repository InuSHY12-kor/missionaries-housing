-- 2026-10-13 보안 점검 A(긴급) — 외부에서 호출하면 안 되는 DB 함수 닫기, 업로드 제한.
--
-- 1) finalize_account_withdrawal(누구나 다른 회원을 탈퇴 처리), notify_admins(누구나 관리자 전원에게
--    가짜 알림·메일) — 내부(관리자 함수·트리거)에서만 쓰이므로 외부 실행 권한을 모두 회수.
-- 2) create_email_verification_token — 토큰을 화면에 돌려줘 메일 확인 없이 인증할 수 있었음.
--    이제 send-email(서비스 롤)이 토큰을 직접 만들어 메일로만 보냅니다 → 외부 실행 권한 회수.
-- 3) verify_reset_identity — 이름·전화·이메일 일치 여부로 회원 존재를 알아낼 수 있었음.
--    비밀번호 찾기 화면은 이제 대조 없이 재설정 메일만 요청합니다 → 외부 실행 권한 회수.
-- 4) 업로드: 버킷별 용량·형식 제한(SVG 등 스크립트가 들어갈 수 있는 형식 차단),
--    숙소 사진은 승인된 숙소 제공자·관리자만 올릴 수 있도록.
-- 5) 나머지 SECURITY DEFINER 함수: 로그인하지 않은 사용자(anon)의 실행 권한 회수.
--    RLS 정책이 쓰는 is_admin / is_super_admin / is_approved_caller, 방문 기록 track_page_view,
--    이메일 인증 링크 verify_email_token은 로그아웃 상태에서도 필요하므로 유지합니다.
--    앞으로 만드는 함수도 기본적으로 anon·PUBLIC에 실행 권한이 붙지 않도록 기본 권한을 바꿉니다
--    (로그아웃 상태에서 불러야 하는 함수를 새로 만들면 GRANT EXECUTE ... TO anon 을 명시해야 함).

-- 1~3
revoke execute on function public.finalize_account_withdrawal(uuid) from public, anon, authenticated;
revoke execute on function public.notify_admins(text, text, text, text, uuid) from public, anon, authenticated;
-- (2·3번 함수는 새 화면 배포 직후 security_hardening_a2에서 닫습니다 — 먼저 닫으면 배포 전까지 인증 메일·비밀번호 찾기가 멈춤)

-- 4) 업로드 제한
update storage.buckets set file_size_limit = 15728640,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf']
where id = 'verification-docs';
update storage.buckets set file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg','image/png','image/webp']
where id = 'accommodation-images';
update storage.buckets set file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']
where id = 'site-assets';
update storage.buckets set file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']
where id = 'ministry-post-images';

drop policy if exists "Users can upload accommodation images to own folder" on storage.objects;
create policy "Users can upload accommodation images to own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'accommodation-images'
    and (storage.foldername(name))[1] = (auth.uid())::text
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.status = 'approved' and u.role in ('host', 'admin')
    )
  );

-- 5) 로그인하지 않은 사용자의 실행 권한 회수
revoke execute on function public.admin_delete_user_account(uuid) from public, anon;
revoke execute on function public.admin_flag_user_for_deletion(uuid, text) from public, anon;
revoke execute on function public.contact_admins(text, uuid) from public, anon;
revoke execute on function public.self_confirm_account_deletion() from public, anon;
revoke execute on function public.get_accommodation_blocked_dates(uuid) from public, anon;
revoke execute on function public.get_accommodation_booked_ranges(uuid) from public, anon;
revoke execute on function public.get_available_accommodation_ids(date, date) from public, anon;

-- 트리거 전용 함수(직접 호출할 일이 없음) — 실행 권한 회수(트리거 동작에는 영향 없음)
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as fn
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef and p.prorettype = 'trigger'::regtype
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.fn);
  end loop;
end $$;

-- 앞으로 만드는 함수의 기본 실행 권한: anon·PUBLIC 제외
alter default privileges for role postgres in schema public revoke execute on functions from public, anon;
