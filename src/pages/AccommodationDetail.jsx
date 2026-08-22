import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../App';
import { MapPin, Users, Home, MessageCircle, CheckCircle, Edit, Send, XCircle, AlertTriangle } from 'lucide-react';
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

  // 관리자 승인 검토 — 실제 이 페이지(호스트/선교사에게 보이는 것과 동일한 화면)에서 바로 처리합니다.
  const [adminActionMode, setAdminActionMode] = useState(null); // 'revision' | 'rejection' | null
  const [adminReason, setAdminReason] = useState('');
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminActionError, setAdminActionError] = useState('');
  const [adminNotice, setAdminNotice] = useState('');

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

  // 승인 — 승인된 회원에게 즉시 노출됩니다.
  const handleAdminApprove = async () => {
    if (!window.confirm('이 숙소를 승인하시겠습니까? 승인 시 승인된 회원에게 바로 노출됩니다.')) return;
    setAdminBusy(true);
    setAdminActionError('');
    try {
      const { error } = await supabase
        .from('accommodations')
        .update({ status: 'approved', rejection_reason: null, admin_feedback_type: null })
        .eq('id', id);
      if (error) throw error;
      setAccommodation(prev => ({ ...prev, status: 'approved', rejection_reason: null, admin_feedback_type: null }));
      setAdminNotice('숙소가 승인되었습니다.');
    } catch (error) {
      setAdminActionError('오류: ' + error.message);
    } finally {
      setAdminBusy(false);
    }
  };

  // 수정 요청/거절 — 두 경우 모두 상태는 계속 '승인 대기중'으로 유지하고, 사유만 호스트에게 전달합니다.
  // (호스트의 "내 숙소" 페이지에서 상태 배지는 그대로 대기중으로 보이고, 사유만 함께 표시됩니다.)
  const handleAdminFeedbackSubmit = async () => {
    if (!adminReason.trim()) {
      setAdminActionError('사유를 입력해주세요.');
      return;
    }
    setAdminBusy(true);
    setAdminActionError('');
    try {
      const { error } = await supabase
        .from('accommodations')
        .update({ status: 'pending', rejection_reason: adminReason.trim(), admin_feedback_type: adminActionMode })
        .eq('id', id);
      if (error) throw error;
      setAccommodation(prev => ({ ...prev, status: 'pending', rejection_reason: adminReason.trim(), admin_feedback_type: adminActionMode }));
      setAdminNotice(adminActionMode === 'revision' ? '수정 요청을 호스트에게 전달했습니다.' : '거절 사유를 호스트에게 전달했습니다.');
      setAdminActionMode(null);
      setAdminReason('');
    } catch (error) {
      setAdminActionError('오류: ' + error.message);
    } finally {
      setAdminBusy(false);
    }
  };

  if (loading) return <div className="container"><p>로드 중...</p></div>;
  if (!accommodation) return <div className="container"><p>숙소를 찾을 수 없습니다.</p></div>;

  const isAdminPendingReview = userProfile?.role === 'admin' && accommodation.status === 'pending';

  const nights = bookingData.checkIn && bookingData.checkOut
    ? Math.ceil((new Date(bookingData.checkOut) - new Date(bookingData.checkIn)) / (1000 * 60 * 60 * 24))
    : 0;

  const canEdit = userProfile && (userProfile.role === 'admin' || accommodation.host_id === userProfile.id);
  const matchedAmenities = (accommodation.amenities || [])
    .map(key => AMENITY_MAP[key])
    .filter(Boolean);
  const otherAmenities = accommodation.amenities_other || [];

  return (
    <div className="accommodation-detail">
      <div className="container">
        {isAdminPendingReview && (
          <div className="admin-review-banner">
            <AlertTriangle size={18} />
            <span>관리자 승인 대기중인 숙소입니다. 선교사/호스트에게 실제로 보이는 화면 그대로이며, 아래 예약 영역 자리에서 승인·수정 요청·거절을 처리할 수 있습니다.</span>
          </div>
        )}
        {adminNotice && <div className="admin-notice-banner">{adminNotice}</div>}

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

            {(matchedAmenities.length > 0 || otherAmenities.length > 0) && (
              <div className="amenities-section">
                <h3>편의시설</h3>
                <div className="amenities-box">
                  {matchedAmenities.map(item => (
                    <div key={item.key} className="amenity-chip">
                      <AmenityIcon name={item.icon} size={16} />
                      <span>{item.label}</span>
                    </div>
                  ))}
                  {otherAmenities.map(value => (
                    <div key={value} className="amenity-chip">
                      <AmenityIcon name="CheckCircle" size={16} />
                      <span>{value}</span>
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

          {/* 오른쪽: 예약 양식 (관리자가 승인 대기중인 숙소를 볼 때는 검토 패널로 대체) */}
          <div className="booking-section">
            {isAdminPendingReview ? (
              <div className="booking-card admin-review-card">
                <h3>관리자 검토</h3>

                {accommodation.rejection_reason && (
                  <div className={`admin-review-prev-feedback ${accommodation.admin_feedback_type === 'revision' ? 'is-revision' : 'is-rejection'}`}>
                    <strong>{accommodation.admin_feedback_type === 'revision' ? '이전에 남긴 수정 요청' : '이전에 남긴 거절 사유'}</strong>
                    <p>{accommodation.rejection_reason}</p>
                  </div>
                )}

                {adminActionMode ? (
                  <div className="admin-reason-form">
                    <label>{adminActionMode === 'revision' ? '수정 요청 사유 *' : '거절 사유 *'}</label>
                    <textarea
                      rows="5"
                      value={adminReason}
                      onChange={(e) => setAdminReason(e.target.value)}
                      placeholder="호스트에게 전달할 내용을 자세히 입력해주세요"
                    />
                    {adminActionError && <p className="form-error">{adminActionError}</p>}
                    <div className="admin-review-actions">
                      <button className="btn btn-danger" disabled={adminBusy} onClick={handleAdminFeedbackSubmit}>
                        {adminBusy ? '처리 중...' : (adminActionMode === 'revision' ? '수정 요청 보내기' : '거절 사유 보내기')}
                      </button>
                      <button
                        className="btn btn-secondary"
                        disabled={adminBusy}
                        onClick={() => { setAdminActionMode(null); setAdminReason(''); setAdminActionError(''); }}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="admin-review-hint">
                      숙소 상태는 승인 전까지 계속 <strong>승인 대기중</strong>으로 유지되며, 수정 요청·거절 사유는 호스트의 "내 숙소" 페이지에서 확인할 수 있습니다.
                    </p>
                    {adminActionError && <p className="form-error">{adminActionError}</p>}
                    <div className="admin-review-actions admin-review-actions-main">
                      <button className="btn btn-success" disabled={adminBusy} onClick={handleAdminApprove}>
                        <CheckCircle size={16} />
                        승인
                      </button>
                      <button
                        className="btn btn-warning"
                        disabled={adminBusy}
                        onClick={() => { setAdminActionMode('revision'); setAdminReason(''); setAdminActionError(''); }}
                      >
                        <Edit size={16} />
                        수정 요청
                      </button>
                      <button
                        className="btn btn-danger"
                        disabled={adminBusy}
                        onClick={() => { setAdminActionMode('rejection'); setAdminReason(''); setAdminActionError(''); }}
                      >
                        <XCircle size={16} />
                        거절
                      </button>
                    </div>
                  </>
                )}

                <Link to="/admin" className="admin-review-back">관리자 대시보드로 돌아가기</Link>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </div>

      <style>{`
        .accommodation-detail {
          flex: 1;
        }

        .admin-review-banner {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background: #fff8e6;
          color: #8a5a12;
          border: 1px solid #f0dcb0;
          border-radius: 8px;
          padding: 0.9rem 1.1rem;
          margin-top: 1.5rem;
          font-size: 0.92rem;
          line-height: 1.5;
        }

        .admin-review-banner svg {
          flex-shrink: 0;
        }

        .admin-notice-banner {
          background: #e6f4f5;
          color: #106570;
          border: 1px solid #cceaec;
          border-radius: 8px;
          padding: 0.75rem 1.1rem;
          margin-top: 0.75rem;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .admin-review-card h3 {
          color: #2c3e50;
          margin-bottom: 1rem;
        }

        .admin-review-hint {
          font-size: 0.85rem;
          color: #7f8c8d;
          line-height: 1.6;
          margin-bottom: 1.25rem;
        }

        .admin-review-prev-feedback {
          border-radius: 6px;
          padding: 0.85rem 1rem;
          margin-bottom: 1.25rem;
          font-size: 0.88rem;
        }

        .admin-review-prev-feedback strong {
          display: block;
          margin-bottom: 0.35rem;
        }

        .admin-review-prev-feedback p {
          margin: 0;
          white-space: pre-wrap;
          line-height: 1.6;
        }

        .admin-review-prev-feedback.is-revision {
          background: #fff8e6;
          color: #8a5a12;
          border-left: 4px solid #f39c12;
        }

        .admin-review-prev-feedback.is-rejection {
          background: #fadbd8;
          color: #922b21;
          border-left: 4px solid #e74c3c;
        }

        .admin-reason-form label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #2c3e50;
          font-size: 0.9rem;
        }

        .admin-reason-form textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #ecf0f1;
          border-radius: 6px;
          font-family: inherit;
          resize: vertical;
        }

        .admin-reason-form textarea:focus {
          outline: none;
          border-color: #16808E;
        }

        .admin-review-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
          margin-top: 1rem;
        }

        .admin-review-actions-main button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          white-space: nowrap;
        }

        .admin-review-back {
          display: block;
          text-align: center;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #ecf0f1;
          color: #16808E;
          font-size: 0.85rem;
          text-decoration: none;
        }

        .admin-review-back:hover {
          text-decoration: underline;
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
