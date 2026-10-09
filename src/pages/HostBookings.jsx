import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../App';
import { PAYMENT_STATUS_LABEL, PAYMENT_STATUS_BADGE_CLASS, cancelPaidBooking, todayKst, formatDateTime } from '../utils/bankTransfer';
import { payoutFee, payoutNet } from '../utils/price';
import { ORG_INFO, PAYMENT_POLICY } from '../data/orgInfo';
import { MapPin, Calendar, Phone, CheckCircle, XCircle, ChevronDown, DoorOpen } from 'lucide-react';
import PageHero from '../components/PageHero';

// 예약 관리(호스트) 페이지 상단 슬라이드 배너 사진
const HOST_BOOKINGS_HERO_IMAGES = [
  'https://images.pexels.com/photos/6276201/pexels-photo-6276201.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/5737832/pexels-photo-5737832.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/5737831/pexels-photo-5737831.jpeg?auto=compress&cs=tinysrgb&w=1600'
];

const STATUS_LABEL = {
  pending: '예약됨',
  confirmed: '예약 확정됨',
  cancelled: '취소됨'
};

const STATUS_BADGE_CLASS = {
  pending: 'badge-warning',
  confirmed: 'badge-success',
  cancelled: 'badge-danger'
};

// 입금 상태 배지(입금 대기·입금 완료·환불 진행 중·환불 완료)는 utils/bankTransfer.js에서 함께 씁니다.
// 숙소 제공자는 여기서 선교사님의 입금 여부를 확인하고, 입실일에 "입실 확인"을 누릅니다.
// 입실이 확인되면 WEWE가 페이플 정산지급대행으로 실비(수수료 차감)를 지급합니다.

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function HostBookings({ userProfile }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!userProfile?.id) {
      setBookings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // RLS 정책("Hosts can view bookings for their accommodations")뿐 아니라,
      // 관리자 계정이 이 페이지(내 숙소로 들어온 예약 관리)에 접속했을 때도
      // "전체 예약"이 아니라 "내가 호스트로 등록한 숙소"의 예약만 보이도록
      // host_id로 명시적으로 필터링합니다. (전체 예약 현황은 관리 탭 > 전체 예약에서 확인)
      const { data, error } = await supabase
        .from('bookings')
        .select('*, accommodations!inner(title, location, host_id), users(full_name, phone, church_name)')
        .eq('accommodations.host_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('예약 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const updateStatus = async (bookingId, status) => {
    const target = bookings.find(b => b.id === bookingId);
    // 입금 완료된 예약을 숙소 제공자가 취소하면 시점과 관계없이 선교사님께 전액 환불됩니다.
    if (status === 'cancelled' && target?.payment_status === 'paid') {
      if (!window.confirm('이미 입금된 예약입니다. 취소하면 선교사님께 입금액 전액이 환불됩니다. 취소하시겠습니까?')) return;
      try {
        await cancelPaidBooking(bookingId, '숙소 제공자 예약 취소');
        setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelled', payment_status: 'refund_pending' } : b));
      } catch (error) {
        alert('오류: ' + error.message);
      }
      return;
    }
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status } : b));
    } catch (error) {
      alert('오류: ' + error.message);
    }
  };

  const confirmCheckIn = async (booking) => {
    if (!window.confirm('선교사님이 숙소에 입실하셨나요? 입실 확인 후 숙박 실비 지급 절차가 시작됩니다.')) return;
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ checked_in_at: new Date().toISOString() })
        .eq('id', booking.id)
        .select('checked_in_at')
        .single();
      if (error) throw error;
      setBookings(bookings.map(b => b.id === booking.id ? { ...b, checked_in_at: data.checked_in_at } : b));
    } catch (error) {
      alert('오류: ' + error.message);
    }
  };

  // 확인이 필요한(대기 중) 예약은 전부 보여주고, 이미 처리된(확정/거절) 지난 예약은
  // 가장 최근 1건만 기본 노출 — "더보기"를 눌러야 나머지 지난 예약이 펼쳐집니다.
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const historyBookings = bookings.filter(b => b.status !== 'pending');
  const visibleHistory = showHistory ? historyBookings : historyBookings.slice(0, 1);

  const renderBookingCard = (booking) => (
    <div key={booking.id} className="card booking-item">
      <div className="booking-item-header">
        <div>
          <h3>{booking.accommodations?.title || '삭제된 숙소'}</h3>
          {booking.accommodations?.location && (
            <p className="location">
              <MapPin size={16} />
              {booking.accommodations.location}
            </p>
          )}
        </div>
        <div className="booking-item-badges">
          <span className={`badge ${STATUS_BADGE_CLASS[booking.status] || 'badge-info'}`}>
            {STATUS_LABEL[booking.status] || booking.status}
          </span>
          {(booking.status === 'confirmed' || booking.payment_status !== 'unpaid') && (
            <span className={`badge ${PAYMENT_STATUS_BADGE_CLASS[booking.payment_status] || 'badge-info'}`}>
              {PAYMENT_STATUS_LABEL[booking.payment_status] || booking.payment_status}
            </span>
          )}
        </div>
      </div>

      <div className="booking-item-body">
        <p className="dates">
          <Calendar size={16} />
          {formatDate(booking.check_in)} ~ {formatDate(booking.check_out)}
        </p>
        <p className="total-price">₩{booking.total_price?.toLocaleString()}</p>
      </div>

      {booking.status === 'confirmed' && (
        <div className="host-payment-info">
          {booking.payment_status === 'unpaid' && (
            <p>
              {booking.va_account_number
                ? `선교사님의 입금을 기다리고 있습니다${booking.deposit_due_at ? ` (입금 기한 ${formatDateTime(booking.deposit_due_at)})` : ''}. 기한까지 입금되지 않으면 예약이 자동 취소됩니다.`
                : '입금 계좌(가상계좌) 발급을 준비하고 있습니다. 발급 후 선교사님이 7일 안에 입금합니다.'}
            </p>
          )}
          {booking.payment_status === 'paid' && (
            <>
              <p>
                입금 완료{booking.paid_at ? ` (${formatDateTime(booking.paid_at)})` : ''}
                {booking.checked_in_at ? ` · 입실 확인 ${formatDateTime(booking.checked_in_at)}` : ' · 입실일에 "입실 확인"을 눌러주세요'}
              </p>
              {Number(booking.total_price) > 0 && (
                <p className="host-payout-line">
                  {booking.payout_status === 'paid'
                    ? `지급 완료 ₩${Number(booking.payout_amount ?? payoutNet(booking.total_price, PAYMENT_POLICY.payoutFeeRate)).toLocaleString()}${booking.payout_at ? ` (${formatDateTime(booking.payout_at)})` : ''}`
                    : `지급 예정액 ₩${payoutNet(booking.total_price, PAYMENT_POLICY.payoutFeeRate).toLocaleString()} = 실비 ₩${Number(booking.total_price).toLocaleString()} − 정산지급대행 수수료 ₩${payoutFee(booking.total_price, PAYMENT_POLICY.payoutFeeRate).toLocaleString()}(${PAYMENT_POLICY.payoutFeeLabel})`}
                </p>
              )}
            </>
          )}
        </div>
      )}

      <div className="guest-info">
        <p><strong>예약자:</strong> {booking.users?.full_name || '알 수 없음'}</p>
        {booking.users?.church_name && <p><strong>교회:</strong> {booking.users.church_name}</p>}
        {booking.users?.phone && (
          <p className="phone">
            <Phone size={14} />
            {booking.users.phone}
          </p>
        )}
      </div>

      {booking.status === 'pending' && (
        <div className="booking-item-actions">
          <button className="btn btn-success" onClick={() => updateStatus(booking.id, 'confirmed')}>
            <CheckCircle size={16} />
            예약 확정
          </button>
          <button className="btn btn-danger" onClick={() => updateStatus(booking.id, 'cancelled')}>
            <XCircle size={16} />
            예약 거절
          </button>
        </div>
      )}

      {/* 입실 확인(입실일부터) / 숙소 사정으로 취소(선교사님께 전액 환불) */}
      {booking.status === 'confirmed' && booking.payment_status === 'paid' && booking.payout_status !== 'paid' && (
        <div className="booking-item-actions">
          {!booking.checked_in_at && todayKst() >= booking.check_in && (
            <button className="btn btn-success" onClick={() => confirmCheckIn(booking)}>
              <DoorOpen size={16} />
              입실 확인
            </button>
          )}
          {!booking.checked_in_at && (
            <button className="btn btn-danger" onClick={() => updateStatus(booking.id, 'cancelled')}>
              <XCircle size={16} />
              예약 취소 (전액 환불)
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="host-bookings">
      <PageHero
        images={HOST_BOOKINGS_HERO_IMAGES}
        eyebrow="MANAGE BOOKINGS"
        title="선교사님을 맞이할 준비를 해주세요"
        subtitle="예약 요청을 확인하고 확정/거절할 수 있습니다."
      />
      <div className="container">
        <h1>예약 관리</h1>
        <p className="subtitle">내 숙소에 들어온 예약 요청을 확인하고 확정/거절할 수 있습니다.</p>
        <div className="host-fee-notice">
          <strong>숙박 실비 지급 안내</strong>
          <p>
            선교사님은 예약 확정 후 발급되는 {ORG_INFO.paymentPartner} 가상계좌로 {PAYMENT_POLICY.depositDays}일 안에 계좌이체로 입금합니다.
            입실이 확인되면 {ORG_INFO.paymentPartner} 정산지급대행을 통해 등록하신 지급 계좌로 실비를 보내드리며,
            이때 <b>정산지급대행 업체가 가져가는 수수료({PAYMENT_POLICY.payoutFeeLabel})는 숙소 제공자 부담</b>으로 실비에서 빼고 지급됩니다.
          </p>
        </div>

        {loading ? (
          <p>로드 중...</p>
        ) : bookings.length === 0 ? (
          <p className="empty-message">아직 들어온 예약이 없습니다.</p>
        ) : (
          <>
            {pendingBookings.length > 0 && (
              <section className="booking-section">
                <h2 className="booking-section-title">확인이 필요한 예약 ({pendingBookings.length})</h2>
                <div className="bookings-list">
                  {pendingBookings.map(renderBookingCard)}
                </div>
              </section>
            )}

            {historyBookings.length > 0 && (
              <section className="booking-section">
                <h2 className="booking-section-title">지난 예약</h2>
                <div className="bookings-list">
                  {visibleHistory.map(renderBookingCard)}
                </div>
                {historyBookings.length > visibleHistory.length && (
                  <button className="see-more-btn" onClick={() => setShowHistory(true)}>
                    더보기 ({historyBookings.length - visibleHistory.length}건 더) <ChevronDown size={16} />
                  </button>
                )}
                {showHistory && historyBookings.length > 1 && (
                  <button className="see-more-btn" onClick={() => setShowHistory(false)}>
                    접기
                  </button>
                )}
              </section>
            )}

            {pendingBookings.length === 0 && historyBookings.length === 0 && (
              <p className="empty-message">아직 들어온 예약이 없습니다.</p>
            )}
          </>
        )}
      </div>

      <style>{`
        .host-fee-notice {
          margin: 0 0 1.5rem;
          padding: 1rem 1.1rem;
          border-radius: 10px;
          background: #fff8ec;
          border: 1px solid #f0c48f;
          word-break: keep-all;
        }

        .host-fee-notice strong {
          display: block;
          color: #8a5a12;
          margin-bottom: 0.3rem;
        }

        .host-fee-notice p {
          margin: 0;
          color: #4a3a22;
          line-height: 1.7;
          font-size: 0.93rem;
        }

        .host-payment-info {
          margin: 0.6rem 0;
          padding: 0.7rem 0.9rem;
          border-radius: 8px;
          background: #faf6ef;
          word-break: keep-all;
        }

        .host-payment-info p {
          margin: 0.15rem 0;
          font-size: 0.9rem;
          color: #3a3a36;
          line-height: 1.6;
        }

        .host-payout-line {
          font-weight: 600;
          color: #2f7d4f !important;
        }

        .host-bookings {
          flex: 1;
        }

        .subtitle {
          color: #7f8c8d;
          margin-top: -1rem;
          margin-bottom: 2rem;
        }

        .empty-message {
          text-align: center;
          color: #95a5a6;
          padding: 2rem;
        }

        .booking-section {
          margin-bottom: 2.5rem;
        }

        .booking-section-title {
          color: #2c3e50;
          font-size: 1.1rem;
          margin-bottom: 1rem;
        }

        .bookings-list {
          display: grid;
          gap: 1.5rem;
        }

        .see-more-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          width: 100%;
          margin-top: 1rem;
          padding: 0.75rem;
          background: white;
          border: 1px dashed #dfe6e9;
          border-radius: 8px;
          color: #d97b3f;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }

        .see-more-btn:hover {
          background: #faf1e6;
          border-color: #d97b3f;
        }

        .booking-item {
          display: flex;
          flex-direction: column;
        }

        .booking-item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #ecf0f1;
        }

        .booking-item-header h3 {
          color: #2c3e50;
          margin-bottom: 0.5rem;
        }

        .booking-item-badges {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.4rem;
        }

        .location {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #7f8c8d;
          margin: 0;
          font-size: 0.9rem;
        }

        .booking-item-body {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 0;
        }

        .dates {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #555;
          margin: 0;
        }

        .total-price {
          font-weight: bold;
          color: #d97b3f;
          margin: 0;
          font-size: 1.1rem;
        }

        .guest-info {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        .guest-info p {
          margin: 0.35rem 0;
          font-size: 0.9rem;
          color: #555;
        }

        .guest-info .phone {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .booking-item-actions {
          display: flex;
          gap: 0.75rem;
        }

        .booking-item-actions button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        @media (max-width: 768px) {
          .booking-item-body {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .booking-item-actions {
            flex-direction: column;
          }

          .host-bookings .subtitle {
            font-size: 0.9rem;
            margin-top: -0.5rem;
            margin-bottom: 1.5rem;
          }

          .host-bookings .booking-section-title {
            font-size: 1rem;
          }

          .host-bookings .booking-item-header {
            flex-wrap: wrap;
            gap: 0.6rem;
          }

          .host-bookings .booking-item-header h3 {
            font-size: 1.05rem;
          }

          .host-bookings .location {
            font-size: 0.85rem;
          }

          .host-bookings .dates {
            font-size: 0.9rem;
          }

          .host-bookings .total-price {
            font-size: 1.05rem;
          }

          .host-bookings .guest-info p {
            font-size: 0.85rem;
          }
        }

        @media (max-width: 480px) {
          .host-bookings .subtitle {
            font-size: 0.85rem;
          }

          .host-bookings .booking-section {
            margin-bottom: 1.75rem;
          }

          .host-bookings .booking-section-title {
            font-size: 0.95rem;
          }

          .host-bookings .booking-item-header h3 {
            font-size: 1rem;
          }

          .host-bookings .location,
          .host-bookings .dates {
            font-size: 0.85rem;
          }

          .host-bookings .total-price {
            font-size: 1rem;
          }

          .host-bookings .guest-info {
            padding: 0.85rem;
          }

          .host-bookings .guest-info p {
            font-size: 0.82rem;
          }

          .host-bookings .see-more-btn {
            padding: 0.65rem;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
}

export default HostBookings;
