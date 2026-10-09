-- 2026-10-10: 숙소 제공자 지급 계좌 (페이플 정산지급대행 준비).
-- 페이플 지급대행은 송금 전에 계좌조회(예금주 실명 확인)를 하며, 이때 은행 코드·계좌번호·
-- 예금주 구분(개인/개인사업자 또는 법인)·생년월일 6자리 또는 사업자(고유)번호 10자리가 필요합니다.
-- 민감 정보라 users 테이블과 분리하고, 본인과 승인된 관리자만 볼 수 있게 합니다.
-- 확인 결과(verified_*), 페이플 빌링키(payple_billing_tran_id)는 관리자·서버만 기록하며,
-- 본인이 계좌 정보를 바꾸면 확인 결과는 자동으로 초기화됩니다.

create table if not exists public.host_payout_accounts (
  user_id uuid primary key references public.users(id) on delete cascade,
  bank_code text not null check (bank_code ~ '^[0-9]{3}$'),
  bank_name text not null,
  account_number text not null check (account_number ~ '^[0-9]{6,16}$'),
  holder_name text not null check (char_length(holder_name) between 1 and 60),
  holder_type text not null check (holder_type in ('personal', 'corporate')),
  holder_info text not null,
  verified_at timestamptz,
  verified_holder_name text,
  payple_billing_tran_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint host_payout_accounts_holder_info_check check (
    (holder_type = 'personal' and holder_info ~ '^[0-9]{6}$')
    or (holder_type = 'corporate' and holder_info ~ '^[0-9]{10}$')
  )
);

comment on table public.host_payout_accounts is
  '숙소 제공자 지급 계좌(페이플 지급대행용). holder_type: personal(개인·개인사업자, holder_info=생년월일 YYMMDD) / corporate(법인·단체, holder_info=사업자·고유번호 10자리)';

alter table public.host_payout_accounts enable row level security;

drop policy if exists "Hosts read own payout account" on public.host_payout_accounts;
create policy "Hosts read own payout account" on public.host_payout_accounts
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Hosts insert own payout account" on public.host_payout_accounts;
create policy "Hosts insert own payout account" on public.host_payout_accounts
  for insert to authenticated with check (
    (user_id = auth.uid() and exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'host'))
    or public.is_admin()
  );

drop policy if exists "Hosts update own payout account" on public.host_payout_accounts;
create policy "Hosts update own payout account" on public.host_payout_accounts
  for update to authenticated using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Hosts delete own payout account" on public.host_payout_accounts;
create policy "Hosts delete own payout account" on public.host_payout_accounts
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

create or replace function public.guard_host_payout_account()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_client boolean := coalesce(auth.role(), '') in ('authenticated', 'anon');
begin
  new.updated_at := now();
  if not v_client or public.is_admin() then
    return new;
  end if;
  -- 본인은 확인 결과를 직접 쓸 수 없고, 계좌 정보가 바뀌면 다시 확인받아야 합니다.
  if TG_OP = 'INSERT' then
    new.verified_at := null;
    new.verified_holder_name := null;
    new.payple_billing_tran_id := null;
    new.created_at := now();
    return new;
  end if;
  new.user_id := old.user_id;
  new.created_at := old.created_at;
  if new.bank_code is distinct from old.bank_code
     or new.account_number is distinct from old.account_number
     or new.holder_name is distinct from old.holder_name
     or new.holder_type is distinct from old.holder_type
     or new.holder_info is distinct from old.holder_info then
    new.verified_at := null;
    new.verified_holder_name := null;
    new.payple_billing_tran_id := null;
  else
    new.verified_at := old.verified_at;
    new.verified_holder_name := old.verified_holder_name;
    new.payple_billing_tran_id := old.payple_billing_tran_id;
  end if;
  return new;
end;
$function$;

drop trigger if exists guard_host_payout_account on public.host_payout_accounts;
create trigger guard_host_payout_account
  before insert or update on public.host_payout_accounts
  for each row execute function public.guard_host_payout_account();
