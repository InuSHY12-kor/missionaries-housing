import { supabase } from '../App';

// 결제 완료된 예약을 취소하면서 토스 결제를 전액 환불합니다 (2026-10-10).
// 실제 환불과 규정 검사(게스트는 입실일 전날까지)는 서버 함수 cancel-toss-payment가 하고,
// 성공하면 예약은 status 'cancelled', payment_status 'refunded'가 됩니다.
// 실패하면 서버가 보낸 안내 문구를 담은 Error를 던집니다.
export async function refundPaidBooking(bookingId, reason) {
  const { data, error } = await supabase.functions.invoke('cancel-toss-payment', {
    body: { bookingId, reason },
  });
  if (error) {
    let msg = '환불 처리 중 오류가 발생했습니다.';
    try {
      const ctx = await error.context?.json();
      if (ctx?.error) msg = ctx.error;
    } catch (e) {
      // JSON 파싱 실패 시 기본 메시지 사용
    }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}
