import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../App';
import { MapPin, Users, Home, MessageCircle, CheckCircle, Edit, Send } from 'lucide-react';
import AccommodationMap from '../components/AccommodationMap';
import ImageCarousel from '../components/ImageCarousel';
import Calendar from '../components/Calendar';
import AmenityIcon from '../components/AmenityIcon';
import { AMENITY_MAP } from '../utils/amenities';

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  // 체크아웃일 당일은 겹치지 않는 것으로 처리 (반개구간 비교)
  return aStart < bEnd && aEnd > bStart;
}

function AccommodationDetail({ userProfile }) {
  const { id } = useParams();
  const [accommodation, setAccommodation] = useState(null);
  const [host, setHost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: ''
  });
  const [bookedRanges, setBookedRanges] = useState([]);
  const [bookedDates, setBookedDates] = useState(new Set());
  const [blockedDates, setBlockedDates] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const [contactMode, setContactMode] = useState(null); // 'host' | 'admin' | null
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState('');
  const [contactError, setContactError] = useState('');

  const fetchAccommodation = useCallback(async () => {
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
  }, [id]);

  const fetchAvailability = useCallback(async () => {
    try {
      const [{ data: ranges, error: rangesError }, { data: blocked, error: blockedError }] = await Promise.all([
        supabase.rpc('get_accommodation_booked_ranges', { p_accommodation_id: id }),
        supabase.rpc('get_accommodation_blocked_dates', { p_accommodation_id: id })
      ]);

      if (rangesError) throw rangesError;
      if (blockedError) throw blockedError;

      setBookedRanges(ranges || []);

      const bookedSet = new Set();
      (ranges || []).forEach(r => {
        const cursor = new Date(r.check_in);
        const end = new Date(r.check_out);
        while (cursor < end) {
          bookedSet.add(cursor.toISOString().split('T')[0]);
          cursor.setDate(cursor.getDate() + 1);
        }
      });
      setBookedDates(bookedSet);
      setBlockedDates(new Set((blocked || []).map(b => b.blocked_date)));
    } catch (error) {
      console.error('예약 현황 로드 오류:', error);
    }
  }, [id]);

    useEffect(() => {
          fetchAccommodation();
          fetchAvailability();
    }, [fetchAccommodation, fetchAvailability]);

  const todayStr = new Date().toISOString().split('T')[0];

  const isDateUnavailable = (dateStr) => dateStr < todayStr || bookedDates.has(dateStr) || blockedDates.has(dateStr);

  const hasUnavailableBetween = (startStr, endStr) => {
    const cursor = new Date(startStr);
    const end = new Date(endStr);
    cursor.setDate(cursor.getDate() + 1);
    while (cursor < end) {
      const dStr = cursor.toISOString().split('T')[0];
      if (bookedDates.has(dStr) || blockedDates.has(dStr)) return true;
      cursor.setDate(cursor.getDate() + 1);
    }
    return false;
  };

  const handleDayClick = (dateStr) => {
    if (bookingSuccess) return;
    setBookingError('');

    if (!bookingData.checkIn || bookingData.checkOut) {
      // 새로운 선택 시작 (체크인 다시 선택)
      setBookingData({ checkIn: dateStr, checkOut: '' });
      return;
    }

    // 체크인은 있고 체크아웃은 아직 없는 상태
    if (dateStr <= bookingData.checkIn) {
      setBookingData({ checkIn: dateStr, checkOut: '' });
      return;
    }

    if (hasUnavailableBetween(bookingData.checkIn, dateStr)) {
      setBookingError('선택하신 기간 중 예약이 불가능한 날짜가 포함되어 있습니다. 다른 날짜를 선택해주세요.');
      setBookingData({ checkIn: dateStr, checkOut: '' });
      return;
    }

    setBookingData(prev => ({ ...prev, checkOut: dateStr }));
  };

  const isCalDisabled = (dateStr) => isDateUnavailable(dateStr);
  const isCalSelected = (dateStr) => dateStr === bookingData.checkIn || dateStr === bookingData.checkOut;
  const isCalInRange = (dateStr) =>
    !!(bookingData.checkIn && bookingData.checkOut && dateStr > bookingData.checkIn && dateStr < bookingData.checkOut);

  const findOverlap = (checkInStr, checkOutStr) => {
    return bookedRanges.find(range =>
      rangesOverlap(checkInStr, checkOutStr, range.check_in, range.check_out)
    );
  };

  const handleBooking = async () => {
    setBookingError('');

    if (!bookingData.checkIn || !bookingData.checkOut) {
      setBookingError('달력에서 체크인, 체크아웃 날짜를 모두 선택해주세요.');
      return;
    }

    if (bookingData.checkIn < todayStr) {
      setBookingError('체크인 날짜는 오늘 이후여야 합니다.');
      return;
    }

    if (bookingData.checkOut <= bookingData.checkIn) {
      setBookingError('체크아웃 날짜는 체크인 날짜 이후여야 합니다.');
      return;
    }

    if (findOverlap(bookingData.checkIn, bookingData.checkOut)) {
      setBookingError('선택하신 날짜는 이미 예약이 있어 선택할 수 없습니다. 다른 날짜를 선택해주세요.');
      return;
    }

    setSubmitting(true);

    try {
      const checkIn = new Date(bookingData.checkIn);
      const checkOut = new Date(bookingData.checkOut);
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      const totalPrice = nights * accommodation.price;

      const { data: { user: authUser } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('bookings')
        .insert({
          accommodation_id: id,
          guest_id: authUser.id,
          check_in: bookingData.checkIn,
          check_out: bookingData.checkOut,
          total_price: totalPrice,
          status: 'pending'
        })
        .select();

      if (error) {
        // 서버(DB)에서 다른 예약과 날짜가 겹치는 것을 감지한 경우 (동시 예약 등)
        if (error.code === '23P01') {
          setBookingError('선택하신 날짜는 방금 다른 분이 먼저 예약하셨습니다. 다른 날짜를 선택해주세요.');
          fetchAvailability();
          return;
        }
        throw error;
      }

      setBookingSuccess(true);
      setBookingData({ checkIn: '', checkOut: '' });
      fetchAvailability();
    } catch (error) {
      setBookingError('오류가 발생했습니다: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openContact = (mode) => {
    setContactMode(mode);
    setContactMessage('');
    setContactError('');
    setContactSuccess('');
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactMessage.trim()) {
      setContactError('메시지 내용을 입력해주세요.');
      return;
    }

    setContactSubmitting(true);
    setContactError('');

    try {
      if (contactMode === 'host') {
        const { data, error } = await supabase
          .from('messages')
          .insert({
            sender_id: userProfile.id,
            recipient_id: host.id,
            accommodation_id: accommodation.id,
            message: contactMessage.trim()
          })
          .select()
          .single();

        if (error) throw error;

        // 이메일 발송은 best-effort — 실패해도 메시지 전송 자체는 성공한 것으로 처리
        supabase.functions
          .invoke('send-email', { body: { type: 'host_contact', messageId: data.id } })
          .catch((emailErr) => console.error('호스트 문의 이메일 발송 오류:', emailErr));
      } else if (contactMode === 'admin') {
        const { data: messageIds, error } = await supabase.rpc('contact_admins', {
          p_message: contactMessage.trim(),
          p_accommodation_id: accommodation.id
        });

        if (error) throw error;

        if (messageIds && messageIds.length > 0) {
          supabase.functions
            .invoke('send-email', { body: { type: 'admin_contact', messageId: messageIds[0] } })
            .catch((emailErr) => console.error('관리자 문의 이메일 발송 오류:', emailErr));
        }
      }

      setContactSuccess('메시지가 전송되었습니다.');
      setContactMessage('');
      setContactMode(null);
    } catch (error) {
      setContactError('오류가 발생했습니다: ' + error.message);
    } finally {
      setContactSubmitting(false);
    }
  };

  if (loading) return <div className="container"><p>로드 중...</p></div>;
  if (!accommodation) return <div className="container"><p>숙소를 찾을 수 없습니다.</p></div>;

  const nights = bookingData.checkIn && bookingData.checkOut
    ? Math.ceil((new Date(bookingData.checkOut) - new Date(bookingData.checkIn)) / (1000 * 60 * 60 * 24))
    : 0;

  const canEdit = userProfile && (userProfile.role === 'admin' || accommodation.host_id === userProfile.id);
  const matchedAmenities = (accommodation.amenities || [])
    .map(key => AMENITY_MAP[key])
    .filter(Boolean);

  return (
    <div className="accommodation-detail">
      <div className="container">
        {/* 이미지 갤러리 */}
        <div className="gallery">
          <ImageCarousel images={accommodation.images} alt={accommodation.title} />
        </div>

        <div className="detail-content">
          {/* 왼쪽: 정보 */}
          <div className="info-section">
            <div className="title-row">
              <h1>{accommodation.title}</h1>
              {canEdit && (
                <Link to={`/my-accommodations?edit=${accommodation.id}`} className="btn btn-secondary edit-btn">
                  <Edit size={16} />
                  수정하기
                </Link>
              )}
            </div>

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

            {matchedAmenities.length > 0 && (
              <div className="amenities-section">
                <h3>편의시설</h3>
                <div className="amenities-box">
                  {matchedAmenities.map(item => (
                    <div key={item.key} className="amenity-chip">
                      <AmenityIcon name={item.icon} size={16} />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 위치 지도 */}
            <div className="map-section">
              <h3>위치</h3>
              <AccommodationMap
                lat={accommodation.latitude}
                lng={accommodation.longitude}
                title={accommodation.title}
              />
            </div>

            {/* 호스트 정보 */}
            <div className="host-info">
              <h3>호스트 정보</h3>
              <div className="host-card">
                <div className="host-details">
                  <h4>{host?.full_name}</h4>
                  <p>{host?.church_name}</p>

                  {contactSuccess && <p className="contact-success-msg">{contactSuccess}</p>}

                  {contactMode ? (
                    <form className="contact-inline-form" onSubmit={handleContactSubmit}>
                      <label>
                        {contactMode === 'host' ? '호스트님께 보낼 메시지' : '위위 관리자에게 보낼 문의 내용'}
                      </label>
                      <textarea
                        rows="4"
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="메시지를 입력해주세요"
                      />
                      {contactError && <p className="form-error">{contactError}</p>}
                      <div className="contact-form-actions">
                        <button type="submit" className="btn btn-primary" disabled={contactSubmitting}>
                          {contactSubmitting ? '전송 중...' : '보내기'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setContactMode(null)}
                          disabled={contactSubmitting}
                        >
                          취소
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="contact-buttons">
                      {userProfile?.id !== host?.id && (
                        <button className="btn btn-secondary" onClick={() => openContact('host')}>
                          <MessageCircle size={16} />
                          호스트에게 메시지
                        </button>
                      )}
                      <button className="btn btn-secondary" onClick={() => openContact('admin')}>
                        <Send size={16} />
                        위위 관리자에게 문의하기
                      </button>
                    </div>
                  )}
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

              {bookingSuccess ? (
                <div className="booking-success">
                  <CheckCircle size={36} />
                  <h4>예약 요청이 접수되었습니다</h4>
                  <p>호스트님의 확인 후 예약이 확정되며, "내 예약" 페이지에서 진행 상황을 확인하실 수 있습니다.</p>
                  <button className="btn btn-secondary btn-block" onClick={() => setBookingSuccess(false)}>
                    다른 날짜 예약하기
                  </button>
                </div>
              ) : (
                <>
                  <div className="date-selection-summary">
                    <div className="date-box">
                      <label>체크인</label>
                      <p>{bookingData.checkIn || '날짜 선택'}</p>
                    </div>
                    <div className="date-box">
                      <label>체크아웃</label>
                      <p>{bookingData.checkOut || '날짜 선택'}</p>
                    </div>
                  </div>

                  <p className="calendar-hint">
                    회색으로 표시된 날짜는 예약이 불가능합니다. 달력에서 체크인 날짜를 먼저 선택하고, 이어서 체크아웃 날짜를 선택해주세요.
                  </p>

                  <Calendar
                    isDisabled={isCalDisabled}
                    isSelected={isCalSelected}
                    isInRange={isCalInRange}
                    onDayClick={handleDayClick}
                  />

                  {nights > 0 && (
                    <div className="price-summary">
                      <div className="summary-row">
                        <span>₩{accommodation.price?.toLocaleString()} × {nights}박</span>
                        <span>₩{(accommodation.price * nights).toLocaleString()}</span>
                      </div>
                      <div className="summary-total">
                        <span>합계</span>
                        <span>₩{(accommodation.price * nights).toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {bookingError && <p className="form-error">{bookingError}</p>}

                  <button className="btn btn-primary btn-block" onClick={handleBooking} disabled={submitting}>
                    {submitting ? '예약 중...' : '예약하기'}
                  </button>

                  <p className="note">예약 후 호스트의 승인이 필요합니다.</p>
                </>
              )}
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

        .detail-content {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 3rem;
          margin-top: 2rem;
        }

        .title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }

        .info-section h1 {
          color: #2c3e50;
          margin-bottom: 1rem;
        }

        .edit-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          white-space: nowrap;
          text-decoration: none;
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

        .description h3, .amenities-section h3, .host-info h3, .map-section h3 {
          color: #2c3e50;
          margin-bottom: 1rem;
        }

        .description p {
          line-height: 1.8;
          color: #555;
        }

        .amenities-section {
          margin-bottom: 2rem;
        }

        .amenities-box {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem 1.5rem;
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1.25rem 1.5rem;
        }

        .amenity-chip {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #444;
          font-size: 0.92rem;
          min-width: 45%;
        }

        .amenity-chip svg {
          color: #16808E;
          flex-shrink: 0;
        }

        .map-section {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 2px solid #ecf0f1;
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

        .contact-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .contact-success-msg {
          color: #16808E;
          font-weight: 600;
          margin-bottom: 0.75rem !important;
        }

        .contact-inline-form label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #2c3e50;
          font-size: 0.9rem;
        }

        .contact-inline-form textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #ecf0f1;
          border-radius: 6px;
          font-family: inherit;
          resize: vertical;
          transition: border-color 0.3s;
        }

        .contact-inline-form textarea:focus {
          outline: none;
          border-color: #16808E;
        }

        .contact-form-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }

        .booking-section {
          position: sticky;
          top: 100px;
          align-self: start;
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
          color: #16808E;
          margin: 0;
        }

        .per-night {
          color: #7f8c8d;
          margin: 0;
          font-size: 0.9rem;
        }

        .date-selection-summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .date-box {
          border: 1px solid #dfe6e9;
          border-radius: 6px;
          padding: 0.6rem 0.75rem;
        }

        .date-box label {
          display: block;
          font-size: 0.75rem;
          color: #95a5a6;
          margin-bottom: 0.2rem;
        }

        .date-box p {
          margin: 0;
          font-weight: 600;
          color: #2c3e50;
          font-size: 0.9rem;
        }

        .calendar-hint {
          font-size: 0.8rem;
          color: #7f8c8d;
          margin-bottom: 0.75rem;
          line-height: 1.5;
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
          justify-content: center;
        }

        .note {
          font-size: 0.85rem;
          color: #7f8c8d;
          text-align: center;
          margin-top: 1rem;
        }

        .form-error {
          color: #e74c3c;
          font-size: 0.85rem;
          margin: 0.5rem 0 0;
        }

        .booking-success {
          text-align: center;
          padding: 1rem 0;
        }

        .booking-success svg {
          color: #16808E;
          margin-bottom: 0.75rem;
        }

        .booking-success h4 {
          color: #2c3e50;
          margin-bottom: 0.5rem;
        }

        .booking-success p {
          color: #7f8c8d;
          font-size: 0.9rem;
          line-height: 1.6;
          margin-bottom: 1rem;
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

          .amenity-chip {
            min-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default AccommodationDetail;
