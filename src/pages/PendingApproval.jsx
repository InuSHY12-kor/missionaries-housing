import React, { useState } from 'react';
import { Clock, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { supabase } from '../App';

// 이 화면은 "이메일 인증"과 "관리자 승인" 둘 다 완료되지 않은 로그인 사용자에게 보여집니다.
// (App.jsx에서 status==='pending' 이거나, status==='approved'인데 email_verified_at이 아직 없는 경우 렌더링)
function PendingApproval({ userProfile }) {
  const status = userProfile?.status || 'pending';
  const rejectionReason = userProfile?.rejection_reason || '';
  const emailVerified = !!userProfile?.email_verified_at;

  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState(false);

  const resendVerificationEmail = async () => {
    setResending(true);
    setResendMessage('');
    setResendError(false);
    try {
      const { data: token, error } = await supabase.rpc('create_email_verification_token', {
        p_user_id: userProfile.id
      });
      if (error) throw error;

      const link = `${window.location.origin}/verify-email?token=${token}`;
      const { error: fnError } = await supabase.functions.invoke('send-email', {
        body: { type: 'email_verification', userId: userProfile.id, link }
      });
      if (fnError) throw fnError;

      setResendMessage('인증 메일을 다시 보내드렸습니다. 메일함(스팸함 포함)을 확인해주세요.');
    } catch (error) {
      setResendError(true);
      setResendMessage('오류가 발생했습니다: ' + error.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="pending-container">
      <div className="container">
        <div className="pending-card">
          {status === 'rejected' ? (
            <>
              <div className="error-icon">
                <AlertCircle size={60} />
              </div>
              <h1>가입이 거절되었습니다</h1>
              <div className="rejection-box">
                <p><strong>거절 사유:</strong></p>
                <p>{rejectionReason}</p>
              </div>
              <p>다시 신청하려면 관리자에게 문의해주세요.</p>
            </>
          ) : status === 'approved' ? (
            // 관리자 승인은 완료되었지만 이메일 인증이 아직 남은 경우
            <>
              <div className="pending-icon">
                <Mail size={60} />
              </div>
              <h1>이메일 인증만 남았습니다</h1>
              <p>
                관리자 승인은 완료되었습니다! 가입 시 입력하신 이메일 주소로 보내드린 인증 메일의 링크를 클릭하시면
                모든 서비스를 이용하실 수 있습니다.
              </p>
              <div className="waiting-message">
                <p>📧 메일이 보이지 않으면 스팸함도 확인해주세요.</p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={resendVerificationEmail}
                disabled={resending}
              >
                {resending ? '재발송 중...' : '인증 메일 다시 받기'}
              </button>
              {resendMessage && (
                <p className={resendError ? 'resend-error' : 'resend-success'}>{resendMessage}</p>
              )}
            </>
          ) : (
            // status === 'pending'
            <>
              <div className="pending-icon">
                <Clock size={60} />
              </div>
              <h1>가입 신청 검토 중</h1>
              <p>
                {emailVerified
                  ? '이메일 인증은 완료되었습니다. 관리자가 귀하의 정보를 검토하고 있습니다. 일반적으로 1-2일 정도 소요됩니다.'
                  : '이메일 인증과 관리자 승인이 모두 완료되어야 서비스를 이용하실 수 있습니다. 아직 이메일 인증이 완료되지 않았습니다 — 가입 시 입력하신 주소로 보내드린 인증 메일의 링크를 클릭해주세요.'}
              </p>
              <div className="info-box">
                <h3>제출된 정보</h3>
                <ul>
                  <li><strong>성명:</strong> {userProfile?.full_name}</li>
                  <li><strong>이메일:</strong> {userProfile?.email}</li>
                  <li><strong>소속:</strong> {userProfile?.church_name}</li>
                  <li><strong>역할:</strong> {userProfile?.role === 'admin' ? '관리자' : userProfile?.role === 'missionary' ? '선교사' : '숙소 제공자'}</li>
                  <li>
                    <strong>이메일 인증:</strong>{' '}
                    <span className={`badge ${emailVerified ? 'badge-success' : 'badge-danger'}`}>
                      {emailVerified ? '인증 완료' : '미인증'}
                    </span>
                  </li>
                  <li><strong>관리자 승인:</strong> <span className="badge badge-warning">검토 중</span></li>
                </ul>
              </div>

              {!emailVerified && (
                <>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={resendVerificationEmail}
                    disabled={resending}
                  >
                    {resending ? '재발송 중...' : '인증 메일 다시 받기'}
                  </button>
                  {resendMessage && (
                    <p className={resendError ? 'resend-error' : 'resend-success'}>{resendMessage}</p>
                  )}
                </>
              )}

              <div className="waiting-message">
                <p>📧 승인이 완료되면 이메일로 알려드리겠습니다.</p>
                <p>👥 혹시 문의사항이 있으시면 관리자에게 연락해주세요.</p>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .pending-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .pending-card {
          background: white;
          border-radius: 8px;
          padding: 3rem;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          max-width: 600px;
          width: 100%;
          text-align: center;
        }

        .pending-icon {
          width: 100px;
          height: 100px;
          background: #fff3cd;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2rem;
          color: #f39c12;
          animation: pulse 2s infinite;
        }

        .success-icon {
          width: 100px;
          height: 100px;
          background: #d5f4e6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2rem;
          color: #27ae60;
          animation: scaleIn 0.5s ease;
        }

        .error-icon {
          width: 100px;
          height: 100px;
          background: #fadbd8;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2rem;
          color: #e74c3c;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .pending-card h1 {
          color: #2c3e50;
          margin-bottom: 1rem;
        }

        .pending-card > p {
          color: #7f8c8d;
          margin-bottom: 2rem;
          font-size: 1.1rem;
        }

        .info-box {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 6px;
          margin: 2rem 0;
          text-align: left;
        }

        .info-box h3 {
          margin-bottom: 1rem;
          color: #2c3e50;
        }

        .info-box ul {
          list-style: none;
        }

        .info-box li {
          padding: 0.5rem 0;
          border-bottom: 1px solid #ecf0f1;
          color: #555;
        }

        .info-box li:last-child {
          border-bottom: none;
        }

        .info-box strong {
          color: #2c3e50;
          margin-right: 0.5rem;
        }

        .waiting-message {
          background: #ecf7ff;
          border-left: 4px solid #3498db;
          padding: 1rem;
          border-radius: 4px;
          margin: 2rem 0;
          text-align: left;
        }

        .waiting-message p {
          margin: 0.5rem 0;
          color: #2c3e50;
        }

        .rejection-box {
          background: #fadbd8;
          border-left: 4px solid #e74c3c;
          padding: 1rem;
          border-radius: 4px;
          margin: 1.5rem 0;
          text-align: left;
        }

        .rejection-box p {
          margin: 0.5rem 0;
          color: #2c3e50;
        }

        .rejection-box strong {
          color: #c0392b;
        }

        .resend-success {
          color: #27ae60;
          font-size: 0.9rem;
          margin-top: 1rem;
        }

        .resend-error {
          color: #e74c3c;
          font-size: 0.9rem;
          margin-top: 1rem;
        }

        @media (max-width: 768px) {
          .pending-card {
            padding: 1.5rem;
          }

          .pending-icon, .success-icon, .error-icon {
            width: 80px;
            height: 80px;
          }
        }
      `}</style>
    </div>
  );
}

export default PendingApproval;
