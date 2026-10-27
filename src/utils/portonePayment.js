import * as PortOne from '@portone/browser-sdk/v2';
import { supabase } from '../App';

// 포트원(PortOne) V2 + KG이니시스 결제 (2026-10-27)
// 상점 아이디·채널 키는 결제창을 열 때 쓰는 공개 값입니다(비밀값은 서버의 Supabase Secrets에만).
// 실연동으로 바꿀 때: 포트원 콘솔의 "실연동" 채널 키로 channelKey를 바꾸고 mode를 'live'로.
export const PORTONE_CONFIG = {
  mode: 'test',
  storeId: 'store-f2e6972a-2f4f-4627-a4c2-81f56726d29c',
  channelKey: 'channel-key-d2893871-e0a7-4b94-b968-ca82ace9d80d',
};

export const PAY_METHOD_LABEL = { card: '신용·체크카드', virtual_account: '가상계좌' };

async function invoke(body) {
  const { data, error } = await supabase.functions.invoke('portone-payment', { body });
  if (error) {
    let message = error.message;
    try {
      const ctx = await error.context?.json();
      if (ctx?.error) message = ctx.error;
    } catch (e) { /* 응답 본문이 없으면 기본 문구 */ }
    throw new Error(message || '결제 처리 중 오류가 발생했습니다.');
  }
  return data;
}

// 결제 완료(또는 가상계좌 발급) 후 서버가 포트원에 직접 조회해 예약에 반영
export function completePayment(paymentId) {
  return invoke({ action: 'complete', paymentId });
}

export function refundCardPayment(bookingId, reason) {
  return invoke({ action: 'refund', bookingId, reason });
}

// method: 'card' | 'virtual_account'
// 결과: { status: 'PAID' | 'VIRTUAL_ACCOUNT_ISSUED' | ... } — 결제창을 닫거나 실패하면 Error
// 모바일에서는 결제창이 다른 페이지로 이동했다가 redirectUrl로 돌아옵니다(그때는 이 함수가 끝나지 않음).
export async function payBooking(booking, method) {
  const prep = await invoke({ action: 'prepare', bookingId: booking.id, method });
  const redirectUrl = `${window.location.origin}/stay/my-bookings/${booking.id}/pay`;
  const response = await PortOne.requestPayment({
    storeId: prep.storeId || PORTONE_CONFIG.storeId,
    channelKey: PORTONE_CONFIG.channelKey,
    paymentId: prep.paymentId,
    orderName: prep.orderName,
    totalAmount: prep.amount,
    currency: 'CURRENCY_KRW',
    payMethod: method === 'card' ? 'CARD' : 'VIRTUAL_ACCOUNT',
    customer: prep.customer,
    customData: { bookingId: booking.id },
    redirectUrl,
    ...(method === 'virtual_account' ? { virtualAccount: { accountExpiry: { validHours: prep.virtualAccountHours } } } : {}),
  });
  if (!response) throw new Error('결제창을 열지 못했습니다.');
  if (response.code) {
    // 사용자가 결제창을 닫은 경우 등
    throw new Error(response.message || '결제가 완료되지 않았습니다.');
  }
  return completePayment(response.paymentId || prep.paymentId);
}
