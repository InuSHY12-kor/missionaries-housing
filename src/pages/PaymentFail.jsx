import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';

// 토스페이먼츠 결제위젯에서 결제가 실패하거나 사용자가 취소했을 때 리다이렉트되는 페이지.
function PaymentFail() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const message = searchParams.get('message');

  return (
    <div className="payment-result">
      <div className="container">
        <div className="card payment-result-card">
          <XCircle size={48} className="payment-result-icon error" />
          <h1>결제가 완료되지 않았습니다</h1>
          <p>{message || '결제가 취소되었거나 진행 중 오류가 발생했습니다.'}</p>
          <div className="payment-result-actions">
            {bookingId && (
              <Link to={`/my-bookings/${bookingId}/pay`} className="btn btn-primary">다시 시도하기</Link>
            )}
            <Link to="/my-bookings" className="btn btn-secondary">내 예약으로 돌아가기</Link>
          </div>
        </div>
      </div>

      <style>{`
        .payment-result {
          flex: 1;
          display: flex;
          align-items: center;
          padding: 3rem 0;
        }

        .payment-result-card {
          max-width: 480px;
          margin: 0 auto;
          text-align: center;
          padding: 2.5rem 2rem;
        }

        .payment-result-icon {
          margin-bottom: 1rem;
        }

        .payment-result-icon.error {
          color: #e74c3c;
        }

        .payment-result-card h1 {
          font-size: 1.3rem;
          margin: 0 0 0.5rem;
          color: #2c3e50;
        }

        .payment-result-card p {
          color: #7f8c8d;
          margin-bottom: 1.5rem;
        }

        .payment-result-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
      `}</style>
    </div>
  );
}

export default PaymentFail;
