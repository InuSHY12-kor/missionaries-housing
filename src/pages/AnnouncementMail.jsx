import React, { useEffect, useRef, useState } from 'react';
import {
  Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Link as LinkIcon, Image as ImageIcon, Eraser, Send, Eye, ArrowLeft,
} from 'lucide-react';
import { supabase } from '../App';

// 관리자 "공지 메일 보내기" (2026-10-10).
// 받는 대상(선교사·숙소 제공자·후원자, 복수 선택)과 제목·본문을 쓰면, 서버(send-announcement)가
// WEWE 안내 메일 프레임으로 감싸 wewe@wewestay.com에서 한 명씩 보냅니다. 이메일 알림을 끈 회원은 제외.
// 편집기는 별도 라이브러리 없이 브라우저 기본 편집 기능(contentEditable)으로 만들었습니다 —
// 글자 굵기·색·크기, 목록, 정렬, 링크, 이미지(사이트 저장소 site-assets에 올린 뒤 주소로 삽입).

const AUDIENCES = [
  { key: 'missionary', label: '선교사' },
  { key: 'host', label: '숙소 제공자' },
  { key: 'supporter', label: '후원자' },
];

const FONT_SIZES = [
  { value: '2', label: '작게' },
  { value: '3', label: '보통' },
  { value: '5', label: '크게' },
  { value: '6', label: '아주 크게' },
];

