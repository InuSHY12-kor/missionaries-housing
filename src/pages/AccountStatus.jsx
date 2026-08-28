import React, { useState } from 'react';
import { UserX, ShieldAlert, LogOut } from 'lucide-react';
import { supabase } from '../App';
import PageHero from '../components/PageHero';

const ACCOUNT_STATUS_HERO_IMAGES = [
  'https://images.pexels.com/photos/29477084/pexels-photo-29477084.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/37625441/pexels-photo-37625441.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/11285384/pexels-photo-11285384.jpeg?auto=compress&cs=tinysrgb&w=1600',
];

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

// 이 화면은 App.jsx에서 userProfile.status가 'withdrawn'(탈퇴 처리 완료, 5년 보관 중) 이거나
// 'deletion_pending'(관리자가 사유를 입력해 삭제 처리한 계정 — 본인이 사유를 확인해야 완전히
// 삭제됨)인 로그인 사용자에게 보여지는 전체화면 안내입니다. 두 경우 모두 정상적인 서비스
// 화면(마이페이지 등)에는 접근할 수 없습니다.
function AccountStatus({ userProfile, onLogout }) {
  const status = userProfile?.status;
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const confirmFinalDeletion = async () => {
    if (!acknowledged) return;
    if (!window.confirm('정말로 계정을 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 이후에는 다시 로그인할 수 없습니다.')) {
      return;
    }
    setConfirming(true);
    setConfirmError('');
    try {
      const { error } = await supabase.rpc('self_confirm_account_deletion');
      if (error) throw error;
      alert('계정이 완전히 삭제되었습니다. 그동안 위위 STAY를 이용해주셔서 감사합니다.');
      await onLogout();
    } catch (error) {
      setConfirmError('오류가 발생했습니다: ' + error.message);
      setConfirming(false);
    }
  };

  return (
    <>
      <PageHero
        images={ACCOUNT_STATUS_HERO_IMAGES}
        eyebrow="ACCOUNT"
        title={status === 'deletion_pending' ? '계정 삭제 안내' : '탈퇴 처리된 계정입니다'}
        subtitle={status === 'deletion_pending' ? '아래 내용을 확인해주세요' : '그동안 위위 STAY를 이용해주셔서 감사합니다'}
      />
      <div className="account-status-container">
        <div className="container">
          <div className="account-status-card">
            {status === 'deletion_pending' ? (
              <>
                <div className="account-status-icon account-status-icon-danger">
                  <ShieldAlert size={56} />
                </div>
                <h1>계정이 삭제 처리되었습니다</h1>
                <p>
                  관리자에 의해 회원님의 계정이 삭제 대상으로 지정되었습니다. 아래 사유를 확인하신 후
                  동의하시면 계정과 관련된 모든 데이터가 <strong>즉시 완전히 영구 삭제</strong>되며,
                  이후에는 다시 로그인하실 수 없습니다.
                </p>

                <div className="account-status-reason-box">
                  <h3>삭제 사유</h3>
                  <p>{userProfile?.admin_deletion_reason || '별도로 기재된 사유가 없습니다. 자세한 사항은 관리자에게 문의해주세요.'}</p>
                </div>

                <label className="account-status-ack">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    disabled={confirming}
                  />
                  <span>위 사유를 확인했으며, 계정과 모든 데이터가 영구적으로 삭제되는 것에 동의합니다.</span>
                </label>

                {confirmError && <p className="account-status-error">{confirmError}</p>}

                <div className="account-status-actions">
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={confirmFinalDeletion}
                    disabled={!acknowledged || confirming}
                  >
                    {confirming ? '삭제 처리 중...' : '확인했습니다 — 계정 완전 삭제'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={onLogout} disabled={confirming}>
                    <LogOut size={16} />
                    나중에 확인하고 로그아웃
                  </button>
                </div>
                <p className="account-status-footnote">
                  지금 확인하지 않고 로그아웃해도 계정은 삭제되지 않으며, 다음에 다시 로그인하시면
                  동일한 안내가 표시됩니다.
                </p>
              </>
            ) : (
              <>
                <div className="account-status-icon account-status-icon-neutral">
                  <UserX size={56} />
                </div>
                <h1>탈퇴 처리가 완료된 계정입니다</h1>
                <p>
                  회원님의 탈퇴 신청에 따라 계정 탈퇴 처리가 완료되어 더 이상 위위 STAY 서비스를
                  이용하실 수 없습니다.
                </p>

                <div className="account-status-info-box">
                  {userProfile?.withdrawn_at && (
                    <p><strong>탈퇴 처리일:</strong> {formatDate(userProfile.withdrawn_at)}</p>
                  )}
                  {userProfile?.scheduled_purge_at && (
                    <p><strong>개인정보 완전 삭제 예정일:</strong> {formatDate(userProfile.scheduled_purge_at)}</p>
                  )}
                  <p className="account-status-info-note">
                    관련 법령 및 위위 이용약관에 따라 분쟁 해결, 부정 이용 방지 등을 위해 탈퇴일로부터
                    5년간 개인정보가 보관되며, 보관 기간이 지나면 자동으로 완전히 삭제됩니다. 보관 기간
                    동안에는 계정으로 다시 로그인하여 서비스를 이용하실 수 없습니다.
                  </p>
                </div>

                <div className="account-status-actions">
                  <button type="button" className="btn btn-secondary" onClick={onLogout}>
                    <LogOut size={16} />
                    로그아웃
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <style>{`
          .account-status-container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }

          .account-status-card {
            background: white;
            border-radius: 8px;
            padding: 3rem;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            max-width: 620px;
            width: 100%;
            text-align: center;
          }

          .account-status-icon {
            width: 96px;
            height: 96px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.75rem;
          }

          .account-status-icon-neutral {
            background: #f0dcc0;
            color: #b8622c;
          }

          .account-status-icon-danger {
            background: #fadbd8;
            color: #e74c3c;
          }

          .account-status-card h1 {
            color: #2c3e50;
            margin-bottom: 1rem;
          }

          .account-status-card > p {
            color: #7f8c8d;
            margin-bottom: 1.5rem;
            font-size: 1.05rem;
            line-height: 1.6;
          }

          .account-status-info-box,
          .account-status-reason-box {
            background: #f8f9fa;
            padding: 1.5rem;
            border-radius: 6px;
            margin: 1.5rem 0;
            text-align: left;
          }

          .account-status-reason-box {
            background: #fdf0ee;
            border-left: 4px solid #e74c3c;
          }

          .account-status-reason-box h3 {
            margin: 0 0 0.5rem;
            color: #c0392b;
            font-size: 1rem;
          }

          .account-status-reason-box p {
            color: #2c3e50;
            white-space: pre-wrap;
            margin: 0;
          }

          .account-status-info-box p {
            color: #2c3e50;
            margin: 0.35rem 0;
          }

          .account-status-info-note {
            margin-top: 0.75rem !important;
            padding-top: 0.75rem;
            border-top: 1px solid #ecf0f1;
            color: #7f8c8d !important;
            font-size: 0.9rem;
            line-height: 1.6;
          }

          .account-status-ack {
            display: flex;
            align-items: flex-start;
            gap: 0.6rem;
            text-align: left;
            background: #fff8f0;
            border: 1px solid #f0dcc0;
            border-radius: 6px;
            padding: 1rem;
            margin: 1.5rem 0;
            font-size: 0.92rem;
            color: #2c3e50;
            cursor: pointer;
          }

          .account-status-ack input {
            margin-top: 0.2rem;
            width: 18px;
            height: 18px;
            flex-shrink: 0;
          }

          .account-status-error {
            color: #e74c3c;
            font-size: 0.9rem;
            margin: -0.5rem 0 1rem;
          }

          .account-status-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            justify-content: center;
            margin-top: 0.5rem;
          }

          .account-status-actions .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
          }

          .account-status-footnote {
            margin: 1.25rem 0 0 !important;
            font-size: 0.85rem !important;
            color: #a0a0a0 !important;
          }

          @media (max-width: 768px) {
            .account-status-card {
              padding: 1.5rem;
            }

            .account-status-icon {
              width: 76px;
              height: 76px;
            }
          }

          @media (max-width: 480px) {
            .account-status-container {
              padding: 1rem;
            }

            .account-status-card {
              padding: 1.25rem;
            }

            .account-status-card h1 {
              font-size: 1.3rem;
            }

            .account-status-actions {
              flex-direction: column;
            }

            .account-status-actions .btn {
              width: 100%;
              justify-content: center;
              min-height: 44px;
            }
          }
        `}</style>
      </div>
    </>
  );
}

export default AccountStatus;
