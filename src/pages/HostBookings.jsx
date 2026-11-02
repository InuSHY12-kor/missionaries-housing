import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../App';
import { PAYMENT_STATUS_LABEL, PAYMENT_STATUS_BADGE_CLASS, cancelPaidBooking, todayKst, formatDateTime } from '../utils/bankTransfer';
import { payoutFee, payoutNet } from '../utils/price';
import { ORG_INFO, PAYMENT_POLICY } from '../data/orgInfo';
import { MapPin, Calendar, Phone, CheckCircle, XCircle, DoorOpen, RotateCcw } from 'lucide-react';
import PageHero from '../components/PageHero';
import { fetchMemberContacts, withContact } from '../utils/memberContacts';

// 예약 관리(호스트) 페이지 상단 슬라이드 배너 사진
const HOST_BOOKINGS_HERO_IMAGES = [
  'https://images.pexels.com/photos/6276201/pexels-photo-6276201.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/5737832/pexels-photo-5737832.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/5737831/pexels-photo-5737831.jpeg?auto=compress&cs=tinysrgb&w=1600'
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

// 입금 상태 배지(입금 대기·입금 완료·환불 진행 중·환불 완료)는 utils/bankTransfer.js에서 함께 씁니다.
// 숙소 제공자는 여기서 선교사님의 입금 여부를 확인하고, 입실일에 "입실 확인"을 누릅니다.
// 입실이 확인되면 WEWE가 실비(수수료 차감)를 지급합니다(2026-10-27 결제는 포트원 카드·가상계좌).

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

// (2026-11-02) 예약 관리 탭 — 확인할 예약 / 확정된 예약 / 지난·취소된 예약으로 나눠 봅니다.
const BOOKING_TABS = [
  { key: 'pending', label: '미확인 예약' },
  { key: 'confirmed', label: '확인된 예약' },
  { key: 'past', label: '이전 예약' }
];

// 기간 빠른 선택. 기간은 숙박일 기준으로, 시작일 이후에 퇴실하는(= 아직 남았거나 최근에 끝난) 예약을 봅니다.
const PERIOD_PRESETS = [
  { key: '3m', label: '최근 3개월', months: 3 },
  { key: '6m', label: '최근 6개월', months: 6 },
  { key: '1y', label: '최근 1년', months: 12 },
  { key: 'all', label: '전체', months: null }
];

// 오늘(한국 시간)에서 n개월 전 날짜(YYYY-MM-DD)
function monthsAgoKst(months) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(d);
}

// 예약이 어느 탭에 속하는지 정합니다. 퇴실일이 지났거나 취소된 예약은 "이전 예약"이지만,
// 결제됐는데 아직 입실 확인을 하지 않은 확정 예약은 입실 확인을 누를 수 있도록 "확인된 예약"에 남겨 둡니다.
function bookingTab(booking, today) {
  if (booking.status === 'cancelled') return 'past';
  if (booking.status === 'pending') return booking.check_out >= today ? 'pending' : 'past';
  if (booking.status === 'confirmed') {
    const needsCheckIn = booking.payment_status === 'paid' && !booking.checked_in_at;
    return booking.check_out >= today || needsCheckIn ? 'confirmed' : 'past';
  }
  return 'past';
}

