import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { supabase } from '../App';
import weweIconWhite from '../assets/wewe-icon-white.png';

// 위위 스테이 상단바(Navigation.jsx)의 "등급 + 반갑습니다, ○○님" 표시와 동일하게, 여기서도
// 로그인한 회원의 역할(회원 등급)을 사람이 읽는 이름으로 보여줍니다(2026-09-10 추가).
const ROLE_LABELS = {
  admin: '관리자',
  missionary: '선교사',
  host: '숙소 제공자',
  supporter: '후원자',
};

// WEWE 전체 홈페이지(최상위 '/', '/about', '/about/ministries', '/about/leadership')용
// 공용 헤더. 기존 /stay 앱의 Navigation.jsx(흰 배경 + "WEWESTAY" 워드마크)와는 완전히
// 분리된 별도 컴포넌트입니다 — 어두운 배경 위에 투명하게 얹히고, 흰색 로고 아이콘 +
// "위로자의 위로자" 태그라인을 사용합니다.
//
// "홈"/"소개"/"사역 소식"/"후원하기"/"로그인"/"가입하기"는 이 헤더가 마운트되는 WeweSite
// 라우터(BrowserRouter) 안의 실제 페이지라서 react-router-dom의 Link로 이동합니다
// (소개: Phase 3, 사역 소식: Phase 4, 후원하기: Phase 5, 로그인/가입하기: Phase 6).
// "위위 스테이"만 별도로 마운트된 다른 앱(/stay, basename="/stay")이라 일반 링크(전체
// 페이지 이동)로 연결합니다.
//
// (2026-09-07 수정) /stay 앱(App.jsx)이 쓰는 것과 동일한 supabase 클라이언트를 그대로
// 가져와서(같은 브라우저 localStorage에 저장된 세션을 공유) 로그인 여부를 확인합니다.
// 위위 홈페이지에서 로그인하면 더 이상 /stay로 강제 이동하지 않고 이 헤더의 상태만
// "로그인/가입하기" → "로그아웃"으로 바뀝니다 — 로그인한 채로 위위 홈페이지를 계속 볼 수
// 있고, "위위 스테이"는 사용자가 원할 때 직접 눌러서 이동합니다.
function WeweHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const navRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async (userId) => {
      const { data } = await supabase.from('users').select('role, status, full_name').eq('id', userId).maybeSingle();
      if (mounted) setUserProfile(data || null);
    };

    supabase.auth.getSession().then(({ data }) => {
      const user = data?.session?.user;
      if (mounted) setIsLoggedIn(!!user);
      if (user) loadProfile(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setIsLoggedIn(!!session?.user);
      if (session?.user) {
        loadProfile(session.user.id);
      } else if (mounted) {
        setUserProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const isAdmin = isLoggedIn && userProfile?.role === 'admin' && userProfile?.status === 'approved';

  const closeMobileNav = () => document.body.classList.remove('wewe-nav-open');

  // (2026-09-09 추가) 모바일 햄버거 메뉴가 열려 있을 때, 메뉴 바깥(또는 토글 버튼이 아닌
  // 곳)을 탭/클릭하면 자동으로 닫히도록 합니다.
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!document.body.classList.contains('wewe-nav-open')) return;
      const nav = navRef.current;
      const toggle = toggleRef.current;
      if (nav && nav.contains(e.target)) return;
      if (toggle && toggle.contains(e.target)) return;
      closeMobileNav();
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  const handleLogout = async (e) => {
    e.preventDefault();
    closeMobileNav();
    await supabase.auth.signOut();
  };

  return (
    <header className="wewe-header">
      {isLoggedIn && userProfile && (userProfile.full_name || userProfile.role) && (
        <div className="wewe-header-top-inner">
          {userProfile.role && (
            <span className={`wewe-status-badge wewe-status-role-${userProfile.role}`}>
              {ROLE_LABELS[userProfile.role] || userProfile.role}
            </span>
          )}
          {userProfile.full_name && (
            <span className="wewe-header-welcome">안녕하세요, {userProfile.full_name}님</span>
          )}
        </div>
      )}
      <div className="wewe-header-inner">
        <Link to="/" className="wewe-brand" onClick={closeMobileNav}>
          <img src={weweIconWhite} alt="WEWE" className="wewe-brand-icon" />
          <span className="wewe-brand-text">
            <span className="wewe-brand-name">WEWE</span>
            <span className="wewe-brand-tagline">위로자의 위로자</span>
          </span>
        </Link>

        <button
          type="button"
          ref={toggleRef}
          className="wewe-nav-toggle"
          aria-label="메뉴 열기"
          onClick={() => document.body.classList.toggle('wewe-nav-open')}
        >
          <span />
          <span />
          <span />
        </button>

        {/* (2026-10-07) 메뉴 순서·스타일 개편.
            - 로그인 전: 홈 · 소개 · 사역 소식 · 위위 스테이 · 로그인 · 가입하기 · 후원하기
            - 로그인 후: 마이페이지 · 홈 · 소개 · 사역 소식 · (관리) · 프로필 · 후원하기 · 위위 스테이 · 로그아웃
            - "관리"는 관리자(role=admin, 승인 완료)에게만 보이며, 위위 쪽 관리자 페이지(/admin)로
              이동합니다. 내용은 위위스테이 관리자 페이지(/stay/admin)와 같은 화면·데이터를 공유합니다.
            - 후원하기/가입하기에 있던 테두리·그라디언트 버튼 효과를 없애고 모든 메뉴를 같은
              텍스트 링크 스타일로 통일했습니다(로그아웃 포함). */}
        <nav className="wewe-nav" ref={navRef}>
          {isLoggedIn ? (
            <>
              <Link to="/mypage" className="wewe-nav-link" onClick={closeMobileNav}>마이페이지</Link>
              <Link to="/" className="wewe-nav-link" onClick={closeMobileNav}>홈</Link>
              <Link to="/about" className="wewe-nav-link" onClick={closeMobileNav}>소개</Link>
              <Link to="/news" className="wewe-nav-link" onClick={closeMobileNav}>사역 소식</Link>
              {isAdmin && (
                <Link to="/admin" className="wewe-nav-link" onClick={closeMobileNav}>관리</Link>
              )}
              <Link to="/profile" className="wewe-nav-link" onClick={closeMobileNav}>프로필</Link>
              <Link to="/donate" className="wewe-nav-link" onClick={closeMobileNav}>후원하기</Link>
              <a href="/stay" className="wewe-nav-link" onClick={closeMobileNav}>위위 스테이</a>
              <button type="button" className="wewe-nav-link wewe-nav-logout-btn" onClick={handleLogout}>
                <LogOut size={15} />
                <span>로그아웃</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/" className="wewe-nav-link" onClick={closeMobileNav}>홈</Link>
              <Link to="/about" className="wewe-nav-link" onClick={closeMobileNav}>소개</Link>
              <Link to="/news" className="wewe-nav-link" onClick={closeMobileNav}>사역 소식</Link>
              <a href="/stay" className="wewe-nav-link" onClick={closeMobileNav}>위위 스테이</a>
              <Link to="/login" className="wewe-nav-link" onClick={closeMobileNav}>로그인</Link>
              <Link to="/signup" className="wewe-nav-link" onClick={closeMobileNav}>가입하기</Link>
              <Link to="/donate" className="wewe-nav-link" onClick={closeMobileNav}>후원하기</Link>
            </>
          )}
        </nav>
      </div>

      <style>{`
        .wewe-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
        }

        /* (2026-09-13 수정) 위위스테이 상단바(Navigation.jsx)와 동일하게 — 별도의
           불투명 배경 박스 없이, 배너 사진 위에 투명하게 얹힌 채로 로고 반대편(오른쪽)에
           정렬합니다. 헤더 자체(.wewe-header)에는 세로 여백을 주지 않고, 이 줄이 배너
           맨 위에 간격 없이 바로 붙도록 하고, 아래 메인 메뉴 줄(.wewe-header-inner)에서
           여백을 관리합니다. */
        .wewe-header-top-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0.85rem 1.5rem 0;
          display: flex;
          align-items: baseline;
          justify-content: flex-end;
          gap: 0.6rem;
        }

        .wewe-status-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          background: rgba(217, 123, 63, 0.22);
          color: #f0a875;
          border: 1px solid rgba(240, 168, 117, 0.4);
        }

        .wewe-status-role-admin {
          background: rgba(95, 163, 157, 0.22);
          color: #8fd3cb;
          border-color: rgba(143, 211, 203, 0.4);
        }

        .wewe-header-welcome {
          color: rgba(255, 255, 255, 0.88);
          font-size: 0.82rem;
          font-weight: 600;
        }

        .wewe-header-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem 1.5rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
        }

        .wewe-brand {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          text-decoration: none;
          flex-shrink: 0;
        }

        .wewe-brand-icon {
          height: 40px;
          width: auto;
          display: block;
        }

        .wewe-brand-text {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
        }

        .wewe-brand-name {
          color: #fff;
          font-weight: 800;
          font-size: 1.15rem;
          letter-spacing: 0.01em;
        }

        .wewe-brand-tagline {
          color: rgba(255, 255, 255, 0.78);
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.04em;
        }

        .wewe-nav {
          display: flex;
          align-items: center;
          gap: 1.4rem;
        }

        .wewe-nav .wewe-nav-link {
          white-space: nowrap;
        }

        /* 로그인 후에는 메뉴가 최대 9개라 중간 폭 화면에서 간격·글자 크기를 조금 줄입니다. */
        @media (max-width: 1120px) and (min-width: 861px) {
          .wewe-nav {
            gap: 1rem;
          }

          .wewe-nav .wewe-nav-link {
            font-size: 0.88rem;
          }
        }

        .wewe-nav-link {
          color: rgba(255, 255, 255, 0.92);
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 600;
          transition: color 0.2s ease;
        }

        .wewe-nav-link:hover {
          color: #f0a875;
        }

        /* 로그아웃도 다른 메뉴와 같은 텍스트 링크 스타일(버튼 기본 스타일만 제거). */
        .wewe-nav-logout-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0;
          border: none;
          background: none;
          font-family: inherit;
          cursor: pointer;
        }

        .wewe-nav-toggle {
          display: none;
          flex-direction: column;
          justify-content: center;
          gap: 5px;
          width: 38px;
          height: 38px;
          background: rgba(255, 255, 255, 0.12);
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .wewe-nav-toggle span {
          display: block;
          width: 18px;
          height: 2px;
          margin: 0 auto;
          background: #fff;
          border-radius: 2px;
        }

        @media (max-width: 860px) {
          .wewe-header-top-inner {
            padding: 0.65rem 1.25rem 0;
          }

          .wewe-header-inner {
            padding: 0.85rem 1.25rem 1.1rem;
          }

          .wewe-brand-icon {
            height: 34px;
          }

          .wewe-brand-name {
            font-size: 1.02rem;
          }

          .wewe-brand-tagline {
            font-size: 0.66rem;
          }

          .wewe-nav-toggle {
            display: flex;
          }

          .wewe-nav {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            width: min(78vw, 320px);
            flex-direction: column;
            align-items: flex-start;
            justify-content: flex-start;
            gap: 1.5rem;
            padding: 5.5rem 2rem 2rem;
            background: #171712;
            transform: translateX(100%);
            transition: transform 0.3s ease;
          }

          body.wewe-nav-open .wewe-nav {
            transform: translateX(0);
          }

          .wewe-nav-link {
            font-size: 1.05rem;
          }
        }
      `}</style>
    </header>
  );
}

export default WeweHeader;
