import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../App';
import { MapPin, Users, Star } from 'lucide-react';

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

  useEffect(() => {
    fetchAccommodations();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, accommodations]);

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

        {/* 숙소 목록 */}
        {loading ? (
          <p>로드 중...</p>
        ) : filteredAccommodations.length === 0 ? (
          <p className="empty-message">해당하는 숙소가 없습니다.</p>
        ) : (
          <div className="grid grid-2">
            {filteredAccommodations.map(accommodation => (
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
          color: #667eea;
          font-weight: 600;
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
          color: #667eea;
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
