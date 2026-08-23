import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Home, ArrowRight } from 'lucide-react';
import PageHero from '../components/PageHero';

const ROLE_SELECT_HERO_IMAGES = [
  'https://images.pexels.com/photos/9608654/pexels-photo-9608654.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/34787908/pexels-photo-34787908.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/1578750/pexels-photo-1578750.jpeg?auto=compress&cs=tinysrgb&w=1600',
];

function SignupRoleSelect() {
  return (
    <>
      <PageHero
        images={ROLE_SELECT_HERO_IMAGES}
        eyebrow="GET STARTED"
        title="가입 유형을 선택해주세요"
        subtitle="회원 유형에 따라 입력하시는 정보가 달라집니다"
      />
      <div className="role-select-container">
      <div className="container">
        <div className="role-select-box">
          <h1>가입 유형을 선택해주세요</h1>
          <p className="subtitle">회원 유형에 따라 입력하시는 정보와 이용약관이 다릅니다.</p>

          <div className="role-cards">
            <Link to="/signup/missionary" className="role-card">
              <div className="role-card-icon">
                <Users size={36} />
              </div>
              <h2>선교사</h2>
              <p>숙소가 필요해요</p>
              <p className="role-card-desc">
                안식년, 휴가, 사역 방문 등으로 임시 숙소가 필요한 선교사님은 이쪽으로 가입해주세요.
              </p>
              <span className="role-card-cta">
                선교사로 가입하기 <ArrowRight size={16} />
              </span>
            </Link>

            <Link to="/signup/host" className="role-card">
              <div className="role-card-icon">
                <Home size={36} />
              </div>
              <h2>숙소 제공자</h2>
              <p>숙소를 나누고 싶어요</p>
              <p className="role-card-desc">
                선교사님을 위해 숙소를 제공하고 싶으신 분은 이쪽으로 가입해주세요.
              </p>
              <span className="role-card-cta">
                숙소 제공자로 가입하기 <ArrowRight size={16} />
              </span>
            </Link>
          </div>

          <div className="login-link">
            이미 계정이 있으신가요? <Link to="/login">로그인</Link>
          </div>
        </div>
      </div>

      <style>{`
        .role-select-container {
          flex: 1;
          display: flex;
          align-items: center;
          padding: 2rem 0;
        }

        .role-select-box {
          background: white;
          padding: 3rem;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          max-width: 780px;
          width: 100%;
          margin: 0 auto;
        }

        .role-select-box h1 {
          text-align: center;
          margin-bottom: 0.5rem;
        }

        .subtitle {
          text-align: center;
          color: #7f8c8d;
          margin-bottom: 2.5rem;
        }

        .role-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .role-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.5rem;
          padding: 2rem 1.5rem;
          border: 2px solid #ecf0f1;
          border-radius: 10px;
          text-decoration: none;
          color: inherit;
          transition: all 0.25s;
        }

        .role-card:hover {
          border-color: #d97b3f;
          background: #fdf8f1;
          transform: translateY(-4px);
          box-shadow: 0 6px 16px rgba(217, 123, 63, 0.15);
        }

        .role-card-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #d97b3f 0%, #b8622c 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.5rem;
        }

        .role-card h2 {
          color: #2c3e50;
          margin: 0;
        }

        .role-card > p:not(.role-card-desc) {
          color: #d97b3f;
          font-weight: 600;
          margin: 0;
        }

        .role-card-desc {
          color: #7f8c8d;
          font-size: 0.9rem;
          line-height: 1.6;
          margin: 0.5rem 0 1rem;
        }

        .role-card-cta {
          margin-top: auto;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: #d97b3f;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .login-link {
          text-align: center;
          margin-top: 2rem;
          color: #7f8c8d;
        }

        .login-link a {
          color: #d97b3f;
          text-decoration: none;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .role-select-box {
            padding: 1.5rem;
          }

          .role-cards {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .role-select-container {
            padding: 1rem 0;
          }

          .role-select-box {
            padding: 1.25rem;
          }

          .role-select-box .subtitle {
            font-size: 0.9rem;
            margin-bottom: 1.5rem;
          }

          .role-cards {
            gap: 1rem;
          }

          .role-card {
            padding: 1.5rem 1.25rem;
          }

          .role-card-icon {
            width: 56px;
            height: 56px;
          }

          .role-card h2 {
            font-size: 1.2rem;
          }

          .role-card-desc {
            font-size: 0.85rem;
          }

          .role-card-cta {
            font-size: 0.85rem;
          }

          .login-link {
            font-size: 0.85rem;
          }
        }
      `}</style>
      </div>
    </>
  );
}

export default SignupRoleSelect;
