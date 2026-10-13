-- 2026-10-13 보안 점검 B6 — 승인 회원끼리 서로의 개인정보(이메일·전화·주소·인증서류 등)가 보이던 문제.
--
-- 기존: "승인 회원은 다른 승인 회원 행을 볼 수 있음" 정책 때문에, 승인 회원이면 다른 회원의 모든 칸
--       (email, phone, church_address, verification_docs, rejection_reason …)을 읽을 수 있었음.
-- 변경: 로그인 회원이 users 표에서 직접 읽을 수 있는 칸을 공개용(이름·교회명·역할·소개·상태 등)으로 제한.
--   - 본인 전체 정보  → get_my_profile()
--   - 관리자 회원 목록 → admin_list_users()  (관리자가 아니면 빈 결과)
--   - 연락처(이메일·전화) → get_member_contacts(ids): 본인, 관리자, 예약으로 연결된 상대(게스트↔숙소 제공자)만
-- 행 단위 정책(RLS)은 그대로 두므로 "누구의 행이 보이는지"는 기존과 같습니다.

-- (1단계) 화면이 쓸 서버 함수만 먼저 만듭니다. 칸 단위 읽기 제한은 화면 배포 후 security_hardening_b6_privileges에서 적용합니다.

-- 2) 본인 전체 정보
create or replace function public.get_my_profile()
returns setof public.users
language sql
stable
security definer
set search_path to 'public'
as $function$
  select * from public.users where id = auth.uid();
$function$;
revoke execute on function public.get_my_profile() from public, anon;
grant execute on function public.get_my_profile() to authenticated;

-- 3) 관리자용 전체 회원 목록 (화면에서 .eq/.order/count로 걸러 씁니다)
create or replace function public.admin_list_users()
returns setof public.users
language sql
stable
security definer
set search_path to 'public'
as $function$
  select * from public.users where public.is_admin();
$function$;
revoke execute on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;

-- 4) 연락처: 본인 / 관리자 / 예약으로 연결된 상대만
create or replace function public.get_member_contacts(p_user_ids uuid[])
returns table (id uuid, email text, phone text)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select u.id, u.email, u.phone
  from public.users u
  where u.id = any(coalesce(p_user_ids, '{}'::uuid[]))
    and auth.uid() is not null
    and (
      u.id = auth.uid()
      or public.is_admin()
      or exists (
        select 1 from public.bookings b
        join public.accommodations a on a.id = b.accommodation_id
        where (b.guest_id = auth.uid() and a.host_id = u.id)
           or (b.guest_id = u.id and a.host_id = auth.uid())
      )
    );
$function$;
revoke execute on function public.get_member_contacts(uuid[]) from public, anon;
grant execute on function public.get_member_contacts(uuid[]) to authenticated;
