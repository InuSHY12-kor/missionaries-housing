import React from 'react';
import { Heart, LogOut, ArrowRight, Newspaper, Gift, Info } from 'lucide-react';
import PageHero from '../components/PageHero';

const SUPPORTER_HOME_HERO_IMAGES = [
  'https://images.pexels.com/photos/2822647/pexels-photo-2822647.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/928199/pexels-photo-928199.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/6699296/pexels-photo-6699296.jpeg?auto=compress&cs=tinysrgb&w=1600',
];

// (Phase 6) 후원자(supporter) 전용 화면. App.jsx는 role==='supporter'인 로그인 사용자에게는
// /stay 안의 어떤 경로로 들어오든("*") 항상 이 화면만 보여줍니다 — 사용자가 명시적으로
// 선택한 범위("소개 페이지만 안내")를 따른 것으로, 숙소 검색·예약 등 선교사/호스트 전용
// 기능에는 접근할 수 없습니다. WEWE 전체 소개 콘텐츠(홈/소개/사역 소식/후원)로 안내합니다.
function SupporterHome({ userProfile, onLogout }) {
  return (
    <>
      <PageHero
        images={SUPPORTER_HOME_HERO_IMAGES}
        eyebrow="THANK YOU"
        title={userProfile?.full_name ? `${userProfile.full_name}님, 후원자가 되어주셔서 감사합니다` : '후원자가 되어주셔서 감사합니다'}
        subtitle="후원자 계정은 WEWE의 소식과 소개 콘텐츠를 확인하는 용도로 안내됩니다"
      />
      <div className="supporter-home-container">
        <div className="container">
          <div className="supporter-home-card">
            <div className="supporter-home-icon">
              <Heart size={44} />
            </div>
            <h1>후원자 계정으로 로그인하셨습니다</h1>
            <p>
              후원자 계정은 WEWE STAY의 숙소 예약·제공 기능을 사용하지 않습니다. 대신 아래 WEWE 소개
              페이지에서 위위가 하는 일과 최근 소식을 확인하실 수 있습니다.
            </p>

            <div className="supporter-home-links">
              {/* /stay(basename="/stay")와 WEWE 전체 홈페이지는 서로 다른 라우터(별도로 마운트된
                  React 앱)이므로 react-router의 Link가 아닌 일반 링크(전체 페이지 이동)를 씁니다. */}
              <a href="/about" className="supporter-home-link">
                <Info size={20} />
                <span>
                  <strong>위위 소개</strong>
                  <small>WEWE가 어떤 단체인지 알아보세요</small>
                </span>
                <ArrowRight size={16} className="supporter-home-link-arrow" />
              </a>
              <a href="/news" className="supporter-home-link">
                <Newspaper size={20} />
                <span>
                  <strong>사역 소식</strong>
                  <small>선교사·목회자 돌봄 현장 이야기</small>
                </span>
                <ArrowRight size={16} className="supporter-home-link-arrow" />
              </a>
              <a href="/donate" className="supporter-home-link">
                <Gift size={20} />
                <span>
                  <strong>후원하기</strong>
                  <small>후원 방법과 후원금이 쓰이는 곳</small>
                </span>
                <ArrowRight size={16} className="supporter-home-link-arrow" />
              </a>
            </div>

            <button type="button" className="btn btn-secondary supporter-home-logout" onClick={onLogout}>
              <LogOut size={16} />
              로그아웃
            </button>
          </div>
        </div>

        <style>{`
          .supporter-home-container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }

          .supporter-home-card {
            background: white;
            border-radius: 8px;
            padding: 3rem;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            max-width: 560px;
            width: 100%;
            text-align: center;
          }

          .supporter-home-icon {
            width: 92px;
            height: 92px;
            background: #eaf5ee;
            color: #1f6b3d;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.75rem;
          }

          .supporter-home-card h1 {
            color: #2c3e50;
            margin-bottom: 0.75rem;
            font-size: 1.4rem;
          }

          .supporter-home-card > p {
            color: #7f8c8d;
            margin-bottom: 2rem;
            font-size: 1rem;
            line-height: 1.7;
          }

          .supporter-home-links {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            margin-bottom: 2rem;
            text-align: left;
          }

          .supporter-home-link {
            display: flex;
            align-items: center;
            gap: 0.85rem;
            padding: 1rem 1.1rem;
            border: 1px solid #ecf0f1;
            border-radius: 8px;
            text-decoration: none;
            color: #2c3e50;
            transition: all 0.2s ease;
          }

          .supporter-home-link:hover {
            border-color: #d97b3f;
            background: #fdf8f1;
          }

          .supporter-home-link > svg:first-child {
            flex-shrink: 0;
            color: #d97b3f;
          }

          .supporter-home-link span {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 0.15rem;
          }

          .supporter-home-link strong {
            font-size: 0.98rem;
          }

          .supporter-home-link small {
            color: #7f8c8d;
            font-size: 0.82rem;
          }

          .supporter-home-link-arrow {
            flex-shrink: 0;
            color: #bdc3c7;
          }

          .supporter-home-logout {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
          }

          @media (max-width: 768px) {
            .supporter-home-card {
              padding: 1.75rem;
            }
          }

          @media (max-width: 480px) {
            .supporter-home-container {
              padding: 1rem;
            }

            .supporter-home-card {
              padding: 1.25rem;
            }

            .supporter-home-card h1 {
              font-size: 1.2rem;
            }
          }
        `}</style>
      </div>
    </>
  );
}

export default SupporterHome;
