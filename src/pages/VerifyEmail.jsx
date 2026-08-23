import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../App';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import PageHero from '../components/PageHero';

const VERIFY_EMAIL_HERO_IMAGES = [
  'https://images.pexels.com/photos/7054544/pexels-photo-7054544.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/38023665/pexels-photo-38023665.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/32598664/pexels-photo-32598664.jpeg?auto=compress&cs=tinysrgb&w=1600',
];

// 이메일 인증 링크(/verify-email?token=...)를 클릭하면 도착하는 공개 페이지.
// 로그인 여부와 무관하게(다른 기기/브라우저에서 메일을 열었을 수도 있음) 동작해야 하므로
// verify_email_token RPC는 anon 권한으로도 호출 가능하도록 되어 있습니다.
function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('checking'); // checking | success | invalid

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setStatus('invalid');
        return;
      }
      try {
        const { data: verifiedUserId, error } = await supabase.rpc('verify_email_token', {
          p_token: token
        });
        if (error || !verifiedUserId) {
          setStatus('invalid');
          return;
        }
        setStatus('success');
        // 관리자에게 인증 완료 알림 메일 발송 (베스트 에포트, 실패해도 사용자 화면에는 영향 없음)
        supabase.functions
          .invoke('send-email', { body: { type: 'admin_email_verified', userId: verifiedUserId } })
          .catch(() => {});
      } catch (e) {
        setStatus('invalid');
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <>
      <PageHero
        images={VERIFY_EMAIL_HERO_IMAGES}
        eyebrow="EMAIL VERIFICATION"
        title="이메일 인증"
        subtitle="인증을 완료하고 다음 단계로 넘어가세요"
      />
      <div className="verify-email-container">
      <div className="container">
        <div className="verify-card">
          {status === 'checking' && (
            <>
              <div className="verify-icon verify-icon-loading">
                <Loader size={48} />
              </div>
              <h1>이메일 인증을 확인하는 중입니다...</h1>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="verify-icon verify-icon-success">
                <CheckCircle size={48} />
              </div>
              <h1>이메일 인증이 완료되었습니다</h1>
              <p>관리자 승인까지 완료되면 모든 서비스를 이용하실 수 있습니다.</p>
              <Link to="/login" className="btn btn-primary">로그인하러 가기</Link>
            </>
          )}
          {status === 'invalid' && (
            <>
              <div className="verify-icon verify-icon-error">
                <XCircle size={48} />
              </div>
              <h1>인증 링크가 유효하지 않습니다</h1>
              <p>링크가 만료되었거나 이미 사용되었습니다. 로그인 후 안내되는 화면에서 인증 메일을 다시 받으실 수 있습니다.</p>
              <Link to="/login" className="btn btn-secondary">로그인하러 가기</Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        .verify-email-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .verify-card {
          background: white;
          border-radius: 8px;
          padding: 3rem;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          max-width: 480px;
          width: 100%;
          text-align: center;
        }

        .verify-icon {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }

        .verify-icon-loading {
          background: #faf1e6;
          color: #d97b3f;
        }

        .verify-icon-loading svg {
          animation: spin 1.2s linear infinite;
        }

        .verify-icon-success {
          background: #d5f4e6;
          color: #27ae60;
        }

        .verify-icon-error {
          background: #fadbd8;
          color: #e74c3c;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .verify-card h1 {
          color: #2c3e50;
          margin-bottom: 0.75rem;
          font-size: 1.4rem;
        }

        .verify-card p {
          color: #7f8c8d;
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .verify-email-container {
            padding: 1.5rem;
          }

          .verify-card {
            padding: 2rem 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .verify-email-container {
            padding: 1rem;
          }

          .verify-card {
            padding: 1.5rem 1.25rem;
          }

          .verify-icon {
            width: 68px;
            height: 68px;
            margin-bottom: 1.25rem;
          }

          .verify-card h1 {
            font-size: 1.2rem;
          }

          .verify-card p {
            font-size: 0.9rem;
          }

          .verify-card .btn {
            min-height: 44px;
          }
        }
      `}</style>
      </div>
    </>
  );
}

export default VerifyEmail;
