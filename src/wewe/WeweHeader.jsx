import React from 'react';
import { Link } from 'react-router-dom';
import weweIconWhite from '../assets/wewe-icon-white.png';

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
function WeweHeader() {
  const closeMobileNav = () => document.body.classList.remove('wewe-nav-open');

  return (
    <header className="wewe-header">
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
          className="wewe-nav-toggle"
          aria-label="메뉴 열기"
          onClick={() => document.body.classList.toggle('wewe-nav-open')}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className="wewe-nav">
          <Link to="/" className="wewe-nav-link" onClick={closeMobileNav}>홈</Link>
          <Link to="/about" className="wewe-nav-link" onClick={closeMobileNav}>소개</Link>
          <Link to="/news" className="wewe-nav-link" onClick={closeMobileNav}>사역 소식</Link>
          <a href="/stay" className="wewe-nav-link" onClick={closeMobileNav}>위위 스테이</a>
          <Link to="/donate" className="wewe-nav-link wewe-nav-donate" onClick={closeMobileNav}>후원하기</Link>
          <Link to="/login" className="wewe-nav-link" onClick={closeMobileNav}>로그인</Link>
          <Link to="/signup" className="wewe-nav-link wewe-nav-cta" onClick={closeMobileNav}>가입하기</Link>
        </nav>
      </div>

      <style>{`
        .wewe-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 1.5rem 0;
        }

        .wewe-header-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
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
          gap: 1.75rem;
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

        .wewe-nav-cta {
          padding: 0.55rem 1.15rem;
          border-radius: 6px;
          background: linear-gradient(90deg, #d97b3f 0%, #b8622c 100%);
          color: #fff !important;
        }

        .wewe-nav-cta:hover {
          color: #fff !important;
          box-shadow: 0 4px 12px rgba(217, 123, 63, 0.4);
        }

        .wewe-nav-donate {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          border: 1.5px solid rgba(255, 255, 255, 0.55);
        }

        .wewe-nav-donate:hover {
          border-color: #f0a875;
          color: #f0a875;
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
          .wewe-header {
            padding: 1.1rem 0;
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
