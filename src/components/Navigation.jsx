import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Home, MapPin, Calendar, Building2, CalendarClock, Star, Shield, User } from 'lucide-react';
import wewelogo from '../assets/wewe-icon.png';
import NotificationBell from './NotificationBell';
import MessageIcon from './MessageIcon';

const ROLE_LABELS = {
  admin: '관리자',
  missionary: '선교사',
  host: '숙소 제공자'
};

function Navigation({ user, userProfile, onLogout }) {
  // 관리자 승인과 이메일 인증이 모두 완료되어야 실제 서비스 메뉴가 노출됨
  const hasFullAccess = userProfile?.status === 'approved' && !!userProfile?.email_verified_at;

  // 로그인한 사용자(특히 관리자)는 메뉴 항목이 많아 좁은 화면에서 상단바가 여러 줄로
  // 늘어날 수 있습니다. 사진 배너 페이지에서는 상단바가 배너 위에 투명하게 얹히기 때문에
  // (position: absolute) 배너 쪽에서 상단바 실제 높이만큼 여백을 미리 비워두지 않으면
  // 글씨가 겹쳐 보입니다. 상단바 자신의 실제 렌더링 높이를 CSS 변수(--navbar-height)로
  // 계속 갱신해서, PageHero/랜딩 히어로가 몇 줄이 되든 항상 정확한 여백을 확보하도록 합니다.
  const navRef = useRef(null);

  useEffect(() => {
    const el = navRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;

    const updateNavbarHeight = () => {
      document.documentElement.style.setProperty('--navbar-height', `${el.offsetHeight}px`);
    };

    updateNavbarHeight();
    const observer = new ResizeObserver(updateNavbarHeight);
    observer.observe(el);
    window.addEventListener('resize', updateNavbarHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateNavbarHeight);
    };
  }, []);

  // 상단에 사진 배너(랜딩 히어로 또는 PageHero)가 있는 페이지에서는 내비게이션을
  // 투명 배경 + 흰 글씨로 배너 위에 오버레이합니다. 배너가 없는 페이지(예약 상세 등 배너를
  // 넣지 않은 일부 하위 페이지)에서는 기존의 불투명 상단바를 그대로 사용합니다.
  const location = useLocation();
  const HERO_BANNER_ROUTES = [
    '/', '/dashboard', '/accommodations', '/my-bookings',
    '/my-accommodations', '/host-bookings', '/reviews', '/messages', '/profile',
    '/login', '/signup', '/signup/missionary', '/signup/host',
    '/signup-complete', '/verify-email', '/complete-profile'
  ];
  // 관리자 페이지(/admin/*), 숙소 상세 페이지(/accommodations/:id), 예약 상세 페이지
  // (/my-bookings/:id)는 하위 경로가 동적으로 바뀌므로 접두사로 매칭합니다.
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAccommodationDetailRoute = location.pathname.startsWith('/accommodations/');
  const isBookingDetailRoute = location.pathname.startsWith('/my-bookings/');
  // 승인 대기 화면과 프로필 등록 화면은 고정된 경로 없이 "*" 라우트로 렌더링되므로
  // (App.jsx 참고) 경로가 아니라 로그인 상태(userProfile)로 판별해야 합니다.
  const isCompleteProfileScreen = !!user && !userProfile;
  const isPendingApprovalScreen = !!userProfile
    && (userProfile.status === 'pending'
      || (userProfile.status === 'approved' && !userProfile.email_verified_at));
  // 탈퇴 처리 완료(withdrawn) / 관리자 삭제 처리 대기(deletion_pending) 화면도 PendingApproval과
  // 마찬가지로 "*" 라우트 + PageHero 배너로 렌더링되므로 동일하게 처리합니다.
  const isAccountStatusScreen = !!userProfile
    && (userProfile.status === 'withdrawn' || userProfile.status === 'deletion_pending');
  const hasHeroBanner = HERO_BANNER_ROUTES.includes(location.pathname)
    || isAdminRoute
    || isAccommodationDetailRoute
    || isBookingDetailRoute
    || isCompleteProfileScreen
    || isPendingApprovalScreen
    || isAccountStatusScreen;

  const brand = (
    <Link to="/" className="navbar-brand">
      <img src={wewelogo} alt="WEWE STAY" className="navbar-logo" />
      <span className="navbar-brand-text">WEWE<b>STAY</b></span>
    </Link>
  );

  return (
    <nav ref={navRef} className={`navbar ${user ? 'navbar-authed' : ''} ${hasHeroBanner ? 'navbar-transparent' : ''}`}>
      <div className={`container ${user ? 'navbar-container' : 'navbar-container-single'}`}>
        {user ? (
          <>
            <div className="navbar-top-row">
              {brand}

              {(userProfile?.full_name || ((userProfile?.status === 'approved' || userProfile?.status === 'pending') && userProfile.role)) && (
                <div className="navbar-top-right">
                  {(userProfile?.status === 'approved' || userProfile?.status === 'pending') && userProfile.role && (
                    <span className={`status-badge status-role-${userProfile.role}`}>
                      {userProfile.role === 'admin' && userProfile.is_super_admin
                        ? '최고 관리자'
                        : (ROLE_LABELS[userProfile.role] || userProfile.role)}
                    </span>
                  )}

                  {userProfile?.full_name && (
                    <span className="navbar-welcome">
                      반갑습니다, {userProfile.full_name}님
                    </span>
                  )}
                </div>
              )}
            </div>

            <ul className="navbar-nav">
              {hasFullAccess && (
                <>
                  <li>
                    <Link to="/dashboard" className="nav-btn">
                      <Home className="nav-btn-icon" size={18} />
                      <span className="nav-btn-label">마이페이지</span>
                    </Link>
                  </li>
                  {(userProfile.role === 'admin' || userProfile.role === 'missionary') && (
                    <li>
                      <Link to="/accommodations" className="nav-btn">
                        <MapPin className="nav-btn-icon" size={18} />
                        <span className="nav-btn-label">숙소 검색</span>
                      </Link>
                    </li>
                  )}
                  <li>
                    <Link to="/my-bookings" className="nav-btn">
                      <Calendar className="nav-btn-icon" size={18} />
                      <span className="nav-btn-label">내 예약</span>
                    </Link>
                  </li>
                  {(userProfile.role === 'admin' || userProfile.role === 'host') && (
                    <>
                      <li>
                        <Link to="/my-accommodations" className="nav-btn">
                          <Building2 className="nav-btn-icon" size={18} />
                          <span className="nav-btn-label">내 숙소</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/host-bookings" className="nav-btn">
                          <CalendarClock className="nav-btn-icon" size={18} />
                          <span className="nav-btn-label">예약 관리</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/reviews" className="nav-btn">
                          <Star className="nav-btn-icon" size={18} />
                          <span className="nav-btn-label">리뷰</span>
                        </Link>
                      </li>
                    </>
                  )}
                  {userProfile.role === 'admin' && (
                    <li>
                      <Link to="/admin" className="nav-btn">
                        <Shield className="nav-btn-icon" size={18} />
                        <span className="nav-btn-label">관리</span>
                      </Link>
                    </li>
                  )}
                  <li>
                    <Link to="/profile" className="nav-btn">
                      <User className="nav-btn-icon" size={18} />
                      <span className="nav-btn-label">프로필</span>
                    </Link>
                  </li>
                </>
              )}

              {(userProfile?.status === 'pending' || (userProfile?.status === 'approved' && !userProfile?.email_verified_at)) && (
                <li>
                  <span className="status-badge status-pending">
                    {!userProfile?.email_verified_at ? '⏳ 이메일 미인증' : '⏳ 승인 대기'}
                  </span>
                </li>
              )}

              {hasFullAccess && (
                <>
                  <li>
                    <NotificationBell userProfile={userProfile} />
                  </li>
                  <li>
                    <MessageIcon userProfile={userProfile} />
                  </li>
                </>
              )}

              <li>
                <button onClick={onLogout} className="nav-btn nav-btn-outline">
                  <LogOut size={18} />
                  <span className="nav-btn-label">로그아웃</span>
                </button>
              </li>
            </ul>
          </>
        ) : (
          <>
            {brand}

            <ul className="navbar-nav">
              <li><Link to="/" className="nav-btn">홈</Link></li>
              <li><Link to="/login" className="nav-btn">로그인</Link></li>
              <li><Link to="/signup" className="nav-btn">가입하기</Link></li>
            </ul>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navigation;
