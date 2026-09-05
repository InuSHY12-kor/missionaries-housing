import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Home, Heart, ArrowRight } from 'lucide-react';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import WevePageHero from './WevePageHero';
import './wewe-shared.css';

// WEWE 전체 가입 유형 선택 페이지 (/signup, Phase 6).
// 선교사·숙소 제공자 가입은 기존에 이미 잘 동작하는 /stay 쪽 가입 흐름(서류 제출 +
// 관리자 승인)을 그대로 재사용합니다 — 같은 로직을 이 페이지에 다시 만들 필요가
// 없고, 검증된 흐름을 그대로 쓰는 편이 더 안전합니다. 후원자만 이 WEWE 전체
// 홈페이지 안의 새 경로(/signup/supporter)로 연결되는데, 후원자는 서류 심사 없이
// 즉시 가입되는 완전히 다른 흐름이기 때문입니다.
function SignupPage() {
  return (
    <div className="wewe-page wewe-signup-page">
      <WeweHeader />

      <WevePageHero
        eyebrow="GET STARTED"
        title="가입 유형을 선택해주세요"
        subtitle="회원 유형에 따라 입력하시는 정보와 이용 방법이 달라집니다."
      />

      <section className="wsg-section">
        <div className="wh-container wh-container-narrow">
          <div className="wsg-cards">
            <a href="/stay/signup/missionary" className="wsg-card">
              <div className="wsg-card-icon">
                <Users size={32} />
              </div>
              <h2>선교사</h2>
              <p className="wsg-card-tag">숙소가 필요해요</p>
              <p className="wsg-card-desc">
                안식년, 휴가, 사역 방문 등으로 임시 숙소가 필요한 선교사님은 이쪽으로 가입해주세요.
                서류 제출과 관리자 승인 절차가 있습니다.
              </p>
              <span className="wsg-card-cta">
                선교사로 가입하기 <ArrowRight size={16} />
              </span>
            </a>

            <a href="/stay/signup/host" className="wsg-card">
              <div className="wsg-card-icon">
                <Home size={32} />
              </div>
              <h2>숙소 제공자</h2>
              <p className="wsg-card-tag">숙소를 나누고 싶어요</p>
              <p className="wsg-card-desc">
                선교사님을 위해 숙소를 제공하고 싶으신 분은 이쪽으로 가입해주세요. 서류 제출과
                관리자 승인 절차가 있습니다.
              </p>
              <span className="wsg-card-cta">
                숙소 제공자로 가입하기 <ArrowRight size={16} />
              </span>
            </a>

            <Link to="/signup/supporter" className="wsg-card wsg-card-supporter">
              <div className="wsg-card-icon">
                <Heart size={32} />
              </div>
              <h2>후원자</h2>
              <p className="wsg-card-tag">위위의 사역을 응원해요</p>
              <p className="wsg-card-desc">
                숙소 예약·제공 없이 WEWE의 소식을 받아보고 후원으로 함께하고 싶으신 분은 이쪽으로
                가입해주세요. 서류 심사 없이 바로 가입이 완료됩니다.
              </p>
              <span className="wsg-card-cta">
                후원자로 가입하기 <ArrowRight size={16} />
              </span>
            </Link>
          </div>

          <div className="wsg-login-link">
            이미 계정이 있으신가요? <Link to="/login">로그인</Link>
          </div>
        </div>
      </section>

      <WeweFooter />

      <style>{`
        .wsg-section {
          flex: 1;
          padding: 4rem 0 5rem;
          background: var(--wh-bg-soft);
        }

        .wsg-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }

        .wsg-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.5rem;
          padding: 2rem 1.5rem;
          background: var(--wh-bg);
          border: 2px solid var(--wh-line);
          border-radius: 12px;
          text-decoration: none;
          color: inherit;
          transition: all 0.25s ease;
        }

        .wsg-card:hover {
          border-color: var(--wh-orange);
          background: #fdf8f1;
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(217, 123, 63, 0.15);
        }

        .wsg-card-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--wh-orange) 0%, var(--wh-orange-deep) 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.35rem;
        }

        .wsg-card-supporter .wsg-card-icon {
          background: linear-gradient(135deg, var(--wh-teal) 0%, #0d4a4f 100%);
        }

        .wsg-card h2 {
          color: var(--wh-ink);
          margin: 0;
          font-size: 1.1rem;
        }

        .wsg-card-tag {
          color: var(--wh-orange-deep);
          font-weight: 700;
          font-size: 0.88rem;
          margin: 0;
        }

        .wsg-card-supporter .wsg-card-tag {
          color: var(--wh-teal);
        }

        .wsg-card-desc {
          color: var(--wh-ink-soft);
          font-size: 0.88rem;
          line-height: 1.65;
          margin: 0.4rem 0 0.8rem;
        }

        .wsg-card-cta {
          margin-top: auto;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: var(--wh-orange-deep);
          font-weight: 700;
          font-size: 0.88rem;
        }

        .wsg-card-supporter .wsg-card-cta {
          color: var(--wh-teal);
        }

        .wsg-login-link {
          text-align: center;
          margin-top: 2.25rem;
          color: var(--wh-stone);
          font-size: 0.92rem;
        }

        .wsg-login-link a {
          color: var(--wh-orange-deep);
          text-decoration: none;
          font-weight: 700;
        }

        @media (max-width: 860px) {
          .wsg-cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default SignupPage;
