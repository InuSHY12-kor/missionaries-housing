import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../App';
import { MapPin, Calendar as CalendarIcon, XCircle, Filter, X } from 'lucide-react';

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

const TABS = [
  { key: 'active', label: '예약중' },
  { key: 'cancelled', label: '취소' },
  { key: 'all', label: '전체 예약' }
];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function MyBookings({ userProfile }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

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
                    <CalendarIcon size={16} />
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
          color: #16808E;
        }

        .booking-tab.active {
          color: #16808E;
          border-bottom-color: #16808E;
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
          background: #e6f4f5;
          color: #16808E;
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
          color: #16808E;
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

          .date-filter {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
}

export default MyBookings;
