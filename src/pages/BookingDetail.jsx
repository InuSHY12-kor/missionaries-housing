import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../App';
import { MapPin, Calendar as CalendarIcon, ArrowLeft, Info, Phone, User, CreditCard } from 'lucide-react';
import AccommodationMap from '../components/AccommodationMap';
import PageHero from '../components/PageHero';

// 예약 상세 페이지 상단 슬라이드 배너 사진 (다른 상세 페이지들과 동일한 테마 적용)
const BOOKING_DETAIL_HERO_IMAGES = [
  'https://images.pexels.com/photos/7746101/pexels-photo-7746101.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/34287271/pexels-photo-34287271.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/4170056/pexels-photo-4170056.jpeg?auto=compress&cs=tinysrgb&w=1600',
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

// 예약이 확정(confirmed)된 후, 숙박비 전액 결제가 완료됐는지 여부를 나타내는 배지.
const PAYMENT_STATUS_LABEL = {
  unpaid: '미결제',
  paid: '결제 완료',
  refunded: '환불됨'
};

const PAYMENT_STATUS_BADGE_CLASS = {
  unpaid: 'badge-warning',
  paid: 'badge-success',
  refunded: 'badge-info'
};

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function BookingDetail({ userProfile }) {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = userProfile?.role === 'admin';

  const fetchBooking = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let query = supabase
        .from('bookings')
        .select('*, accommodations(id, title, location, images, usage_guide, latitude, longitude, host_id, users(full_name, phone, church_name))')
        .eq('id', id);

      // 관리자가 아니면 본인이 예약한 건만 조회할 수 있습니다.
      if (!isAdmin) {
        query = query.eq('guest_id', userProfile.id);
      }

      const { data, error: fetchError } = await query.single();
      if (fetchError) throw fetchError;
      setBooking(data);
    } catch (err) {
      setError('예약 정보를 불러올 수 없습니다. 삭제되었거나 접근 권한이 없는 예약일 수 있습니다.');
    } finally {
      setLoading(false);
    }
  }, [id, isAdmin, userProfile?.id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  if (loading) {
    return (
      <div className="container">
        <p>로드 중...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>{error || '예약 정보를 찾을 수 없습니다.'}</p>
          <Link to="/my-bookings" className="btn btn-primary">내 예약으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  const accommodation = booking.accommodations;
  const host = accommodation?.users;

  return (
    <div className="booking-detail">
      <PageHero
        images={BOOKING_DETAIL_HERO_IMAGES}
        eyebrow="BOOKING DETAILS"
        title={accommodation?.title || '예약 상세 정보'}
        subtitle={accommodation?.location || '체류 일정과 이용 안내를 확인해보세요'}
      />
      <div className="container">
        <Link to="/my-bookings" className="back-link">
          <ArrowLeft size={16} />
          내 예약으로 돌아가기
        </Link>

        <div className="booking-detail-header">
          <div>
            <h1>{accommodation?.title || '삭제된 숙소'}</h1>
            {accommodation?.location && (
              <p className="location">
                <MapPin size={16} />
                {accommodation.location}
              </p>
            )}
          </div>
          <div className="booking-detail-badges">
            <span className={`badge ${STATUS_BADGE_CLASS[booking.status] || 'badge-info'}`}>
              {STATUS_LABEL[booking.status] || booking.status}
            </span>
            {booking.status === 'confirmed' && (
              <span className={`badge ${PAYMENT_STATUS_BADGE_CLASS[booking.payment_status] || 'badge-info'}`}>
                {PAYMENT_STATUS_LABEL[booking.payment_status] || booking.payment_status}
              </span>
            )}
          </div>
        </div>

        {accommodation?.images?.[0] && (
          <img src={accommodation.images[0]} alt={accommodation.title} className="booking-detail-image" />
        )}

        <div className="booking-detail-grid">
          <div className="card booking-info-card">
            <h2>예약 정보</h2>
            <div className="booking-info-row">
              <CalendarIcon size={18} />
              <div>
                <p className="label">체류 일정</p>
                <p className="value">{formatDate(booking.check_in)} ~ {formatDate(booking.check_out)}</p>
              </div>
            </div>
            <div className="booking-info-row">
              <span className="booking-info-price">₩</span>
              <div>
                <p className="label">총 결제 금액</p>
                <p className="value">₩{booking.total_price?.toLocaleString()}</p>
              </div>
            </div>
            {host && (
              <div className="booking-info-row">
                <User size={18} />
                <div>
                  <p className="label">숙소 제공자</p>
                  <p className="value">{host.full_name}{host.church_name ? ` · ${host.church_name}` : ''}</p>
                </div>
              </div>
            )}
            {host?.phone && (
              <div className="booking-info-row">
                <Phone size={18} />
                <div>
                  <p className="label">연락처</p>
                  <p className="value">{host.phone}</p>
                </div>
              </div>
            )}

            {booking.status === 'confirmed' && booking.payment_status !== 'paid' && booking.guest_id === userProfile?.id && (
              <Link to={`/my-bookings/${booking.id}/pay`} className="btn btn-primary booking-detail-pay-link">
                <CreditCard size={16} />
                숙박비 결제하기
              </Link>
            )}

            {accommodation?.id && (
              <Link to={`/accommodations/${accommodation.id}`} className="btn btn-secondary booking-detail-listing-link">
                숙소 상세 페이지 보기
              </Link>
            )}
          </div>

          <div className="card usage-guide-card">
            <h2>
              <Info size={18} />
              숙소 이용 안내
            </h2>
            {accommodation?.usage_guide ? (
              <p className="usage-guide-text">{accommodation.usage_guide}</p>
            ) : (
              <p className="usage-guide-empty">
                아직 숙소 제공자가 등록한 이용 안내가 없습니다. 궁금한 점이 있다면 메시지로 문의해주세요.
              </p>
            )}
          </div>
        </div>

        {accommodation?.latitude != null && accommodation?.longitude != null && (
          <div className="card booking-map-card">
            <h2>위치</h2>
            <AccommodationMap
              lat={accommodation.latitude}
              lng={accommodation.longitude}
              title={accommodation.title}
            />
          </div>
        )}
      </div>

      <style>{`
        .booking-detail {
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

        .booking-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .booking-detail-header h1 {
          margin: 0 0 0.5rem;
        }

        .booking-detail-header .location {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #7f8c8d;
          margin: 0;
        }

        .booking-detail-badges {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.4rem;
        }

        .booking-detail-image {
          width: 100%;
          max-height: 360px;
          object-fit: cover;
          border-radius: 10px;
          margin-bottom: 1.5rem;
        }

        .booking-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          align-items: start;
        }

        .booking-info-card h2,
        .usage-guide-card h2,
        .booking-map-card h2 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #2c3e50;
          font-size: 1.1rem;
          margin: 0 0 1rem;
        }

        .booking-info-row {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem 0;
          border-top: 1px solid #f0dcc0;
        }

        .booking-info-row:first-of-type {
          border-top: none;
          padding-top: 0;
        }

        .booking-info-row > svg,
        .booking-info-price {
          color: #d97b3f;
          flex-shrink: 0;
          margin-top: 0.15rem;
        }

        .booking-info-price {
          font-weight: 700;
          width: 18px;
          text-align: center;
        }

        .booking-info-row .label {
          margin: 0 0 0.15rem;
          font-size: 0.78rem;
          color: #95a5a6;
        }

        .booking-info-row .value {
          margin: 0;
          color: #2c3e50;
          font-weight: 600;
        }

        .booking-detail-pay-link,
        .booking-detail-listing-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          text-align: center;
          margin-top: 1rem;
        }

        .usage-guide-text {
          white-space: pre-wrap;
          line-height: 1.7;
          color: #2c3e50;
          margin: 0;
        }

        .usage-guide-empty {
          color: #95a5a6;
          font-size: 0.9rem;
          line-height: 1.6;
          margin: 0;
        }

        .booking-map-card {
          margin-top: 1.5rem;
        }

        @media (max-width: 768px) {
          .booking-detail-grid {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }

          .booking-detail-header {
            flex-wrap: wrap;
            gap: 0.75rem;
          }

          .booking-detail-header h1 {
            font-size: 1.4rem;
          }

          .booking-detail-image {
            max-height: 220px;
            margin-bottom: 1.25rem;
          }

          .booking-info-card h2,
          .usage-guide-card h2,
          .booking-map-card h2 {
            font-size: 1rem;
          }

          .booking-info-row .value {
            font-size: 0.92rem;
          }

          .usage-guide-text,
          .usage-guide-empty {
            font-size: 0.9rem;
          }

          .booking-map-card {
            margin-top: 1.25rem;
          }

          .booking-map-card .accommodation-map {
            height: 260px;
          }
        }

        @media (max-width: 480px) {
          .back-link {
            font-size: 0.85rem;
            margin-bottom: 1.1rem;
          }

          .booking-detail-header h1 {
            font-size: 1.3rem;
          }

          .booking-detail-header .location {
            font-size: 0.85rem;
          }

          .booking-detail-image {
            max-height: 180px;
          }

          .booking-info-row {
            padding: 0.6rem 0;
            gap: 0.6rem;
          }

          .booking-info-row .label {
            font-size: 0.72rem;
          }

          .booking-info-row .value {
            font-size: 0.88rem;
          }

          .booking-map-card .accommodation-map {
            height: 220px;
          }
        }
      `}</style>
    </div>
  );
}

export default BookingDetail;
