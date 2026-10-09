-- 2026-10-10: WEWE·WEWE STAY 방문 통계 (관리자 전용).
--
-- 외부 분석 서비스 없이 자체 수집합니다. 개인을 알아볼 수 있는 정보(IP, 이름, 이메일)는 저장하지 않고,
-- 브라우저마다 무작위로 만든 방문자 ID(visitor_id, localStorage)와 탭 단위 세션 ID(session_id)만 씁니다.
--   · 기록: track_page_view() — 누구나 호출 가능(익명 포함), 테이블에 직접 접근은 불가
--   · 조회: admin_site_stats() — 승인된 관리자만, 집계 결과만 반환
--   · 보관: 2년이 지난 기록은 매일 자동 삭제

create table if not exists public.site_page_views (
  id bigserial primary key,
  site text not null check (site in ('wewe', 'stay')),
  path text not null,
  referrer_host text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  visitor_id uuid not null,
  session_id uuid not null,
  is_entry boolean not null default false,
  device text check (device in ('mobile', 'tablet', 'desktop')),
  created_at timestamptz not null default now()
);

create index if not exists site_page_views_created_idx on public.site_page_views (created_at);
create index if not exists site_page_views_site_created_idx on public.site_page_views (site, created_at);
create index if not exists site_page_views_visitor_idx on public.site_page_views (visitor_id, created_at);

alter table public.site_page_views enable row level security;
-- 정책 없음: 클라이언트는 테이블을 직접 읽거나 쓸 수 없고 아래 함수로만 접근합니다.

