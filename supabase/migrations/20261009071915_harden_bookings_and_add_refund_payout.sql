-- 2026-10-10: 실결제 전환 준비 — 예약 금액·결제 상태 보호, 환불·정산 기록 컬럼.
--
-- [보안] 지금까지 게스트는 "본인 예약 취소" 정책으로 예약 행의 아무 칸이나 바꿀 수 있었습니다.
-- (예: payment_status='paid'로 바꾸기, 결제 전에 total_price를 낮추기) — 실결제 전에 반드시 막아야 합니다.
-- 브라우저(anon/authenticated)에서 직접 바꾸는 경우, 관리자가 아니면:
--   · INSERT: 상태=승인 대기, 결제=미결제, 금액은 서버가 (1박 실비 × 박수)로 다시 계산
--   · UPDATE: 결제·정산 관련 칸, 금액, 날짜, 숙소·게스트는 바꿀 수 없음
--             게스트는 '취소'로만 상태 변경 가능, 숙소 제공자는 확정/취소 가능
--             결제 완료된 예약의 취소는 환불 함수(cancel-toss-payment, 서버)를 통해서만
-- 결제 승인·환불 엣지 함수는 service_role로 동작하므로 이 제한을 받지 않습니다.

alter table public.bookings add column if not exists payout_status text not null default 'pending';
alter table public.bookings add column if not exists payout_at timestamptz;
alter table public.bookings add column if not exists payout_memo text;
comment on column public.bookings.payout_status is '숙소 제공자 정산 상태: pending(정산 전) / paid(정산 완료). 관리자만 변경.';

alter table public.payments add column if not exists refunded_at timestamptz;
alter table public.payments add column if not exists cancel_reason text;

create or replace function public.guard_booking_status()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  is_host boolean;
  v_price numeric;
  v_client boolean := coalesce(auth.role(), '') in ('authenticated', 'anon');
begin
  if not v_client or public.is_admin() then
    return new;
  end if;

  if TG_OP = 'INSERT' then
    new.status := 'pending';
    new.payment_status := 'unpaid';
    new.paid_at := null;
    new.payment_intent_id := null;
    new.payout_status := 'pending';
    new.payout_at := null;
    new.payout_memo := null;
    select a.price into v_price from public.accommodations a where a.id = new.accommodation_id;
    if v_price is null or new.check_out <= new.check_in then
      raise exception '예약 정보가 올바르지 않습니다.';
    end if;
    new.total_price := v_price * (new.check_out - new.check_in);
    return new;
  end if;

  -- UPDATE
  select exists(
    select 1 from public.accommodations a where a.id = new.accommodation_id and a.host_id = auth.uid()
  ) into is_host;

  new.payment_status := old.payment_status;
  new.paid_at := old.paid_at;
  new.payment_intent_id := old.payment_intent_id;
  new.payout_status := old.payout_status;
  new.payout_at := old.payout_at;
  new.payout_memo := old.payout_memo;
  new.total_price := old.total_price;
  new.check_in := old.check_in;
  new.check_out := old.check_out;
  new.accommodation_id := old.accommodation_id;
  new.guest_id := old.guest_id;

  if not is_host and new.status <> 'cancelled' then
    new.status := old.status;
  end if;

  if old.payment_status = 'paid' and new.status = 'cancelled' and old.status <> 'cancelled' then
    raise exception '결제가 완료된 예약은 환불 절차를 통해 취소해주세요.';
  end if;

  return new;
end;
$function$;
