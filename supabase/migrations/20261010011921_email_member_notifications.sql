-- 2026-10-10: 종 알림 → 이메일을 관리자뿐 아니라 승인된 모든 회원에게도.
-- 지금까지 email_admin_notification 트리거는 받는 사람이 관리자일 때만 send-email을 호출해서,
-- 선교사·숙소 제공자는 회원 승인, 새 예약 요청, 예약 확정·취소, 숙소 승인, 리뷰 알림을 메일로 받지 못했습니다
-- (프로필의 "이메일 알림" 설정과 달랐음). 관리자는 위위스테이·위위 알림 중 하나라도 켜져 있으면,
-- 그 외 회원은 위위스테이 이메일 알림(notification_email)이 켜져 있으면 보냅니다.
-- 실제 발송·중복 방지는 send-email(type admin_notification)이 emailed_at으로 처리합니다.
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
      and u.status = 'approved'
      and (
        (u.role = 'admin' and (coalesce(u.notification_email, true) or coalesce(u.notification_email_wewe, true)))
        or (u.role <> 'admin' and coalesce(u.notification_email, true))
      )
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
