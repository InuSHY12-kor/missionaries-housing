import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../App';
import { MapPin, Users, Star, Calendar } from 'lucide-react';
import SearchMap from '../components/SearchMap';
import PageHero from '../components/PageHero';

// 숙소 검색 페이지 상단 슬라이드 배너 사진
const SEARCH_HERO_IMAGES = [
  'https://images.pexels.com/photos/33085059/pexels-photo-33085059.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/38333372/pexels-photo-38333372.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/29673494/pexels-photo-29673494.jpeg?auto=compress&cs=tinysrgb&w=1600'
];

function Accommodations() {
  const [accommodations, setAccommodations] = useState([]);
  const [filteredAccommodations, setFilteredAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: '',
    minPrice: 0,
    maxPrice: 1000000,
    capacity: 1
  });

  // 일정(체크인/체크아웃) — 선택하면 해당 기간에 예약 가능한 숙소만 표시.
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [availableIds, setAvailableIds] = useState(null); // null = 일정 필터 미적용
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [dateError, setDateError] = useState('');

  // 지도 화면 범위 — 지도를 움직이거나 확대하면 갱신되어, 그 범위 안의 숙소만 아래 목록에 표시.
  const [mapBounds, setMapBounds] = useState(null);

  useEffect(() => {
    fetchAccommodations();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, accommodations]);

  // 일정 선택 시 예약 가능한 숙소 id 목록 조회 (RLS를 우회하는 전용 RPC).
  useEffect(() => {
    if (!checkIn || !checkOut) {
      setAvailableIds(null);
      setDateError('');
      return;
    }
    if (checkOut <= checkIn) {
      setDateError('체크아웃 날짜는 체크인 날짜 이후여야 합니다.');
      setAvailableIds(null);
      return;
    }
    setDateError('');
    let cancelled = false;
    (async () => {
      setAvailabilityLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_available_accommodation_ids', {
          p_check_in: checkIn,
          p_check_out: checkOut
        });
        if (error) throw error;
        if (!cancelled) {
          setAvailableIds(new Set((data || []).map((row) => row.accommodation_id)));
        }
      } catch (error) {
        console.error('예약 가능 숙소 조회 오류:', error);
        if (!cancelled) setAvailableIds(null);
      } finally {
        if (!cancelled) setAvailabilityLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [checkIn, checkOut]);

  const fetchAccommodations = async () => {
    try {
      const { data, error } = await supabase
        .from('accommodations')
        .select('*, users(full_name, church_name)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccommodations(data || []);
    } catch (error) {
      console.error('숙소 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = accommodations;

    if (filters.location) {
      filtered = filtered.filter(acc =>
        acc.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    filtered = filtered.filter(acc =>
      acc.price >= filters.minPrice && acc.price <= filters.maxPrice
    );

    filtered = filtered.filter(acc =>
      acc.capacity >= filters.capacity
    );

    setFilteredAccommodations(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: name === 'location' ? value : parseInt(value)
    }));
  };

  // 일정 조건까지 반영한 숙소 목록 (지도 마커에도 사용).
  const dateFilteredAccommodations = useMemo(() => {
    if (!availableIds) return filteredAccommodations;
    return filteredAccommodations.filter(acc => availableIds.has(acc.id));
  }, [filteredAccommodations, availableIds]);

  // 지도 범위(bounds) 안에 있는 숙소만 최종 목록에 노출.
  const visibleAccommodations = useMemo(() => {
    if (!mapBounds) return dateFilteredAccommodations;
    return dateFilteredAccommodations.filter(acc => {
      if (acc.latitude == null || acc.longitude == null) return false;
      return mapBounds.contains({ lat: Number(acc.latitude), lng: Number(acc.longitude) });
    });
  }, [dateFilteredAccommodations, mapBounds]);

  const clearDates = () => {
    setCheckIn('');
    setCheckOut('');
    setDateError('');
  };

  return (
    <div className="accommodations">
      <PageHero
        images={SEARCH_HERO_IMAGES}
        eyebrow="FIND A STAY"
        title="신뢰할 수 있는 숙소를 찾아보세요"
        subtitle="승인된 숙소만 이곳에 노출됩니다."
      />
      <div className="container">
        <h1>숙소 검색</h1>

        {/* 필터 */}
        <div className="filter-section">
          <div className="filter-card">
            <div className="form-group date-group">
              <label>
                <Calendar size={16} />
                체크인
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>

            <div className="form-group date-group">
              <label>
                <Calendar size={16} />
                체크아웃
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>지역</label>
              <input
                type="text"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                placeholder="도시 또는 지역명"
              />
            </div>

            <div className="form-group">
              <label>최대 가격 (₩)</label>
              <input
                type="range"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                min="0"
                max="1000000"
                step="10000"
              />
              <span>₩{filters.maxPrice.toLocaleString()}</span>
            </div>

            <div className="form-group">
              <label>최소 수용인원</label>
              <select
                name="capacity"
                value={filters.capacity}
                onChange={handleFilterChange}
              >
                <option value="1">1명</option>
                <option value="2">2명 이상</option>
                <option value="4">4명 이상</option>
                <option value="6">6명 이상</option>
              </select>
            </div>

            <button
              className="btn btn-secondary"
              onClick={() => {
                setFilters({ location: '', minPrice: 0, maxPrice: 1000000, capacity: 1 });
                clearDates();
              }}
            >
              초기화
            </button>
          </div>

          {dateError && <p className="form-error date-error">{dateError}</p>}
          {checkIn && checkOut && !dateError && (
            <p className="date-hint">
              {availabilityLoading
                ? '예약 가능한 숙소를 확인하는 중...'
                : `${checkIn} ~ ${checkOut} 기간에 예약 가능한 숙소만 표시하고 있습니다.`}
            </p>
          )}
        </div>

        {/* 지도 검색 */}
        <div className="map-search-section">
          <div className="map-search-header">
            <div>
              <h2>지도에서 찾기</h2>
              <p className="map-search-hint">
                지도를 확대하면 숙소명과 1박 가격이 바로 보여요. 지도를 움직이거나 확대/축소하면
                현재 화면에 보이는 지역의 숙소만 아래 목록에 표시됩니다.
              </p>
            </div>
          </div>

          <SearchMap
            accommodations={dateFilteredAccommodations}
            onBoundsChange={setMapBounds}
          />
        </div>

        {/* 숙소 목록 */}
        {loading ? (
          <p>로드 중...</p>
        ) : visibleAccommodations.length === 0 ? (
          <p className="empty-message">
            {checkIn && checkOut
              ? '해당 일정에 예약 가능하면서 현재 지도 범위에 있는 숙소가 없습니다. 일정을 바꾸거나 지도를 움직여 보세요.'
              : '현재 지도 범위에 있는 숙소가 없습니다. 지도를 움직이거나 축소해 보세요.'}
          </p>
        ) : (
          <div className="grid grid-2">
            {visibleAccommodations.map(accommodation => (
              <Link
                key={accommodation.id}
                to={`/accommodations/${accommodation.id}`}
                className="accommodation-card"
              >
                <div className="accommodation-image">
                  {accommodation.images && accommodation.images[0] ? (
                    <img src={accommodation.images[0]} alt={accommodation.title} />
                  ) : (
                    <div className="image-placeholder">이미지 없음</div>
                  )}
                </div>
                <div className="accommodation-details">
                  <h3>{accommodation.title}</h3>
                  <p className="location">
                    <MapPin size={16} />
                    {accommodation.location}
                  </p>
                  <p className="description">{accommodation.description?.substring(0, 80)}...</p>
                  <div className="info-row">
                    <span><Users size={16} /> {accommodation.capacity}명</span>
                    <span><Star size={16} /> 4.5 (12리뷰)</span>
                  </div>
                  <div className="footer">
                    <p className="price">₩{accommodation.price?.toLocaleString()}/일</p>
                    <p className="host">{accommodation.users?.full_name}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .accommodations {
          flex: 1;
        }

        .filter-section {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          margin: 2rem 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .filter-card {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .filter-card .form-group {
          margin-bottom: 0;
        }

        .filter-card .form-group.date-group label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .filter-card span {
          display: block;
          margin-top: 0.5rem;
          color: #d97b3f;
          font-weight: 600;
        }

        .date-error {
          color: #e74c3c;
          font-size: 0.85rem;
          margin: 1rem 0 0;
        }

        .date-hint {
          color: #d97b3f;
          font-size: 0.85rem;
          margin: 1rem 0 0;
          background: #faf1e6;
          padding: 0.6rem 0.9rem;
          border-radius: 6px;
        }

        .map-search-section {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .map-search-header {
          margin-bottom: 1rem;
        }

        .map-search-header h2 {
          color: #2c3e50;
          margin-bottom: 0.35rem;
        }

        .map-search-hint {
          color: #7f8c8d;
          font-size: 0.9rem;
          margin: 0;
        }

        .empty-message {
          text-align: center;
          color: #95a5a6;
          padding: 2rem;
        }

        .accommodation-card {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: all 0.3s;
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
        }

        .accommodation-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }

        .accommodation-image {
          width: 100%;
          height: 200px;
          background: #ecf0f1;
          overflow: hidden;
        }

        .accommodation-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #95a5a6;
        }

        .accommodation-details {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .accommodation-details h3 {
          margin-bottom: 0.75rem;
          color: #2c3e50;
        }

        .location {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #7f8c8d;
          margin-bottom: 0.75rem;
        }

        .description {
          color: #555;
          font-size: 0.95rem;
          margin-bottom: 1rem;
          flex: 1;
        }

        .info-row {
          display: flex;
          gap: 1rem;
          color: #7f8c8d;
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }

        .info-row span {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .footer {
          border-top: 1px solid #ecf0f1;
          padding-top: 1rem;
        }

        .price {
          font-size: 1.3rem;
          font-weight: bold;
          color: #d97b3f;
          margin: 0 0 0.5rem;
        }

        .host {
          color: #7f8c8d;
          font-size: 0.9rem;
          margin: 0;
        }

        @media (max-width: 768px) {
          .filter-section,
          .map-search-section {
            padding: 1.25rem;
            margin: 1.25rem 0;
          }

          .filter-card {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .map-search-header h2 {
            font-size: 1.2rem;
          }

          .map-search-hint {
            font-size: 0.85rem;
          }

          .date-hint,
          .date-error {
            font-size: 0.8rem;
          }

          .accommodation-image {
            height: 180px;
          }

          .accommodation-details {
            padding: 1.1rem;
          }

          .accommodation-details h3 {
            font-size: 1.1rem;
            margin-bottom: 0.5rem;
          }

          .location {
            font-size: 0.9rem;
            margin-bottom: 0.5rem;
          }

          .description {
            font-size: 0.88rem;
            margin-bottom: 0.75rem;
          }

          .info-row {
            font-size: 0.85rem;
            margin-bottom: 0.75rem;
          }

          .price {
            font-size: 1.15rem;
            margin-bottom: 0.35rem;
          }

          .host {
            font-size: 0.85rem;
          }
        }

        @media (max-width: 480px) {
          .filter-section,
          .map-search-section {
            padding: 0.9rem;
            margin: 1rem 0;
            border-radius: 10px;
          }

          .filter-card {
            gap: 0.85rem;
          }

          .filter-card span {
            font-size: 0.9rem;
          }

          .map-search-header h2 {
            font-size: 1.1rem;
          }

          .map-search-hint {
            font-size: 0.8rem;
          }

          .accommodation-image {
            height: 160px;
          }

          .accommodation-details {
            padding: 0.9rem;
          }

          .accommodation-details h3 {
            font-size: 1.02rem;
          }

          .location,
          .description,
          .info-row {
            font-size: 0.82rem;
          }

          .price {
            font-size: 1.05rem;
          }

          .host {
            font-size: 0.78rem;
          }

          .empty-message {
            padding: 1.25rem;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}

export default Accommodations;