function HostBookings({ userProfile }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  // 처음에는 최근 3개월(숙박일 기준) 예약만 보여 줍니다.
  const [periodPreset, setPeriodPreset] = useState('3m');
  const [fromDate, setFromDate] = useState(() => monthsAgoKst(3));
  const [toDate, setToDate] = useState('');
  const [accommodationFilter, setAccommodationFilter] = useState('all');

  const fetchBookings = useCallback(async () => {
    if (!userProfile?.id) {
      setBookings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // RLS 정책("Hosts can view bookings for their accommodations")뿐 아니라,
      // 관리자 계정이 이 페이지(내 숙소로 들어온 예약 관리)에 접속했을 때도
      // "전체 예약"이 아니라 "내가 호스트로 등록한 숙소"의 예약만 보이도록
      // host_id로 명시적으로 필터링합니다. (전체 예약 현황은 관리 탭 > 전체 예약에서 확인)
      const { data, error } = await supabase
        .from('bookings')
        .select('*, accommodations!inner(title, location, host_id), users!bookings_guest_id_fkey(full_name, church_name)')
        .eq('accommodations.host_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // (보안 점검 B6) 게스트 전화번호는 연락처 함수로 받아 붙입니다(내 숙소 예약의 게스트만).
      const contacts = await fetchMemberContacts(supabase, (data || []).map(b => b.guest_id));
      setBookings((data || []).map(b => ({ ...b, users: withContact(b.users, contacts[b.guest_id]) })));
    } catch (error) {
      console.error('예약 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const updateStatus = async (bookingId, status) => {
    const target = bookings.find(b => b.id === bookingId);
    // 결제 완료된 예약을 숙소 제공자가 취소하면 시점과 관계없이 선교사님께 전액 환불됩니다(카드는 결제 취소).
    if (status === 'cancelled' && target?.payment_status === 'paid') {
      if (!window.confirm('이미 결제된 예약입니다. 취소하면 선교사님께 결제액 전액이 환불됩니다. 취소하시겠습니까?')) return;
      try {
        const { cardRefunded } = await cancelPaidBooking(bookingId, '숙소 제공자 예약 취소');
        setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelled', payment_status: cardRefunded ? 'refunded' : 'refund_pending' } : b));
      } catch (error) {
        alert('오류: ' + error.message);
      }
      return;
    }
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status } : b));
    } catch (error) {
      alert('오류: ' + error.message);
    }
  };

  const confirmCheckIn = async (booking) => {
    if (!window.confirm('선교사님이 숙소에 입실하셨나요? 입실 확인 후 숙박 실비 지급 절차가 시작됩니다.')) return;
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ checked_in_at: new Date().toISOString() })
        .eq('id', booking.id)
        .select('checked_in_at')
        .single();
      if (error) throw error;
      setBookings(bookings.map(b => b.id === booking.id ? { ...b, checked_in_at: data.checked_in_at } : b));
    } catch (error) {
      alert('오류: ' + error.message);
    }
  };

  const selectPreset = (preset) => {
    setPeriodPreset(preset.key);
    setFromDate(preset.months ? monthsAgoKst(preset.months) : '');
    setToDate('');
  };

  const resetFilters = () => {
    selectPreset(PERIOD_PRESETS[0]);
    setAccommodationFilter('all');
  };

  // 검색 조건의 숙소 목록 — 예약이 들어온 내 숙소들
  const accommodationOptions = [...new Map(
    bookings.map(b => [b.accommodation_id, b.accommodations?.title || '삭제된 숙소'])
  ).entries()].sort((a, b) => a[1].localeCompare(b[1], 'ko'));

  // 기간: 숙박 기간이 [시작일, 종료일]과 겹치는 예약. 숙소: 선택한 숙소의 예약.
  const today = todayKst();
  const filteredBookings = bookings.filter(b =>
    (!fromDate || b.check_out >= fromDate) &&
    (!toDate || b.check_in <= toDate) &&
    (accommodationFilter === 'all' || b.accommodation_id === accommodationFilter)
  );
  const bookingsByTab = { pending: [], confirmed: [], past: [] };
  filteredBookings.forEach(b => bookingsByTab[bookingTab(b, today)].push(b));
  // 미확인·확인된 예약은 입실일이 가까운 순, 이전 예약은 최근 순으로 보여 줍니다.
  bookingsByTab.pending.sort((a, b) => a.check_in.localeCompare(b.check_in));
  bookingsByTab.confirmed.sort((a, b) => a.check_in.localeCompare(b.check_in));
  bookingsByTab.past.sort((a, b) => b.check_in.localeCompare(a.check_in));
  const visibleBookings = bookingsByTab[activeTab];
  const filtersChanged = periodPreset !== '3m' || accommodationFilter !== 'all';

  const TAB_EMPTY_MESSAGE = {
    pending: '확인이 필요한 예약이 없습니다.',
    confirmed: '확정된 예약이 없습니다.',
    past: '이전 예약이 없습니다.'
  };

  const renderBookingCard = (booking) => (
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
        <div className="booking-item-badges">
          <span className={`badge ${STATUS_BADGE_CLASS[booking.status] || 'badge-info'}`}>
            {STATUS_LABEL[booking.status] || booking.status}
          </span>
          {(booking.status === 'confirmed' || booking.payment_status !== 'unpaid') && (
            <span className={`badge ${PAYMENT_STATUS_BADGE_CLASS[booking.payment_status] || 'badge-info'}`}>
              {PAYMENT_STATUS_LABEL[booking.payment_status] || booking.payment_status}
            </span>
          )}
        </div>
      </div>

      <div className="booking-item-body">
        <p className="dates">
          <Calendar size={16} />
          {formatDate(booking.check_in)} ~ {formatDate(booking.check_out)}
        </p>
        <p className="total-price">₩{booking.total_price?.toLocaleString()}</p>
      </div>

      {booking.status === 'confirmed' && (
        <div className="host-payment-info">
          {booking.payment_status === 'unpaid' && (
            <p>
              {booking.va_account_number
                ? `선교사님이 가상계좌 입금을 준비하고 있습니다${booking.deposit_due_at ? ` (기한 ${formatDateTime(booking.deposit_due_at)})` : ''}. 기한까지 입금되지 않으면 예약이 자동 취소됩니다.`
                : `선교사님의 결제를 기다리고 있습니다${booking.deposit_due_at ? ` (결제 기한 ${formatDateTime(booking.deposit_due_at)})` : ''}. 결제되면 알림으로 알려드립니다.`}
            </p>
          )}
          {booking.payment_status === 'paid' && (
            <>
              <p>
                결제 완료{booking.paid_at ? ` (${formatDateTime(booking.paid_at)})` : ''}
                {booking.checked_in_at ? ` · 입실 확인 ${formatDateTime(booking.checked_in_at)}` : ' · 입실일에 "입실 확인"을 눌러주세요'}
              </p>
              {Number(booking.total_price) > 0 && (
                <p className="host-payout-line">
                  {booking.payout_status === 'paid'
                    ? `지급 완료 ₩${Number(booking.payout_amount ?? payoutNet(booking.total_price, PAYMENT_POLICY.payoutFeeRate)).toLocaleString()}${booking.payout_at ? ` (${formatDateTime(booking.payout_at)})` : ''}`
                    : `지급 예정액 ₩${payoutNet(booking.total_price, PAYMENT_POLICY.payoutFeeRate).toLocaleString()} = 실비 ₩${Number(booking.total_price).toLocaleString()} − 정산지급대행 수수료 ₩${payoutFee(booking.total_price, PAYMENT_POLICY.payoutFeeRate).toLocaleString()}(${PAYMENT_POLICY.payoutFeeLabel})`}
                </p>
              )}
            </>
          )}
        </div>
      )}

      <div className="guest-info">
        <p><strong>예약자:</strong> {booking.users?.full_name || '알 수 없음'}</p>
        {booking.users?.church_name && <p><strong>교회:</strong> {booking.users.church_name}</p>}
        {booking.users?.phone && (
          <p className="phone">
            <Phone size={14} />
            {booking.users.phone}
          </p>
        )}
      </div>

      {booking.status === 'pending' && (
        <div className="booking-item-actions">
          <button className="btn btn-success" onClick={() => updateStatus(booking.id, 'confirmed')}>
            <CheckCircle size={16} />
            예약 확정
          </button>
          <button className="btn btn-danger" onClick={() => updateStatus(booking.id, 'cancelled')}>
            <XCircle size={16} />
            예약 거절
          </button>
        </div>
      )}

      {/* 입실 확인(입실일부터) / 숙소 사정으로 취소(선교사님께 전액 환불) */}
      {booking.status === 'confirmed' && booking.payment_status === 'paid' && booking.payout_status !== 'paid' && (
        <div className="booking-item-actions">
          {!booking.checked_in_at && todayKst() >= booking.check_in && (
            <button className="btn btn-success" onClick={() => confirmCheckIn(booking)}>
              <DoorOpen size={16} />
              입실 확인
            </button>
          )}
          {!booking.checked_in_at && (
            <button className="btn btn-danger" onClick={() => updateStatus(booking.id, 'cancelled')}>
              <XCircle size={16} />
              예약 취소 (전액 환불)
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="host-bookings">
      <PageHero
        images={HOST_BOOKINGS_HERO_IMAGES}
        eyebrow="MANAGE BOOKINGS"
        title="선교사님을 맞이할 준비를 해주세요"
        subtitle="예약 요청을 확인하고 확정/거절할 수 있습니다."
      />
      <div className="container">
        <h1>예약 관리</h1>
        <p className="subtitle">내 숙소에 들어온 예약 요청을 확인하고 확정/거절할 수 있습니다.</p>
        <div className="host-fee-notice">
          <strong>숙박 실비 지급 안내</strong>
          <p>
            선교사님은 예약 확정 후 {PAYMENT_POLICY.depositDays}일 안에 {ORG_INFO.paymentPartner}를 통해 카드 또는 가상계좌로 결제합니다.
            결제가 완료되면 알림으로 알려드리고, 입실이 확인되면 등록하신 지급 계좌로 실비를 보내드리며,
            이때 <b>정산지급대행 수수료({PAYMENT_POLICY.payoutFeeLabel})는 숙소 제공자 부담</b>으로 실비에서 빼고 지급됩니다.
          </p>
        </div>

        {loading ? (
          <p>로드 중...</p>
        ) : bookings.length === 0 ? (
          <p className="empty-message">아직 들어온 예약이 없습니다.</p>
        ) : (
          <>
            <div className="hb-filters" role="search" aria-label="예약 검색 조건">
              <div className="hb-filter-group">
                <span className="hb-filter-label">기간 (숙박일 기준)</span>
                <div className="hb-presets">
                  {PERIOD_PRESETS.map(preset => (
                    <button
                      key={preset.key}
                      type="button"
                      className={`hb-chip${periodPreset === preset.key ? ' active' : ''}`}
                      aria-pressed={periodPreset === preset.key}
                      onClick={() => selectPreset(preset)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="hb-dates">
                  <input
                    type="date"
                    aria-label="시작일"
                    value={fromDate}
                    max={toDate || undefined}
                    onChange={(e) => { setFromDate(e.target.value); setPeriodPreset('custom'); }}
                  />
                  <span>~</span>
                  <input
                    type="date"
                    aria-label="종료일"
                    value={toDate}
                    min={fromDate || undefined}
                    onChange={(e) => { setToDate(e.target.value); setPeriodPreset('custom'); }}
                  />
                </div>
              </div>
              <div className="hb-filter-group">
                <label className="hb-filter-label" htmlFor="hb-accommodation">숙소</label>
                <select
                  id="hb-accommodation"
                  value={accommodationFilter}
                  onChange={(e) => setAccommodationFilter(e.target.value)}
                >
                  <option value="all">전체 숙소</option>
                  {accommodationOptions.map(([id, title]) => (
                    <option key={id} value={id}>{title}</option>
                  ))}
                </select>
              </div>
              {filtersChanged && (
                <button type="button" className="hb-reset" onClick={resetFilters}>
                  <RotateCcw size={14} />
                  조건 초기화
                </button>
              )}
            </div>

            <div className="hb-tabs" role="tablist" aria-label="예약 분류">
              {BOOKING_TABS.map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  className={`hb-tab${activeTab === tab.key ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                  <span className="hb-tab-count">{bookingsByTab[tab.key].length}</span>
                </button>
              ))}
            </div>

            <section className="booking-section" role="tabpanel">
              {visibleBookings.length > 0 ? (
                <div className="bookings-list">
                  {visibleBookings.map(renderBookingCard)}
                </div>
              ) : (
                <p className="empty-message">
                  {TAB_EMPTY_MESSAGE[activeTab]}
                  {periodPreset !== 'all' && <><br />기간을 넓히면 더 오래된 예약도 볼 수 있습니다.</>}
                </p>
              )}
            </section>
          </>
        )}
      </div>

      <style>{`
        .host-fee-notice {
          margin: 0 0 1.5rem;
          padding: 1rem 1.1rem;
          border-radius: 4px;
          background: #fafafa;
          border: 1px solid #f0c48f;
          word-break: keep-all;
        }

        .host-fee-notice strong {
          display: block;
          color: #8a5a12;
          margin-bottom: 0.3rem;
        }

        .host-fee-notice p {
          margin: 0;
          color: #4a3a22;
          line-height: 1.7;
          font-size: 0.93rem;
        }

        .host-payment-info {
          margin: 0.6rem 0;
          padding: 0.7rem 0.9rem;
          border-radius: 4px;
          background: #fafafa;
          word-break: keep-all;
        }

        .host-payment-info p {
          margin: 0.15rem 0;
          font-size: 0.9rem;
          color: #222222;
          line-height: 1.6;
        }

        .host-payout-line {
          font-weight: 600;
          color: #2f7d4f !important;
        }

        .host-bookings {
          flex: 1;
        }

        .subtitle {
          color: #6b6b6b;
          margin-top: -1rem;
          margin-bottom: 2rem;
        }

        .empty-message {
          text-align: center;
          color: #6b6b6b;
          padding: 2rem;
        }

        .booking-section {
          margin-bottom: 2.5rem;
        }

        .booking-section-title {
          color: #111111;
          font-size: 1.1rem;
          margin-bottom: 1rem;
        }

        .bookings-list {
          display: grid;
          gap: 1.5rem;
        }

        .hb-filters {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          gap: 1rem 1.5rem;
          padding: 1rem 1.1rem;
          margin-bottom: 1.5rem;
          border: 1px solid #ebebeb;
          border-radius: 4px;
          background: #fff;
        }

        .hb-filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          min-width: 0;
        }

        .hb-filter-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #6b6b6b;
        }

        .hb-presets {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }

        .hb-chip {
          padding: 0.4rem 0.8rem;
          border: 1px solid #d4d4d4;
          border-radius: 6px;
          background: #fff;
          color: #222222;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }

        .hb-chip.active {
          background: #000000;
          border-color: #000000;
          color: #fff;
        }

        .hb-dates {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: #6b6b6b;
        }

        .hb-dates input,
        .hb-filters select {
          padding: 0.45rem 0.6rem;
          border: 1px solid #d4d4d4;
          border-radius: 6px;
          background: #fff;
          color: #111111;
          font: inherit;
          font-size: 0.88rem;
          min-width: 0;
        }

        .hb-filters select {
          min-width: 12rem;
          max-width: 100%;
        }

        .hb-reset {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.45rem 0.2rem;
          border: none;
          background: none;
          color: #a65424;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }

        .hb-tabs {
          display: flex;
          gap: 1.5rem;
          border-bottom: 1px solid #d4d4d4;
          margin-bottom: 1.5rem;
          overflow-x: auto;
        }

        .hb-tab {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.75rem 0;
          margin-bottom: -1px;
          border: none;
          border-bottom: 2px solid transparent;
          background: none;
          color: #6b6b6b;
          font-size: 0.98rem;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
        }

        .hb-tab.active {
          color: #111111;
          border-bottom-color: #000000;
        }

        .hb-tab-count {
          min-width: 1.4rem;
          padding: 0.05rem 0.4rem;
          border-radius: 6px;
          background: #f2f2f2;
          color: #424242;
          font-size: 0.78rem;
          text-align: center;
        }

        .hb-tab.active .hb-tab-count {
          background: #d97b3f;
          color: #fff;
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
          border-bottom: 1px solid #ebebeb;
        }

        .booking-item-header h3 {
          color: #111111;
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
          color: #6b6b6b;
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
          color: #a65424;
          margin: 0;
          font-size: 1.1rem;
        }

        .guest-info {
          background: #fafafa;
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        .guest-info p {
          margin: 0.35rem 0;
          font-size: 0.9rem;
          color: #555;
        }

        .guest-info .phone {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .booking-item-actions {
          display: flex;
          gap: 0.75rem;
        }

        .booking-item-actions button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        @media (max-width: 768px) {
          .booking-item-body {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .booking-item-actions {
            flex-direction: column;
          }

          .host-bookings .subtitle {
            font-size: 0.9rem;
            margin-top: -0.5rem;
            margin-bottom: 1.5rem;
          }

          .host-bookings .booking-section-title {
            font-size: 1rem;
          }

          .host-bookings .booking-item-header {
            flex-wrap: wrap;
            gap: 0.6rem;
          }

          .host-bookings .booking-item-header h3 {
            font-size: 1.05rem;
          }

          .host-bookings .location {
            font-size: 0.85rem;
          }

          .host-bookings .dates {
            font-size: 0.9rem;
          }

          .host-bookings .total-price {
            font-size: 1.05rem;
          }

          .host-bookings .guest-info p {
            font-size: 0.85rem;
          }
        }

        @media (max-width: 480px) {
          .host-bookings .subtitle {
            font-size: 0.85rem;
          }

          .host-bookings .booking-section {
            margin-bottom: 1.75rem;
          }

          .host-bookings .booking-section-title {
            font-size: 0.95rem;
          }

          .host-bookings .booking-item-header h3 {
            font-size: 1rem;
          }

          .host-bookings .location,
          .host-bookings .dates {
            font-size: 0.85rem;
          }

          .host-bookings .total-price {
            font-size: 1rem;
          }

          .host-bookings .guest-info {
            padding: 0.85rem;
          }

          .host-bookings .guest-info p {
            font-size: 0.82rem;
          }

          .host-bookings .hb-filters {
            flex-direction: column;
            align-items: stretch;
          }

          .host-bookings .hb-dates input {
            flex: 1;
          }

          .host-bookings .hb-filters select {
            width: 100%;
            min-width: 0;
          }

          .host-bookings .hb-tabs {
            gap: 1rem;
          }

          .host-bookings .hb-tab {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}

export default HostBookings;
