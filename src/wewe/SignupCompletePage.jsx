import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Home } from 'lucide-react';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import WevePageHero from './WevePageHero';
import HERO_IMAGE_SETS from './heroImages';
import { SignupCompleteGuide } from '../components/SignupGuide';
import './wewe-shared.css';

// WEWE용 가입 완료 페이지 (/signup/complete, 2026-10-09 신설).
// WEWE(/signup)에서 가입을 시작한 경우 이 페이지로, WEWE STAY(/stay/signup)에서 시작한 경우
// /stay/signup-complete로 갑니다(CompleteProfile.jsx가 가입 시작 사이트를 보고 분기).
// "홈으로 이동하기"도 WEWE 홈(/)으로 연결됩니다.
const VALID_ROLES = ['missionary', 'host', 'supporter'];

function SignupCompletePage() {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const role = VALID_ROLES.includes(roleParam) ? roleParam : 'missionary';
  const isSupporter = role === 'supporter';

  return (
    <div className="wewe-page wewe-signup-complete-page">
      <WeweHeader />

      <WevePageHero
        eyebrow={isSupporter ? 'WELCOME' : 'ONE MORE STEP'}
        title={isSupporter ? '후원자 가입이 완료되었습니다' : '가입 신청이 접수되었습니다'}
        subtitle={
          isSupporter
            ? 'WEWE의 후원자가 되어주셔서 감사합니다. 지금 바로 이용하실 수 있어요.'
            : '이메일 인증과 관리자 승인이 끝나야 이용하실 수 있습니다. 아래 안내를 꼭 확인해주세요.'
        }
        images={HERO_IMAGE_SETS.signup}
      />

      <section className="wsc-section">
        <div className="wh-container wh-container-narrow">
          <SignupCompleteGuide role={role} />

          <div className="wsc-actions">
            <Link to="/" className="wh-btn wh-btn-primary">
              <Home size={18} /> WEWE 홈으로 이동하기
            </Link>
          </div>
        </div>
      </section>

      <WeweFooter />

      <style>{`
        .wsc-section {
          padding: 3.5rem 0 5rem;
          background: var(--wh-bg-soft);
        }

        .wsc-actions {
          display: flex;
          justify-content: center;
          margin-top: 2.25rem;
        }
      `}</style>
    </div>
  );
}

export default SignupCompletePage;
