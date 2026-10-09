-- 2026-10-10: 숙소별 실비 방식 선택.
--   per_night: 1박 기준 (총액 = 1박 실비 × 박수) — 기존 방식, 기본값
--   per_stay : 숙박 1회 정액 (박수와 관계없이 총액 = 실비)
-- 예약 금액은 guard_booking_status 트리거가 이 값에 따라 서버에서 다시 계산합니다.

alter table public.accommodations
  add column if not exists price_type text not null default 'per_night';

alter table public.accommodations
  drop constraint if exists accommodations_price_type_check;
alter table public.accommodations
  add constraint accommodations_price_type_check check (price_type in ('per_night', 'per_stay'));

comment on column public.accommodations.price_type is
  '실비 방식: per_night(1박 기준, 박수만큼 곱함) / per_stay(숙박 1회 정액, 박수와 무관)';

create or replace function public.guard_booking_status()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  is_host boolean;
  v_price numeric;
  v_price_type text;
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
    select a.price, a.price_type into v_price, v_price_type
      from public.accommodations a where a.id = new.accommodation_id;
    if v_price is null or new.check_out <= new.check_in then
      raise exception '예약 정보가 올바르지 않습니다.';
    end if;
    if v_price_type = 'per_stay' then
      new.total_price := v_price;
    else
      new.total_price := v_price * (new.check_out - new.check_in);
    end if;
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
