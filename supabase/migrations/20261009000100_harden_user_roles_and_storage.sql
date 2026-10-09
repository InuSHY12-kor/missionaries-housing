-- 2026-10-09 보안 보강 (Supabase MCP apply_migration으로 프로덕션에 이미 적용됨 — 기록용 사본)
-- 1) 관리자 판정은 "승인된" 관리자만 (role='admin' AND status='approved').
create or replace function public.is_admin()
returns boolean language plpgsql security definer set search_path to 'public'
as $function$
begin
  return exists (
    select 1 from users
    where id = auth.uid() and role = 'admin' and status = 'approved'
  );
end;
$function$;

create or replace function public.is_super_admin()
returns boolean language plpgsql security definer set search_path to 'public'
as $function$
begin
  return exists (
    select 1 from users
    where id = auth.uid() and is_super_admin = true and role = 'admin' and status = 'approved'
  );
end;
$function$;

-- 2) 회원 프로필 INSERT 가드 — 지금까지 INSERT에는 가드가 없어, 가입자가 직접 role='admin',
--    status='approved'로 프로필을 만들 수 있었습니다. 클라이언트(anon/authenticated)가 직접 넣는
--    경우 역할은 선교사·숙소 제공자·후원자만 허용하고, 선교사·숙소 제공자는 항상 승인 대기 +
--    이메일 미인증으로 시작합니다. (SECURITY INVOKER — 보안 정의자 함수 안에서 실행되는 쓰기는
--    current_user가 함수 소유자라 영향을 받지 않습니다.)
create or replace function public.guard_users_insert()
returns trigger language plpgsql set search_path to 'public'
as $function$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    if new.role is null or new.role not in ('missionary', 'host', 'supporter') then
      raise exception '허용되지 않는 회원 유형입니다.';
    end if;
    new.is_super_admin := false;
    if new.role = 'supporter' then
      new.status := 'approved';
    else
      new.status := 'pending';
      new.email_verified_at := null;
    end if;
    new.rejection_reason := null;
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_users_insert_guard on public.users;
create trigger trg_users_insert_guard
  before insert on public.users
  for each row execute function public.guard_users_insert();

-- 3) 회원 프로필 UPDATE 가드 보강 — 본인이 직접 바꿀 수 없는 항목에 이메일 인증 시각·거절 사유 추가.
--    (이메일 인증은 verify_email_token 보안 정의자 함수가 처리하므로 영향 없음)
create or replace function public.guard_users_privilege()
returns trigger language plpgsql set search_path to 'public'
as $function$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    new.status := old.status;
    new.role := old.role;
    new.email_verified_at := old.email_verified_at;
    new.rejection_reason := old.rejection_reason;
  end if;
  return new;
end;
$function$;

-- 4) 신원 확인 서류(verification-docs, 비공개 버킷) — 지금까지 로그인한 모든 회원이 다른 사람의
--    서류까지 열람할 수 있었습니다. 본인 폴더({userId}/...)와 관리자만 열람·업로드하도록 제한.
drop policy if exists "Authenticated users can view verification docs" on storage.objects;
drop policy if exists "Authenticated users can upload verification docs" on storage.objects;

create policy "Owners and admins can view verification docs" on storage.objects
  for select to authenticated
  using (bucket_id = 'verification-docs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

create policy "Users can upload own verification docs" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'verification-docs' and (storage.foldername(name))[1] = auth.uid()::text);

-- 5) 숙소 사진 업로드도 본인 폴더({userId}/...)에만.
drop policy if exists "Authenticated users can upload accommodation images" on storage.objects;
create policy "Users can upload accommodation images to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'accommodation-images' and (storage.foldername(name))[1] = auth.uid()::text);
