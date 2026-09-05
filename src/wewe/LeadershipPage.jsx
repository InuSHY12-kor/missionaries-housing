import React from 'react';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import WevePageHero from './WevePageHero';
import AboutSubNav from './AboutSubNav';
import weweLogoFull from '../assets/wewe-logo-full.png';
import './wewe-shared.css';

// "소개" > "대표·이사회" 페이지 (/about/leadership).
// 대표 홍현지님 소개(claude/wewe-brand-content-2026-09-05.md #7)와,
// 아직 구성되지 않은 이사회에 대한 안내(#8, "향후 추가 예정")를 담습니다.
function LeadershipPage() {
  return (
    <div className="wewe-page wewe-leadership-page">
      <WeweHeader />

      <WevePageHero
        eyebrow="LEADERSHIP"
        title="대표 및 이사회"
        subtitle="WEWE를 이끌어가는 사람들을 소개합니다."
      >
        <AboutSubNav active="/about/leadership" />
      </WevePageHero>

      <section className="wl-leader">
        <div className="wh-container wh-container-narrow">
          <span className="wh-eyebrow wh-eyebrow-center">REPRESENTATIVE</span>
          <h2 className="wh-h2-center">대표 홍현지</h2>

          <div className="wl-leader-card">
            <img src={weweLogoFull} alt="WEWE" className="wl-leader-logo" />
            <div className="wl-leader-body">
              <p className="wl-leader-degree">간호학(전공) 학사 · 호스피스 전문 간호사(석사)</p>
              <ul className="wl-leader-history">
                <li>현 세브란스 완화의료팀 프로젝트매니저</li>
                <li>전 세브란스 완화의료팀 소아전문간호사</li>
                <li>전 국립암센터 소아암 병동 전문간호사</li>
              </ul>
              <p className="wl-leader-note">약력은 계속 추가될 예정입니다.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="wl-board">
        <div className="wh-container wh-container-narrow">
          <span className="wh-eyebrow wh-eyebrow-center">BOARD OF DIRECTORS</span>
          <h2 className="wh-h2-center">이사회</h2>

          <div className="wl-board-card">
            <p>WEWE는 임의법인에서 사단법인으로 전환하는 과정에서 이사회를 구성하고 있습니다.</p>
            <span className="wl-board-soon">구성 중</span>
          </div>
        </div>
      </section>

      <WeweFooter />

      <style>{`
        .wl-leader {
          padding: 5rem 0 1rem;
          background: var(--wh-bg);
        }

        .wl-leader-card {
          display: grid;
          grid-template-columns: 140px 1fr;
          gap: 2rem;
          align-items: center;
          padding: 2rem;
          background: var(--wh-bg-soft);
          border: 1px solid var(--wh-line);
          border-radius: 12px;
        }

        .wl-leader-logo {
          width: 100%;
          height: auto;
        }

        .wl-leader-degree {
          color: var(--wh-ink);
          font-weight: 700;
          margin-bottom: 0.9rem;
        }

        .wl-leader-history {
          list-style: none;
          margin: 0 0 0.9rem;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .wl-leader-history li {
          color: var(--wh-ink-soft);
          font-size: 0.95rem;
          line-height: 1.6;
          padding-left: 1rem;
          position: relative;
        }

        .wl-leader-history li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.6rem;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--wh-orange);
        }

        .wl-leader-note {
          margin: 0;
          font-size: 0.85rem;
          color: var(--wh-stone);
        }

        .wl-board {
          padding: 4rem 0 5.5rem;
          background: var(--wh-bg);
        }

        .wl-board-card {
          text-align: center;
          padding: 2.5rem;
          background: var(--wh-bg-soft);
          border: 1px dashed var(--wh-line);
          border-radius: 10px;
        }

        .wl-board-card p {
          color: var(--wh-ink-soft);
          margin-bottom: 0.9rem;
          font-size: 1rem;
        }

        .wl-board-soon {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--wh-stone);
          border: 1px solid var(--wh-line);
          border-radius: 999px;
          padding: 0.3rem 0.9rem;
        }

        @media (max-width: 860px) {
          .wl-leader-card {
            grid-template-columns: 72px 1fr;
            padding: 1.5rem;
            gap: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}

export default LeadershipPage;
