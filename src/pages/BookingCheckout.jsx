import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../App';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import PageHero from '../components/PageHero';

// 결제 페이지 상단 슬라이드 배너 사진 (다른 상세 페이지들과 동일한 테마 적용)
const BOOKING_CHECKOUT_HERO_IMAGES = [
  'https://images.pexels.com/photos/7746101/pexels-photo-7746101.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/34287271/pexels-photo-34287271.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/4170056/pexels-photo-4170056.jpeg?auto=compress&cs=tinysrgb&w=1600',
];

// 토스페이먼츠 결제위젯 — (2026-10-10) 구버전(v1 payment-widget)에서 토스가 권장하는 v2 SDK로 교체.
// 클라이언트 키는 Netlify 환경변수 REACT_APP_TOSS_CLIENT_KEY(결제위젯 연동 키: test_gck_… / live_gck_…).
// 실제 결제 승인(confirm-toss-payment)과 환불(cancel-toss-payment)은 서버 함수에서 시크릿 키로 처리합니다.
const TOSS_SDK_SRC = 'https://js.tosspayments.com/v2/standard';
const TOSS_CLIENT_KEY = process.env.REACT_APP_TOSS_CLIENT_KEY;

function loadTossSdk() {
  return new Promise((resolve, reject) => {
    if (window.TossPayments) {
      resolve(window.TossPayments);
      return;
    }
    const existing = document.querySelector(`script[src="${TOSS_SDK_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.TossPayments));
      existing.addEventListener('error', () => reject(new Error('script load error')));
      return;
    }
    const script = document.createElement('script');
    script.src = TOSS_SDK_SRC;
    script.async = true;
    script.onload = () => resolve(window.TossPayments);
    script.onerror = () => reject(new Error('script load error'));
    document.head.appendChild(script);
  });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function BookingCheckout({ userProfile }) {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [widgetError, setWidgetError] = useState('');
  const [widgetReady, setWidgetReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const paymentWidgetRef = useRef(null);

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

  const payable = booking && booking.status === 'confirmed' && booking.payment_status !== 'paid';

  useEffect(() => {
    if (!payable) return;
    if (!TOSS_CLIENT_KEY) {
      setWidgetError('결제 기능이 아직 준비 중입니다. 관리자에게 문의해주세요.');
      return;
    }

    let cancelled = false;
    loadTossSdk()
      .then(async (TossPayments) => {
        if (cancelled || !TossPayments) return;
        // customerKey는 사용자별로 고유해야 하므로 회원 id(uuid)를 사용합니다.
        const widgets = TossPayments(TOSS_CLIENT_KEY).widgets({ customerKey: userProfile.id });
        paymentWidgetRef.current = widgets;
        await widgets.setAmount({ currency: 'KRW', value: Number(booking.total_price) });
        await Promise.all([
          widgets.renderPaymentMethods({ selector: '#toss-payment-method', variantKey: 'DEFAULT' }),
          widgets.renderAgreement({ selector: '#toss-agreement', variantKey: 'AGREEMENT' }),
        ]);
        if (!cancelled) setWidgetReady(true);
      })
      .catch(() => {
        if (!cancelled) setWidgetError('결제 위젯을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payable, booking?.total_price, userProfile.id]);

  const handlePay = async () => {
    if (!paymentWidgetRef.current || !booking) return;
    setSubmitting(true);
    try {
      const orderId = `wewe-${booking.id}-${Date.now()}`;
      await paymentWidgetRef.current.requestPayment({
        orderId,
        orderName: booking.accommodations?.title
          ? `${booking.accommodations.title} 숙박 실비`
          : 'WEWE STAY 숙박 실비',
        successUrl: `${window.location.origin}/stay/payment/success?bookingId=${booking.id}`,
        failUrl: `${window.location.origin}/stay/payment/fail?bookingId=${booking.id}`,
        customerEmail: userProfile.email,
        customerName: userProfile.full_name,
        customerMobilePhone: userProfile.phone ? userProfile.phone.replace(/[^0-9]/g, '') : undefined,
      });
    } catch (err) {
      // 사용자가 결제창을 닫는 등의 경우에도 여기로 오므로, 별도 안내 없이 버튼만 복구합니다.
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <p>로드 중...</p>
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

  return (
    <div className="booking-checkout">
      <PageHero
        images={BOOKING_CHECKOUT_HERO_IMAGES}
        eyebrow="PAYMENT"
        title={booking.accommodations?.title || '숙박 실비 결제'}
        subtitle="예약이 확정된 숙소의 숙박 실비를 결제합니다"
      />
      <div className="container">
        <Link to={`/my-bookings/${booking.id}`} className="back-link">
          <ArrowLeft size={16} />
          예약 상세로 돌아가기
        </Link>

        <h1>숙박 실비 결제</h1>
        <p className="subtitle">예약이 확정된 숙소의 숙박 실비를 결제합니다. 카드·간편결제 등을 이용하실 수 있습니다.</p>

        <div className="card checkout-summary-card">
          <h2>{booking.accommodations?.title || '삭제된 숙소'}</h2>
          {booking.accommodations?.location && (
            <p className="checkout-location">{booking.accommodations.location}</p>
          )}
          <div className="checkout-summary-row">
            <span>체류 일정</span>
            <span>{formatDate(booking.check_in)} ~ {formatDate(booking.check_out)}</span>
          </div>
          <div className="checkout-summary-row checkout-summary-total">
            <span>결제 금액</span>
            <span>₩{booking.total_price?.toLocaleString()}</span>
          </div>
        </div>

        {booking.status !== 'confirmed' ? (
          <div className="card checkout-notice">
            <p>예약이 호스트에 의해 확정된 후에만 결제할 수 있습니다.</p>
            <Link to={`/my-bookings/${booking.id}`} className="btn btn-secondary">예약 상세로 돌아가기</Link>
          </div>
        ) : booking.payment_status === 'paid' ? (
          <div className="card checkout-notice">
            <p>이미 결제가 완료된 예약입니다.</p>
            <Link to={`/my-bookings/${booking.id}`} className="btn btn-secondary">예약 상세로 돌아가기</Link>
          </div>
        ) : widgetError ? (
          <div className="card checkout-notice">
            <p>{widgetError}</p>
            <Link to={`/my-bookings/${booking.id}`} className="btn btn-secondary">예약 상세로 돌아가기</Link>
          </div>
        ) : (
          <div className="card checkout-widget-card">
            <div id="toss-payment-method" />
            <div id="toss-agreement" />
            {/* (2026-10-10) 결제 전에 환불 규정을 분명히 안내 */}
            <div className="checkout-refund-note">
              <strong>취소·환불 안내</strong>
              <p>
                입실일 전날까지 취소하시면 결제하신 금액을 <b>전액 환불</b>해드립니다. 입실일 당일부터는
                직접 취소·환불이 어려우니 관리자에게 문의해주세요.{' '}
                <Link to="/refund-policy" target="_blank" rel="noopener noreferrer">환불 규정 전문 보기</Link>
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary checkout-pay-btn"
              disabled={!widgetReady || submitting}
              onClick={handlePay}
            >
              <ShieldCheck size={18} />
              {submitting ? '결제 진행 중...' : `₩${booking.total_price?.toLocaleString()} 결제하기`}
            </button>
          </div>
        )}
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

        .checkout-widget-card {
          margin-top: 1.5rem;
          padding: 1.5rem;
        }

        .checkout-pay-btn {
          width: 100%;
          margin-top: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 1.05rem;
          padding: 0.9rem;
        }

        .checkout-pay-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .checkout-summary-row {
            font-size: 0.9rem;
          }

          .checkout-widget-card {
            padding: 1.25rem;
          }

          .checkout-pay-btn {
            font-size: 1rem;
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

          .checkout-widget-card {
            padding: 0.875rem;
          }

          .checkout-pay-btn {
            font-size: 0.95rem;
            padding: 0.85rem;
          }

          .back-link {
            font-size: 0.85rem;
          }
        }

        .checkout-refund-note {
          margin: 1rem 0;
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
