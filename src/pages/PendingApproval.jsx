import React, { useState, useEffect } from 'react';
import { supabase } from '../App';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

function PendingApproval({ userProfile }) {
  const [status, setStatus] = useState(userProfile?.status || 'pending');
  const [rejectionReason, setRejectionReason] = useState(userProfile?.rejection_reason || '');

  useEffect(() => {
    // 상태 변경 리스너
    const subscription = supabase
      .from('users')
      .on('*', payload => {
        if (payload.new.status !== status) {
          setStatus(payload.new.status);
          setRejectionReason(payload.new.rejection_reason || '');
          // 페이지 새로고침
          window.location.reload();
        }
      })
      .subscribe();

    return () => {
      supabase.removeSubscription(subscription);
    };
  }, [status]);

  return (
    <div className="pending-container">
      <div className="container">
        <div className="pending-card">
          {status === 'pending' ? (
            <>
              <div className="pending-icon">
                <Clock size={60} />
              </div>
              <h1>가입 신청 검토 중</h1>
              <p>
                관리자가 귀하의 정보를 검토하고 있습니다.
                일반적으로 1-2일 정도 소요됩니다.
              </p>
              <div className="info-box">
                <h3>제출된 정보</h3>
                <ul>
                  <li><strong>성명:</strong> {userProfile?.full_name}</li>
                  <li><strong>이메일:</strong> {userProfile?.email}</li>
                  <li><strong>소속:</strong> {userProfile?.church_name}</li>
                                                    <li><strong>역할:</strong> {userProfile?.role === 'admin' ? '관리자' : userProfile?.role === 'missionary' ? '선교사' : '숙소 제공자'}</li>
                  <li><strong>상태:</strong> <span className="badge badge-warning">검토 중</span></li>
                </ul>
              </div>
              <div className="waiting-message">
                <p>📧 승인이 완료되면 이메일로 알려드리겠습니다.</p>
                <p>👥 혹시 문의사항이 있으시면 관리자에게 연락해주세요.</p>
              </div>
            </>
          ) : status === 'approved' ? (
            <>
              <div className="success-icon">
                <CheckCircle size={60} />
              </div>
              <h1>승인 완료!</h1>
              <p>축하합니다! 이제 모든 기능을 이용할 수 있습니다.</p>
              <a href="/dashboard" className="btn btn-primary">대시보드로 이동</a>
            </>
          ) : (
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
