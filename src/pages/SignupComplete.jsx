import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import PageHero from '../components/PageHero';

const SIGNUP_COMPLETE_HERO_IMAGES = [
  'https://images.pexels.com/photos/2822647/pexels-photo-2822647.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/928199/pexels-photo-928199.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/6699296/pexels-photo-6699296.jpeg?auto=compress&cs=tinysrgb&w=1600',
];

function SignupComplete() {
  // (Phase 6) 후원자는 관리자 승인이나 추가 이메일 인증 없이 CompleteProfile.jsx 제출과
  // 동시에 바로 이용 가능한 상태(status: 'approved', email_verified_at 채움)가 되므로,
  // 승인 대기 안내 대신 곧바로 로그인해서 이용할 수 있다는 안내를 보여줍니다.
  const [searchParams] = useSearchParams();
  const isSupporter = searchParams.get('role') === 'supporter';

  return (
    <>
      <PageHero
        images={SIGNUP_COMPLETE_HERO_IMAGES}
        eyebrow="ONE MORE STEP"
        title={isSupporter ? '후원자 가입이 완료되었습니다' : '가입 신청이 완료되었습니다'}
        subtitle={isSupporter ? '별도 승인 없이 바로 이용하실 수 있어요' : '메일함에서 인증 링크를 확인해주세요'}
      />
      <div className="signup-complete-container">
      <div className="signup-complete-card">
        <div className="signup-complete-icon">
          <MailCheck size={48} />
        </div>
        {isSupporter ? (
          <>
            <h1>후원자 등록이 완료되었습니다</h1>
            <p>
              위위(WEWE)의 후원자가 되어주셔서 감사합니다. 후원자 계정은 별도의 서류 심사나 관리자 승인 없이
              바로 이용하실 수 있습니다.
              <br />
              위위 소개 페이지에서 WEWE가 하는 일을 좀 더 살펴보세요.
            </p>
            {/* /stay(basename="/stay")와 WEWE 전체 홈페이지는 서로 다른 라우터이므로
                react-router의 Link가 아닌 일반 링크(전체 페이지 이동)를 사용합니다. */}
            <a href="/" className="btn btn-primary">위위 소개 페이지로 이동하기</a>
          </>
        ) : (
          <>
            <h1>회원가입이 완료되었습니다</h1>
            <p>
              입력하신 이메일 주소로 인증 메일을 보내드렸습니다. 메일함(스팸함 포함)에서 인증 링크를 클릭해주세요.
              <br />
              <strong>이메일 인증</strong>과 <strong>관리자 승인</strong>이 모두 완료되어야 모든 서비스를 이용하실 수 있습니다.
            </p>
            <Link to="/" className="btn btn-primary">홈으로 이동하기</Link>
          </>
        )}
      </div>

      <style>{`
        .signup-complete-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .signup-complete-card {
          background: white;
          border-radius: 8px;
          padding: 3rem;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          max-width: 480px;
          width: 100%;
          text-align: center;
        }

        .signup-complete-icon {
          width: 96px;
          height: 96px;
          background: #faf1e6;
          color: #d97b3f;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2rem;
        }

        .signup-complete-card h1 {
          color: #2c3e50;
          margin-bottom: 0.75rem;
        }

        .signup-complete-card p {
          color: #7f8c8d;
          margin-bottom: 2rem;
          font-size: 1.05rem;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .signup-complete-container {
            padding: 1.5rem;
          }

          .signup-complete-card {
            padding: 2rem 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .signup-complete-container {
            padding: 1rem;
          }

          .signup-complete-card {
            padding: 1.5rem 1.25rem;
          }

          .signup-complete-icon {
            width: 72px;
            height: 72px;
            margin-bottom: 1.25rem;
          }

          .signup-complete-card h1 {
            font-size: 1.3rem;
          }

          .signup-complete-card p {
            font-size: 0.9rem;
            margin-bottom: 1.5rem;
          }

          .signup-complete-card .btn {
            min-height: 44px;
          }
        }
      `}</style>
      </div>
    </>
  );
}

export default SignupComplete;
