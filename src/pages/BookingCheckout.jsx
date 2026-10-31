import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../App';
import { ArrowLeft, Landmark, Copy, CheckCircle, CreditCard } from 'lucide-react';
import PageHero from '../components/PageHero';
import { ORG_INFO, PAYMENT_POLICY } from '../data/orgInfo';
import { PAYMENT_STATUS_LABEL, formatDateTime } from '../utils/bankTransfer';
import { payBooking, completePayment, PAY_METHOD_LABEL, PORTONE_CONFIG } from '../utils/portonePayment';

// 결제 페이지 상단 슬라이드 배너 사진 (다른 상세 페이지들과 동일한 테마 적용)
const BOOKING_CHECKOUT_HERO_IMAGES = [
  'https://images.pexels.com/photos/7746101/pexels-photo-7746101.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/34287271/pexels-photo-34287271.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/4170056/pexels-photo-4170056.jpeg?auto=compress&cs=tinysrgb&w=1600',
];

// 숙박 실비 결제 (/my-bookings/:id/pay) — 2026-10-27 포트원(KG이니시스) 카드·가상계좌 결제로 전환.
// 숙소 제공자가 예약을 확정하면 결제 기한(확정 후 7일) 안에 카드 또는 가상계좌로 결제합니다.
// 결제 결과는 서버(portone-payment)가 포트원에 직접 조회해 반영하고(payment_status = paid),
// 가상계좌는 발급된 계좌(va_*)로 입금하면 포트원 웹훅으로 자동 반영됩니다.
// 모바일 결제창은 다른 페이지로 갔다가 ?paymentId=...로 이 화면에 돌아오므로, 그때 결과를 확인합니다.

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function BookingCheckout({ userProfile }) {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState('');
  const [method, setMethod] = useState('card');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchBooking = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, accommodations(id, title, location)')
        .eq('id', id)
        .eq('guest_id', userProfile.id)
        .single();
      if (error) throw error;
      setBooking(data);
    } catch (err) {
      setLoadError('예약 정보를 불러올 수 없습니다. 삭제되었거나 접근 권한이 없는 예약일 수 있습니다.');
    } finally {
      setLoading(false);
    }
  }, [id, userProfile.id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  // 모바일 결제창에서 돌아온 경우(?paymentId=...&code=...)
  useEffect(() => {
    const returnedId = searchParams.get('paymentId');
    if (!returnedId) return;
    const code = searchParams.get('code');
    const message = searchParams.get('message');
    setSearchParams({}, { replace: true });
    if (code) {
      setPayError(message || '결제가 완료되지 않았습니다.');
      return;
    }
    setPaying(true);
    completePayment(returnedId)
      .then((r) => setNotice(r?.status === 'VIRTUAL_ACCOUNT_ISSUED' ? '가상계좌가 발급되었습니다. 아래 계좌로 입금해주세요.' : '결제가 완료되었습니다.'))
      .catch((e) => setPayError(e.message))
      .finally(() => { setPaying(false); fetchBooking(); });
  }, [searchParams, setSearchParams, fetchBooking]);

  const startPayment = async () => {
    setPaying(true);
    setPayError('');
    setNotice('');
    try {
      const r = await payBooking(booking, method);
      setNotice(r?.status === 'VIRTUAL_ACCOUNT_ISSUED' ? '가상계좌가 발급되었습니다. 아래 계좌로 입금해주세요.' : '결제가 완료되었습니다.');
    } catch (e) {
      setPayError(e.message);
    } finally {
      setPaying(false);
      fetchBooking();
    }
  };

  const copyAccount = async () => {
    try {
      await navigator.clipboard.writeText(`${booking.va_bank_name} ${booking.va_account_number}`);
      setNotice('계좌번호를 복사했습니다.');
    } catch (e) {
      setNotice('복사하지 못했습니다. 계좌번호를 직접 적어주세요.');
    }
  };


  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>예약 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (loadError || !booking) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>{loadError || '예약 정보를 찾을 수 없습니다.'}</p>
          <Link to="/my-bookings" className="btn btn-primary">내 예약으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  const awaitingPayment = booking.status === 'confirmed' && booking.payment_status === 'unpaid';
  const vaIssued = booking.pg_method === 'virtual_account' && booking.pg_status === 'VIRTUAL_ACCOUNT_ISSUED' && Boolean(booking.va_account_number);
  const overdue = booking.deposit_due_at && new Date(booking.deposit_due_at) < new Date();

  return (
    <div className="booking-checkout">
      <PageHero
        images={BOOKING_CHECKOUT_HERO_IMAGES}
        eyebrow="PAYMENT"
        title={booking.accommodations?.title || '숙박 실비 결제'}
        subtitle="숙박 실비는 카드 또는 가상계좌로 결제합니다"
      />
      <div className="container">
        <Link to={`/my-bookings/${booking.id}`} className="back-link">
          <ArrowLeft size={16} />
          예약 상세로 돌아가기
        </Link>

        <h1>숙박 실비 결제</h1>
        <p className="subtitle">
          숙소 제공자가 예약을 확정하면 <b>{PAYMENT_POLICY.depositDays}일 안에</b> 카드 또는 가상계좌로 결제해주세요.
          {' '}결제는 결제대행사 {ORG_INFO.paymentPartner}를 통해 이루어지며, 결제하신 실비는 입실이 확인된 뒤 숙소 제공자에게 전달됩니다.
        </p>

        {PORTONE_CONFIG.mode === 'test' && (
          <p className="checkout-test-banner">지금은 <b>테스트 결제</b> 기간입니다. 결제창이 열려도 실제 숙박 대금으로 청구되지 않습니다.</p>
        )}

        <div className="card checkout-summary-card">
          <h2>{booking.accommodations?.title || '삭제된 숙소'}</h2>
          {booking.accommodations?.location && (
            <p className="checkout-location">{booking.accommodations.location}</p>
          )}
          <div className="checkout-summary-row">
            <span>체류 일정</span>
            <span>{formatDate(booking.check_in)} ~ {formatDate(booking.check_out)}</span>
          </div>
          <div className="checkout-summary-row">
            <span>결제 상태</span>
            <span>{booking.status === 'cancelled' ? '취소된 예약' : PAYMENT_STATUS_LABEL[booking.payment_status] || booking.payment_status}</span>
          </div>
          {awaitingPayment && booking.deposit_due_at && (
            <div className="checkout-summary-row checkout-deadline">
              <span>결제 기한</span>
              <span>{formatDateTime(booking.deposit_due_at)}까지</span>
            </div>
          )}
          <div className="checkout-summary-row checkout-summary-total">
            <span>결제 금액</span>
            <span>₩{booking.total_price?.toLocaleString()}</span>
          </div>
        </div>

        {payError && <p className="checkout-error" role="alert">{payError}</p>}
        {notice && <p className="checkout-notice-text">{notice}</p>}

        {booking.status === 'pending' && (
          <div className="card checkout-notice">
            <p>숙소 제공자가 예약을 확정하면 결제할 수 있습니다. 확정되면 알림과 메일로 안내해드립니다.</p>
            <Link to={`/my-bookings/${booking.id}`} className="btn btn-secondary">예약 상세로 돌아가기</Link>
          </div>
        )}

        {booking.status === 'cancelled' && (
          <div className="card checkout-notice">
            <p>
              취소된 예약입니다.
              {booking.payment_status === 'refund_pending' && ' 결제하신 금액은 환불 절차가 진행 중입니다.'}
              {booking.payment_status === 'refunded' && ' 환불이 완료되었습니다.'}
            </p>
            <Link to={`/my-bookings/${booking.id}`} className="btn btn-secondary">예약 상세로 돌아가기</Link>
          </div>
        )}

        {booking.status === 'confirmed' && booking.payment_status === 'paid' && (
          <div className="card checkout-paid">
            <CheckCircle size={28} />
            <div>
              <strong>결제가 완료되었습니다</strong>
              <p>
                {booking.paid_at ? `${formatDateTime(booking.paid_at)} 결제 완료` : '결제 완료'}
                {booking.pg_method ? ` (${PAY_METHOD_LABEL[booking.pg_method]})` : ''}.
                {' '}입실이 확인되면 숙박 실비가 숙소 제공자에게 전달됩니다.
              </p>
              {booking.pg_receipt_url && (
                <a href={booking.pg_receipt_url} target="_blank" rel="noopener noreferrer" className="checkout-receipt">영수증 보기</a>
              )}
            </div>
          </div>
        )}

        {awaitingPayment && !vaIssued && (
          <div className="card checkout-pay-card">
            <h2><CreditCard size={22} /> 결제 수단 선택</h2>
            {overdue ? (
              <p>결제 기한이 지났습니다. 예약이 곧 자동으로 취소됩니다. 다시 예약해주세요.</p>
            ) : (
              <>
                <div className="checkout-methods" role="radiogroup" aria-label="결제 수단">
                  {[['card', '신용·체크카드', '결제창에서 카드사·앱카드로 바로 결제'], ['virtual_account', '가상계좌', '예약 전용 계좌를 받아 기한 안에 입금']].map(([value, label, desc]) => (
                    <label key={value} className={`checkout-method${method === value ? ' is-selected' : ''}`}>
                      <input type="radio" name="pay-method" value={value} checked={method === value} onChange={() => setMethod(value)} />
                      <span><b>{label}</b><small>{desc}</small></span>
                    </label>
                  ))}
                </div>
                <button type="button" className="btn btn-primary checkout-pay-btn" onClick={startPayment} disabled={paying}>
                  {paying ? '결제 진행 중...' : `₩${booking.total_price?.toLocaleString()} 결제하기`}
                </button>
              </>
            )}
          </div>
        )}

        {awaitingPayment && vaIssued && (
          <div className="card checkout-va-card">
            <h2><Landmark size={22} /> 입금 계좌 (가상계좌)</h2>
            <div className="checkout-va-account">
              <div>
                <span className="checkout-va-bank">{booking.va_bank_name}</span>
                <span className="checkout-va-number">{booking.va_account_number}</span>
                <span className="checkout-va-holder">예금주 {booking.va_holder_name || ORG_INFO.paymentPartner}</span>
              </div>
              <button type="button" className="btn btn-secondary" onClick={copyAccount}>
                <Copy size={16} /> 복사
              </button>
            </div>
            <div className="checkout-summary-row">
              <span>입금 금액</span>
              <span><b>₩{booking.total_price?.toLocaleString()}</b> (정확히 이 금액으로)</span>
            </div>
            {booking.deposit_due_at && (
              <div className="checkout-summary-row checkout-deadline">
                <span>입금 기한</span>
                <span>{formatDateTime(booking.deposit_due_at)}까지</span>
              </div>
            )}
            <p className="checkout-va-note">입금하시면 자동으로 확인되어 결제 완료로 바뀝니다. 입금자명은 상관없습니다.</p>
          </div>
        )}

        <div className="checkout-refund-note">
          <strong>결제·환불 안내</strong>
          <ul>
            <li>결제는 WEWE 운영 계좌가 아닌 결제대행사 {ORG_INFO.paymentPartner}를 통해 이루어집니다.</li>
            <li>예약 확정 후 {PAYMENT_POLICY.depositDays}일 안에 결제되지 않으면 예약이 자동으로 취소됩니다.</li>
            <li>결제하신 실비는 입실이 확인된 뒤 숙소 제공자에게 전달됩니다.</li>
            <li>
              입실일 전날까지 취소하시면 <b>전액 환불</b>해드립니다(카드는 결제 취소, 가상계좌는 입력하신 환불 계좌로 이체). 입실일 당일부터는 직접 취소가 어려우니 WEWE에 문의해주세요.{' '}
              <Link to="/refund-policy" target="_blank" rel="noopener noreferrer">취소·환불 규정 보기</Link>
            </li>
          </ul>
        </div>
      </div>

      <style>{`
        .booking-checkout {
          flex: 1;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: #6b6b6b;
          text-decoration: none;
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
        }

        .back-link:hover {
          color: #a65424;
        }

        .booking-checkout h1 {
          margin-bottom: 0.35rem;
        }

        .subtitle {
          color: #6b6b6b;
          margin-bottom: 1.5rem;
        }

        .checkout-summary-card h2 {
          margin: 0 0 0.35rem;
          color: #111111;
        }

        .checkout-location {
          color: #6b6b6b;
          margin: 0 0 1rem;
          font-size: 0.9rem;
        }

        .checkout-summary-row {
          display: flex;
          justify-content: space-between;
          padding: 0.6rem 0;
          border-top: 1px solid #ebebeb;
          color: #111111;
        }

        .checkout-summary-row:first-of-type {
          border-top: none;
        }

        .checkout-summary-total {
          font-weight: 700;
          color: #a65424;
          font-size: 1.1rem;
        }

        .checkout-notice {
          margin-top: 1.5rem;
          text-align: center;
        }

        .checkout-notice p {
          color: #6b6b6b;
          margin-bottom: 1rem;
        }




        @media (max-width: 768px) {
          .checkout-summary-row {
            font-size: 0.9rem;
          }



          .checkout-summary-total {
            font-size: 1rem;
          }
        }

        @media (max-width: 480px) {
          .booking-checkout h1 {
            font-size: 1.3rem;
          }

          .subtitle {
            font-size: 0.9rem;
          }

          .checkout-summary-card {
            padding: 1rem;
          }

          .checkout-summary-card h2 {
            font-size: 1.05rem;
          }

          .checkout-summary-row {
            flex-direction: column;
            gap: 0.15rem;
            font-size: 0.85rem;
            padding: 0.5rem 0;
          }

          .checkout-summary-row span:last-child {
            font-weight: 600;
          }

          .checkout-summary-total {
            flex-direction: row;
            justify-content: space-between;
            font-size: 1rem;
          }



          .back-link {
            font-size: 0.85rem;
          }
        }

        .checkout-va-card {
          margin-top: 1.5rem;
          padding: 1.5rem;
          word-break: keep-all;
        }

        .checkout-va-card h2 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.15rem;
          margin: 0 0 1rem;
        }

        .checkout-va-waiting,
        .checkout-test-banner { background: #fff7e6; border: 1px solid #f0d49a; color: #7a5a12; border-radius: 4px; padding: 0.7rem 1rem; margin: 0 0 1rem; font-size: 0.92rem; }
        .checkout-error { background: #fbe9e3; color: #a63d1f; border-radius: 4px; padding: 0.7rem 1rem; margin: 0 0 1rem; }
        .checkout-pay-card h2 { display: flex; align-items: center; gap: 0.5rem; margin: 0 0 1rem; font-size: 1.15rem; }
        .checkout-methods { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; margin-bottom: 1.1rem; }
        .checkout-method { display: flex; gap: 0.6rem; align-items: flex-start; border: 1.5px solid #ebebeb; border-radius: 4px; padding: 0.9rem 1rem; cursor: pointer; background: #fff; }
        .checkout-method.is-selected { border-color: #000000; background: #fff7f0; }
        .checkout-method input { margin-top: 0.25rem; accent-color: #d97b3f; }
        .checkout-method span { display: flex; flex-direction: column; gap: 0.2rem; }
        .checkout-method small { color: #6b6b6b; font-size: 0.85rem; line-height: 1.5; }
        .checkout-pay-btn { width: 100%; font-size: 1.05rem; padding: 0.9rem 1.5rem; font-weight: 700; }
        .checkout-receipt { display: inline-block; margin-top: 0.4rem; font-weight: 700; color: #2f7d4f; }
        .checkout-va-note { margin: 0.8rem 0 0; color: #6b6b6b; font-size: 0.9rem; }
        @media (max-width: 560px) { .checkout-methods { grid-template-columns: 1fr; } }
        .checkout-paid {
          display: flex;
          gap: 0.9rem;
          align-items: flex-start;
          margin-top: 1.5rem;
          word-break: keep-all;
        }

        .checkout-va-waiting svg { color: #a65424; flex: 0 0 auto; }
        .checkout-paid svg { color: #2f7d4f; flex: 0 0 auto; }

        .checkout-va-waiting p,
        .checkout-paid p {
          margin: 0.3rem 0 0;
          color: #4a463e;
          line-height: 1.7;
        }

        .checkout-va-account {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          background: #fafafa;
          border-radius: 4px;
          padding: 1rem 1.1rem;
          margin-bottom: 0.6rem;
        }

        .checkout-va-account > div {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .checkout-va-bank { color: #6b6b6b; font-size: 0.92rem; }
        .checkout-va-number { font-size: 1.35rem; font-weight: 800; letter-spacing: 0.03em; color: #111111; }
        .checkout-va-holder { color: #6b6b6b; font-size: 0.88rem; }

        .checkout-va-account .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .checkout-deadline span:last-child {
          color: #b3261e;
          font-weight: 700;
        }

        .checkout-depositor {
          margin-top: 1rem;
        }

        .checkout-depositor label {
          display: block;
          font-weight: 600;
          margin-bottom: 0.4rem;
          font-size: 0.92rem;
        }

        .checkout-depositor > div {
          display: flex;
          gap: 0.5rem;
        }

        .checkout-depositor input {
          flex: 1;
          min-width: 0;
          padding: 0.6rem 0.75rem;
          border: 1px solid #d8d3c8;
          border-radius: 4px;
          font-size: 1rem;
        }

        .checkout-notice-text {
          margin: 0.6rem 0 0;
          font-weight: 600;
          color: #2f7d4f;
        }

        .checkout-refund-note ul {
          margin: 0;
          padding-left: 1.1rem;
        }

        .checkout-refund-note li {
          margin: 0.2rem 0;
        }

        .checkout-refund-note {
          margin: 1.5rem 0 0;
          padding: 0.9rem 1rem;
          border-radius: 4px;
          background: #fafafa;
          border: 1px solid #f0c48f;
          font-size: 0.92rem;
          line-height: 1.65;
          color: #4a3a22;
          word-break: keep-all;
        }

        .checkout-refund-note strong {
          display: block;
          margin-bottom: 0.25rem;
          color: #8a5a12;
        }

        .checkout-refund-note p {
          margin: 0;
        }

        .checkout-refund-note a {
          color: #a65424;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}

export default BookingCheckout;
