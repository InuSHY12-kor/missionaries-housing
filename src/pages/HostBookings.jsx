import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../App';
import { MapPin, Calendar, Phone, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
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
        <span className={`badge ${STATUS_BADGE_CLASS[booking.status] || 'badge-info'}`}>
          {STATUS_LABEL[booking.status] || booking.status}
        </span>
      </div>

      <div className="booking-item-body">
        <p className="dates">
          <Calendar size={16} />
          {formatDate(booking.check_in)} ~ {formatDate(booking.check_out)}
        </p>
        <p className="total-price">₩{booking.total_price?.toLocaleString()}</p>
      </div>

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
