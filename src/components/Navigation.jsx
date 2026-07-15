import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';

const ROLE_LABELS = {
  admin: '관리자',
  missionary: '선교사',
  host: '숙소 제공자'
};

function Navigation({ user, userProfile, onLogout }) {
  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          🏠 WEWE STAY
        </Link>

        <ul className="navbar-nav">
          {!user ? (
            <>
              <li><Link to="/">홈</Link></li>
              <li><Link to="/login">로그인</Link></li>
              <li><Link to="/signup" className="btn btn-primary">가입하기</Link></li>
            </>
          ) : (
            <>
              {userProfile?.full_name && (
                <li className="navbar-welcome">
                  반갑습니다, {userProfile.full_name}님
                </li>
              )}

              {userProfile?.status === 'approved' && (
                <>
                  <li><Link to="/dashboard">대시보드</Link></li>
                  <li><Link to="/accommodations">숙소 검색</Link></li>
                  {userProfile.role === 'host' && (
                    <li><Link to="/my-accommodations">내 숙소</Link></li>
                  )}
                  {userProfile.role === 'admin' && (
                    <li><Link to="/admin">관리</Link></li>
                  )}
                  <li><Link to="/profile">프로필</Link></li>
                  <li>
                    <span className={`status-badge status-role-${userProfile.role}`}>
                      {ROLE_LABELS[userProfile.role] || userProfile.role}
                    </span>
                  </li>
                </>
              )}

              {userProfile?.status === 'pending' && (
                <li>
                  <span className="status-badge status-pending">
                    ⏳ 승인 대기 중
                  </span>
                </li>
              )}

              <li>
                <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
