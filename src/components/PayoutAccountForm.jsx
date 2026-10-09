import React, { useEffect, useState } from 'react';
import { supabase } from '../App';

// 숙소 제공자 지급 계좌 입력 (2026-10-10, 페이플 정산지급대행 준비).
// 페이플은 송금 전에 계좌조회(예금주 실명 확인)를 하며 은행 코드, 계좌번호, 예금주 구분,
// 생년월일 6자리(개인·개인사업자) 또는 사업자·고유번호 10자리(법인·단체)를 요구합니다.
// 저장 위치: host_payout_accounts (본인과 관리자만 조회, 확인 결과는 관리자·서버만 기록).

// 금융결제원 표준 은행 코드(3자리)
export const BANKS = [
  ['004', 'KB국민은행'], ['088', '신한은행'], ['020', '우리은행'], ['081', '하나은행'],
  ['011', 'NH농협은행'], ['012', '지역농·축협'], ['003', 'IBK기업은행'], ['090', '카카오뱅크'],
  ['092', '토스뱅크'], ['089', '케이뱅크'], ['071', '우체국'], ['045', '새마을금고'],
  ['048', '신협'], ['007', '수협은행'], ['002', 'KDB산업은행'], ['023', 'SC제일은행'],
  ['027', '한국씨티은행'], ['031', 'iM뱅크(대구)'], ['032', '부산은행'], ['039', '경남은행'],
  ['034', '광주은행'], ['037', '전북은행'], ['035', '제주은행'], ['050', '저축은행'],
];

export const EMPTY_PAYOUT_ACCOUNT = {
  bank_code: '',
  account_number: '',
  holder_name: '',
  holder_type: 'personal',
  holder_info: '',
};

const onlyDigits = (v) => String(v || '').replace(/[^0-9]/g, '');

// 입력값을 저장 형태로 정리하고 문제가 있으면 안내 문구를 돌려줍니다.
export function normalizePayoutAccount(value) {
  const bank = BANKS.find(([code]) => code === value.bank_code);
  const row = {
    bank_code: value.bank_code,
    bank_name: bank ? bank[1] : '',
    account_number: onlyDigits(value.account_number),
    holder_name: String(value.holder_name || '').trim(),
    holder_type: value.holder_type === 'corporate' ? 'corporate' : 'personal',
    holder_info: onlyDigits(value.holder_info),
  };
  let error = null;
  if (!bank) error = '은행을 선택해주세요.';
  else if (row.account_number.length < 6 || row.account_number.length > 16) error = '계좌번호를 숫자로 정확히 입력해주세요.';
  else if (!row.holder_name) error = '예금주명을 입력해주세요.';
  else if (row.holder_type === 'personal' && row.holder_info.length !== 6) error = '예금주 생년월일 6자리(예: 900101)를 입력해주세요.';
  else if (row.holder_type === 'corporate' && row.holder_info.length !== 10) error = '사업자등록번호 또는 고유번호 10자리를 입력해주세요.';
  return { row, error };
}

export async function savePayoutAccount(userId, value) {
  const { row, error } = normalizePayoutAccount(value);
  if (error) throw new Error(error);
  const { error: dbError } = await supabase
    .from('host_payout_accounts')
    .upsert({ user_id: userId, ...row }, { onConflict: 'user_id' });
  if (dbError) throw dbError;
}

export function maskAccountNumber(num) {
  const s = String(num || '');
  if (s.length <= 4) return s;
  return `${'*'.repeat(s.length - 4)}${s.slice(-4)}`;
}

