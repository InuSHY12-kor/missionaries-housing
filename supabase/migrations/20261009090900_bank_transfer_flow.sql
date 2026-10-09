-- 2026-10-10: 숙박 실비를 계좌이체(페이플 가상계좌)로만 받고, 입실 확인 후 정산지급대행으로 지급하는 흐름.
--
-- 예약 흐름: 예약 요청 → 숙소 제공자 확정 → 가상계좌 발급(va_*) → 발급 후 7일 안에 입금(paid)
--            → 입실 확인(checked_in_at, 숙소 제공자·관리자) → 지급(payout_status='paid', 수수료 차감)
-- 취소: 결제(입금) 전에는 기존처럼 직접 취소. 입금 후 취소는 cancel_paid_booking()으로만 하며
--       payment_status='refund_pending'이 되고, 관리자가 환불 계좌로 이체한 뒤 'refunded'로 바꿉니다.
-- 입금 기한(deposit_due_at)이 지나도록 입금되지 않은 예약은 pg_cron이 매시간 자동 취소합니다.

alter table public.bookings add column if not exists confirmed_at timestamptz;
alter table public.bookings add column if not exists va_bank_name text;
alter table public.bookings add column if not exists va_account_number text;
alter table public.bookings add column if not exists va_holder_name text;
alter table public.bookings add column if not exists va_issued_at timestamptz;
alter table public.bookings add column if not exists deposit_due_at timestamptz;
alter table public.bookings add column if not exists depositor_name text;
alter table public.bookings add column if not exists checked_in_at timestamptz;
alter table public.bookings add column if not exists checked_in_by uuid references public.users(id) on delete set null;
alter table public.bookings add column if not exists refund_requested_at timestamptz;
alter table public.bookings add column if not exists refunded_at timestamptz;
alter table public.bookings add column if not exists cancel_reason text;
alter table public.bookings add column if not exists payout_fee numeric;
alter table public.bookings add column if not exists payout_amount numeric;

alter table public.bookings drop constraint if exists bookings_payment_status_check;
alter table public.bookings add constraint bookings_payment_status_check
  check (payment_status in ('unpaid', 'paid', 'refund_pending', 'refunded'));

comment on column public.bookings.payment_status is
  'unpaid(입금 대기) / paid(입금 완료) / refund_pending(취소, 환불 진행 중) / refunded(환불 완료)';
comment on column public.bookings.deposit_due_at is '입금 기한 = 가상계좌 발급 시각 + 7일';
comment on column public.bookings.payout_fee is '지급 시 숙소 제공자 부담으로 차감한 정산지급대행 수수료';