create or replace function public.track_page_view(
  p_site text,
  p_path text,
  p_referrer text default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null,
  p_visitor_id uuid default null,
  p_session_id uuid default null,
  p_is_entry boolean default false,
  p_device text default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_host text;
begin
  if p_site not in ('wewe', 'stay') or p_visitor_id is null or p_session_id is null or p_path is null then
    return;
  end if;
  -- 같은 방문자의 하루 기록은 500건까지만 (비정상적인 대량 호출 방지)
  if (select count(*) from public.site_page_views
       where visitor_id = p_visitor_id and created_at > now() - interval '1 day') >= 500 then
    return;
  end if;

  v_host := lower(substring(coalesce(p_referrer, '') from '^[a-zA-Z][a-zA-Z0-9+.-]*://([^/:?#]+)'));
  if v_host is not null then
    v_host := regexp_replace(v_host, '^www\.', '');
    -- 우리 사이트 안에서 이동한 경우는 유입 경로가 아님
    if v_host in ('wewestay.com', 'localhost') or v_host like '%.netlify.app' then
      v_host := null;
    end if;
  end if;

  insert into public.site_page_views
    (site, path, referrer_host, utm_source, utm_medium, utm_campaign, visitor_id, session_id, is_entry, device)
  values (
    p_site,
    left(split_part(p_path, '?', 1), 200),
    left(v_host, 120),
    nullif(left(lower(trim(coalesce(p_utm_source, ''))), 80), ''),
    nullif(left(lower(trim(coalesce(p_utm_medium, ''))), 80), ''),
    nullif(left(trim(coalesce(p_utm_campaign, '')), 120), ''),
    p_visitor_id,
    p_session_id,
    coalesce(p_is_entry, false),
    case when p_device in ('mobile', 'tablet', 'desktop') then p_device end
  );
end;
$function$;

revoke all on function public.track_page_view(text, text, text, text, text, text, uuid, uuid, boolean, text) from public;
grant execute on function public.track_page_view(text, text, text, text, text, text, uuid, uuid, boolean, text) to anon, authenticated;

-- 유입 경로 이름 정리: UTM이 있으면 우선, 없으면 referrer 도메인을 알아보기 쉬운 이름으로
create or replace function public.site_traffic_source(p_utm_source text, p_referrer_host text)
returns text
language sql
immutable
as $function$
  select case
    when p_utm_source is not null then p_utm_source
    when p_referrer_host is null then '직접 방문·북마크'
    when p_referrer_host like '%naver.%' then '네이버'
    when p_referrer_host like '%google.%' then '구글'
    when p_referrer_host like '%daum.%' or p_referrer_host like '%kakao.%' then '다음·카카오'
    when p_referrer_host like '%instagram.%' then '인스타그램'
    when p_referrer_host like '%facebook.%' or p_referrer_host = 'fb.me' or p_referrer_host like '%.fb.com' then '페이스북'
    when p_referrer_host like '%youtube.%' or p_referrer_host = 'youtu.be' then '유튜브'
    when p_referrer_host like '%bing.%' then 'Bing'
    else p_referrer_host
  end
$function$;

-- 관리자용 통계. p_site: 'wewe' / 'stay' / null(전체). 날짜는 한국 시간 기준.
create or replace function public.admin_site_stats(p_site text, p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_from timestamptz;
  v_to timestamptz;
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception '관리자만 볼 수 있습니다.';
  end if;
  if p_from is null or p_to is null or p_to < p_from then
    raise exception '기간이 올바르지 않습니다.';
  end if;
  if p_to - p_from > 400 then
    raise exception '기간은 최대 400일까지 조회할 수 있습니다.';
  end if;
  v_from := (p_from::timestamp at time zone 'Asia/Seoul');
  v_to := ((p_to + 1)::timestamp at time zone 'Asia/Seoul');

  with v as (
    select * from public.site_page_views
     where (p_site is null or site = p_site)
  ),
  r as (
    select * from v where created_at >= v_from and created_at < v_to
  )
  select jsonb_build_object(
    'today', (select jsonb_build_object('visitors', count(distinct visitor_id), 'pageviews', count(*))
                from v where created_at >= (v_today::timestamp at time zone 'Asia/Seoul')),
    'total', (select jsonb_build_object('visitors', count(distinct visitor_id), 'pageviews', count(*), 'since', min(created_at)) from v),
    'range', (select jsonb_build_object('visitors', count(distinct visitor_id), 'pageviews', count(*), 'sessions', count(distinct session_id)) from r),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d.day::date, 'visitors', coalesce(x.visitors, 0), 'pageviews', coalesce(x.pageviews, 0)) order by d.day), '[]'::jsonb)
        from generate_series(p_from, p_to, interval '1 day') as d(day)
        left join (
          select (created_at at time zone 'Asia/Seoul')::date as day, count(distinct visitor_id) visitors, count(*) pageviews
            from r group by 1
        ) x on x.day = d.day::date
    ),
    'sources', (
      select coalesce(jsonb_agg(jsonb_build_object('source', source, 'sessions', sessions) order by sessions desc), '[]'::jsonb)
        from (
          select public.site_traffic_source(utm_source, referrer_host) source, count(distinct session_id) sessions
            from r where is_entry group by 1 order by 2 desc limit 15
        ) s
    ),
    'campaigns', (
      select coalesce(jsonb_agg(jsonb_build_object('source', utm_source, 'medium', utm_medium, 'campaign', utm_campaign, 'sessions', sessions) order by sessions desc), '[]'::jsonb)
        from (
          select utm_source, utm_medium, utm_campaign, count(distinct session_id) sessions
            from r where is_entry and (utm_source is not null or utm_campaign is not null)
           group by 1, 2, 3 order by 4 desc limit 15
        ) c
    ),
    'pages', (
      select coalesce(jsonb_agg(jsonb_build_object('site', site, 'path', path, 'pageviews', pageviews, 'visitors', visitors) order by pageviews desc), '[]'::jsonb)
        from (
          select site, path, count(*) pageviews, count(distinct visitor_id) visitors
            from r group by 1, 2 order by 3 desc limit 15
        ) p
    ),
    'devices', (
      select coalesce(jsonb_agg(jsonb_build_object('device', device, 'visitors', visitors) order by visitors desc), '[]'::jsonb)
        from (
          select coalesce(device, 'unknown') device, count(distinct visitor_id) visitors from r group by 1
        ) dv
    ),
    'sites', (
      select coalesce(jsonb_agg(jsonb_build_object('site', site, 'visitors', visitors, 'pageviews', pageviews)), '[]'::jsonb)
        from (
          select site, count(distinct visitor_id) visitors, count(*) pageviews from r group by 1
        ) st
    )
  ) into v_result;

  return v_result;
end;
$function$;

revoke all on function public.admin_site_stats(text, date, date) from public, anon;
grant execute on function public.admin_site_stats(text, date, date) to authenticated;

-- 2년 지난 방문 기록 자동 삭제 (매일 새벽 4시 KST = 19:00 UTC)
select cron.unschedule(jobid) from cron.job where jobname = 'wewe-purge-old-page-views';
select cron.schedule('wewe-purge-old-page-views', '0 19 * * *',
  $$delete from public.site_page_views where created_at < now() - interval '2 years';$$);
