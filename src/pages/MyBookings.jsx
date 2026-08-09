import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../App';
import { MapPin, Calendar, XCircle } from 'lucide-react';

const STATUS_LABEL = {
  pending: '확정 대기',
  confirmed: '예약 확정',
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

function MyBookings({ userProfile }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, accommodations(id, title, location, images)')
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

  return (
    <div className="my-bookings">
      <div className="container">
        <h1>내 예약</h1>

        {loading ? (
          <p>로드 중...</p>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <p>아직 예약 내역이 없습니다.</p>
            <Link to="/accommodations" className="btn btn-primary">숙소 검색하러 가기</Link>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map(booking => (
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

                {booking.status !== 'cancelled' && (
                  <div className="booking-item-actions">
                    <button className="btn btn-danger" onClick={() => handleCancel(booking.id)}>
                      <XCircle size={16} />
                      예약 취소
                    </button>
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
          margin-top: 2rem;
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
          color: #16808E;
          margin: 0;
          font-size: 1.1rem;
        }

        .booking-item-actions {
          border-top: 1px solid #ecf0f1;
          padding-top: 1rem;
        }

        .booking-item-actions button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        @media (max-width: 768px) {
          .booking-item-body {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}

export default MyBookings;
