import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../App';
import { MapPin, Users, Star, X } from 'lucide-react';
import SearchMap from '../components/SearchMap';
import { haversineDistanceKm } from '../utils/geo';

function Accommodations() {
  const [accommodations, setAccommodations] = useState([]);
  const [filteredAccommodations, setFilteredAccommodations] = useState([]);
  const [visibleAccommodations, setVisibleAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: '',
    minPrice: 0,
    maxPrice: 1000000,
    capacity: 1
  });
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [radiusKm, setRadiusKm] = useState(30);

  useEffect(() => {
    fetchAccommodations();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, accommodations]);

  useEffect(() => {
    if (selectedPoint) {
      setVisibleAccommodations(
        filteredAccommodations.filter(acc => {
          if (acc.latitude == null || acc.longitude == null) return false;
          const distance = haversineDistanceKm(selectedPoint, {
            lat: Number(acc.latitude),
            lng: Number(acc.longitude)
          });
          return distance <= radiusKm;
        })
      );
    } else {
      setVisibleAccommodations(filteredAccommodations);
    }
  }, [filteredAccommodations, selectedPoint, radiusKm]);

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

  return (
    <div className="accommodations">
      <div className="container">
        <h1>숙소 검색</h1>

        {/* 필터 */}
        <div className="filter-section">
          <div className="filter-card">
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
              onClick={() => setFilters({ location: '', minPrice: 0, maxPrice: 1000000, capacity: 1 })}
            >
              초기화
            </button>
          </div>
        </div>

        {/* 지도 검색 */}
        <div className="map-search-section">
          <div className="map-search-header">
            <div>
              <h2>지도에서 찾기</h2>
              <p className="map-search-hint">
                지도를 클릭해서 원하는 위치를 선택하면 그 주변의 숙소만 보여드립니다.
              </p>
            </div>
            {selectedPoint && (
              <button className="btn btn-secondary" onClick={() => setSelectedPoint(null)}>
                <X size={16} />
                위치 선택 해제
              </button>
            )}
          </div>

          {selectedPoint && (
            <div className="radius-control">
              <label>반경: {radiusKm}km 이내</label>
              <input
                type="range"
                min="5"
                max="200"
                step="5"
                value={radiusKm}
                onChange={(e) => setRadiusKm(parseInt(e.target.value))}
              />
            </div>
          )}

          <SearchMap
            accommodations={filteredAccommodations}
            selectedPoint={selectedPoint}
            onSelectPoint={setSelectedPoint}
            radiusKm={radiusKm}
          />
        </div>

        {/* 숙소 목록 */}
        {loading ? (
          <p>로드 중...</p>
        ) : visibleAccommodations.length === 0 ? (
          <p className="empty-message">
            {selectedPoint ? '선택하신 위치 주변에 등록된 숙소가 없습니다.' : '해당하는 숙소가 없습니다.'}
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

        .filter-card span {
          display: block;
          margin-top: 0.5rem;
          color: #16808E;
          font-weight: 600;
        }

        .map-search-section {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .map-search-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
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

        .map-search-header button {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          white-space: nowrap;
        }

        .radius-control {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .radius-control label {
          font-weight: 600;
          color: #16808E;
          white-space: nowrap;
        }

        .radius-control input[type="range"] {
          flex: 1;
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
          color: #16808E;
          margin: 0 0 0.5rem;
        }

        .host {
          color: #7f8c8d;
          font-size: 0.9rem;
          margin: 0;
        }

        @media (max-width: 768px) {
          .filter-card {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Accommodations;