// 입력 칸 묶음 (가입 화면과 프로필 화면에서 같이 씀)
export function PayoutAccountFields({ value, onChange, disabled }) {
  const set = (name) => (e) => onChange({ ...value, [name]: e.target.value });
  const corporate = value.holder_type === 'corporate';
  return (
    <div className="payout-fields">
      <div className="form-group">
        <label>은행 *</label>
        <select value={value.bank_code} onChange={set('bank_code')} disabled={disabled}>
          <option value="">은행 선택</option>
          {BANKS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>계좌번호 *</label>
        <input
          type="text"
          inputMode="numeric"
          value={value.account_number}
          onChange={set('account_number')}
          placeholder="숫자만 입력 (- 없이)"
          maxLength={20}
          disabled={disabled}
        />
      </div>
      <div className="form-group">
        <label>예금주 구분 *</label>
        <select value={value.holder_type} onChange={set('holder_type')} disabled={disabled}>
          <option value="personal">개인 · 개인사업자</option>
          <option value="corporate">법인 · 단체(교회 등, 사업자·고유번호 보유)</option>
        </select>
      </div>
      <div className="form-group">
        <label>예금주명 *</label>
        <input
          type="text"
          value={value.holder_name}
          onChange={set('holder_name')}
          placeholder={corporate ? '통장에 표시된 법인·단체명' : '통장에 표시된 예금주 성명'}
          maxLength={60}
          disabled={disabled}
        />
      </div>
      <div className="form-group">
        <label>{corporate ? '사업자등록번호 또는 고유번호 (10자리) *' : '예금주 생년월일 (6자리) *'}</label>
        <input
          type="text"
          inputMode="numeric"
          value={value.holder_info}
          onChange={set('holder_info')}
          placeholder={corporate ? '예: 1234567890' : '예: 900101'}
          maxLength={corporate ? 12 : 6}
          disabled={disabled}
        />
        <p className="help-text">
          지급 전에 페이플 계좌조회로 예금주가 맞는지 확인하는 데에만 사용합니다.
        </p>
      </div>
    </div>
  );
}

// 프로필 화면용: 등록된 계좌를 보여주고 수정할 수 있습니다.
export function PayoutAccountSection({ userId }) {
  const [account, setAccount] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(EMPTY_PAYOUT_ACCOUNT);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from('host_payout_accounts')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (!alive) return;
      setAccount(data || null);
      setLoaded(true);
    })();
    return () => { alive = false; };
  }, [userId]);

  const startEdit = () => {
    setDraft(account
      ? {
          bank_code: account.bank_code,
          account_number: account.account_number,
          holder_name: account.holder_name,
          holder_type: account.holder_type,
          holder_info: account.holder_info,
        }
      : EMPTY_PAYOUT_ACCOUNT);
    setMessage('');
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      await savePayoutAccount(userId, draft);
      const { data } = await supabase.from('host_payout_accounts').select('*').eq('user_id', userId).maybeSingle();
      setAccount(data || null);
      setEditing(false);
      setMessage('지급 계좌가 저장되었습니다.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <p>불러오는 중...</p>;

  return (
    <div className="payout-section">
      <p className="help-text">
        선교사님이 입금한 숙박 실비는 입실이 확인된 뒤 페이플(Payple) 지급대행을 통해 이 계좌로 보내드립니다.
        실비를 받지 않고 무료로만 제공하신다면 등록하지 않으셔도 됩니다.
      </p>
      {!editing && account && (
        <div className="payout-current">
          <p><strong>{account.bank_name}</strong> {maskAccountNumber(account.account_number)}</p>
          <p>예금주 {account.holder_name} ({account.holder_type === 'corporate' ? '법인·단체' : '개인·개인사업자'})</p>
          <p className={account.verified_at ? 'payout-verified' : 'payout-unverified'}>
            {account.verified_at ? '예금주 확인 완료' : '예금주 확인 전 (WEWE가 첫 지급 전에 확인합니다)'}
          </p>
        </div>
      )}
      {!editing && !account && <p className="payout-unverified">아직 등록된 지급 계좌가 없습니다.</p>}
      {editing && <PayoutAccountFields value={draft} onChange={setDraft} disabled={saving} />}
      {message && <p className="payout-message">{message}</p>}
      <div className="payout-actions">
        {editing ? (
          <>
            <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)} disabled={saving}>
              취소
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-primary" onClick={startEdit}>
            {account ? '지급 계좌 변경' : '지급 계좌 등록'}
          </button>
        )}
      </div>
      <style>{`
        .payout-section .help-text { margin-bottom: 0.9rem; }
        .payout-current p { margin: 0.2rem 0; }
        .payout-verified { color: #2f7d4f; font-weight: 600; }
        .payout-unverified { color: #8a6a2f; }
        .payout-message { margin-top: 0.6rem; font-weight: 600; }
        .payout-actions { display: flex; gap: 0.5rem; margin-top: 0.9rem; flex-wrap: wrap; }
      `}</style>
    </div>
  );
}
