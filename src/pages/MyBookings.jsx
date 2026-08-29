import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../App';
import { MapPin, Calendar as CalendarIcon, XCircle, Filter, X, Heart, MessageCircle, CreditCard } from 'lucide-react';
import PageHero from '../components/PageHero';

// 내 예약 페이지 상단 슬라이드 배너 사진
const MY_BOOKINGS_HERO_IMAGES = [
  'https://images.pexels.com/photos/6726195/pexels-photo-6726195.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/1008155/pexels-photo-1008155.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/30981181/pexels-photo-30981181.jpeg?auto=compress&cs=tinysrgb&w=1600'
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

const TABS = [
  { key: 'active', label: '예약중' },
  { key: 'cancelled', label: '취소' },
  { key: 'all', label: '전체 예약' }
];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

// 오늘 날짜(YYYY-MM-DD) 문자열. ISO 형식 날짜 문자열끼리는 그대로 비교해도 순서가 맞습니다.
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function MyBookings({ userProfile }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [openReviewFormId, setOpenReviewFormId] = useState(null);
  const [reviewSubmittingId, setReviewSubmittingId] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, accommodations(id, title, location, images), reviews(id, comment, host_heart, created_at)')
        .eq('guest_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('예약 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile.id]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // 체크아웃 다음 날부터 "감사 인사(리뷰)"를 남길 수 있습니다 (DB 트리거로도 동일하게 강제됨).
  const canLeaveReview = (booking) =>
    booking.status === 'confirmed' &&
    (!booking.reviews || booking.reviews.length === 0) &&
    todayStr() > booking.check_out;

  const submitReview = async (booking) => {
    const comment = (reviewDrafts[booking.id] || '').trim();
    if (!comment) {
      alert('감사 인사 내용을 입력해주세요.');
      return;
    }
    setReviewSubmittingId(booking.id);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({ booking_id: booking.id, comment })
        .select()
        .single();
      if (error) throw error;
      setBookings(bookings.map(b => b.id === booking.id ? { ...b, reviews: [data] } : b));
      setOpenReviewFormId(null);
      setReviewDrafts(prev => ({ ...prev, [booking.id]: '' }));
    } catch (error) {
      alert('오류: ' + error.message);
    } finally {
      setReviewSubmittingId(null);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('정말 이 예약을 취소하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
    } catch (error) {
      alert('오류: ' + error.message);
    }
  };

  const tabFiltered = useMemo(() => {
    if (tab === 'active') return bookings.filter(b => b.status !== 'cancelled');
    if (tab === 'cancelled') return bookings.filter(b => b.status === 'cancelled');
    return bookings;
  }, [bookings, tab]);

  const visibleBookings = useMemo(() => {
    if (!filterFrom && !filterTo) return tabFiltered;
    return tabFiltered.filter(b => {
      if (filterFrom && b.check_out < filterFrom) return false;
      if (filterTo && b.check_in > filterTo) return false;
      return true;
    });
  }, [tabFiltered, filterFrom, filterTo]);

  const tabCount = (key) => {
    if (key === 'active') return bookings.filter(b => b.status !== 'cancelled').length;
    if (key === 'cancelled') return bookings.filter(b => b.status === 'cancelled').length;
    return bookings.length;
  };

  const clearFilter = () => {
    setFilterFrom('');
    setFilterTo('');
  };

  return (
    <div className="my-bookings">
      <PageHero
        images={MY_BOOKINGS_HERO_IMAGES}
        eyebrow="MY BOOKINGS"
        title="다가오는 쉼을 확인하세요"
        subtitle="예약 현황과 일정을 한눈에 볼 수 있습니다."
      />
      <div className="container">
        <h1>내 예약</h1>

        {!loading && bookings.length > 0 && (
          <>
            <div className="booking-tabs">
              {TABS.map(t => (
                <button
                  key={t.key}
                  className={`booking-tab ${tab === t.key ? 'active' : ''}`}
                  onClick={() => setTab(t.key)}
                >
                  {t.label} <span className="tab-count">{tabCount(t.key)}</span>
                </button>
              ))}
            </div>

            <div className="date-filter">
              <Filter size={16} />
              <div className="date-filter-field">
                <label>체류 시작</label>
                <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
              </div>
              <div className="date-filter-field">
                <label>체류 종료</label>
                <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
              </div>
              {(filterFrom || filterTo) && (
                <button type="button" className="date-filter-clear" onClick={clearFilter}>
                  <X size={14} />
                  필터 초기화
                </button>
              )}
            </div>
          </>
        )}

        {loading ? (
          <p>로드 중...</p>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <p>아직 예약 내역이 없습니다.</p>
            <Link to="/accommodations" className="btn btn-primary">숙소 검색하러 가기</Link>
          </div>
        ) : visibleBookings.length === 0 ? (
          <div className="empty-state">
            <p>해당 조건에 맞는 예약이 없습니다.</p>
          </div>
        ) : (
          <div className="bookings-list">
            {visibleBookings.map(booking => (
              <div key={booking.id} className="card booking-item">
                <Link to={`/my-bookings/${booking.id}`} className="booking-item-link">
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
                      {booking.status === 'confirmed' && (
                        <span className={`badge ${PAYMENT_STATUS_BADGE_CLASS[booking.payment_status] || 'badge-info'}`}>
                          {PAYMENT_STATUS_LABEL[booking.payment_status] || booking.payment_status}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="booking-item-body">
                    <p className="dates">
                      <CalendarIcon size={16} />
                      {formatDate(booking.check_in)} ~ {formatDate(booking.check_out)}
                    </p>
                    <p className="total-price">₩{booking.total_price?.toLocaleString()}</p>
                  </div>

                  <p className="booking-item-detail-cta">예약 상세 및 숙소 이용 안내 보기 →</p>
                </Link>

                {booking.status !== 'cancelled' && (
                  <div className="booking-item-actions">
                    {booking.status === 'confirmed' && booking.payment_status !== 'paid' && (
                      <Link to={`/my-bookings/${booking.id}/pay`} className="btn btn-primary">
                        <CreditCard size={16} />
                        결제하기
                      </Link>
                    )}
                    <button className="btn btn-danger" onClick={() => handleCancel(booking.id)}>
                      <XCircle size={16} />
                      예약 취소
                    </button>
                  </div>
                )}

                {booking.reviews && booking.reviews.length > 0 && (
                  <div className="review-submitted">
                    <p className="review-submitted-header">
                      <MessageCircle size={15} />
                      감사 인사를 남겼습니다
                      {booking.reviews[0].host_heart && (
                        <span className="review-heart-badge">
                          <Heart size={13} fill="currentColor" />
                          호스트가 확인했어요
                        </span>
                      )}
                    </p>
                    <p className="review-submitted-comment">{booking.reviews[0].comment}</p>
                  </div>
                )}

                {canLeaveReview(booking) && (
                  <div className="review-form-area">
                    {openReviewFormId === booking.id ? (
                      <div className="review-form">
                        <textarea
                          rows="3"
                          placeholder="머물렀던 숙소와 호스트님께 짧은 감사 인사를 남겨주세요."
                          value={reviewDrafts[booking.id] || ''}
                          onChange={(e) => setReviewDrafts(prev => ({ ...prev, [booking.id]: e.target.value }))}
                        />
                        <div className="review-form-actions">
                          <button
                            className="btn btn-primary"
                            disabled={reviewSubmittingId === booking.id}
                            onClick={() => submitReview(booking)}
                          >
                            {reviewSubmittingId === booking.id ? '등록 중...' : '감사 인사 남기기'}
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => setOpenReviewFormId(null)}
                            disabled={reviewSubmittingId === booking.id}
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button className="review-open-btn" onClick={() => setOpenReviewFormId(booking.id)}>
                        <Heart size={16} />
                        감사 인사 남기기
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .my-bookings {
          flex: 1;
        }

        .booking-tabs {
          display: flex;
          gap: 0.5rem;
          margin-top: 1.5rem;
          border-bottom: 2px solid #ecf0f1;
        }

        .booking-tab {
          background: none;
          border: none;
          padding: 0.75rem 1.25rem;
          font-size: 0.95rem;
          font-weight: 600;
          color: #7f8c8d;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          transition: color 0.2s, border-color 0.2s;
        }

        .booking-tab:hover {
          color: #d97b3f;
        }

        .booking-tab.active {
          color: #d97b3f;
          border-bottom-color: #d97b3f;
        }

        .tab-count {
          background: #ecf0f1;
          color: #7f8c8d;
          border-radius: 10px;
          padding: 0.05rem 0.5rem;
          font-size: 0.78rem;
          font-weight: 600;
        }

        .booking-tab.active .tab-count {
          background: #faf1e6;
          color: #d97b3f;
        }

        .date-filter {
          display: flex;
          align-items: flex-end;
          gap: 1rem;
          background: white;
          padding: 1rem 1.25rem;
          border-radius: 8px;
          margin: 1.25rem 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          flex-wrap: wrap;
        }

        .date-filter > svg {
          color: #d97b3f;
          margin-bottom: 0.6rem;
        }

        .date-filter-field {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .date-filter-field label {
          font-size: 0.75rem;
          color: #95a5a6;
        }

        .date-filter-field input {
          padding: 0.5rem;
          border: 1px solid #dfe6e9;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .date-filter-clear {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          background: none;
          border: 1px solid #dfe6e9;
          border-radius: 20px;
          padding: 0.45rem 0.9rem;
          font-size: 0.82rem;
          color: #7f8c8d;
          cursor: pointer;
          margin-bottom: 1px;
        }

        .date-filter-clear:hover {
          background: #f8f9fa;
        }

        .empty-state {
          text-align: center;
          background: white;
          padding: 3rem 2rem;
          border-radius: 8px;
          margin-top: 2rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .empty-state p {
          color: #7f8c8d;
          margin-bottom: 1.5rem;
        }

        .bookings-list {
          display: grid;
          gap: 1.5rem;
          margin-top: 1.5rem;
        }

        .booking-item {
          display: flex;
          flex-direction: column;
        }

        .booking-item-link {
          display: block;
          color: inherit;
          text-decoration: none;
        }

        .booking-item-detail-cta {
          margin: 0;
          padding-top: 0.5rem;
          color: #d97b3f;
          font-size: 0.85rem;
          font-weight: 600;
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

        .booking-item-actions {
          border-top: 1px solid #ecf0f1;
          padding-top: 1rem;
          display: flex;
          gap: 0.75rem;
        }

        .booking-item-actions button,
        .booking-item-actions a {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .review-submitted {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #ecf0f1;
          background: #fdf8f1;
          border-radius: 6px;
          padding: 0.85rem 1rem;
        }

        .review-submitted-header {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin: 0 0 0.4rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: #b8622c;
        }

        .review-heart-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          margin-left: auto;
          color: #e74c3c;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .review-submitted-comment {
          margin: 0;
          color: #2c3e50;
          font-size: 0.92rem;
          white-space: pre-wrap;
        }

        .review-form-area {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #ecf0f1;
        }

        .review-open-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.7rem;
          background: white;
          border: 1px dashed #d97b3f;
          border-radius: 8px;
          color: #d97b3f;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .review-open-btn:hover {
          background: #faf1e6;
        }

        .review-form textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #dfe6e9;
          border-radius: 6px;
          font-family: inherit;
          font-size: 0.92rem;
          resize: vertical;
        }

        .review-form-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.75rem;
        }

        @media (max-width: 768px) {
          .booking-item-body {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .date-filter {
            flex-direction: column;
            align-items: stretch;
          }

          .date-filter-field input {
            width: 100%;
          }

          .booking-tabs {
            gap: 0.25rem;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            flex-wrap: nowrap;
          }

          .booking-tab {
            padding: 0.65rem 0.85rem;
            font-size: 0.88rem;
            white-space: nowrap;
            flex-shrink: 0;
          }

          .booking-item-header {
            flex-wrap: wrap;
          }

          .booking-item-header h3 {
            font-size: 1.05rem;
          }

          .total-price {
            font-size: 1.05rem;
          }

          .booking-item-actions {
            flex-direction: column;
          }

          .booking-item-actions button,
          .booking-item-actions a,
          .review-form-actions button {
            width: 100%;
            justify-content: center;
          }

          .review-form-actions {
            flex-direction: column;
            gap: 0.5rem;
          }
        }

        @media (max-width: 480px) {
          .my-bookings h1 {
            font-size: 1.5rem;
          }

          .booking-tab {
            padding: 0.55rem 0.7rem;
            font-size: 0.82rem;
            gap: 0.3rem;
          }

          .tab-count {
            padding: 0.05rem 0.4rem;
            font-size: 0.72rem;
          }

          .date-filter {
            padding: 0.85rem 1rem;
          }

          .date-filter-field label {
            font-size: 0.7rem;
          }

          .date-filter-field input {
            font-size: 0.85rem;
            padding: 0.45rem;
          }

          .booking-item-header h3 {
            font-size: 1rem;
          }

          .location,
          .dates {
            font-size: 0.85rem;
          }

          .total-price {
            font-size: 1rem;
          }

          .booking-item-detail-cta {
            font-size: 0.8rem;
          }

          .booking-item-actions button,
          .booking-item-actions a,
          .review-open-btn {
            font-size: 0.85rem;
            padding: 0.6rem;
          }

          .review-submitted-header,
          .review-submitted-comment {
            font-size: 0.82rem;
          }

          .review-form textarea {
            font-size: 0.85rem;
          }

          .empty-state {
            padding: 2rem 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}

export default MyBookings;
