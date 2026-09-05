import React from 'react';
import weweIconWhite from '../assets/wewe-icon-white.png';

// WEWE 전체 홈페이지(최상위 '/')용 공용 헤더.
// 기존 /stay 앱의 Navigation.jsx(흰 배경 + "WEWESTAY" 워드마크)와는 완전히 분리된
// 별도 컴포넌트입니다 — 어두운 히어로 배너 위에 투명하게 얹히고, 흰색 로고 아이콘 +
// "위로자의 위로자" 태그라인을 사용합니다.
//
// 아직 만들어지지 않은 하위 페이지(소개/사역 소식 상세 페이지, WEWE 전체용 로그인·가입)는
// 이번 단계(Phase 2)에서는 다음으로 연결합니다:
//  - 소개 / 사역 소식: 같은 홈페이지 안의 섹션으로 스크롤(앵커) — Phase 3/4에서 실제 하위 페이지로 교체 예정
//  - 로그인 / 가입하기: 지금 실제로 동작하는 /stay 쪽 로그인·가입 페이지로 연결 — Phase 6에서 WEWE 전체용으로 교체 예정
//  - 위위 스테이: /stay (별도로 마운트된 앱이라 일반 링크로 이동)
function WeweHeader() {
  return (
    <header className="wewe-header">
      <div className="wewe-header-inner">
        <a href="/" className="wewe-brand">
          <img src={weweIconWhite} alt="WEWE" className="wewe-brand-icon" />
          <span className="wewe-brand-text">
            <span className="wewe-brand-name">WEWE</span>
            <span className="wewe-brand-tagline">위로자의 위로자</span>
          </span>
        </a>

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
          <a href="#top" className="wewe-nav-link">홈</a>
          <a href="#about" className="wewe-nav-link">소개</a>
          <a href="#news" className="wewe-nav-link">사역 소식</a>
          <a href="/stay" className="wewe-nav-link">위위 스테이</a>
          <a href="/stay/login" className="wewe-nav-link">로그인</a>
          <a href="/stay/signup" className="wewe-nav-link wewe-nav-cta">가입하기</a>
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