-- 게스트 환불 계좌 (숙소 제공자에게는 보이지 않도록 bookings와 분리)
create table if not exists public.booking_refund_accounts (
  booking_id uuid primary key references public.bookings(id) on delete cascade,
  guest_id uuid not null references public.users(id) on delete cascade,
  bank_code text not null check (bank_code ~ '^[0-9]{3}$'),
  bank_name text not null,
  account_number text not null check (account_number ~ '^[0-9]{6,16}$'),
  holder_name text not null check (char_length(holder_name) between 1 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.booking_refund_accounts enable row level security;

drop policy if exists "Guests manage own refund account" on public.booking_refund_accounts;
create policy "Guests manage own refund account" on public.booking_refund_accounts
  for all to authenticated
  using (guest_id = auth.uid() or public.is_admin())
  with check (
    public.is_admin()
    or (guest_id = auth.uid() and exists (
      select 1 from public.bookings b where b.id = booking_id and b.guest_id = auth.uid()
    ))
  );

create or replace function public.guard_booking_status()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  is_host boolean;
  is_guest boolean;
  v_price numeric;
  v_price_type text;
  v_req_checked_in timestamptz;
  v_req_depositor text;
  v_system boolean := coalesce(current_setting('wewe.booking_system_update', true), '') = 'on';
  v_client boolean := coalesce(auth.role(), '') in ('authenticated', 'anon');
  v_restricted boolean;
begin
  v_restricted := v_client and not v_system and not public.is_admin();

  if TG_OP = 'INSERT' then
    if v_restricted then
      new.status := 'pending';
      new.payment_status := 'unpaid';
      new.paid_at := null;
      new.payment_intent_id := null;
      new.payout_status := 'pending';
      new.payout_at := null;
      new.payout_memo := null;
      new.payout_fee := null;
      new.payout_amount := null;
      new.confirmed_at := null;
      new.va_bank_name := null;
      new.va_account_number := null;
      new.va_holder_name := null;
      new.va_issued_at := null;
      new.deposit_due_at := null;
      new.checked_in_at := null;
      new.checked_in_by := null;
      new.refund_requested_at := null;
      new.refunded_at := null;
      new.cancel_reason := null;
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
    end if;
    return new;
  end if;

  -- UPDATE
  if v_restricted then
    select exists(
      select 1 from public.accommodations a where a.id = new.accommodation_id and a.host_id = auth.uid()
    ) into is_host;
    is_guest := old.guest_id = auth.uid();
    v_req_checked_in := new.checked_in_at;
    v_req_depositor := new.depositor_name;

    new.payment_status := old.payment_status;
    new.paid_at := old.paid_at;
    new.payment_intent_id := old.payment_intent_id;
    new.payout_status := old.payout_status;
    new.payout_at := old.payout_at;
    new.payout_memo := old.payout_memo;
    new.payout_fee := old.payout_fee;
    new.payout_amount := old.payout_amount;
    new.total_price := old.total_price;
    new.check_in := old.check_in;
    new.check_out := old.check_out;
    new.accommodation_id := old.accommodation_id;
    new.guest_id := old.guest_id;
    new.confirmed_at := old.confirmed_at;
    new.va_bank_name := old.va_bank_name;
    new.va_account_number := old.va_account_number;
    new.va_holder_name := old.va_holder_name;
    new.va_issued_at := old.va_issued_at;
    new.deposit_due_at := old.deposit_due_at;
    new.depositor_name := old.depositor_name;
    new.checked_in_at := old.checked_in_at;
    new.checked_in_by := old.checked_in_by;
    new.refund_requested_at := old.refund_requested_at;
    new.refunded_at := old.refunded_at;
    new.cancel_reason := old.cancel_reason;

    if not is_host and new.status <> 'cancelled' then
      new.status := old.status;
    end if;

    -- 입금 후 취소는 cancel_paid_booking()(환불 절차)으로만
    if old.payment_status <> 'unpaid' and new.status = 'cancelled' and old.status <> 'cancelled' then
      raise exception '입금이 완료된 예약은 환불 절차를 통해 취소해주세요.';
    end if;

    -- 게스트: 입금 전 입금자명 기록
    if is_guest and old.payment_status = 'unpaid' then
      new.depositor_name := nullif(left(trim(coalesce(v_req_depositor, '')), 40), '');
    end if;

    -- 숙소 제공자: 입금 완료된 예약의 입실 확인(입실일 당일부터, 한 번만)
    if is_host and v_req_checked_in is not null and old.checked_in_at is null then
      if old.status <> 'confirmed' or old.payment_status <> 'paid' then
        raise exception '입금이 완료된 확정 예약만 입실 확인할 수 있습니다.';
      end if;
      if (now() at time zone 'Asia/Seoul')::date < old.check_in then
        raise exception '입실일부터 입실 확인을 할 수 있습니다.';
      end if;
      new.checked_in_at := now();
      new.checked_in_by := auth.uid();
    end if;
  end if;

  -- 모든 경로 공통: 확정 시각, 가상계좌 발급 시각과 입금 기한(발급 후 7일)
  if new.status = 'confirmed' and old.status is distinct from 'confirmed' then
    new.confirmed_at := now();
  end if;
  if new.va_account_number is not null and old.va_account_number is null then
    new.va_issued_at := coalesce(new.va_issued_at, now());
    new.deposit_due_at := coalesce(new.deposit_due_at, new.va_issued_at + interval '7 days');
  end if;

  return new;
end;
$function$;

-- 입금 완료된 예약의 취소 + 환불 요청 (게스트·숙소 제공자·관리자)
--   게스트: 입실일 전날까지(한국 시간), 환불 계좌 필수
--   숙소 제공자·관리자: 지급 전이면 언제든 (게스트가 나중에 환불 계좌를 입력)
create or replace function public.cancel_paid_booking(
  p_booking_id uuid,
  p_reason text default null,
  p_bank_code text default null,
  p_bank_name text default null,
  p_account_number text default null,
  p_holder_name text default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  b public.bookings%rowtype;
  v_uid uuid := auth.uid();
  v_is_admin boolean := public.is_admin();
  v_is_host boolean;
  v_is_guest boolean;
begin
  select * into b from public.bookings where id = p_booking_id for update;
  if not found then raise exception '예약을 찾을 수 없습니다.'; end if;

  v_is_guest := b.guest_id = v_uid;
  select exists(select 1 from public.accommodations a where a.id = b.accommodation_id and a.host_id = v_uid) into v_is_host;
  if not (v_is_admin or v_is_host or v_is_guest) then
    raise exception '이 예약을 취소할 권한이 없습니다.';
  end if;
  if b.status = 'cancelled' then raise exception '이미 취소된 예약입니다.'; end if;
  if b.payment_status <> 'paid' then raise exception '입금이 완료된 예약만 환불 취소할 수 있습니다.'; end if;
  if b.payout_status = 'paid' then raise exception '숙소 제공자에게 이미 지급된 예약입니다. WEWE에 문의해주세요.'; end if;

  if v_is_guest and not v_is_admin and not v_is_host then
    if b.checked_in_at is not null or (now() at time zone 'Asia/Seoul')::date >= b.check_in then
      raise exception '입실일 당일부터는 직접 취소·환불할 수 없습니다. WEWE에 문의해주세요.';
    end if;
    if p_bank_code is null or p_account_number is null or p_holder_name is null then
      raise exception '환불 받을 계좌를 입력해주세요.';
    end if;
  end if;

  if p_bank_code is not null and p_account_number is not null and p_holder_name is not null then
    insert into public.booking_refund_accounts (booking_id, guest_id, bank_code, bank_name, account_number, holder_name)
    values (b.id, b.guest_id, p_bank_code, coalesce(p_bank_name, ''), regexp_replace(p_account_number, '[^0-9]', '', 'g'), trim(p_holder_name))
    on conflict (booking_id) do update set
      bank_code = excluded.bank_code, bank_name = excluded.bank_name,
      account_number = excluded.account_number, holder_name = excluded.holder_name, updated_at = now();
  end if;

  perform set_config('wewe.booking_system_update', 'on', true);
  update public.bookings
     set status = 'cancelled',
         payment_status = 'refund_pending',
         refund_requested_at = now(),
         cancel_reason = left(coalesce(nullif(trim(p_reason), ''),
           case when v_is_admin then '관리자 취소' when v_is_host then '숙소 제공자 취소' else '게스트 취소' end), 200)
   where id = b.id;
  perform set_config('wewe.booking_system_update', 'off', true);
end;
$function$;

revoke all on function public.cancel_paid_booking(uuid, text, text, text, text, text) from public, anon;
grant execute on function public.cancel_paid_booking(uuid, text, text, text, text, text) to authenticated;

-- 입금 기한이 지난 미입금 예약 자동 취소 (매시간)
create or replace function public.cancel_overdue_unpaid_bookings()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  n integer;
begin
  update public.bookings
     set status = 'cancelled',
         cancel_reason = '입금 기한(가상계좌 발급 후 7일) 경과로 자동 취소'
   where status = 'confirmed'
     and payment_status = 'unpaid'
     and deposit_due_at is not null
     and deposit_due_at < now();
  get diagnostics n = row_count;
  return n;
end;
$function$;

revoke all on function public.cancel_overdue_unpaid_bookings() from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'wewe-cancel-overdue-unpaid-bookings';
select cron.schedule('wewe-cancel-overdue-unpaid-bookings', '7 * * * *', $$select public.cancel_overdue_unpaid_bookings();$$);
