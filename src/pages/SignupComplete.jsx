import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Home } from 'lucide-react';
import PageHero from '../components/PageHero';
import { SignupCompleteGuide } from '../components/SignupGuide';

const SIGNUP_COMPLETE_HERO_IMAGES = [
  'https://images.pexels.com/photos/2822647/pexels-photo-2822647.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/928199/pexels-photo-928199.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/6699296/pexels-photo-6699296.jpeg?auto=compress&cs=tinysrgb&w=1600',
];

const VALID_ROLES = ['missionary', 'host', 'supporter'];

// WEWE STAY용 가입 완료 페이지 (/stay/signup-complete).
// (2026-10-09 개편) 이메일 인증·관리자 승인이 필요하다는 점을 눈에 띄는 안내 상자와 단계별 진행
// 상황(완료 / 지금 해주세요 / 대기)으로 자세히 보여줍니다(공용 컴포넌트 SignupCompleteGuide).
// WEWE(/signup)에서 시작한 가입은 WEWE용 완료 페이지(/signup/complete)로 가고, 이 페이지는
// 위위스테이에서 시작한 가입 전용입니다 — "홈으로 이동하기"도 위위스테이 홈(/stay)으로 연결됩니다.
function SignupComplete() {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const role = VALID_ROLES.includes(roleParam) ? roleParam : 'missionary';
  const isSupporter = role === 'supporter';

  return (
    <>
      <PageHero
        images={SIGNUP_COMPLETE_HERO_IMAGES}
        eyebrow={isSupporter ? 'WELCOME' : 'ONE MORE STEP'}
        title={isSupporter ? '후원자 가입이 완료되었습니다' : '가입 신청이 접수되었습니다'}
        subtitle={isSupporter ? '지금 바로 이용하실 수 있어요' : '이메일 인증과 관리자 승인이 끝나야 이용하실 수 있습니다'}
      />
      <div className="signup-complete-container">
        <div className="signup-complete-card">
          <SignupCompleteGuide role={role} />
          <div className="signup-complete-actions">
            <Link to="/" className="btn btn-primary">
              <Home size={18} /> WEWE STAY 홈으로 이동하기
            </Link>
          </div>
        </div>

        <style>{`
          .signup-complete-container {
            flex: 1;
            display: flex;
            justify-content: center;
            padding: 2rem;
          }

          .signup-complete-card {
            background: white;
            border-radius: 12px;
            padding: 2.25rem;
            box-shadow: 0 4px 16px rgba(0,0,0,0.08);
            max-width: 720px;
            width: 100%;
          }

          .signup-complete-actions {
            display: flex;
            justify-content: center;
            margin-top: 2rem;
          }

          .signup-complete-actions .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
            min-height: 44px;
          }

          @media (max-width: 768px) {
            .signup-complete-container {
              padding: 1.25rem 1rem;
            }

            .signup-complete-card {
              padding: 1.4rem 1.1rem;
            }
          }
        `}</style>
      </div>
    </>
  );
}

export default SignupComplete;
