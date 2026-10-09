import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { ArrowDown, ArrowUp, ImagePlus, Pencil, Plus, RotateCcw, Save, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../App';
import { useWeweAdmin } from '../wewe/useWeweAdmin';

// ───────────────────────────────────────────────────────────────────────────────
// 관리자 편집 모드 (2026-10-09)
//
// WEWE(WeweSite)와 WEWE STAY(App) 양쪽에서, 승인된 관리자에게만 보이는 "편집 모드" 버튼을 켜면
//   - 모든 페이지의 상단 배너: "배너 수정" 버튼 → 사진(추가·삭제·순서·업로드)과 배너 문구 수정
//   - 주요 문구(<EditableText>로 감싼 제목·본문): 점선 테두리 → 눌러서 바로 수정
// 을 할 수 있습니다. 수정 내용은 Supabase site_content에 페이지별로 저장됩니다.
//   key  = "page:<site>:<경로>"  (예: page:wewe:/about, page:stay:/)
//   data = { hero: { eyebrow, title, subtitle, images: [url...] }, text: { [문구 id]: "내용" } }
// 저장하지 않은 항목은 코드에 적힌 기본값이 그대로 보이고, "기본값으로 되돌리기"로 언제든 원래대로
// 돌아갑니다. 저장·업로드 권한은 서버(RLS: is_admin())에서 승인된 관리자만 허용합니다.
//
// 문구 서식: **굵게** 로 감싸면 굵은 글씨, 줄바꿈(Enter)은 그대로 줄바꿈으로 표시됩니다.
// (HTML은 해석하지 않고 모두 글자로 표시 — 안전을 위해)
// ───────────────────────────────────────────────────────────────────────────────

const EditModeContext = createContext(null);

const PAGE_KEY_PREFIX = 'page:';

function normalizePath(pathname) {
  if (!pathname) return '/';
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

// 배너 사진 주소 검사 — https 주소만, CSS url() 안에 넣어도 안전한 문자만 허용합니다.
export function isSafeImageUrl(url) {
  return typeof url === 'string' && /^https:\/\/[^\s"'()<>\\]+$/i.test(url.trim());
}

export function EditModeProvider({ site, children }) {
  const { isAdmin, userId } = useWeweAdmin();
  const [editMode, setEditMode] = useState(false);
  const [pages, setPages] = useState({});
  const [loaded, setLoaded] = useState(false);

  // 사이트의 페이지별 수정 내용을 한 번에 불러옵니다(페이지 이동 시 다시 불러오지 않음).
  useEffect(() => {
    let mounted = true;
    supabase
      .from('site_content')
      .select('key, data')
      .like('key', `${PAGE_KEY_PREFIX}${site}:%`)
      .then(({ data, error }) => {
        if (!mounted) return;
        if (!error && Array.isArray(data)) {
          const map = {};
          data.forEach((row) => {
            map[row.key] = row.data && typeof row.data === 'object' ? row.data : {};
          });
          setPages(map);
        }
        setLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, [site]);

  // 관리자 권한을 잃으면(로그아웃 등) 편집 모드도 즉시 꺼집니다.
  useEffect(() => {
    if (!isAdmin) setEditMode(false);
  }, [isAdmin]);

  const savePage = useCallback(async (pageKey, updater) => {
    const key = `${PAGE_KEY_PREFIX}${site}:${pageKey}`;
    const current = pages[key] || {};
    const next = updater(current);
    const { error } = await supabase.from('site_content').upsert({
      key,
      data: next,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    });
    if (error) throw error;
    setPages((prev) => ({ ...prev, [key]: next }));
  }, [pages, site, userId]);

  const value = useMemo(() => ({
    site,
    isAdmin,
    editing: isAdmin && editMode,
    setEditMode,
    pages,
    loaded,
    savePage,
  }), [site, isAdmin, editMode, pages, loaded, savePage]);

  return (
    <EditModeContext.Provider value={value}>
      {children}
      {isAdmin && <EditModeToggle />}
      <EditModeStyles />
    </EditModeContext.Provider>
  );
}

// 현재 페이지의 수정 내용과 저장 함수를 돌려줍니다. Provider 밖에서는 편집 기능 없이 기본값만.
export function usePageContent() {
  const ctx = useContext(EditModeContext);
  const location = useLocation();
  const pageKey = normalizePath(location.pathname);

  return useMemo(() => {
    if (!ctx) {
      return { data: {}, loaded: true, editing: false, save: async () => {}, pageKey };
    }
    const data = ctx.pages[`${PAGE_KEY_PREFIX}${ctx.site}:${pageKey}`] || {};
    return {
      data,
      loaded: ctx.loaded,
      editing: ctx.editing,
      save: (updater) => ctx.savePage(pageKey, updater),
      pageKey,
    };
  }, [ctx, pageKey]);
}

// 배너 기본값 + 저장된 수정 내용을 합친 결과. ready는 수정 내용을 불러왔는지 여부(깜빡임 방지용).
export function useHero(defaults) {
  const { data, loaded } = usePageContent();
  const hero = data.hero || {};
  const images = Array.isArray(hero.images) ? hero.images.filter(isSafeImageUrl) : [];
  return {
    eyebrow: typeof hero.eyebrow === 'string' ? hero.eyebrow : defaults.eyebrow,
    title: typeof hero.title === 'string' && hero.title.trim() ? hero.title : defaults.title,
    subtitle: typeof hero.subtitle === 'string' ? hero.subtitle : defaults.subtitle,
    images: images.length > 0 ? images : (defaults.images || []),
    ready: loaded,
  };
}

// **굵게** 와 줄바꿈만 해석하는 아주 작은 서식 렌더러 (HTML은 해석하지 않음).
export function renderRich(text) {
  const lines = String(text ?? '').split('\n');
  return lines.map((line, li) => {
    const parts = line.split(/\*\*(.+?)\*\*/g);
    return (
      // eslint-disable-next-line react/no-array-index-key
      <React.Fragment key={li}>
        {parts.map((part, pi) => (pi % 2 === 1
          // eslint-disable-next-line react/no-array-index-key
          ? <strong key={pi}>{part}</strong>
          // eslint-disable-next-line react/no-array-index-key
          : <React.Fragment key={pi}>{part}</React.Fragment>))}
        {li < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

// 수정 가능한 문구. children(기본값)은 반드시 글자(문자열)여야 합니다.
export function EditableText({ id, as: Tag = 'p', className = '', children, label, ...rest }) {
  const { data, editing, save } = usePageContent();
  const [open, setOpen] = useState(false);
  const defaultText = typeof children === 'string' ? children : '';
  const override = data.text && typeof data.text[id] === 'string' ? data.text[id] : null;
  const text = override ?? defaultText;

  if (!editing) {
    return <Tag className={className || undefined} {...rest}>{renderRich(text)}</Tag>;
  }

  return (
    <>
      <Tag
        className={`${className} em-editable`.trim()}
        title="눌러서 문구 수정"
        role="button"
        tabIndex={0}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setOpen(true); } }}
        {...rest}
      >
        {renderRich(text)}
        {override !== null && <span className="em-edited-dot" title="수정된 문구" />}
      </Tag>
      {open && (
        <TextEditorModal
          label={label || id}
          initial={text}
          defaultText={defaultText}
          isOverridden={override !== null}
          onClose={() => setOpen(false)}
          onSave={async (value) => {
            await save((cur) => ({ ...cur, text: { ...(cur.text || {}), [id]: value } }));
            setOpen(false);
          }}
          onReset={async () => {
            await save((cur) => {
              const nextText = { ...(cur.text || {}) };
              delete nextText[id];
              return { ...cur, text: nextText };
            });
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

// 배너 안에 놓는 "배너 수정" 버튼 (편집 모드에서만 보임).
export function HeroEditButton({ defaults }) {
  const { data, editing, save } = usePageContent();
  const [open, setOpen] = useState(false);
  if (!editing) return null;

  return (
    <>
      <button
        type="button"
        className="em-hero-btn"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
      >
        <ImageIcon size={16} /> 배너 수정
      </button>
      {open && (
        <HeroEditorModal
          defaults={defaults}
          current={data.hero || null}
          onClose={() => setOpen(false)}
          onSave={async (hero) => {
            await save((cur) => ({ ...cur, hero }));
            setOpen(false);
          }}
          onReset={async () => {
            await save((cur) => {
              const next = { ...cur };
              delete next.hero;
              return next;
            });
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

function EditModeToggle() {
  const ctx = useContext(EditModeContext);
  if (!ctx) return null;
  const on = ctx.editing;
  return (
    <>
      {on && (
        <div className="em-banner" role="status">
          <Pencil size={15} />
          <span>편집 모드 — 점선으로 표시된 문구를 눌러 수정하고, 배너는 <b>배너 수정</b> 버튼으로 바꿀 수 있습니다.</span>
        </div>
      )}
      <button
        type="button"
        className={`em-toggle${on ? ' em-toggle-on' : ''}`}
        onClick={() => ctx.setEditMode(!on)}
        aria-pressed={on}
      >
        <Pencil size={16} />
        {on ? '편집 모드 끄기' : '편집 모드'}
      </button>
    </>
  );
}

function Modal({ title, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="em-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="em-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="em-modal-head">
          <h3>{title}</h3>
          <button type="button" className="em-icon-btn" onClick={onClose} aria-label="닫기"><X size={18} /></button>
        </div>
        <div className="em-modal-body">{children}</div>
        <div className="em-modal-foot">{footer}</div>
      </div>
    </div>,
    document.body
  );
}

function TextEditorModal({ label, initial, defaultText, isOverridden, onClose, onSave, onReset }) {
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (err) {
      setError('저장하지 못했습니다: ' + (err?.message || err));
      setBusy(false);
    }
  };

  return (
    <Modal
      title="문구 수정"
      onClose={onClose}
      footer={(
        <>
          {isOverridden && (
            <button type="button" className="em-btn em-btn-ghost" disabled={busy} onClick={() => run(onReset)}>
              <RotateCcw size={15} /> 기본값으로 되돌리기
            </button>
          )}
          <span className="em-spacer" />
          <button type="button" className="em-btn em-btn-ghost" disabled={busy} onClick={onClose}>취소</button>
          <button
            type="button"
            className="em-btn"
            disabled={busy || !value.trim()}
            onClick={() => run(() => onSave(value.trim()))}
          >
            <Save size={15} /> {busy ? '저장 중...' : '저장하기'}
          </button>
        </>
      )}
    >
      <p className="em-label">{label}</p>
      <textarea
        className="em-textarea"
        rows={Math.min(12, Math.max(3, Math.ceil(value.length / 45)))}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
      />
      <p className="em-help">
        <b>**굵게**</b>처럼 별표 두 개로 감싸면 굵은 글씨가 되고, Enter로 줄을 바꿀 수 있습니다.
      </p>
      {isOverridden && (
        <details className="em-default">
          <summary>원래(기본) 문구 보기</summary>
          <p>{defaultText}</p>
        </details>
      )}
      {error && <p className="em-error">{error}</p>}
    </Modal>
  );
}

function HeroEditorModal({ defaults, current, onClose, onSave, onReset }) {
  const start = {
    eyebrow: typeof current?.eyebrow === 'string' ? current.eyebrow : (defaults.eyebrow || ''),
    title: typeof current?.title === 'string' && current.title.trim() ? current.title : (defaults.title || ''),
    subtitle: typeof current?.subtitle === 'string' ? current.subtitle : (defaults.subtitle || ''),
    images: Array.isArray(current?.images) && current.images.length > 0 ? current.images : (defaults.images || []),
  };
  const [form, setForm] = useState(start);
  const [newUrl, setNewUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const setField = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const setImages = (images) => setForm((p) => ({ ...p, images }));
  const move = (idx, dir) => {
    const next = [...form.images];
    const t = idx + dir;
    if (t < 0 || t >= next.length) return;
    [next[idx], next[t]] = [next[t], next[idx]];
    setImages(next);
  };

  const addUrl = () => {
    const url = newUrl.trim();
    if (!isSafeImageUrl(url)) {
      setError('사진 주소는 https:// 로 시작하는 이미지 주소여야 합니다.');
      return;
    }
    setError('');
    setImages([...form.images, url]);
    setNewUrl('');
  };

  const upload = async (file) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError('배너 사진은 8MB 이하로 올려주세요.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const path = `banners/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('site-assets').upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('site-assets').getPublicUrl(path);
      setImages([...form.images, data.publicUrl]);
    } catch (err) {
      setError('사진을 올리지 못했습니다: ' + (err?.message || err));
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    const images = form.images.map((u) => u.trim()).filter(Boolean);
    if (images.length === 0) {
      setError('배너 사진을 1장 이상 넣어주세요.');
      return;
    }
    const bad = images.find((u) => !isSafeImageUrl(u));
    if (bad) {
      setError('올바르지 않은 사진 주소가 있습니다: ' + bad);
      return;
    }
    if (!form.title.trim()) {
      setError('배너 제목을 입력해주세요.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSave({
        eyebrow: form.eyebrow.trim(),
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        images,
      });
    } catch (err) {
      setError('저장하지 못했습니다: ' + (err?.message || err));
      setBusy(false);
    }
  };

  const resetAll = async () => {
    setBusy(true);
    setError('');
    try {
      await onReset();
    } catch (err) {
      setError('되돌리지 못했습니다: ' + (err?.message || err));
      setBusy(false);
    }
  };

  return (
    <Modal
      title="배너 수정"
      onClose={onClose}
      footer={(
        <>
          {current && (
            <button type="button" className="em-btn em-btn-ghost" disabled={busy} onClick={resetAll}>
              <RotateCcw size={15} /> 기본값으로 되돌리기
            </button>
          )}
          <span className="em-spacer" />
          <button type="button" className="em-btn em-btn-ghost" disabled={busy} onClick={onClose}>취소</button>
          <button type="button" className="em-btn" disabled={busy || uploading} onClick={submit}>
            <Save size={15} /> {busy ? '저장 중...' : '저장하기'}
          </button>
        </>
      )}
    >
      <label className="em-field">
        <span>작은 머리글 (영문 등, 비워두면 표시 안 함)</span>
        <input type="text" value={form.eyebrow} onChange={(e) => setField('eyebrow', e.target.value)} />
      </label>
      <label className="em-field">
        <span>배너 제목</span>
        <input type="text" value={form.title} onChange={(e) => setField('title', e.target.value)} />
      </label>
      <label className="em-field">
        <span>배너 설명 (Enter로 줄바꿈, 비워두면 표시 안 함)</span>
        <textarea rows={3} value={form.subtitle} onChange={(e) => setField('subtitle', e.target.value)} />
      </label>

      <div className="em-field">
        <span>배너 사진 ({form.images.length}장 — 위에서부터 순서대로 넘어갑니다)</span>
        <ul className="em-images">
          {form.images.map((url, idx) => (
            // eslint-disable-next-line react/no-array-index-key
            <li key={`${url}-${idx}`}>
              <span className="em-thumb" style={isSafeImageUrl(url) ? { backgroundImage: `url("${url}")` } : undefined} />
              <input
                type="text"
                value={url}
                onChange={(e) => setImages(form.images.map((u, i) => (i === idx ? e.target.value : u)))}
              />
              <button type="button" className="em-icon-btn" aria-label="위로" onClick={() => move(idx, -1)}><ArrowUp size={15} /></button>
              <button type="button" className="em-icon-btn" aria-label="아래로" onClick={() => move(idx, 1)}><ArrowDown size={15} /></button>
              <button
                type="button"
                className="em-icon-btn em-danger"
                aria-label="삭제"
                onClick={() => setImages(form.images.filter((_, i) => i !== idx))}
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
        <div className="em-add-row">
          <input
            type="text"
            placeholder="사진 주소 붙여넣기 (https://...)"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
          />
          <button type="button" className="em-btn em-btn-ghost" onClick={addUrl}><Plus size={15} /> 주소로 추가</button>
          <label className="em-btn em-btn-ghost em-upload">
            <ImagePlus size={15} /> {uploading ? '올리는 중...' : '사진 올리기'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; upload(f); }}
            />
          </label>
        </div>
        <p className="em-help">가로로 긴 사진(1600px 이상)이 가장 보기 좋습니다. 사진 위에 글씨가 얹히므로 너무 밝은 사진은 피해주세요.</p>
      </div>
      {error && <p className="em-error">{error}</p>}
    </Modal>
  );
}

function EditModeStyles() {
  return (
    <style>{`
      .em-toggle {
        position: fixed;
        left: 16px;
        bottom: 16px;
        z-index: 1200;
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.7rem 1.05rem;
        border: none;
        border-radius: 999px;
        background: #1c1c1a;
        color: #fff;
        font-family: inherit;
        font-size: 0.9rem;
        font-weight: 700;
        box-shadow: 0 8px 22px rgba(0, 0, 0, 0.25);
        cursor: pointer;
      }

      .em-toggle-on {
        background: #146b71;
      }

      .em-banner {
        position: fixed;
        left: 50%;
        bottom: 16px;
        transform: translateX(-50%);
        z-index: 1199;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        max-width: min(680px, calc(100vw - 220px));
        padding: 0.6rem 1rem;
        border-radius: 10px;
        background: #fff8ec;
        border: 1px solid #f0c48f;
        color: #6b4513;
        font-size: 0.85rem;
        line-height: 1.5;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
        word-break: keep-all;
      }

      .em-editable {
        outline: 2px dashed rgba(217, 123, 63, 0.75) !important;
        outline-offset: 4px;
        border-radius: 4px;
        cursor: text !important;
        position: relative;
        transition: background 0.15s ease;
      }

      .em-editable:hover {
        background: rgba(217, 123, 63, 0.1);
      }

      .em-edited-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        margin-left: 6px;
        border-radius: 50%;
        background: #146b71;
        vertical-align: middle;
      }

      .em-hero-btn {
        position: absolute;
        top: 50%;
        right: 16px;
        transform: translateY(-50%);
        z-index: 50;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.6rem 0.95rem;
        border: 2px solid #fff;
        border-radius: 999px;
        background: rgba(217, 123, 63, 0.95);
        color: #fff;
        font-family: inherit;
        font-size: 0.88rem;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
      }

      .em-overlay {
        position: fixed;
        inset: 0;
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        background: rgba(20, 20, 18, 0.55);
      }

      .em-modal {
        width: min(720px, 100%);
        max-height: calc(100vh - 2rem);
        display: flex;
        flex-direction: column;
        border-radius: 14px;
        background: #fff;
        color: #1c1c1a;
        text-align: left;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
        word-break: keep-all;
      }

      .em-modal-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid #e5e2da;
      }

      .em-modal-head h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 800;
        color: #1c1c1a;
      }

      .em-modal-body {
        padding: 1.1rem 1.25rem;
        overflow-y: auto;
      }

      .em-modal-foot {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
        padding: 0.9rem 1.25rem;
        border-top: 1px solid #e5e2da;
      }

      .em-spacer {
        flex: 1;
      }

      .em-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.55rem 0.95rem;
        border: 1.5px solid #146b71;
        border-radius: 8px;
        background: #146b71;
        color: #fff;
        font-family: inherit;
        font-size: 0.88rem;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
      }

      .em-btn:disabled {
        opacity: 0.55;
        cursor: default;
      }

      .em-btn-ghost {
        background: #fff;
        color: #146b71;
      }

      .em-icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        flex-shrink: 0;
        border: 1px solid #e5e2da;
        border-radius: 8px;
        background: #fff;
        color: #4a4a46;
        cursor: pointer;
      }

      .em-danger {
        color: #b3261e;
      }

      .em-label {
        margin: 0 0 0.4rem;
        font-size: 0.8rem;
        font-weight: 700;
        color: #8c8880;
      }

      .em-textarea,
      .em-field input,
      .em-field textarea,
      .em-add-row input,
      .em-images input {
        width: 100%;
        box-sizing: border-box;
        padding: 0.6rem 0.75rem;
        border: 1px solid #d9d5cc;
        border-radius: 8px;
        font-family: inherit;
        font-size: 0.95rem;
        line-height: 1.6;
        color: #1c1c1a;
        background: #fff;
      }

      .em-textarea,
      .em-field textarea {
        resize: vertical;
      }

      .em-field {
        display: block;
        margin-bottom: 1rem;
      }

      .em-field > span {
        display: block;
        margin-bottom: 0.35rem;
        font-size: 0.85rem;
        font-weight: 700;
        color: #4a4a46;
      }

      .em-images {
        list-style: none;
        margin: 0 0 0.6rem;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
      }

      .em-images li {
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }

      .em-images input {
        font-size: 0.8rem;
        padding: 0.45rem 0.6rem;
      }

      .em-thumb {
        width: 84px;
        height: 48px;
        flex-shrink: 0;
        border-radius: 6px;
        background: #eee center / cover no-repeat;
        border: 1px solid #e5e2da;
      }

      .em-add-row {
        display: flex;
        gap: 0.45rem;
        flex-wrap: wrap;
      }

      .em-add-row input {
        flex: 1;
        min-width: 200px;
      }

      .em-upload input {
        display: none;
      }

      .em-help {
        margin: 0.5rem 0 0;
        font-size: 0.82rem;
        line-height: 1.6;
        color: #6b665c;
      }

      .em-default {
        margin-top: 0.75rem;
        font-size: 0.85rem;
        color: #4a4a46;
      }

      .em-default summary {
        cursor: pointer;
        font-weight: 700;
      }

      .em-default p {
        margin: 0.4rem 0 0;
        padding: 0.6rem 0.75rem;
        border-radius: 8px;
        background: #f6f4ef;
        white-space: pre-wrap;
      }

      .em-error {
        margin: 0.75rem 0 0;
        color: #b3261e;
        font-size: 0.88rem;
      }

      @media (max-width: 700px) {
        .em-banner {
          display: none;
        }

        .em-hero-btn {
          top: auto;
          bottom: 56px;
          right: 12px;
          transform: none;
        }

        .em-thumb {
          width: 56px;
          height: 36px;
        }
      }
    `}</style>
  );
}
