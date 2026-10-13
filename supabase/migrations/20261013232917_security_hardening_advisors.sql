-- 2026-10-14 Supabase 보안 점검(Advisors) 경고 정리
--
-- 1) site_traffic_source: search_path 고정(함수가 엉뚱한 스키마의 객체를 쓰지 않도록)
-- 2) btree_gist 확장을 public에서 extensions 스키마로 이동
--    (예약 겹침 방지 제약은 내부 번호로 연결돼 있어 그대로 동작)
-- 3) is_admin / is_approved_caller / is_super_admin: 비로그인 상태에서 API(/rpc)로 부를 수 있던 관리자 권한 함수.
--    권한 정책(RLS)과 다른 함수들이 이 이름을 쓰고 있어 실행 권한을 빼면 공개 페이지가 오류가 나므로,
--    실제 확인은 API에 노출되지 않는 private 스키마의 함수가 하고, public 쪽은 그것을 부르기만 하는
--    일반(SECURITY INVOKER) 함수로 바꿉니다. 결과는 기존과 같습니다.

-- 1)
alter function public.site_traffic_source(text, text) set search_path = '';

-- 2)
alter extension btree_gist set schema extensions;

-- 3)
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $function$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin' and status = 'approved'
  );
$function$;

create or replace function private.is_approved_caller()
returns boolean language sql stable security definer set search_path = ''
as $function$
  select exists (
    select 1 from public.users u where u.id = auth.uid() and u.status = 'approved'
  );
$function$;

create or replace function private.is_super_admin()
returns boolean language sql stable security definer set search_path = ''
as $function$
  select exists (
    select 1 from public.users
    where id = auth.uid() and is_super_admin = true and role = 'admin' and status = 'approved'
  );
$function$;

revoke all on function private.is_admin(), private.is_approved_caller(), private.is_super_admin() from public;
grant execute on function private.is_admin(), private.is_approved_caller(), private.is_super_admin()
  to anon, authenticated, service_role;

create or replace function public.is_admin()
returns boolean language sql stable security invoker set search_path = ''
as $function$ select private.is_admin(); $function$;

create or replace function public.is_approved_caller()
returns boolean language sql stable security invoker set search_path = ''
as $function$ select private.is_approved_caller(); $function$;

create or replace function public.is_super_admin()
returns boolean language sql stable security invoker set search_path = ''
as $function$ select private.is_super_admin(); $function$;
