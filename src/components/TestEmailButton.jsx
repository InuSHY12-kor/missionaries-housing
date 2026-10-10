import React, { useState } from 'react';
import { supabase } from '../App';

// 관리자 전용 "메일 발송 테스트" (2026-10-10).
//   - 나에게: 로그인한 관리자 본인 주소로 보내고, 메일 서버(Gmail)가 받아들였는지 보여줍니다.
//   - 관리자 전원에게: 실제 관리자 알림 메일과 같은 경로(ADMIN_NOTIFY_EMAIL + 승인된 관리자)로 한 명씩 보내고
//     수신자별 결과를 보여줍니다. 메일 서버가 받아들였는데도 도착하지 않으면, 받는 쪽(Gmail·네이버)이
//     도메인 메일 인증(SPF·DKIM)이 없는 메일을 거부·차단한 경우가 대부분입니다.
// 서버: send-email type "test_email" (allAdmins 옵션)
function TestEmailButton() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const send = async (allAdmins) => {
    if (allAdmins && !window.confirm('승인된 관리자 전원에게 테스트 메일을 보낼까요?')) return;
    setBusy(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('send-email', { body: { type: 'test_email', allAdmins } });
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
      <div className="test-email-buttons">
        <button type="button" className="btn btn-secondary" onClick={() => send(false)} disabled={busy}>
          {busy ? '보내는 중...' : '나에게 테스트 메일'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => send(true)} disabled={busy}>
          관리자 전원에게 테스트 메일
        </button>
      </div>
      {result && (
        <div className={`test-email-result ${result.ok ? 'ok' : 'fail'}`}>
          {!result.ok && <p>보내지 못했습니다: {result.error}</p>}
          {result.ok && result.allAdmins && (
            <>
              <p>메일 서버 결과 (관리자 {result.sent + result.failed}명 중 {result.sent}명 접수):</p>
              <ul>
                {(result.results || []).map((r) => (
                  <li key={r.to}>
                    {r.to} — {r.ok ? `접수됨${r.rejected?.length ? ' (거절됨)' : ''}` : `실패: ${r.error}`}
                  </li>
                ))}
              </ul>
              <p>"접수됨"인데 받은편지함에 없다면, 받는 쪽에서 막힌 것입니다. 발송 계정(wewe@wewestay.com) 받은편지함에 반송 안내 메일이 왔는지 확인해 주세요.</p>
            </>
          )}
          {result.ok && !result.allAdmins && (
            <>
              <p><b>{result.to}</b>(으)로 보냈고, 메일 서버가 정상적으로 받아들였습니다{result.rejected?.length ? ` (거절: ${result.rejected.join(', ')})` : ''}.</p>
              {result.sameAsSender ? (
                <p className="test-email-warn">이 주소는 메일을 보내는 계정 자신이라, 구글 안에서 바로 전달됩니다(다른 주소로의 도착 여부는 확인되지 않음).</p>
              ) : (
                <p>1~2분 안에 받은편지함을 확인해 주세요. 없으면 스팸함·프로모션 탭·전체보관함도 확인해 주세요.</p>
              )}
            </>
          )}
        </div>
      )}
      <style>{`
        .test-email { margin-top: 1rem; }
        .test-email-buttons { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .test-email-result { margin-top: 0.75rem; padding: 0.8rem 1rem; border-radius: 8px; font-size: 0.9rem; line-height: 1.6; word-break: keep-all; }
        .test-email-result p { margin: 0 0 0.3rem; }
        .test-email-result ul { margin: 0 0 0.4rem; padding-left: 1.1rem; word-break: break-all; }
        .test-email-result.ok { background: #eef7f0; border: 1px solid #b9dcc3; }
        .test-email-result.fail { background: #fdeeee; border: 1px solid #f0bcbc; color: #8a1f1f; }
        .test-email-warn { color: #8a5a12; font-weight: 600; }
      `}</style>
    </div>
  );
}

export default TestEmailButton;
