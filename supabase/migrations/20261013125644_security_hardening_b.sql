-- 2026-10-13 보안 점검 B — 결제 기록 노출, 관리자 메일 반복 발송, 스팸 방어.
--
-- 7) payments: 숙소 제공자·게스트가 결제 키(payment_key)와 결제사 원본 응답(raw_response)까지 볼 수 있었음.
--    화면에서 payments를 읽는 곳이 없으므로 숙소 제공자·게스트 조회 정책을 없애고 관리자만 봅니다.
-- 8) 인증 없이 부를 수 있는 send-email의 관리자 대상 메일(새 가입·인증 완료·문의)이 30분 안에는 같은 ID로
--    반복 호출될 수 있었음 → "이미 보냄" 표시 칸을 두고 send-email이 한 번만 보내도록(선점) 합니다.
-- 9) 스팸 방어: 문의 폼 길이 제한·호출 제한, 쪽지는 승인된 회원만, 방문 기록 하루 전체 상한.

-- 7)
drop policy if exists "Guests can view own payments" on public.payments;
drop policy if exists "Hosts can view payments for their accommodations" on public.payments;

-- 8)
alter table public.users add column if not exists admin_signup_emailed_at timestamptz;
alter table public.users add column if not exists admin_verified_emailed_at timestamptz;
alter table public.inquiries add column if not exists admin_emailed_at timestamptz;
comment on column public.users.admin_signup_emailed_at is 'send-email admin_new_signup 발송 시각(중복 발송 방지)';
comment on column public.users.admin_verified_emailed_at is 'send-email admin_email_verified 발송 시각(중복 발송 방지)';
comment on column public.inquiries.admin_emailed_at is 'send-email inquiry 발송 시각(중복 발송 방지)';

-- 회원이 이 칸들을 직접 바꾸지 못하도록(서버만 기록) — users는 기존 보호 트리거와 별개로 막습니다.
create or replace function public.guard_admin_email_marks()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon') and not public.is_admin() then
    if TG_OP = 'INSERT' then
      new.admin_signup_emailed_at := null;
      new.admin_verified_emailed_at := null;
    else
      new.admin_signup_emailed_at := old.admin_signup_emailed_at;
      new.admin_verified_emailed_at := old.admin_verified_emailed_at;
    end if;
  end if;
  return new;
end;
$function$;
revoke execute on function public.guard_admin_email_marks() from public, anon, authenticated;
drop trigger if exists trg_guard_admin_email_marks on public.users;
create trigger trg_guard_admin_email_marks
  before insert or update on public.users
  for each row execute function public.guard_admin_email_marks();

-- 9-1) 문의: 길이 제한 + 같은 이메일 1시간 3건, 전체 10분 30건 상한. 상태·발송 표시는 접수 시 초기화.
create or replace function public.guard_inquiry_insert()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon') and not public.is_admin() then
    new.name := left(trim(coalesce(new.name, '')), 50);
    new.email := left(lower(trim(coalesce(new.email, ''))), 254);
    new.phone := left(trim(coalesce(new.phone, '')), 30);
    new.topic := left(new.topic, 50);
    new.status := 'new';
    new.admin_emailed_at := null;
    new.created_at := now();
    if length(coalesce(new.message, '')) > 2000 then
      raise exception '문의 내용은 2000자 이내로 적어주세요.';
    end if;
    if new.name = '' or new.email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
      raise exception '이름과 올바른 이메일을 입력해주세요.';
    end if;
    if (select count(*) from public.inquiries where lower(email) = new.email and created_at > now() - interval '1 hour') >= 3 then
      raise exception '짧은 시간에 너무 많은 문의가 접수되었습니다. 잠시 후 다시 시도해주세요.';
    end if;
    if (select count(*) from public.inquiries where created_at > now() - interval '10 minutes') >= 30 then
      raise exception '지금은 문의가 많아 잠시 후 다시 시도해주세요.';
    end if;
  end if;
  return new;
end;
$function$;
revoke execute on function public.guard_inquiry_insert() from public, anon, authenticated;
drop trigger if exists trg_guard_inquiry_insert on public.inquiries;
create trigger trg_guard_inquiry_insert
  before insert on public.inquiries
  for each row execute function public.guard_inquiry_insert();

-- 9-2) 쪽지: 승인된 회원만 보낼 수 있도록(중복 정책 정리)
drop policy if exists "Members can send messages" on public.messages;
drop policy if exists "Users can send messages as themselves" on public.messages;
create policy "Approved members can send messages" on public.messages
  for insert to authenticated
  with check (sender_id = auth.uid() and public.is_approved_caller());

-- 9-3) 방문 기록: 방문자 번호를 바꿔가며 무한히 쌓는 것을 막기 위한 하루 전체 상한(5만 건)
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
  if (select count(*) from public.site_page_views
       where visitor_id = p_visitor_id and created_at > now() - interval '1 day') >= 500 then
    return;
  end if;
  if (select count(*) from public.site_page_views where created_at > now() - interval '1 day') >= 50000 then
    return;
  end if;

  v_host := lower(substring(coalesce(p_referrer, '') from '^[a-zA-Z][a-zA-Z0-9+.-]*://([^/:?#]+)'));
  if v_host is not null then
    v_host := regexp_replace(v_host, '^www\.', '');
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
grant execute on function public.track_page_view(text, text, text, text, text, text, uuid, uuid, boolean, text) to anon, authenticated;
