import React from 'react';
import { Info, Mail, LogOut } from 'lucide-react';
import LandingPage from './LandingPage';

// (Phase 6) 후원자(supporter) 전용 화면. App.jsx는 role==='supporter'인 로그인 사용자에게는
// /stay 안의 어떤 경로로 들어오든 항상 이 화면만 보여줍니다 — 숙소 검색·예약, 관리 기능 등
// 선교사/호스트/관리자 전용 기능에는 접근할 수 없고, 위위 스테이가 어떤 서비스인지 확인할 수
// 있는 소개 페이지만 열람할 수 있습니다(사용자가 명시적으로 선택한 범위, 결정 사항 #6).
//
// (2026-09-07 수정) 이전에는 "후원자가 되어주셔서 감사합니다" 카드 + WEWE 소개/사역
// 소식/후원 페이지로 가는 링크 목록만 보여줬는데, 후원자가 위위 스테이 자체(선교사·호스트를
// 위한 숙소 공유 플랫폼)를 착각하지 않도록 안내 문구를 더 명확히 하고, 실제 위위 스테이
// 소개 페이지(LandingPage, "/" 공개 페이지와 동일한 내용)를 그대로 보여주는 형태로
// 바꿨습니다. 계정 유형을 선교사/숙소 제공자로 바꾸고 싶으면 관리자에게 요청하도록 안내합니다.
function SupporterHome({ userProfile, onLogout }) {
  const greeting = userProfile?.full_name ? `${userProfile.full_name}님, ` : '';

  const notice = (
    <section className="supporter-notice">
      <div className="container supporter-notice-inner">
        <div className="supporter-notice-icon">
          <Info size={22} />
        </div>

        <div className="supporter-notice-body">
          <strong>{greeting}후원자 계정으로 로그인하셨습니다</strong>
          <p>
            위위 스테이는 선교사님을 위한 숙소 공유 플랫폼입니다. 지금 계정으로는 숙소 검색·예약·등록
            기능을 이용하실 수 없어요. 숙소 이용을 원하시는 경우 선교사로, 숙소를 제공하기를
            원하시는 경우 숙소 제공자로 계정 유형 변경을 관리자에게 요청해주세요. 아래에서 위위
            스테이가 어떤 곳인지 먼저 살펴보실 수 있습니다.
          </p>

          <div className="supporter-notice-actions">
            <a
              href="mailto:wewe@wewestay.com?subject=%5B%EC%9C%84%EC%9C%84%20%EC%8A%A4%ED%85%8C%EC%9D%B4%5D%20%EA%B3%84%EC%A0%95%20%EC%9C%A0%ED%98%95%20%EB%B3%80%EA%B2%BD%20%EC%9A%94%EC%B2%AD"
              className="link-cta link-cta-dark"
            >
              <Mail size={16} />
              관리자에게 계정 유형 변경 요청하기
            </a>
            <button type="button" className="supporter-notice-logout" onClick={onLogout}>
              <LogOut size={15} />
              로그아웃
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .supporter-notice {
          background: var(--lp-bg-soft, #faf9f6);
          border-top: 1px solid var(--line, #e5e2da);
          border-bottom: 1px solid var(--line, #e5e2da);
          padding: 2.5rem 0;
        }

        .supporter-notice-inner {
          max-width: 760px;
          display: flex;
          gap: 1.1rem;
        }

        .supporter-notice-icon {
          flex-shrink: 0;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgba(156, 128, 88, 0.15);
          color: var(--accent, #9c8058);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .supporter-notice-body strong {
          display: block;
          color: var(--ink, #1c1c1a);
          font-size: 1.08rem;
          margin-bottom: 0.6rem;
        }

        .supporter-notice-body p {
          color: var(--ink-soft, #4a4a46);
          line-height: 1.8;
          font-size: 0.98rem;
          margin: 0 0 1.25rem;
        }

        .supporter-notice-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .supporter-notice-logout {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: none;
          border: none;
          padding: 0;
          font-family: inherit;
          font-size: 0.92rem;
          font-weight: 700;
          color: var(--stone, #8c8880);
          cursor: pointer;
        }

        .supporter-notice-logout:hover {
          color: var(--ink, #1c1c1a);
        }

        @media (max-width: 768px) {
          .supporter-notice {
            padding: 1.75rem 0;
          }

          .supporter-notice-inner {
            flex-direction: column;
          }
        }
      `}</style>
    </section>
  );

  return <LandingPage noticeBanner={notice} />;
}

export default SupporterHome;
