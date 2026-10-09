import { supabase } from '../App';
import { BANKS } from '../components/PayoutAccountForm';

// 숙박 실비 계좌이체(페이플 가상계좌) 흐름 공용 도우미 (2026-10-10).
// DB: bookings.payment_status = unpaid(입금 대기) / paid(입금 완료) / refund_pending(환불 진행 중) / refunded(환불 완료)
// 입금 후 취소는 RPC cancel_paid_booking(환불 요청)으로만 할 수 있습니다.

export const PAYMENT_STATUS_LABEL = {
  unpaid: '입금 대기',
  paid: '입금 완료',
  refund_pending: '환불 진행 중',
  refunded: '환불 완료',
};

export const PAYMENT_STATUS_BADGE_CLASS = {
  unpaid: 'badge-warning',
  paid: 'badge-success',
  refund_pending: 'badge-warning',
  refunded: 'badge-info',
};

function rpcErrorMessage(error) {
  return error?.message || '처리 중 오류가 발생했습니다.';
}

// account: { bank_code, account_number, holder_name } (게스트는 필수, 숙소 제공자·관리자는 생략)
export async function cancelPaidBooking(bookingId, reason, account) {
  const bank = account ? BANKS.find(([code]) => code === account.bank_code) : null;
  const { error } = await supabase.rpc('cancel_paid_booking', {
    p_booking_id: bookingId,
    p_reason: reason || null,
    p_bank_code: account?.bank_code || null,
    p_bank_name: bank ? bank[1] : null,
    p_account_number: account ? String(account.account_number || '').replace(/[^0-9]/g, '') : null,
    p_holder_name: account?.holder_name?.trim() || null,
  });
  if (error) throw new Error(rpcErrorMessage(error));
}

// 숙소 제공자·관리자가 취소한 경우처럼, 환불 진행 중에 게스트가 환불 계좌를 나중에 입력할 때
export async function saveRefundAccount(bookingId, guestId, account) {
  const bank = BANKS.find(([code]) => code === account.bank_code);
  const { error } = await supabase.from('booking_refund_accounts').upsert({
    booking_id: bookingId,
    guest_id: guestId,
    bank_code: account.bank_code,
    bank_name: bank ? bank[1] : '',
    account_number: String(account.account_number || '').replace(/[^0-9]/g, ''),
    holder_name: String(account.holder_name || '').trim(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'booking_id' });
  if (error) throw new Error(rpcErrorMessage(error));
}

export function validateRefundAccount(account) {
  if (!BANKS.find(([code]) => code === account.bank_code)) return '환불 받을 은행을 선택해주세요.';
  const digits = String(account.account_number || '').replace(/[^0-9]/g, '');
  if (digits.length < 6 || digits.length > 16) return '계좌번호를 숫자로 정확히 입력해주세요.';
  if (!String(account.holder_name || '').trim()) return '예금주명을 입력해주세요.';
  return null;
}

export function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// 한국 시간 기준 오늘(YYYY-MM-DD)
export function todayKst() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());
}
