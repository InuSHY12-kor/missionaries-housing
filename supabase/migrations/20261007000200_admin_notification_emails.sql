-- 2026-10-07: 관리자에게 생기는 알림(종 아이콘)을 이메일로도 보내기.
-- notifications INSERT 시, 받는 사람이 승인된 관리자이고 이메일 알림을 켜 두었으면
-- pg_net으로 send-email 엣지 함수(type = admin_notification)를 비동기 호출합니다.
-- 엣지 함수는 emailed_at으로 1회만 발송하고, 이미 별도 메일이 있는 종류(가입/인증/문의/메시지)는 건너뜁니다.
-- (Supabase MCP apply_migration으로 프로덕션에 이미 적용됨 — 기록용 사본)
create extension if not exists pg_net with schema extensions;

alter table public.notifications add column if not exists emailed_at timestamptz;
comment on column public.notifications.emailed_at is '관리자 알림 메일 발송 시각(send-email admin_notification이 기록, 중복 발송 방지).';

create or replace function public.email_admin_notification()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.type in ('member_signup', 'email_verified', 'inquiry_new', 'new_message') then
    return new;
  end if;

  if exists (
    select 1 from public.users u
    where u.id = new.recipient_id
      and u.role = 'admin'
      and u.status = 'approved'
      and (coalesce(u.notification_email, true) or coalesce(u.notification_email_wewe, true))
  ) then
    begin
      perform net.http_post(
        url := 'https://zvbdzecmnwfpnugjrbef.supabase.co/functions/v1/send-email',
        body := jsonb_build_object('type', 'admin_notification', 'notificationId', new.id),
        headers := jsonb_build_object('Content-Type', 'application/json'),
        timeout_milliseconds := 30000
      );
    exception when others then
      -- 메일 호출 실패가 알림 생성(및 원래 작업)을 막지 않도록 무시합니다.
      raise warning 'email_admin_notification failed: %', sqlerrm;
    end;
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_email_admin_notification on public.notifications;
create trigger trg_email_admin_notification
  after insert on public.notifications
  for each row execute function public.email_admin_notification();

-- 후원자(WEWE 회원)는 가입 즉시 승인(status='approved')이라 기존 트리거가 관리자 알림(종 아이콘)을
-- 만들지 않았습니다. 후원자 가입도 관리자 알림에 남도록 보완합니다(메일은 admin_new_signup이 별도 발송).
create or replace function public.notify_new_member_signup()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.status = 'pending' then
    perform public.notify_admins(
      'member_signup',
      '신규 회원 가입',
      coalesce(new.full_name, '신규 회원') || '님이 회원가입을 신청했습니다.',
      '/admin'
    );
  elsif new.role = 'supporter' then
    perform public.notify_admins(
      'member_signup',
      '신규 후원자 가입',
      coalesce(new.full_name, '신규 회원') || '님이 후원자로 가입했습니다.',
      '/admin?tab=members'
    );
  end if;
  return new;
end;
$function$;
