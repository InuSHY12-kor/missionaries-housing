import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../App';
import { MapPin, Users, Home, MessageCircle } from 'lucide-react';

function AccommodationDetail() {
  const { id } = useParams();
  const [accommodation, setAccommodation] = useState(null);
  const [host, setHost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: ''
  });

  useEffect(() => {
    fetchAccommodation();
  }, [id]);

  const fetchAccommodation = async () => {
    try {
      const { data, error } = await supabase
        .from('accommodations')
        .select('*, users(id, full_name, church_name, phone)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setAccommodation(data);
      setHost(data.users);
    } catch (error) {
      console.error('숙소 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!bookingData.checkIn || !bookingData.checkOut) {
      alert('날짜를 선택해주세요.');
      return;
    }

    try {
      const checkIn = new Date(bookingData.checkIn);
      const checkOut = new Date(bookingData.checkOut);
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      const totalPrice = nights * accommodation.price;

      // 예약 생성
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          accommodation_id: id,
          guest_id: (await supabase.auth.getUser()).data.user.id,
          check_in: bookingData.checkIn,
          check_out: bookingData.checkOut,
          total_price: totalPrice,
          status: 'pending'
        })
        .select();

      if (error) throw error;

      alert('예약이 생성되었습니다! 결제 페이지로 이동합니다.');
      // 실제로는 Stripe 결제 폼으로 이동해야 함
    } catch (error) {
      alert('오류: ' + error.message);
    }
  };

  if (loading) return <div className="container"><p>로드 중...</p></div>;
  if (!accommodation) return <div className="container"><p>숙소를 찾을 수 없습니다.</p></div>;

  return (
    <div className="accommodation-detail">
      <div className="container">
        {/* 이미지 갤러리 */}
        <div className="gallery">
          {accommodation.images && accommodation.images.length > 0 ? (
            <img src={accommodation.images[0]} alt={accommodation.title} className="main-image" />
          ) : (
            <div className="image-placeholder">이미지 없음</div>
          )}
        </div>

        <div className="detail-content">
          {/* 왼쪽: 정보 */}
          <div className="info-section">
            <h1>{accommodation.title}</h1>
            
            <p className="location">
              <MapPin size={20} />
              {accommodation.location}
            </p>

            <div className="basic-info">
              <div className="info-item">
                <Users size={20} />
                <span>{accommodation.capacity}명 수용</span>
              </div>
              <div className="info-item">
                <Home size={20} />
                <span>침실 {accommodation.bedrooms}, 욕실 {accommodation.bathrooms}</span>
              </div>
            </div>

            <div className="description">
              <h3>숙소 설명</h3>
              <p>{accommodation.description}</p>
            </div>

            {accommodation.amenities && accommodation.amenities.length > 0 && (
              <div className="amenities">
                <h3>편의시설</h3>
                <ul>
                  {accommodation.amenities.map((amenity, idx) => (
                    <li key={idx}>{amenity}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 호스트 정보 */}
            <div className="host-info">
              <h3>호스트 정보</h3>
              <div className="host-card">
                <div className="host-details">
                  <h4>{host?.full_name}</h4>
                  <p>{host?.church_name}</p>
                  <button className="btn btn-secondary">
                    <MessageCircle size={16} />
                    호스트에게 메시지
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽: 예약 양식 */}
          <div className="booking-section">
            <div className="booking-card">
              <div className="price-header">
                <p className="price">₩{accommodation.price?.toLocaleString()}</p>
                <p className="per-night">1박 기준</p>
              </div>

              <div className="form-group">
                <label>체크인</label>
                <input
                  type="date"
                  value={bookingData.checkIn}
                  onChange={(e) => setBookingData({ ...bookingData, checkIn: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>체크아웃</label>
                <input
                  type="date"
                  value={bookingData.checkOut}
                  onChange={(e) => setBookingData({ ...bookingData, checkOut: e.target.value })}
                />
              </div>

              {bookingData.checkIn && bookingData.checkOut && (
                <div className="price-summary">
                  <div className="summary-row">
                    <span>₩{accommodation.price?.toLocaleString()} × {Math.ceil((new Date(bookingData.checkOut) - new Date(bookingData.checkIn)) / (1000 * 60 * 60 * 24))}박</span>
                    <span>₩{(accommodation.price * Math.ceil((new Date(bookingData.checkOut) - new Date(bookingData.checkIn)) / (1000 * 60 * 60 * 24))).toLocaleString()}</span>
                  </div>
                  <div className="summary-total">
                    <span>합계</span>
                    <span>₩{(accommodation.price * Math.ceil((new Date(bookingData.checkOut) - new Date(bookingData.checkIn)) / (1000 * 60 * 60 * 24))).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <button className="btn btn-primary btn-block" onClick={handleBooking}>
                예약하기
              </button>

              <p className="note">예약 후 호스트의 승인이 필요합니다.</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .accommodation-detail {
          flex: 1;
        }

        .gallery {
          margin: 2rem 0;
          border-radius: 8px;
          overflow: hidden;
          height: 400px;
          background: #ecf0f1;
        }

        .main-image {
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

        .detail-content {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 3rem;
          margin-top: 2rem;
        }

        .info-section h1 {
          color: #2c3e50;
          margin-bottom: 1rem;
        }

        .location {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #7f8c8d;
          margin-bottom: 1.5rem;
          font-size: 1.1rem;
        }

        .basic-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 2rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #555;
        }

        .description {
          margin-bottom: 2rem;
        }

        .description h3, .amenities h3, .host-info h3 {
          color: #2c3e50;
          margin-bottom: 1rem;
        }

        .description p {
          line-height: 1.8;
          color: #555;
        }

        .amenities ul {
          list-style: none;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }

        .amenities li {
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 4px;
          color: #555;
        }

        .host-info {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 2px solid #ecf0f1;
        }

        .host-card {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 6px;
        }

        .host-details h4 {
          color: #2c3e50;
          margin-bottom: 0.5rem;
        }

        .host-details p {
          color: #7f8c8d;
          margin-bottom: 1rem;
        }

        .booking-section {
          position: sticky;
          top: 100px;
        }

        .booking-card {
          background: white;
          border: 2px solid #ecf0f1;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .price-header {
          text-align: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #ecf0f1;
        }

        .price {
          font-size: 2rem;
          font-weight: bold;
          color: #667eea;
          margin: 0;
        }

        .per-night {
          color: #7f8c8d;
          margin: 0;
          font-size: 0.9rem;
        }

        .price-summary {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 6px;
          margin: 1rem 0;
        }

        .summary-row, .summary-total {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-size: 0.95rem;
        }

        .summary-total {
          font-weight: bold;
          color: #2c3e50;
          border-top: 1px solid #ecf0f1;
          padding-top: 0.5rem;
          margin-top: 0.5rem;
        }

        .btn-block {
          width: 100%;
          margin-top: 1rem;
        }

        .note {
          font-size: 0.85rem;
          color: #7f8c8d;
          text-align: center;
          margin-top: 1rem;
        }

        @media (max-width: 768px) {
          .detail-content {
            grid-template-columns: 1fr;
          }

          .booking-section {
            position: static;
          }

          .basic-info {
            grid-template-columns: 1fr;
          }

          .gallery {
            height: 250px;
          }
        }
      `}</style>
    </div>
  );
}

export default AccommodationDetail;
