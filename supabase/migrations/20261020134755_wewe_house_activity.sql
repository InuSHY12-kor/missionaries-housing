-- 2026-10-20 WEWE 하우스(관리자 전용 라이브 대시보드) — 익명 집계 RPC
--
-- 1) 승인 시각: accommodations·users에는 "언제 승인됐는지" 칸이 없어 approved_at을 추가합니다.
--    값은 트리거가 서버에서만 채웁니다(상태가 approved로 바뀌는 순간, 후원자는 가입 즉시).
--    화면에서 보낸 값은 무시되므로 회원이 바꿀 수 없습니다. 기존 승인 건은 updated_at으로 채워둡니다(근사값).
-- 2) get_house_activity(p_limit): 관리자만. 카운터와 최근 이벤트 {type, occurred_at(분 단위 내림)}만 돌려주고
--    이름·이메일·전화·교회·숙소 주소/좌표·예약 날짜·사용자 ID 등 개인을 알아볼 수 있는 값은 담지 않습니다.
--    추후 공개 전환 시에도 같은 구조를 쓸 수 있게 처음부터 익명 집계만 사용합니다.

-- 1)
alter table public.accommodations add column if not exists approved_at timestamptz;
alter table public.users add column if not exists approved_at timestamptz;
comment on column public.accommodations.approved_at is '관리자가 승인한 시각(트리거가 기록, WEWE 하우스 이벤트용)';
comment on column public.users.approved_at is '회원 승인 시각(트리거가 기록, 후원자는 가입 시각; WEWE 하우스 이벤트용)';

update public.accommodations set approved_at = (updated_at at time zone 'UTC')
  where status = 'approved' and approved_at is null;
update public.users set approved_at = (coalesce(updated_at, created_at) at time zone 'UTC')
  where status = 'approved' and approved_at is null;

-- 트리거 이름을 zz_로 시작해 기존 보호 트리거(상태 변경 차단) 다음에 실행되게 합니다(같은 시점 트리거는 이름순).
create or replace function public.stamp_approved_at()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if TG_OP = 'INSERT' then
    new.approved_at := case when new.status = 'approved' then now() else null end;
  elsif new.status = 'approved' and old.status is distinct from 'approved' then
    new.approved_at := now();
  elsif new.status is distinct from 'approved' then
    new.approved_at := null;
  else
    new.approved_at := old.approved_at;
  end if;
  return new;
end;
$function$;
revoke execute on function public.stamp_approved_at() from public, anon, authenticated;

drop trigger if exists zz_stamp_approved_at on public.accommodations;
create trigger zz_stamp_approved_at
  before insert or update on public.accommodations
  for each row execute function public.stamp_approved_at();

drop trigger if exists zz_stamp_approved_at on public.users;
create trigger zz_stamp_approved_at
  before insert or update on public.users
  for each row execute function public.stamp_approved_at();

-- 2)
create or replace function public.get_house_activity(p_limit integer default 20)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 50);
  v_month_start timestamptz := date_trunc('month', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';
  v_counters jsonb;
  v_events jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'approved_stays',        (select count(*) from public.accommodations where status = 'approved'),
    'bookings_this_month',   (select count(*) from public.bookings
                                where status <> 'cancelled' and (created_at at time zone 'UTC') >= v_month_start),
    'confirmed_bookings',    (select count(*) from public.bookings where status = 'confirmed'),
    'approved_missionaries', (select count(*) from public.users where role = 'missionary' and status = 'approved'),
    'approved_hosts',        (select count(*) from public.users where role = 'host' and status = 'approved'),
    'supporters',            (select count(*) from public.users where role = 'supporter' and status = 'approved'),
    'published_posts',       (select count(*) from public.ministry_posts where status = 'published')
  ) into v_counters;

  select coalesce(jsonb_agg(jsonb_build_object('type', e.type, 'occurred_at', e.at) order by e.at desc), '[]'::jsonb)
  into v_events
  from (
    select type, date_trunc('minute', at) as at
    from (
      select 'stay_approved' as type, a.approved_at as at
        from public.accommodations a where a.status = 'approved' and a.approved_at is not null
      union all
      select 'booking_created', (b.created_at at time zone 'UTC') from public.bookings b
      union all
      select 'booking_confirmed', b.confirmed_at from public.bookings b where b.confirmed_at is not null
      union all
      select case u.role when 'missionary' then 'member_approved_missionary'
                         when 'host' then 'member_approved_host'
                         else 'supporter_joined' end,
             u.approved_at
        from public.users u
        where u.status = 'approved' and u.approved_at is not null and u.role in ('missionary', 'host', 'supporter')
      union all
      select 'post_published', p.published_at
        from public.ministry_posts p where p.status = 'published' and p.published_at is not null
    ) raw
    where at is not null and at <= now()
    order by at desc
    limit v_limit
  ) e;

  return jsonb_build_object(
    'generated_at', date_trunc('minute', now()),
    'counters', v_counters,
    'events', v_events
  );
end;
$function$;
revoke execute on function public.get_house_activity(integer) from public, anon;
grant execute on function public.get_house_activity(integer) to authenticated;
