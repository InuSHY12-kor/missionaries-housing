import React, { useState } from 'react';
import { BANKS } from './PayoutAccountForm';
import { validateRefundAccount } from '../utils/bankTransfer';

// 입금 완료된 예약을 취소할 때 환불 받을 계좌를 받는 창 (2026-10-10).
// 계좌이체로 입금받았기 때문에 환불도 입금자 본인 명의 계좌로 이체합니다.
//   mode 'cancel'  : 취소 + 환불 요청 (안내 문구와 "취소하고 환불 요청" 버튼)
//   mode 'account' : 이미 취소된 예약(숙소 제공자 취소 등)에 환불 계좌만 입력
function RefundAccountModal({ mode = 'cancel', amount, onSubmit, onClose }) {
  const [account, setAccount] = useState({ bank_code: '', account_number: '', holder_name: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (name) => (e) => setAccount((prev) => ({ ...prev, [name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const problem = validateRefundAccount(account);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSubmit(account);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="ram-overlay" role="dialog" aria-modal="true" onClick={busy ? undefined : onClose}>
      <form className="ram-box" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{mode === 'cancel' ? '예약 취소 및 환불 요청' : '환불 받을 계좌 입력'}</h2>
        {mode === 'cancel' && (
          <p className="ram-desc">
            입실일 전날까지 취소하시면 입금하신 금액
            {amount != null && <b> ₩{Number(amount).toLocaleString()}</b>} 전액을 환불해드립니다.
            환불은 영업일 기준 3일 안에 아래 계좌로 이체됩니다.
          </p>
        )}
        {mode === 'account' && (
          <p className="ram-desc">입금하신 분 본인 명의의 계좌를 입력해주세요. 영업일 기준 3일 안에 이체해드립니다.</p>
        )}

        <label>
          은행
          <select value={account.bank_code} onChange={set('bank_code')} disabled={busy}>
            <option value="">은행 선택</option>
            {BANKS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
        </label>
        <label>
          계좌번호
          <input type="text" inputMode="numeric" value={account.account_number} onChange={set('account_number')} placeholder="숫자만 입력" maxLength={20} disabled={busy} />
        </label>
        <label>
          예금주
          <input type="text" value={account.holder_name} onChange={set('holder_name')} placeholder="입금하신 분 성명" maxLength={60} disabled={busy} />
        </label>

        {error && <p className="ram-error">{error}</p>}

        <div className="ram-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>닫기</button>
          <button type="submit" className={`btn ${mode === 'cancel' ? 'btn-danger' : 'btn-primary'}`} disabled={busy}>
            {busy ? '처리 중...' : mode === 'cancel' ? '취소하고 환불 요청' : '환불 계좌 저장'}
          </button>
        </div>
      </form>

      <style>{`
        .ram-overlay {
          position: fixed;
          inset: 0;
          background: rgba(20, 20, 18, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 2000;
        }

        .ram-box {
          background: #fff;
          border-radius: 14px;
          padding: 1.6rem;
          width: 100%;
          max-width: 440px;
          max-height: calc(100vh - 32px);
          overflow-y: auto;
          word-break: keep-all;
        }

        .ram-box h2 {
          font-size: 1.2rem;
          margin: 0 0 0.6rem;
        }

        .ram-desc {
          color: #4a463e;
          line-height: 1.7;
          margin: 0 0 1rem;
          font-size: 0.95rem;
        }

        .ram-box label {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          font-weight: 600;
          font-size: 0.92rem;
          margin-bottom: 0.8rem;
        }

        .ram-box select,
        .ram-box input {
          padding: 0.65rem 0.75rem;
          border: 1px solid #d8d3c8;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 400;
        }

        .ram-error {
          color: #b3261e;
          font-weight: 600;
          margin: 0 0 0.6rem;
        }

        .ram-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
          flex-wrap: wrap;
          margin-top: 0.4rem;
        }
      `}</style>
    </div>
  );
}

export default RefundAccountModal;
