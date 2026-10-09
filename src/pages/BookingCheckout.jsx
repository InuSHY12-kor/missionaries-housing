import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../App';
import { ArrowLeft, Landmark, Copy, Clock, CheckCircle } from 'lucide-react';
import PageHero from '../components/PageHero';
import { ORG_INFO, PAYMENT_POLICY } from '../data/orgInfo';
import { PAYMENT_STATUS_LABEL, formatDateTime } from '../utils/bankTransfer';

// 결제 페이지 상단 슬라이드 배너 사진 (다른 상세 페이지들과 동일한 테마 적용)
const BOOKING_CHECKOUT_HERO_IMAGES = [
  'https://images.pexels.com/photos/7746101/pexels-photo-7746101.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/34287271/pexels-photo-34287271.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/4170056/pexels-photo-4170056.jpeg?auto=compress&cs=tinysrgb&w=1600',
];

// 숙박 실비 입금 안내 (/my-bookings/:id/pay) — 2026-10-10 토스 카드결제에서 계좌이체 전용으로 전환.
// 숙박 실비는 페이플(Payple)이 예약마다 발급하는 가상계좌로만 받습니다(카드 결제 없음).
// 가상계좌 정보(va_*)와 입금 기한(deposit_due_at = 발급 후 7일)은 관리자 또는 페이플 연동이 채우며,
// 입금이 확인되면 payment_status가 paid로 바뀝니다. 게스트는 여기서 입금자명만 남길 수 있습니다.

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function BookingCheckout({ userProfile }) {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [depositor, setDepositor] = useState('');
  const [savingDepositor, setSavingDepositor] = useState(false);
  const [notice, setNotice] = useState('');

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
      setDepositor(data.depositor_name || userProfile.full_name || '');
    } catch (err) {
      setLoadError('예약 정보를 불러올 수 없습니다. 삭제되었거나 접근 권한이 없는 예약일 수 있습니다.');
    } finally {
      setLoading(false);
    }
  }, [id, userProfile.id, userProfile.full_name]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const copyAccount = async () => {
    try {
      await navigator.clipboard.writeText(`${booking.va_bank_name} ${booking.va_account_number}`);
      setNotice('계좌번호를 복사했습니다.');
    } catch (e) {
      setNotice('복사하지 못했습니다. 계좌번호를 직접 적어주세요.');
    }
  };

  const saveDepositor = async () => {
    setSavingDepositor(true);
    setNotice('');
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ depositor_name: depositor.trim() || null })
        .eq('id', booking.id);
      if (error) throw error;
      setNotice('입금자명을 저장했습니다.');
    } catch (err) {
      setNotice('오류: ' + err.message);
    } finally {
      setSavingDepositor(false);
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

  const awaitingDeposit = booking.status === 'confirmed' && booking.payment_status === 'unpaid';
  const hasAccount = Boolean(booking.va_account_number);

  return (
    <div className="booking-checkout">
      <PageHero
        images={BOOKING_CHECKOUT_HERO_IMAGES}
        eyebrow="BANK TRANSFER"
        title={booking.accommodations?.title || '숙박 실비 입금 안내'}
        subtitle="숙박 실비는 계좌이체(가상계좌)로만 입금받습니다"
      />
      <div className="container">
        <Link to={`/my-bookings/${booking.id}`} className="back-link">
          <ArrowLeft size={16} />
          예약 상세로 돌아가기
        </Link>

        <h1>숙박 실비 입금 안내</h1>
        <p className="subtitle">
          WEWE STAY는 <b>계좌이체로만</b> 숙박 실비를 받습니다(신용카드 결제 없음). 예약이 확정되면
          {' '}{ORG_INFO.paymentPartner}가 이 예약 전용 가상계좌를 발급하며, 발급일로부터 <b>{PAYMENT_POLICY.depositDays}일 안에</b> 입금해주세요.
        </p>

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
            <span>입금 상태</span>
            <span>{booking.status === 'cancelled' ? '취소된 예약' : PAYMENT_STATUS_LABEL[booking.payment_status] || booking.payment_status}</span>
          </div>
          <div className="checkout-summary-row checkout-summary-total">
            <span>입금할 금액</span>
            <span>₩{booking.total_price?.toLocaleString()}</span>
          </div>
        </div>

        {booking.status === 'pending' && (
          <div className="card checkout-notice">
            <p>숙소 제공자가 예약을 확정하면 입금 계좌가 발급됩니다. 확정 전에는 입금하지 마세요.</p>
            <Link to={`/my-bookings/${booking.id}`} className="btn btn-secondary">예약 상세로 돌아가기</Link>
          </div>
        )}

        {booking.status === 'cancelled' && (
          <div className="card checkout-notice">
            <p>
              취소된 예약입니다.
              {booking.payment_status === 'refund_pending' && ' 입금하신 금액은 환불 절차가 진행 중입니다.'}
              {booking.payment_status === 'refunded' && ' 환불이 완료되었습니다.'}
            </p>
            <Link to={`/my-bookings/${booking.id}`} className="btn btn-secondary">예약 상세로 돌아가기</Link>
          </div>
        )}

        {booking.status === 'confirmed' && booking.payment_status === 'paid' && (
          <div className="card checkout-paid">
            <CheckCircle size={28} />
            <div>
              <strong>입금이 확인되었습니다</strong>
              <p>
                {booking.paid_at ? `${formatDateTime(booking.paid_at)} 입금 확인. ` : ''}
                입실이 확인되면 숙박 실비가 숙소 제공자에게 전달됩니다.
              </p>
            </div>
          </div>
        )}

        {awaitingDeposit && !hasAccount && (
          <div className="card checkout-va-card checkout-va-waiting">
            <Clock size={26} />
            <div>
              <strong>입금 계좌 발급 준비 중</strong>
              <p>
                예약이 확정되었습니다. {ORG_INFO.paymentPartner} 가상계좌가 발급되면 이 화면과 알림으로 안내해드립니다.
                발급 전에는 입금하지 마세요. 오래 걸리면 {ORG_INFO.phone} 또는 {ORG_INFO.email}로 문의해주세요.
              </p>
            </div>
          </div>
        )}

        {awaitingDeposit && hasAccount && (
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

            <div className="checkout-depositor">
              <label htmlFor="depositor-name">입금자명 (입금 확인에 사용됩니다)</label>
              <div>
                <input
                  id="depositor-name"
                  type="text"
                  value={depositor}
                  onChange={(e) => setDepositor(e.target.value)}
                  maxLength={40}
                  placeholder="입금하실 분 성명"
                />
                <button type="button" className="btn btn-primary" onClick={saveDepositor} disabled={savingDepositor}>
                  {savingDepositor ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
            {notice && <p className="checkout-notice-text">{notice}</p>}
          </div>
        )}

        <div className="checkout-refund-note">
          <strong>입금·환불 안내</strong>
          <ul>
            <li>숙박 실비는 WEWE 운영 계좌가 아닌, {ORG_INFO.paymentPartner}가 발급한 이 예약 전용 가상계좌로 받습니다.</li>
            <li>가상계좌 발급 후 {PAYMENT_POLICY.depositDays}일 안에 입금되지 않으면 예약이 자동으로 취소됩니다.</li>
            <li>입금하신 실비는 입실이 확인된 뒤 {ORG_INFO.paymentPartner} 정산지급대행을 통해 숙소 제공자에게 전달됩니다.</li>
            <li>
              입실일 전날까지 취소하시면 <b>전액 환불</b>해드립니다(입금자 본인 계좌로 이체). 입실일 당일부터는 직접 취소가 어려우니 WEWE에 문의해주세요.{' '}
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
          color: #7f8c8d;
          text-decoration: none;
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
        }

        .back-link:hover {
          color: #d97b3f;
        }

        .booking-checkout h1 {
          margin-bottom: 0.35rem;
        }

        .subtitle {
          color: #7f8c8d;
          margin-bottom: 1.5rem;
        }

        .checkout-summary-card h2 {
          margin: 0 0 0.35rem;
          color: #2c3e50;
        }

        .checkout-location {
          color: #7f8c8d;
          margin: 0 0 1rem;
          font-size: 0.9rem;
        }

        .checkout-summary-row {
          display: flex;
          justify-content: space-between;
          padding: 0.6rem 0;
          border-top: 1px solid #f0dcc0;
          color: #2c3e50;
        }

        .checkout-summary-row:first-of-type {
          border-top: none;
        }

        .checkout-summary-total {
          font-weight: 700;
          color: #d97b3f;
          font-size: 1.1rem;
        }

        .checkout-notice {
          margin-top: 1.5rem;
          text-align: center;
        }

        .checkout-notice p {
          color: #7f8c8d;
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
        .checkout-paid {
          display: flex;
          gap: 0.9rem;
          align-items: flex-start;
          margin-top: 1.5rem;
          word-break: keep-all;
        }

        .checkout-va-waiting svg { color: #d97b3f; flex: 0 0 auto; }
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
          background: #faf6ef;
          border-radius: 10px;
          padding: 1rem 1.1rem;
          margin-bottom: 0.6rem;
        }

        .checkout-va-account > div {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .checkout-va-bank { color: #6b665c; font-size: 0.92rem; }
        .checkout-va-number { font-size: 1.35rem; font-weight: 800; letter-spacing: 0.03em; color: #1c1c1a; }
        .checkout-va-holder { color: #6b665c; font-size: 0.88rem; }

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
          border-radius: 8px;
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
          border-radius: 8px;
          background: #fff8ec;
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
          color: #b8622c;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}

export default BookingCheckout;
