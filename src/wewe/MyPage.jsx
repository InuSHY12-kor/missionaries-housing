import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import WevePageHero from './WevePageHero';
import Reveal from './Reveal';
import HERO_IMAGE_SETS from './heroImages';
import './wewe-shared.css';

// WEWE 마이페이지 (/mypage, 2026-09-09 추가).
// 로그인한 회원이 헤더에서 접근할 수 있는 자리를 먼저 만들어두고, 실제 기능(활동 요약,
// 후원 내역, 알림 등)은 추후 업데이트로 채울 예정임을 안내하는 "준비 중" placeholder입니다.
function MyPage() {
  return (
    <div className="wewe-page wewe-mypage-page">
      <WeweHeader />

      <WevePageHero
        eyebrow="MY PAGE"
        title="마이페이지"
        subtitle="회원님만을 위한 공간을 준비하고 있습니다."
        images={HERO_IMAGE_SETS.login}
      />

      <section className="wm-soon-section">
        <div className="wh-container wh-container-narrow">
          <Reveal as="div" className="wm-soon-card">
            <div className="wm-soon-icon">
              <Sparkles size={32} />
            </div>
            <h2>더 나은 마이페이지로 곧 찾아뵙겠습니다</h2>
            <p>
              활동 요약, 후원 내역, 받은 소식 등을 한 곳에서 확인할 수 있는 마이페이지 기능을
              준비하고 있습니다. 업데이트되는 대로 이 자리에서 만나보실 수 있어요.
            </p>
            <Link to="/profile" className="wh-btn wh-btn-primary">
              프로필 관리하러 가기
            </Link>
            <Link to="/" className="wm-soon-back">
              <ArrowLeft size={14} /> 홈으로 돌아가기
            </Link>
          </Reveal>
        </div>
      </section>

      <WeweFooter />

      <style>{`
        .wm-soon-section {
          flex: 1;
          padding: 5rem 0 6rem;
          background: var(--wh-bg-soft);
        }

        .wm-soon-card {
          max-width: 520px;
          margin: 0 auto;
          text-align: center;
          padding: 3rem 2.25rem;
          background: var(--wh-bg);
          border: 1px solid var(--wh-line);
          border-radius: 16px;
        }

        .wm-soon-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 1.25rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--wh-orange) 0%, var(--wh-orange-deep) 100%);
          color: #fff;
        }

        .wm-soon-card h2 {
          color: var(--wh-ink);
          font-size: 1.3rem;
          margin-bottom: 0.85rem;
        }

        .wm-soon-card p {
          color: var(--wh-ink-soft);
          line-height: 1.8;
          margin-bottom: 1.75rem;
        }

        .wm-soon-back {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          margin-top: 1.25rem;
          color: var(--wh-stone);
          text-decoration: none;
          font-size: 0.88rem;
          font-weight: 600;
        }

        .wm-soon-back:hover {
          color: var(--wh-orange-deep);
        }

        @media (max-width: 860px) {
          .wm-soon-card {
            padding: 2.25rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}

export default MyPage;
