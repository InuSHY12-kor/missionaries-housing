import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
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

  return (
    <nav className={`navbar ${user ? 'navbar-authed' : ''}`}>
      <div className="container">
        <Link to="/" className="navbar-brand">
          <img src={wewelogo} alt="WEWE STAY" className="navbar-logo" />
          <span className="navbar-brand-text">WEWE<b>STAY</b></span>
        </Link>

        <ul className="navbar-nav">
          {!user ? (
            <>
              <li><Link to="/" className="nav-btn">홈</Link></li>
              <li><Link to="/login" className="nav-btn nav-btn-outline">로그인</Link></li>
              <li><Link to="/signup" className="btn btn-primary">가입하기</Link></li>
            </>
          ) : (
            <>
              {userProfile?.full_name && (
                <li className="navbar-welcome">
                  반갑습니다, {userProfile.full_name}님
                </li>
              )}

              {hasFullAccess && (
                <>
                  <li><Link to="/dashboard" className="nav-btn">대시보드</Link></li>
                  {(userProfile.role === 'admin' || userProfile.role === 'missionary') && (
                    <li><Link to="/accommodations" className="nav-btn">숙소 검색</Link></li>
                  )}
                  <li><Link to="/my-bookings" className="nav-btn">내 예약</Link></li>
                  {(userProfile.role === 'admin' || userProfile.role === 'host') && (
                    <>
                      <li><Link to="/my-accommodations" className="nav-btn">내 숙소</Link></li>
                      <li><Link to="/host-bookings" className="nav-btn">예약 관리</Link></li>
                      <li><Link to="/reviews" className="nav-btn">리뷰</Link></li>
                    </>
                  )}
                  {userProfile.role === 'admin' && (
                    <li><Link to="/admin" className="nav-btn">관리</Link></li>
                  )}
                  <li><Link to="/profile" className="nav-btn">프로필</Link></li>
                </>
              )}

              {(userProfile?.status === 'approved' || userProfile?.status === 'pending') && userProfile.role && (
                <li>
                  <span className={`status-badge status-role-${userProfile.role}`}>
                    {userProfile.role === 'admin' && userProfile.is_super_admin
                      ? '최고 관리자'
                      : (ROLE_LABELS[userProfile.role] || userProfile.role)}
                  </span>
                </li>
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
                  로그아웃
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navigation;
