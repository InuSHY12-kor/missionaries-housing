import React, { useState } from 'react';
import { supabase } from '../App';

// 관리자 전용 "메일 발송 테스트" (2026-10-10) — 로그인한 관리자 본인 주소로 테스트 메일을 보내고,
// 메일 서버(Gmail)가 받아들였는지와 흔한 문제(보내는 계정과 같은 주소)를 바로 알려줍니다.
// 서버: send-email type "test_email"
function TestEmailButton() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const send = async () => {
    setBusy(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('send-email', { body: { type: 'test_email' } });
      if (error) {
        let msg = error.message;
        try {
          const ctx = await error.context?.json();
          if (ctx?.error) msg = ctx.error;
        } catch (e) {
          // 기본 메시지 사용
        }
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      setResult({ ok: true, ...data });
    } catch (err) {
      setResult({ ok: false, error: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="test-email">
      <button type="button" className="btn btn-secondary" onClick={send} disabled={busy}>
        {busy ? '보내는 중...' : '테스트 메일 보내기 (관리자)'}
      </button>
      {result && (
        <div className={`test-email-result ${result.ok ? 'ok' : 'fail'}`}>
          {result.ok ? (
            <>
              <p><b>{result.to}</b>(으)로 보냈고, 메일 서버가 정상적으로 받아들였습니다{result.rejected?.length ? ` (거절: ${result.rejected.join(', ')})` : ''}.</p>
              {result.sameAsSender ? (
                <p className="test-email-warn">
                  이 주소는 사이트가 메일을 보내는 Gmail 계정과 같습니다. Gmail은 자기 자신에게 보낸 메일을
                  받은편지함이 아니라 <b>보낸편지함·전체보관함</b>에만 둡니다. 알림을 받을 주소를 다른 메일로 바꾸거나,
                  메일 발송용 계정을 따로 만들어 주세요.
                </p>
              ) : (
                <p>1~2분 안에 받은편지함을 확인해 주세요. 없으면 스팸함·프로모션 탭·전체보관함도 확인해 주세요.</p>
              )}
            </>
          ) : (
            <p>보내지 못했습니다: {result.error}</p>
          )}
        </div>
      )}
      <style>{`
        .test-email { margin-top: 1rem; }
        .test-email-result { margin-top: 0.75rem; padding: 0.8rem 1rem; border-radius: 8px; font-size: 0.9rem; line-height: 1.6; word-break: keep-all; }
        .test-email-result p { margin: 0 0 0.3rem; }
        .test-email-result.ok { background: #eef7f0; border: 1px solid #b9dcc3; }
        .test-email-result.fail { background: #fdeeee; border: 1px solid #f0bcbc; color: #8a1f1f; }
        .test-email-warn { color: #8a5a12; font-weight: 600; }
      `}</style>
    </div>
  );
}

export default TestEmailButton;
