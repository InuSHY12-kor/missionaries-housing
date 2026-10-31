import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Home, MapPin, Calendar, Building2, CalendarClock, Star, Shield, User, Info } from 'lucide-react';
import wewelogo from '../assets/WEWE_logo_2-mark.png';
import weweIconWhite from '../assets/wewe-icon-white.png';
import NotificationBell from './NotificationBell';
import MessageIcon from './MessageIcon';

const ROLE_LABELS = {
  admin: '관리자',
  missionary: '선교사',
  host: '숙소 제공자',
  supporter: '후원자'
};

function Navigation({ user, userProfile, onLogout }) {
  // 관리자 승인과 이메일 인증이 모두 완료되어야 실제 서비스 메뉴가 노출됨
  const hasFullAccess = userProfile?.status === 'approved' && !!userProfile?.email_verified_at;
  // (Phase 6) 후원자는 숙소 검색/예약/등록 등 실제 서비스 메뉴를 이용하지 않고 App.jsx에서
  // 항상 소개 전용 화면(SupporterHome)만 보게 되므로, 상단 메뉴도 "위위" 링크와 로그아웃만
  // 남긴 훨씬 단순한 형태로 보여줍니다.
  const isSupporterRole = userProfile?.role === 'supporter';

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

  // (2026-10-31 흑백 에디토리얼) 사진 배너 위에 투명하게 얹히던 상단바를 없애고, 모든 화면에서
  // 흰 바탕 상단바를 씁니다(페이지 머리말 PageHero도 흰 바탕으로 바뀌었습니다).

  const brand = (
    <Link to="/" className="navbar-brand">
      <img src={wewelogo} alt="WEWE STAY" className="navbar-logo" />
      <span className="navbar-brand-text">WEWE<b>STAY</b></span>
    </Link>
  );

  return (
    <nav ref={navRef} className={`navbar ${user ? 'navbar-authed' : ''}`}>
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
              {hasFullAccess && isSupporterRole && (
                <li>
                  {/* 후원자는 숙소 검색/예약 등 실제 서비스 메뉴를 이용하지 않으므로
                      WEWE 전체 홈페이지로 돌아가는 링크만 보여줍니다. */}
                  <a href="/" target="_blank" rel="noopener" className="nav-btn">
                    <img src={weweIconWhite} alt="" className="nav-btn-icon nav-btn-logo" aria-hidden="true" />
                    <span className="nav-btn-label">위위 소개 보기</span>
                  </a>
                </li>
              )}

              {hasFullAccess && !isSupporterRole && (
                <>
                  <li>
                    <Link to="/dashboard" className="nav-btn">
                      <Home className="nav-btn-icon" size={18} />
                      <span className="nav-btn-label">마이페이지</span>
                    </Link>
                  </li>
                  <li>
                    {/* 위위 스테이는 이제 WEWE 전체 홈페이지 안의 하위 사이트입니다.
                        여기는 별도로 마운트된 앱(basename="/stay")이므로 React Router가 아닌
                        일반 링크(전체 페이지 이동)로 최상위 WEWE 홈으로 돌아갑니다. */}
                    <a href="/" target="_blank" rel="noopener" className="nav-btn">
                      {/* (2026-10-10) 다른 메뉴처럼 아이콘을 붙여 모바일 타일 크기를 맞춤 — 흰색 WEWE 로고 */}
                      <img src={weweIconWhite} alt="" className="nav-btn-icon nav-btn-logo" aria-hidden="true" />
                      <span className="nav-btn-label">위위</span>
                    </a>
                  </li>
                  {/* (2026-10-31) 위위스테이 소개(/about) — 서비스 안내·이용 흐름·약관 탭이 함께 있는 안내 페이지 */}
                  <li>
                    <Link to="/about" className="nav-btn">
                      <Info className="nav-btn-icon" size={18} />
                      <span className="nav-btn-label">소개</span>
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
                  {/* (2026-10-09) 내 예약은 숙소를 이용하는 선교사·관리자에게만 (App.jsx 라우트와 동일) */}
                  {(userProfile.role === 'admin' || userProfile.role === 'missionary') && (
                    <li>
                      <Link to="/my-bookings" className="nav-btn">
                        <Calendar className="nav-btn-icon" size={18} />
                        <span className="nav-btn-label">내 예약</span>
                      </Link>
                    </li>
                  )}
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

              {hasFullAccess && !isSupporterRole && (
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
              <li><Link to="/about" className="nav-btn">소개</Link></li>
              <li>
                {/* 최상위 WEWE 홈페이지로 돌아가는 링크 — 별도로 마운트된 앱이므로 일반 링크 사용 */}
                <a href="/" target="_blank" rel="noopener" className="nav-btn">위위</a>
              </li>
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