import React, { useRef, useState } from 'react';
import { Send, Eye, ArrowLeft } from 'lucide-react';
import { supabase } from '../App';
import RichEmailEditor from '../components/RichEmailEditor';

// 관리자 "공지 메일 보내기" (2026-10-10).
// 받는 대상(선교사·숙소 제공자·후원자, 복수 선택)과 제목·본문을 쓰면, 서버(send-announcement)가
// WEWE 안내 메일 프레임으로 감싸 wewe@wewestay.com에서 한 명씩 보냅니다. 이메일 알림을 끈 회원은 제외.
// 편집기: components/RichEmailEditor (회원 개별 메일과 공용).

const AUDIENCES = [
  { key: 'missionary', label: '선교사' },
  { key: 'host', label: '숙소 제공자' },
  { key: 'supporter', label: '후원자' },
];

// send-announcement 호출 (회원 개별 메일 MemberContactModal에서도 사용)
export async function invokeAnnouncement(body) {
  const { data, error } = await supabase.functions.invoke('send-announcement', { body });
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
  return data;
}

function AnnouncementMail({ onBack }) {
  const editorRef = useRef(null);
  const [roles, setRoles] = useState([]);
  const [subject, setSubject] = useState('');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState(null);
  const [preview, setPreview] = useState(null);

  const toggleRole = (key) => {
    setRoles((prev) => (prev.includes(key) ? prev.filter((r) => r !== key) : [...prev, key]));
  };

  const getHtml = () => editorRef.current?.getHtml() || '';

  const runPreview = async () => {
    setBusy('preview');
    setMessage(null);
    try {
      const data = await invokeAnnouncement({ subject, roles, html: getHtml(), previewOnly: true });
      setPreview(data);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy('');
    }
  };

  const sendTest = async () => {
    setBusy('test');
    setMessage(null);
    try {
      await invokeAnnouncement({ subject, roles, html: getHtml(), testOnly: true });
      setMessage({ type: 'ok', text: '내 메일 주소로 테스트 메일을 보냈습니다. 받은편지함에서 모양을 확인해 주세요.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy('');
    }
  };

  const sendAll = async () => {
    setBusy('send');
    setMessage(null);
    try {
      const check = await invokeAnnouncement({ subject, roles, html: getHtml(), previewOnly: true });
      const labels = AUDIENCES.filter((a) => roles.includes(a.key)).map((a) => a.label).join(', ');
      if (check.recipientCount === 0) throw new Error('보낼 수 있는 받는 사람이 없습니다.');
      if (!window.confirm(`${labels} ${check.recipientCount}명에게 "${subject}" 메일을 보낼까요?\n보낸 뒤에는 취소할 수 없습니다.`)) {
        setBusy('');
        return;
      }
      const result = await invokeAnnouncement({ subject, roles, html: getHtml() });
      setMessage({
        type: result.failed ? 'error' : 'ok',
        text: `${result.sent}명에게 보냈습니다.${result.failed ? ` 실패 ${result.failed}명: ${result.failedRecipients.join(', ')}` : ''}`,
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="am-wrap">
      <button type="button" className="am-back" onClick={onBack}>
        <ArrowLeft size={16} /> 한눈에 보기로 돌아가기
      </button>
      <h2 className="am-title">공지 메일 보내기</h2>
      <p className="am-desc">
        선택한 회원에게 <b>wewe@wewestay.com</b>에서 WEWE 안내 메일 모양으로 보내집니다. 이메일 알림을 끈 회원은 제외되며,
        받는 사람끼리는 서로의 주소가 보이지 않도록 한 명씩 보냅니다.
      </p>

      <div className="am-field">
        <span className="am-label">받는 대상</span>
        <div className="am-audiences">
          {AUDIENCES.map((a) => (
            <label key={a.key} className={`am-audience ${roles.includes(a.key) ? 'on' : ''}`}>
              <input type="checkbox" checked={roles.includes(a.key)} onChange={() => toggleRole(a.key)} />
              {a.label}
            </label>
          ))}
        </div>
      </div>

      <label className="am-field">
        <span className="am-label">제목</span>
        <input type="text" className="am-subject" value={subject} maxLength={150} onChange={(e) => setSubject(e.target.value)} placeholder="예: 10월 WEWE 소식과 기도 제목" />
      </label>

      <div className="am-field">
        <span className="am-label">내용</span>
        <RichEmailEditor
          ref={editorRef}
          placeholder="안녕하세요, WEWE입니다. 전하고 싶은 소식을 적어주세요."
          onError={(text) => setMessage({ type: 'error', text })}
        />
      </div>

      {message && <p className={`am-message ${message.type}`}>{message.text}</p>}

      <div className="am-actions">
        <button type="button" className="btn btn-secondary" onClick={runPreview} disabled={!!busy}>
          <Eye size={16} /> {busy === 'preview' ? '불러오는 중...' : '미리보기'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={sendTest} disabled={!!busy}>
          {busy === 'test' ? '보내는 중...' : '나에게 테스트 발송'}
        </button>
        <button type="button" className="btn btn-primary" onClick={sendAll} disabled={!!busy || roles.length === 0}>
          <Send size={16} /> {busy === 'send' ? '보내는 중...' : '보내기'}
        </button>
      </div>

      {preview && (
        <div className="am-preview">
          <div className="am-preview-head">
            <b>미리보기</b> — 받는 사람 {preview.recipientCount}명 (이메일 알림을 켠 승인 회원)
            <button type="button" className="am-preview-close" onClick={() => setPreview(null)}>닫기</button>
          </div>
          <iframe title="메일 미리보기" srcDoc={preview.html} sandbox="" />
        </div>
      )}

      <style>{`
        .am-wrap { margin-top: 1.5rem; word-break: keep-all; }
        .am-back { display: inline-flex; align-items: center; gap: 0.35rem; background: none; border: none; color: #6b6b6b; cursor: pointer; padding: 0; margin-bottom: 1rem; font-size: 0.92rem; }
        .am-back:hover { color: #a65424; }
        .am-title { margin: 0 0 0.4rem; font-size: 1.35rem; }
        .am-desc { color: #5f5a50; margin: 0 0 1.25rem; line-height: 1.7; font-size: 0.95rem; }
        .am-field { display: block; margin-bottom: 1.1rem; }
        .am-label { display: block; font-weight: 700; margin-bottom: 0.45rem; font-size: 0.95rem; }
        .am-audiences { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .am-audience { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.55rem 0.95rem; border: 1.5px solid #d4d4d4; border-radius: 6px; cursor: pointer; font-weight: 600; background: #fff; }
        .am-audience.on { border-color: #000000; background: #fafafa; color: #a8551f; }
        .am-subject { width: 100%; padding: 0.7rem 0.85rem; border: 1px solid #d4d4d4; border-radius: 4px; font-size: 1rem; }
        .am-message { padding: 0.75rem 1rem; border-radius: 4px; font-weight: 600; }
        .am-message.ok { background: #eef7f0; color: #2f6b45; }
        .am-message.error { background: #fdeeee; color: #8a1f1f; }
        .am-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
        .am-actions .btn { display: inline-flex; align-items: center; gap: 0.35rem; }
        .am-preview { margin-top: 1.5rem; border: 1px solid #ebebeb; border-radius: 4px; overflow: hidden; }
        .am-preview-head { display: flex; align-items: center; gap: 0.5rem; padding: 0.7rem 1rem; background: #fafafa; font-size: 0.92rem; flex-wrap: wrap; }
        .am-preview-close { margin-left: auto; background: none; border: 1px solid #d4d4d4; border-radius: 6px; padding: 0.25rem 0.7rem; cursor: pointer; }
        .am-preview iframe { width: 100%; height: 640px; border: 0; background: #eef0ee; }
      `}</style>
    </div>
  );
}

export default AnnouncementMail;
