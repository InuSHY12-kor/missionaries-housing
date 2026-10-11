import React, { useRef, useState } from 'react';
import { supabase } from '../App';
import RichEmailEditor from './RichEmailEditor';
import { invokeAnnouncement } from '../pages/AnnouncementMail';

// 관리자 회원 목록에서 회원 한 명에게 직접 연락 (2026-10-11).
//   mode "message": 위위스테이 쪽지 보내기 — 받는 사람에게 종 알림이 가고(DB 트리거), 원하면 메일로도 알려줍니다.
//   mode "mail":    개별 메일 보내기 — WEWE 안내 메일 프레임으로 wewe@wewestay.com에서 보냅니다(send-announcement userIds).
// 1:1 업무 연락이라 회원의 이메일 알림 설정과 관계없이 보냅니다.

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function MemberContactModal({ member, mode, adminProfile, onClose }) {
  const editorRef = useRef(null);
  const [text, setText] = useState('');
  const [subject, setSubject] = useState('');
  const [alsoEmail, setAlsoEmail] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const sendMessage = async () => {
    const body = text.trim();
    if (!body) {
      setResult({ type: 'error', text: '쪽지 내용을 입력해주세요.' });
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: adminProfile.id,
        recipient_id: member.id,
        message: body,
      });
      if (error) throw error;
      let note = '쪽지를 보냈습니다. 받는 분에게 종 알림이 표시됩니다.';
      if (alsoEmail) {
        const html = `<p style="margin:0 0 14px;">${escapeHtml(member.full_name || '')}님, WEWE 관리자가 쪽지를 보냈습니다.</p>
<div style="background:#f7f4f0;border-radius:8px;padding:16px;margin:0 0 16px;white-space:pre-wrap;">${escapeHtml(body)}</div>
<p style="margin:0;"><a href="https://wewestay.com/stay/messages" style="color:#b8622c;font-weight:700;">위위스테이 쪽지함에서 답장하기 →</a></p>`;
        await invokeAnnouncement({ userIds: [member.id], subject: 'WEWE 관리자의 쪽지가 도착했습니다', html });
        note += ' 메일로도 알려드렸습니다.';
      }
      setResult({ type: 'ok', text: note });
      setText('');
    } catch (err) {
      setResult({ type: 'error', text: '보내지 못했습니다: ' + err.message });
    } finally {
      setBusy(false);
    }
  };

  const sendMail = async () => {
    const html = editorRef.current?.getHtml() || '';
    if (!subject.trim()) {
      setResult({ type: 'error', text: '제목을 입력해주세요.' });
      return;
    }
    if (!window.confirm(`${member.full_name || member.email}님(${member.email})에게 메일을 보낼까요?`)) return;
    setBusy(true);
    setResult(null);
    try {
      const data = await invokeAnnouncement({ userIds: [member.id], subject: subject.trim(), html });
      if (!data.sent) throw new Error('보내지 못했습니다.');
      setResult({ type: 'ok', text: `${member.email}(으)로 메일을 보냈습니다.` });
    } catch (err) {
      setResult({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const isMail = mode === 'mail';

  return (
    <div className="mcm-overlay" role="dialog" aria-modal="true" onClick={busy ? undefined : onClose}>
      <div className="mcm-box" onClick={(e) => e.stopPropagation()}>
        <h2>{isMail ? '메일 보내기' : '쪽지 보내기'}</h2>
        <p className="mcm-to">
          받는 사람: <b>{member.full_name || '이름 없음'}</b> ({member.email})
        </p>

        {isMail ? (
          <>
            <label className="mcm-field">
              <span>제목</span>
              <input type="text" value={subject} maxLength={150} onChange={(e) => setSubject(e.target.value)} placeholder="예: 가입 서류 보완 안내" />
            </label>
            <div className="mcm-field">
              <span>내용 (WEWE 안내 메일 모양으로 보내집니다)</span>
              <RichEmailEditor ref={editorRef} minHeight={200} placeholder="안녕하세요, WEWE입니다." onError={(t) => setResult({ type: 'error', text: t })} />
            </div>
          </>
        ) : (
          <>
            <label className="mcm-field">
              <span>쪽지 내용</span>
              <textarea rows={6} value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} placeholder="회원에게 보낼 쪽지를 적어주세요. 받는 분은 위위스테이 쪽지함에서 답장할 수 있습니다." />
            </label>
            <label className="mcm-check">
              <input type="checkbox" checked={alsoEmail} onChange={(e) => setAlsoEmail(e.target.checked)} />
              메일로도 쪽지가 왔다고 알려주기
            </label>
          </>
        )}

        {result && <p className={`mcm-result ${result.type}`}>{result.text}</p>}

        <div className="mcm-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>닫기</button>
          <button type="button" className="btn btn-primary" onClick={isMail ? sendMail : sendMessage} disabled={busy}>
            {busy ? '보내는 중...' : isMail ? '메일 보내기' : '쪽지 보내기'}
          </button>
        </div>
      </div>

      <style>{`
        .mcm-overlay { position: fixed; inset: 0; background: rgba(20, 20, 18, 0.55); display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 2000; }
        .mcm-box { background: #fff; border-radius: 14px; padding: 1.5rem; width: 100%; max-width: 620px; max-height: calc(100vh - 32px); overflow-y: auto; word-break: keep-all; text-align: left; }
        .mcm-box h2 { margin: 0 0 0.4rem; font-size: 1.25rem; }
        .mcm-to { margin: 0 0 1rem; color: #5f5a50; font-size: 0.95rem; overflow-wrap: anywhere; }
        .mcm-field { display: block; margin-bottom: 0.9rem; }
        .mcm-field > span { display: block; font-weight: 700; font-size: 0.92rem; margin-bottom: 0.4rem; }
        .mcm-field input, .mcm-field textarea { width: 100%; padding: 0.65rem 0.8rem; border: 1px solid #ddd6c8; border-radius: 8px; font-size: 1rem; font-family: inherit; }
        .mcm-check { display: flex; align-items: center; gap: 0.45rem; font-size: 0.92rem; margin-bottom: 0.8rem; cursor: pointer; }
        .mcm-result { padding: 0.7rem 0.9rem; border-radius: 8px; font-weight: 600; font-size: 0.92rem; }
        .mcm-result.ok { background: #eef7f0; color: #2f6b45; }
        .mcm-result.error { background: #fdeeee; color: #8a1f1f; }
        .mcm-actions { display: flex; justify-content: flex-end; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem; }
      `}</style>
    </div>
  );
}

export default MemberContactModal;