async function invokeAnnouncement(body) {
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
  const fileRef = useRef(null);
  const [roles, setRoles] = useState([]);
  const [subject, setSubject] = useState('');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    try {
      document.execCommand('styleWithCSS', false, true);
    } catch (e) {
      // 일부 브라우저는 지원하지 않음 — 기본 동작 사용
    }
  }, []);

  const toggleRole = (key) => {
    setRoles((prev) => (prev.includes(key) ? prev.filter((r) => r !== key) : [...prev, key]));
  };

  const exec = (command, value = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  };

  const addLink = () => {
    const url = window.prompt('연결할 주소를 입력하세요 (https://...)', 'https://');
    if (url && /^https?:\/\//i.test(url)) exec('createLink', url);
  };

  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: '이미지 파일만 넣을 수 있습니다.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: '이미지는 5MB 이하로 올려주세요.' });
      return;
    }
    setBusy('image');
    try {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
      const path = `mail/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('site-assets').upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from('site-assets').getPublicUrl(path);
      exec('insertHTML', `<img src="${data.publicUrl}" alt="" style="max-width:100%;height:auto;border-radius:8px;" />`);
    } catch (err) {
      setMessage({ type: 'error', text: '이미지를 올리지 못했습니다: ' + err.message });
    } finally {
      setBusy('');
    }
  };

  const getHtml = () => editorRef.current?.innerHTML || '';

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
        <div className="am-toolbar" role="toolbar" aria-label="글 꾸미기">
          <select defaultValue="" onChange={(e) => { if (e.target.value) exec('fontSize', e.target.value); e.target.value = ''; }} aria-label="글자 크기">
            <option value="">글자 크기</option>
            {FONT_SIZES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <button type="button" title="굵게" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')}><Bold size={16} /></button>
          <button type="button" title="기울임" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')}><Italic size={16} /></button>
          <button type="button" title="밑줄" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('underline')}><Underline size={16} /></button>
          <label className="am-color" title="글자 색">
            <span style={{ borderBottomColor: '#d97b3f' }}>A</span>
            <input type="color" defaultValue="#d97b3f" onChange={(e) => exec('foreColor', e.target.value)} />
          </label>
          <label className="am-color" title="배경 색">
            <span className="am-hilite">A</span>
            <input type="color" defaultValue="#fdf3cf" onChange={(e) => exec('hiliteColor', e.target.value)} />
          </label>
          <span className="am-sep" />
          <button type="button" title="글머리 목록" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertUnorderedList')}><List size={16} /></button>
          <button type="button" title="번호 목록" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertOrderedList')}><ListOrdered size={16} /></button>
          <button type="button" title="왼쪽 정렬" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyLeft')}><AlignLeft size={16} /></button>
          <button type="button" title="가운데 정렬" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyCenter')}><AlignCenter size={16} /></button>
          <button type="button" title="오른쪽 정렬" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyRight')}><AlignRight size={16} /></button>
          <span className="am-sep" />
          <button type="button" title="링크" onMouseDown={(e) => e.preventDefault()} onClick={addLink}><LinkIcon size={16} /></button>
          <button type="button" title="이미지 넣기" onClick={() => fileRef.current?.click()} disabled={busy === 'image'}><ImageIcon size={16} /></button>
          <button type="button" title="서식 지우기" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('removeFormat')}><Eraser size={16} /></button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={uploadImage} />
        </div>
        <div
          ref={editorRef}
          className="am-editor"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="메일 내용"
          data-placeholder="안녕하세요, WEWE입니다. 전하고 싶은 소식을 적어주세요."
        />
        {busy === 'image' && <p className="am-hint">이미지를 올리는 중...</p>}
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
        .am-back { display: inline-flex; align-items: center; gap: 0.35rem; background: none; border: none; color: #7f8c8d; cursor: pointer; padding: 0; margin-bottom: 1rem; font-size: 0.92rem; }
        .am-back:hover { color: #d97b3f; }
        .am-title { margin: 0 0 0.4rem; font-size: 1.35rem; }
        .am-desc { color: #5f5a50; margin: 0 0 1.25rem; line-height: 1.7; font-size: 0.95rem; }
        .am-field { display: block; margin-bottom: 1.1rem; }
        .am-label { display: block; font-weight: 700; margin-bottom: 0.45rem; font-size: 0.95rem; }
        .am-audiences { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .am-audience { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.55rem 0.95rem; border: 1.5px solid #ddd6c8; border-radius: 999px; cursor: pointer; font-weight: 600; background: #fff; }
        .am-audience.on { border-color: #d97b3f; background: #fff4ea; color: #a8551f; }
        .am-subject { width: 100%; padding: 0.7rem 0.85rem; border: 1px solid #ddd6c8; border-radius: 8px; font-size: 1rem; }
        .am-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem; padding: 0.45rem; border: 1px solid #ddd6c8; border-bottom: none; border-radius: 8px 8px 0 0; background: #faf8f4; }
        .am-toolbar button { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border: none; background: transparent; border-radius: 6px; cursor: pointer; color: #3a3a36; }
        .am-toolbar button:hover { background: #efe9df; }
        .am-toolbar select { height: 34px; border: 1px solid #ddd6c8; border-radius: 6px; padding: 0 0.4rem; background: #fff; }
        .am-color { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 6px; cursor: pointer; font-weight: 800; }
        .am-color:hover { background: #efe9df; }
        .am-color span { border-bottom: 3px solid #d97b3f; line-height: 1.1; }
        .am-color .am-hilite { background: #fdf3cf; border-bottom: none; padding: 0 3px; }
        .am-color input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
        .am-sep { width: 1px; height: 22px; background: #ddd6c8; margin: 0 0.25rem; }
        .am-editor { min-height: 280px; padding: 1rem 1.1rem; border: 1px solid #ddd6c8; border-radius: 0 0 8px 8px; background: #fff; line-height: 1.75; font-size: 0.98rem; outline: none; overflow-wrap: anywhere; }
        .am-editor:focus { border-color: #d97b3f; }
        .am-editor:empty::before { content: attr(data-placeholder); color: #a8a296; }
        .am-editor img { max-width: 100%; height: auto; }
        .am-hint { color: #7f8c8d; font-size: 0.88rem; margin: 0.4rem 0 0; }
        .am-message { padding: 0.75rem 1rem; border-radius: 8px; font-weight: 600; }
        .am-message.ok { background: #eef7f0; color: #2f6b45; }
        .am-message.error { background: #fdeeee; color: #8a1f1f; }
        .am-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
        .am-actions .btn { display: inline-flex; align-items: center; gap: 0.35rem; }
        .am-preview { margin-top: 1.5rem; border: 1px solid #e5e2da; border-radius: 12px; overflow: hidden; }
        .am-preview-head { display: flex; align-items: center; gap: 0.5rem; padding: 0.7rem 1rem; background: #faf6ef; font-size: 0.92rem; flex-wrap: wrap; }
        .am-preview-close { margin-left: auto; background: none; border: 1px solid #ddd6c8; border-radius: 6px; padding: 0.25rem 0.7rem; cursor: pointer; }
        .am-preview iframe { width: 100%; height: 640px; border: 0; background: #eef0ee; }
      `}</style>
    </div>
  );
}

export default AnnouncementMail;
