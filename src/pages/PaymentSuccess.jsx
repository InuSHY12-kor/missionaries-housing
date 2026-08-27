import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../App';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

// 토스페이먼츠 결제위젯이 성공 시 리다이렉트시키는 페이지.
// 쿼리스트링(paymentKey/orderId/amount)과 우리가 넘긴 bookingId를 confirm-toss-payment
// 엣지 함수로 보내 서버에서 실제 결제 승인을 처리합니다. (금액 검증도 서버에서 다시 수행됨)
function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing'); // processing | success | error
  const [message, setMessage] = useState('');
  const calledRef = useRef(false);

  const bookingId = searchParams.get('bookingId');

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const confirmPayment = async () => {
      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');

      if (!paymentKey || !orderId || !amount || !bookingId) {
        setStatus('error');
        setMessage('결제 정보가 올바르지 않습니다.');
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke('confirm-toss-payment', {
          body: { bookingId, orderId, paymentKey, amount: Number(amount) },
        });

        if (fnError) {
          let msg = '결제 승인 처리 중 오류가 발생했습니다.';
          try {
            const ctx = await fnError.context?.json();
            if (ctx?.error) msg = ctx.error;
          } catch (e) {
            // JSON 파싱 실패 시 기본 메시지 사용
          }
          throw new Error(msg);
        }
        if (data?.error) {
          throw new Error(data.error);
        }

        setStatus('success');
      } catch (err) {
        setStatus('error');
        setMessage(err.message || '결제 승인 처리 중 오류가 발생했습니다.');
      }
    };

    confirmPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="payment-result">
      <div className="container">
        <div className="card payment-result-card">
          {status === 'processing' && (
            <>
              <Loader size={48} className="payment-result-icon spin" />
              <h1>결제 승인 처리 중입니다</h1>
              <p>잠시만 기다려주세요...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle size={48} className="payment-result-icon success" />
              <h1>결제가 완료되었습니다</h1>
              <p>숙박비 결제가 정상적으로 처리되었습니다. 감사합니다!</p>
              {bookingId && (
                <Link to={`/my-bookings/${bookingId}`} className="btn btn-primary">예약 상세 보기</Link>
              )}
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle size={48} className="payment-result-icon error" />
              <h1>결제 승인에 실패했습니다</h1>
              <p>{message}</p>
              <div className="payment-result-actions">
                {bookingId && (
                  <Link to={`/my-bookings/${bookingId}/pay`} className="btn btn-primary">다시 시도하기</Link>
                )}
                <Link to="/my-bookings" className="btn btn-secondary">내 예약으로 돌아가기</Link>
              </div>
            </>
          )}
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

        .payment-result-icon.success {
          color: #27ae60;
        }

        .payment-result-icon.error {
          color: #e74c3c;
        }

        .payment-result-icon.spin {
          color: #d97b3f;
          animation: payment-spin 1s linear infinite;
        }

        @keyframes payment-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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

        @media (prefers-reduced-motion: reduce) {
          .payment-result-icon.spin {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

export default PaymentSuccess;
