import React from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';

function SignupComplete() {
  return (
    <div className="signup-complete-container">
      <div className="signup-complete-card">
        <div className="signup-complete-icon">
          <MailCheck size={48} />
        </div>
        <h1>회원가입이 완료되었습니다</h1>
        <p>관리자의 승인 후 모든 서비스를 이용하실 수 있습니다.</p>
        <Link to="/" className="btn btn-primary">홈으로 이동하기</Link>
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
          background: #e6f4f5;
          color: #16808E;
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
      `}</style>
    </div>
  );
}

export default SignupComplete;
