-- 2026-10-27 포트원(PortOne) V2 + KG이니시스 결제 연동 (카드·가상계좌)
--
-- 흐름: 예약 요청 → 숙소 제공자 확정(결제 기한 = 확정 후 7일) → 선교사 결제(카드 또는 가상계좌)
--       → 서버(portone-payment)가 포트원에 금액·상태를 직접 확인해 payment_status = paid
--       → 숙소 제공자·선교사·관리자에게 "결제 완료" 알림 → 입실 확인 → 지급(지급대행 확정 전까지는 관리자가 표시)
-- 결제 결과 칸(pg_*)과 payment_status는 서버(service_role)만 바꿉니다. 회원 화면에서 보낸 값은 보호 트리거가 되돌립니다.

alter table public.bookings add column if not exists pg_payment_id text;
alter table public.bookings add column if not exists pg_method text;
alter table public.bookings add column if not exists pg_status text;
alter table public.bookings add column if not exists pg_receipt_url text;
create unique index if not exists bookings_pg_payment_id_key on public.bookings (pg_payment_id) where pg_payment_id is not null;
alter table public.bookings drop constraint if exists bookings_pg_method_check;
alter table public.bookings add constraint bookings_pg_method_check check (pg_method is null or pg_method in ('card', 'virtual_account'));
comment on column public.bookings.pg_payment_id is '포트원 결제 ID(KG이니시스 주문번호, 40자 이내) — 서버가 발급';
comment on column public.bookings.pg_method is '결제 수단: card | virtual_account';
comment on column public.bookings.pg_status is '포트원 결제 상태 원문(READY, VIRTUAL_ACCOUNT_ISSUED, PAID, CANCELLED, PARTIAL_CANCELLED, FAILED)';
comment on column public.bookings.pg_receipt_url is '카드 영수증 주소(포트원 응답)';

-- 보호 트리거: pg_* 칸 보호 + 확정 시 결제 기한(7일) 설정
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
      new.pg_payment_id := null;
      new.pg_method := null;
      new.pg_status := null;
      new.pg_receipt_url := null;
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
    new.pg_payment_id := old.pg_payment_id;
    new.pg_method := old.pg_method;
    new.pg_status := old.pg_status;
    new.pg_receipt_url := old.pg_receipt_url;
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

    if old.payment_status <> 'unpaid' and new.status = 'cancelled' and old.status <> 'cancelled' then
      raise exception '결제가 완료된 예약은 환불 절차를 통해 취소해주세요.';
    end if;

    if is_guest and old.payment_status = 'unpaid' then
      new.depositor_name := nullif(left(trim(coalesce(v_req_depositor, '')), 40), '');
    end if;

    if is_host and v_req_checked_in is not null and old.checked_in_at is null then
      if old.status <> 'confirmed' or old.payment_status <> 'paid' then
        raise exception '결제가 완료된 확정 예약만 입실 확인할 수 있습니다.';
      end if;
      if (now() at time zone 'Asia/Seoul')::date < old.check_in then
        raise exception '입실일부터 입실 확인을 할 수 있습니다.';
      end if;
      new.checked_in_at := now();
      new.checked_in_by := auth.uid();
    end if;
  end if;

  if new.status = 'confirmed' and old.status is distinct from 'confirmed' then
    new.confirmed_at := now();
    -- (2026-10-27) 결제 기한: 확정 후 7일(카드·가상계좌 공통). 지나면 cancel_overdue_unpaid_bookings가 자동 취소
    if new.payment_status = 'unpaid' then
      new.deposit_due_at := coalesce(new.deposit_due_at, now() + interval '7 days');
    end if;
  end if;
  if new.va_account_number is not null and old.va_account_number is null then
    new.va_issued_at := coalesce(new.va_issued_at, now());
    new.deposit_due_at := coalesce(new.deposit_due_at, new.va_issued_at + interval '7 days');
  end if;

  return new;
end;
$function$;

-- 알림: 결제 완료 시 숙소 제공자·선교사·관리자에게
create or replace function public.notify_booking_status_change()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_host_id uuid;
  v_title text;
begin
  select a.host_id, a.title into v_host_id, v_title from public.accommodations a where a.id = new.accommodation_id;

  if old.status is distinct from new.status then
    if new.status = 'confirmed' then
      if new.guest_id <> auth.uid() then
        insert into public.notifications (recipient_id, type, title, body, link)
        values (new.guest_id, 'booking_confirmed', '예약이 확정되었습니다',
                coalesce(v_title, '숙소') || ' 예약이 확정되었습니다. 7일 안에 결제를 완료해주세요.', '/my-bookings');
      end if;
      perform public.notify_admins('booking_confirmed', '예약 확정', coalesce(v_title, '숙소') || ' 예약이 확정되었습니다.', '/admin', auth.uid());
    elsif new.status = 'cancelled' then
      if v_host_id is not null and v_host_id <> auth.uid() then
        insert into public.notifications (recipient_id, type, title, body, link)
        values (v_host_id, 'booking_cancelled', '예약이 취소되었습니다', coalesce(v_title, '숙소') || ' 예약이 취소되었습니다.', '/host-bookings');
      end if;
      perform public.notify_admins('booking_cancelled', '예약 취소', coalesce(v_title, '숙소') || ' 예약이 취소되었습니다.', '/admin', auth.uid());
    end if;
  end if;

  -- (2026-10-27) 결제 완료
  if old.payment_status is distinct from new.payment_status and new.payment_status = 'paid' then
    if v_host_id is not null then
      insert into public.notifications (recipient_id, type, title, body, link)
      values (v_host_id, 'booking_paid', '결제가 완료되었습니다',
              coalesce(v_title, '숙소') || ' 예약의 결제가 완료되었습니다. 입실일에 입실 확인을 눌러주세요.', '/host-bookings');
    end if;
    insert into public.notifications (recipient_id, type, title, body, link)
    values (new.guest_id, 'booking_paid', '결제가 완료되었습니다',
            coalesce(v_title, '숙소') || ' 예약의 결제가 완료되었습니다.', '/my-bookings');
    perform public.notify_admins('booking_paid', '결제 완료', coalesce(v_title, '숙소') || ' 예약의 결제가 완료되었습니다.', '/admin', null);
  end if;

  return new;
end;
$function$;

-- 카드 결제는 환불 계좌 없이 취소(포트원 결제 취소로 전액 환불) — 가상계좌 결제만 환불 계좌를 받습니다.
create or replace function public.cancel_paid_booking(p_booking_id uuid, p_reason text default null, p_bank_code text default null, p_bank_name text default null, p_account_number text default null, p_holder_name text default null)
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
  if b.payment_status <> 'paid' then raise exception '결제가 완료된 예약만 환불 취소할 수 있습니다.'; end if;
  if b.payout_status = 'paid' then raise exception '숙소 제공자에게 이미 지급된 예약입니다. WEWE에 문의해주세요.'; end if;

  if v_is_guest and not v_is_admin and not v_is_host then
    if b.checked_in_at is not null or (now() at time zone 'Asia/Seoul')::date >= b.check_in then
      raise exception '입실일 당일부터는 직접 취소·환불할 수 없습니다. WEWE에 문의해주세요.';
    end if;
    if b.pg_method is distinct from 'card' and (p_bank_code is null or p_account_number is null or p_holder_name is null) then
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
