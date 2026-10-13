import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Link as LinkIcon, Image as ImageIcon, Eraser,
} from 'lucide-react';
import { supabase } from '../App';
import { checkUploadFile, contentTypeFor, acceptFor } from '../utils/uploadRules';

// 메일 본문 서식 편집기 (2026-10-10, 공지 메일·회원 개별 메일 공용).
// 별도 라이브러리 없이 브라우저 기본 편집 기능(contentEditable)으로 글자 크기·굵기·색, 목록, 정렬,
// 링크, 이미지(사이트 저장소 site-assets/mail에 올린 뒤 주소로 삽입)를 지원합니다.
// ref.getHtml()로 작성한 HTML을 꺼냅니다.

const FONT_SIZES = [
  { value: '2', label: '작게' },
  { value: '3', label: '보통' },
  { value: '5', label: '크게' },
  { value: '6', label: '아주 크게' },
];

const RichEmailEditor = forwardRef(function RichEmailEditor({ placeholder, minHeight = 280, onError }, ref) {
  const editorRef = useRef(null);
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  useImperativeHandle(ref, () => ({
    getHtml: () => editorRef.current?.innerHTML || '',
    clear: () => { if (editorRef.current) editorRef.current.innerHTML = ''; },
  }));

  useEffect(() => {
    try {
      document.execCommand('styleWithCSS', false, true);
    } catch (e) {
      // 일부 브라우저는 지원하지 않음 — 기본 동작 사용
    }
  }, []);

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
    const problem = checkUploadFile(file, 'site-assets');
    if (problem) {
      onError?.(problem);
      return;
    }
    setUploading(true);
    try {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
      const path = `mail/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('site-assets').upload(path, file, { contentType: contentTypeFor(file) });
      if (error) throw error;
      const { data } = supabase.storage.from('site-assets').getPublicUrl(path);
      exec('insertHTML', `<img src="${data.publicUrl}" alt="" style="max-width:100%;height:auto;border-radius:8px;" />`);
    } catch (err) {
      onError?.('이미지를 올리지 못했습니다: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const keep = (e) => e.preventDefault(); // 버튼을 눌러도 편집기의 선택 영역이 풀리지 않도록

  return (
    <div className="rte">
      <div className="am-toolbar" role="toolbar" aria-label="글 꾸미기">
        <select defaultValue="" onChange={(e) => { if (e.target.value) exec('fontSize', e.target.value); e.target.value = ''; }} aria-label="글자 크기">
          <option value="">글자 크기</option>
          {FONT_SIZES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <button type="button" title="굵게" onMouseDown={keep} onClick={() => exec('bold')}><Bold size={16} /></button>
        <button type="button" title="기울임" onMouseDown={keep} onClick={() => exec('italic')}><Italic size={16} /></button>
        <button type="button" title="밑줄" onMouseDown={keep} onClick={() => exec('underline')}><Underline size={16} /></button>
        <label className="am-color" title="글자 색">
          <span>A</span>
          <input type="color" defaultValue="#d97b3f" onChange={(e) => exec('foreColor', e.target.value)} />
        </label>
        <label className="am-color" title="배경 색">
          <span className="am-hilite">A</span>
          <input type="color" defaultValue="#fdf3cf" onChange={(e) => exec('hiliteColor', e.target.value)} />
        </label>
        <span className="am-sep" />
        <button type="button" title="글머리 목록" onMouseDown={keep} onClick={() => exec('insertUnorderedList')}><List size={16} /></button>
        <button type="button" title="번호 목록" onMouseDown={keep} onClick={() => exec('insertOrderedList')}><ListOrdered size={16} /></button>
        <button type="button" title="왼쪽 정렬" onMouseDown={keep} onClick={() => exec('justifyLeft')}><AlignLeft size={16} /></button>
        <button type="button" title="가운데 정렬" onMouseDown={keep} onClick={() => exec('justifyCenter')}><AlignCenter size={16} /></button>
        <button type="button" title="오른쪽 정렬" onMouseDown={keep} onClick={() => exec('justifyRight')}><AlignRight size={16} /></button>
        <span className="am-sep" />
        <button type="button" title="링크" onMouseDown={keep} onClick={addLink}><LinkIcon size={16} /></button>
        <button type="button" title="이미지 넣기" onClick={() => fileRef.current?.click()} disabled={uploading}><ImageIcon size={16} /></button>
        <button type="button" title="서식 지우기" onMouseDown={keep} onClick={() => exec('removeFormat')}><Eraser size={16} /></button>
        <input ref={fileRef} type="file" accept={acceptFor('site-assets')} hidden onChange={uploadImage} />
      </div>
      <div
        ref={editorRef}
        className="am-editor"
        style={{ minHeight }}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="메일 내용"
        data-placeholder={placeholder}
      />
      {uploading && <p className="am-hint">이미지를 올리는 중...</p>}
      <style>{`
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
        .am-editor { padding: 1rem 1.1rem; border: 1px solid #ddd6c8; border-radius: 0 0 8px 8px; background: #fff; line-height: 1.75; font-size: 0.98rem; outline: none; overflow-wrap: anywhere; text-align: left; }
        .am-editor:focus { border-color: #d97b3f; }
        .am-editor:empty::before { content: attr(data-placeholder); color: #a8a296; }
        .am-editor img { max-width: 100%; height: auto; }
        .am-hint { color: #7f8c8d; font-size: 0.88rem; margin: 0.4rem 0 0; }
      `}</style>
    </div>
  );
});

export default RichEmailEditor;
