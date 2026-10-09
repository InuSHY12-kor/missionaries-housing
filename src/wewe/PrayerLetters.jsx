import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowDown, ArrowLeft, ArrowUp, ChevronLeft, ChevronRight, ExternalLink, ImagePlus, Image as ImageIcon,
  Maximize2, Minimize2, PenSquare, Pencil, Save, Trash2, X,
} from 'lucide-react';
import { supabase } from '../App';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import WevePageHero from './WevePageHero';
import NewsSubNav from './NewsSubNav';
import HERO_IMAGE_SETS from './heroImages';
import { useWeweAdmin } from './useWeweAdmin';
import './wewe-shared.css';

// ───────────────────────────────────────────────────────────────────────────────
// 사역 소식 > 기도 편지 (2026-10-09 신설)
//   /news/prayer-letters            목록 — 번호·제목·작성자·작성일만 보이는 줄글 게시판(미리보기 없음)
//   /news/prayer-letters/:id        본문 — 줄글 + A4 이미지(누르면 확대, "원본 크기로 보기")
//   /news/prayer-letters/new        관리자 글쓰기
//   /news/prayer-letters/:id/edit   관리자 수정
// 데이터: Supabase prayer_letters (공개 글은 누구나 조회, 작성·수정·삭제는 승인된 관리자만 — RLS).
// 이미지: site-assets 버킷의 prayer-letters/ 폴더(관리자만 업로드).
// 작성자 이름은 관리자가 직접 입력하거나 이전에 쓴 이름 중에서 고를 수 있습니다.
// ───────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;
const LIST_PATH = '/news/prayer-letters';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
};

// 날짜 입력(YYYY-MM-DD) ↔ 저장값. 한국 시간 낮 12시로 저장해 어느 시간대에서도 같은 날짜로 보이게 합니다.
const toDateInput = (iso) => {
  const d = iso ? new Date(iso) : new Date();
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(d);
};
const fromDateInput = (value) => `${value}T12:00:00+09:00`;

const isSafeUrl = (url) => typeof url === 'string' && /^https:\/\/[^\s"'()<>\\]+$/i.test(url);

function PrayerHero({ title, subtitle }) {
  return (
    <WevePageHero
      eyebrow="PRAYER LETTERS"
      title={title || '기도 편지'}
      subtitle={subtitle || 'WEWE와 함께 걸어가는 기도의 이야기를 나눕니다.'}
      images={HERO_IMAGE_SETS.prayer}
    >
      <NewsSubNav active={LIST_PATH} />
    </WevePageHero>
  );
}

// ── 목록 ──────────────────────────────────────────────────────────────────────
export function PrayerLettersListPage() {
  const { isAdmin } = useWeweAdmin();
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    supabase
      .from('prayer_letters')
      .select('id, title, author_name, status, published_at, images')
      .order('published_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setLoadError('기도 편지를 불러오지 못했습니다.');
        else setLetters(data || []);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isAdmin]); // 관리자로 확인되면 임시저장 글까지 다시 불러옵니다

  const totalPages = Math.max(1, Math.ceil(letters.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = letters.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div className="wewe-page wewe-prayer-page">
      <WeweHeader />
      <PrayerHero />

      <section className="pl-section">
        <div className="wh-container wh-container-narrow">
          {isAdmin && (
            <div className="pl-admin-bar">
              <span>관리자 전용</span>
              <Link to={`${LIST_PATH}/new`} className="wh-btn wh-btn-primary">
                <PenSquare size={16} /> 새 기도 편지 쓰기
              </Link>
            </div>
          )}

          {loading ? (
            <p className="pl-status">불러오는 중...</p>
          ) : loadError ? (
            <p className="pl-status">{loadError}</p>
          ) : letters.length === 0 ? (
            <p className="pl-empty">아직 등록된 기도 편지가 없습니다.</p>
          ) : (
            <>
              <div className="pl-board" role="table" aria-label="기도 편지 목록">
                <div className="pl-row pl-row-head" role="row">
                  <span role="columnheader" className="pl-col-no">번호</span>
                  <span role="columnheader" className="pl-col-title">제목</span>
                  <span role="columnheader" className="pl-col-author">작성자</span>
                  <span role="columnheader" className="pl-col-date">작성일</span>
                </div>
                {visible.map((letter, idx) => {
                  const no = letters.length - ((current - 1) * PAGE_SIZE + idx);
                  return (
                    <Link to={`${LIST_PATH}/${letter.id}`} className="pl-row" role="row" key={letter.id}>
                      <span role="cell" className="pl-col-no">{no}</span>
                      <span role="cell" className="pl-col-title">
                        {letter.status === 'draft' && <span className="pl-draft">임시저장</span>}
                        {letter.title}
                        {Array.isArray(letter.images) && letter.images.length > 0 && (
                          <span className="pl-img-count" title={`이미지 ${letter.images.length}장`}>
                            <ImageIcon size={14} /> {letter.images.length}
                          </span>
                        )}
                      </span>
                      <span role="cell" className="pl-col-author">{letter.author_name}</span>
                      <span role="cell" className="pl-col-date">{formatDate(letter.published_at)}</span>
                    </Link>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <nav className="pl-pages" aria-label="페이지">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      type="button"
                      key={n}
                      className={n === current ? 'active' : ''}
                      onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    >
                      {n}
                    </button>
                  ))}
                </nav>
              )}
            </>
          )}
        </div>
      </section>

      <WeweFooter />
      <PrayerStyles />
    </div>
  );
}

// ── 이미지 확대 보기 ───────────────────────────────────────────────────────────
function Lightbox({ images, index, onClose, onMove }) {
  const [original, setOriginal] = useState(false);
  const src = images[index];

  useEffect(() => {
    setOriginal(false);
  }, [index]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && index < images.length - 1) onMove(index + 1);
      if (e.key === 'ArrowLeft' && index > 0) onMove(index - 1);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, images.length, onClose, onMove]);

  return (
    <div className="pl-lightbox" role="dialog" aria-modal="true" aria-label="이미지 확대 보기">
      <div className="pl-lightbox-bar">
        <span>{index + 1} / {images.length}</span>
        <div className="pl-lightbox-actions">
          <button type="button" onClick={() => setOriginal((v) => !v)}>
            {original ? <><Minimize2 size={16} /> 화면에 맞추기</> : <><Maximize2 size={16} /> 원본 크기로 보기</>}
          </button>
          <a href={src} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /> 새 창에서 원본 열기</a>
          <button type="button" onClick={onClose} aria-label="닫기"><X size={18} /> 닫기</button>
        </div>
      </div>
      <div
        className={`pl-lightbox-stage${original ? ' pl-lightbox-original' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        role="presentation"
      >
        <img
          src={src}
          alt={`기도 편지 이미지 ${index + 1}`}
          onClick={() => setOriginal((v) => !v)}
          title={original ? '눌러서 화면에 맞추기' : '눌러서 원본 크기로 보기'}
        />
      </div>
      {index > 0 && (
        <button type="button" className="pl-lightbox-nav pl-lightbox-prev" onClick={() => onMove(index - 1)} aria-label="이전 이미지">
          <ChevronLeft size={28} />
        </button>
      )}
      {index < images.length - 1 && (
        <button type="button" className="pl-lightbox-nav pl-lightbox-next" onClick={() => onMove(index + 1)} aria-label="다음 이미지">
          <ChevronRight size={28} />
        </button>
      )}
    </div>
  );
}

// ── 본문 ──────────────────────────────────────────────────────────────────────
export function PrayerLetterDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useWeweAdmin();
  const [letter, setLetter] = useState(null);
  const [state, setState] = useState('loading'); // loading | ok | missing
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    if (!UUID_RE.test(id || '')) {
      setState('missing');
      return undefined;
    }
    supabase
      .from('prayer_letters')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data) setState('missing');
        else {
          setLetter(data);
          setState('ok');
        }
      });
    return () => {
      active = false;
    };
  }, [id, isAdmin]);

  const images = useMemo(() => (letter?.images || []).filter(isSafeUrl), [letter]);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const handleDelete = async () => {
    if (!window.confirm('이 기도 편지를 삭제할까요? 삭제하면 되돌릴 수 없습니다.')) return;
    setDeleting(true);
    const { error } = await supabase.from('prayer_letters').delete().eq('id', letter.id);
    if (error) {
      window.alert('삭제하지 못했습니다: ' + error.message);
      setDeleting(false);
      return;
    }
    // 이 글에 올렸던 이미지 파일도 정리합니다(실패해도 글 삭제는 이미 완료).
    const paths = images
      .map((url) => url.split('/storage/v1/object/public/site-assets/')[1])
      .filter((p) => p && p.startsWith('prayer-letters/'));
    if (paths.length > 0) {
      await supabase.storage.from('site-assets').remove(paths).catch(() => {});
    }
    navigate(LIST_PATH, { replace: true });
  };

  return (
    <div className="wewe-page wewe-prayer-page">
      <WeweHeader />
      <PrayerHero />

      <section className="pl-section">
        <div className="wh-container wh-container-narrow">
          <Link to={LIST_PATH} className="pl-back"><ArrowLeft size={15} /> 목록으로</Link>

          {state === 'loading' && <p className="pl-status">불러오는 중...</p>}
          {state === 'missing' && <p className="pl-empty">기도 편지를 찾을 수 없습니다.</p>}

          {state === 'ok' && letter && (
            <article className="pl-article">
              <header className="pl-article-head">
                {letter.status === 'draft' && <span className="pl-draft">임시저장 (관리자에게만 보임)</span>}
                <h2>{letter.title}</h2>
                <p className="pl-meta">
                  <span><b>작성자</b> {letter.author_name}</span>
                  <span><b>작성일</b> {formatDate(letter.published_at)}</span>
                </p>
              </header>

              {/* (2026-10-09) 첨부 이미지(A4 편지)를 본문 위에, 한 장씩 본문 폭 가득 세로로 이어서 보여줍니다
                  (1페이지 → 2페이지 순서). 누르면 기존처럼 확대 보기가 열립니다. */}
              {images.length > 0 && (
                <div className="pl-images">
                  {images.map((src, idx) => (
                    <button
                      type="button"
                      // eslint-disable-next-line react/no-array-index-key
                      key={`${idx}-${src}`}
                      className="pl-image"
                      onClick={() => setLightboxIndex(idx)}
                      aria-label={`${idx + 1}페이지 크게 보기`}
                    >
                      <img src={src} alt={`기도 편지 ${idx + 1}페이지`} loading={idx === 0 ? 'eager' : 'lazy'} />
                      {images.length > 1 && <span className="pl-image-page">{idx + 1} / {images.length}</span>}
                      <span className="pl-image-zoom"><Maximize2 size={14} /> 크게 보기</span>
                    </button>
                  ))}
                </div>
              )}

              {letter.content && <div className="pl-content">{letter.content}</div>}

              {isAdmin && (
                <div className="pl-article-admin">
                  <Link to={`${LIST_PATH}/${letter.id}/edit`} className="wh-btn wh-btn-ghost"><Pencil size={15} /> 수정</Link>
                  <button type="button" className="wh-btn pl-danger-btn" onClick={handleDelete} disabled={deleting}>
                    <Trash2 size={15} /> {deleting ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              )}
            </article>
          )}
        </div>
      </section>

      {lightboxIndex !== null && images[lightboxIndex] && (
        <Lightbox images={images} index={lightboxIndex} onClose={closeLightbox} onMove={setLightboxIndex} />
      )}

      <WeweFooter />
      <PrayerStyles />
    </div>
  );
}

// ── 관리자 글쓰기·수정 ─────────────────────────────────────────────────────────
export function PrayerLetterEditorPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { isAdmin, userId, checked } = useWeweAdmin();
  const [form, setForm] = useState({
    title: '',
    author_name: 'WEWE',
    date: toDateInput(),
    content: '',
    images: [],
    status: 'published',
  });
  const [authorOptions, setAuthorOptions] = useState(['WEWE']);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // 관리자가 아니면(권한을 잃은 경우 포함) 곧바로 목록으로 돌려보냅니다.
  useEffect(() => {
    if (checked && !isAdmin) navigate(LIST_PATH, { replace: true });
  }, [checked, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    let active = true;
    supabase.from('prayer_letters').select('author_name').then(({ data }) => {
      if (!active || !data) return;
      const names = Array.from(new Set(['WEWE', ...data.map((r) => r.author_name).filter(Boolean)]));
      setAuthorOptions(names);
    });
    if (isEditing) {
      if (!UUID_RE.test(id)) {
        navigate(LIST_PATH, { replace: true });
        return undefined;
      }
      supabase.from('prayer_letters').select('*').eq('id', id).maybeSingle().then(({ data }) => {
        if (!active) return;
        if (!data) {
          navigate(LIST_PATH, { replace: true });
          return;
        }
        setForm({
          title: data.title || '',
          author_name: data.author_name || 'WEWE',
          date: toDateInput(data.published_at),
          content: data.content || '',
          images: Array.isArray(data.images) ? data.images : [],
          status: data.status || 'published',
        });
        setLoading(false);
      });
    }
    return () => {
      active = false;
    };
  }, [isAdmin, isEditing, id, navigate]);

  const setField = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const moveImage = (idx, dir) => {
    const next = [...form.images];
    const t = idx + dir;
    if (t < 0 || t >= next.length) return;
    [next[idx], next[t]] = [next[t], next[idx]];
    setField('images', next);
  };

  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    const tooBig = files.find((f) => f.size > MAX_IMAGE_BYTES);
    if (tooBig) {
      setError(`"${tooBig.name}" 파일이 너무 큽니다. 이미지는 15MB 이하로 올려주세요.`);
      return;
    }
    setUploading(true);
    setError('');
    try {
      const urls = [];
      for (const file of files) {
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        const path = `prayer-letters/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        // eslint-disable-next-line no-await-in-loop
        const { error: upErr } = await supabase.storage.from('site-assets').upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        urls.push(supabase.storage.from('site-assets').getPublicUrl(path).data.publicUrl);
      }
      setForm((p) => ({ ...p, images: [...p.images, ...urls] }));
    } catch (err) {
      setError('이미지를 올리지 못했습니다: ' + (err?.message || err));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    if (!form.author_name.trim()) {
      setError('작성자 이름을 입력하거나 골라주세요.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
      setError('작성일을 선택해주세요.');
      return;
    }
    if (!form.content.trim() && form.images.length === 0) {
      setError('본문을 쓰거나 이미지를 1장 이상 올려주세요.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      title: form.title.trim(),
      author_name: form.author_name.trim(),
      content: form.content,
      images: form.images,
      status: form.status,
      published_at: fromDateInput(form.date),
      updated_at: new Date().toISOString(),
    };
    try {
      let letterId = id;
      if (isEditing) {
        const { error: upErr } = await supabase.from('prayer_letters').update(payload).eq('id', id);
        if (upErr) throw upErr;
      } else {
        letterId = window.crypto.randomUUID();
        const { error: insErr } = await supabase.from('prayer_letters').insert({ ...payload, id: letterId, created_by: userId });
        if (insErr) throw insErr;
      }
      navigate(`${LIST_PATH}/${letterId}`, { replace: true });
    } catch (err) {
      setError('저장하지 못했습니다: ' + (err?.message || err));
      setSaving(false);
    }
  };

  if (!checked || !isAdmin) {
    return <div style={{ minHeight: '100vh', background: '#1c2f2c' }} aria-busy="true" />;
  }

  return (
    <div className="wewe-page wewe-prayer-page">
      <WeweHeader />
      <PrayerHero title={isEditing ? '기도 편지 수정' : '새 기도 편지 쓰기'} subtitle="관리자 전용 — 저장하면 기도 편지 게시판에 바로 반영됩니다." />

      <section className="pl-section">
        <div className="wh-container wh-container-narrow">
          <Link to={isEditing ? `${LIST_PATH}/${id}` : LIST_PATH} className="pl-back"><ArrowLeft size={15} /> 돌아가기</Link>

          {loading ? (
            <p className="pl-status">불러오는 중...</p>
          ) : (
            <div className="pl-editor">
              <label className="pl-field">
                <span>제목</span>
                <input type="text" value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="기도 편지 제목" />
              </label>

              <div className="pl-field-row">
                <label className="pl-field">
                  <span>작성자</span>
                  <input
                    type="text"
                    list="pl-author-options"
                    value={form.author_name}
                    onChange={(e) => setField('author_name', e.target.value)}
                    placeholder="이름을 입력하거나 목록에서 고르세요"
                  />
                  <datalist id="pl-author-options">
                    {authorOptions.map((name) => <option key={name} value={name} />)}
                  </datalist>
                  <small>이전에 쓴 이름은 입력란을 누르면 목록으로 나옵니다.</small>
                </label>
                <label className="pl-field">
                  <span>작성일</span>
                  <input type="date" value={form.date} onChange={(e) => setField('date', e.target.value)} />
                </label>
                <label className="pl-field">
                  <span>공개 상태</span>
                  <select value={form.status} onChange={(e) => setField('status', e.target.value)}>
                    <option value="published">공개</option>
                    <option value="draft">임시저장 (관리자만 보기)</option>
                  </select>
                </label>
              </div>

              <label className="pl-field">
                <span>본문</span>
                <textarea
                  rows={16}
                  value={form.content}
                  onChange={(e) => setField('content', e.target.value)}
                  placeholder="기도 편지 내용을 입력하세요. 줄바꿈은 그대로 보입니다."
                />
              </label>

              <div className="pl-field">
                <span>이미지 (A4 크기 이미지 권장 — 위에서부터 순서대로 보입니다)</span>
                {form.images.length > 0 && (
                  <ul className="pl-editor-images">
                    {form.images.map((url, idx) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <li key={`${idx}-${url}`}>
                        <img src={url} alt={`첨부 이미지 ${idx + 1}`} />
                        <span className="pl-editor-img-no">{idx + 1}</span>
                        <div className="pl-editor-img-actions">
                          <button type="button" onClick={() => moveImage(idx, -1)} aria-label="앞으로"><ArrowUp size={14} /></button>
                          <button type="button" onClick={() => moveImage(idx, 1)} aria-label="뒤로"><ArrowDown size={14} /></button>
                          <button
                            type="button"
                            className="pl-danger"
                            onClick={() => setField('images', form.images.filter((_, i) => i !== idx))}
                            aria-label="삭제"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <label className="pl-upload">
                  <ImagePlus size={18} /> {uploading ? '올리는 중...' : '이미지 올리기 (여러 장 선택 가능)'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    disabled={uploading}
                    onChange={(e) => { const files = e.target.files; uploadFiles(files); e.target.value = ''; }}
                  />
                </label>
              </div>

              {error && <p className="pl-error">{error}</p>}

              <div className="pl-editor-actions">
                <Link to={isEditing ? `${LIST_PATH}/${id}` : LIST_PATH} className="wh-btn wh-btn-ghost">취소</Link>
                <button type="button" className="wh-btn wh-btn-primary" onClick={handleSave} disabled={saving || uploading}>
                  <Save size={16} /> {saving ? '저장 중...' : '저장하기'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <WeweFooter />
      <PrayerStyles />
    </div>
  );
}

function PrayerStyles() {
  return (
    <style>{`
      .pl-section {
        padding: 3.5rem 0 5rem;
        background: var(--wh-bg);
      }

      .pl-status,
      .pl-empty {
        text-align: center;
        color: var(--wh-stone);
        padding: 3rem 1rem;
        font-size: 1rem;
      }

      .pl-empty {
        border: 1px dashed var(--wh-line);
        border-radius: 12px;
      }

      .pl-admin-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
        padding: 0.75rem 1rem;
        margin-bottom: 1.5rem;
        border: 1px dashed rgba(20, 107, 113, 0.45);
        border-radius: 10px;
        background: rgba(20, 107, 113, 0.05);
        color: var(--wh-teal);
        font-size: 0.88rem;
        font-weight: 700;
      }

      .pl-admin-bar .wh-btn,
      .pl-article-admin .wh-btn,
      .pl-editor-actions .wh-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
      }

      /* 게시판 */
      .pl-board {
        border-top: 2px solid var(--wh-ink);
      }

      .pl-row {
        display: grid;
        grid-template-columns: 64px 1fr 130px 120px;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 0.5rem;
        border-bottom: 1px solid var(--wh-line);
        color: var(--wh-ink);
        text-decoration: none;
        font-size: 0.98rem;
      }

      a.pl-row:hover {
        background: var(--wh-bg-soft);
      }

      a.pl-row:hover .pl-col-title {
        color: var(--wh-teal);
        text-decoration: underline;
      }

      .pl-row-head {
        padding: 0.8rem 0.5rem;
        background: var(--wh-bg-soft);
        color: var(--wh-ink-soft);
        font-size: 0.88rem;
        font-weight: 800;
      }

      .pl-col-no,
      .pl-col-author,
      .pl-col-date {
        text-align: center;
        color: var(--wh-ink-soft);
      }

      .pl-row-head .pl-col-title {
        text-align: center;
      }

      .pl-col-title {
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .pl-col-date {
        font-variant-numeric: tabular-nums;
        font-size: 0.92rem;
      }

      .pl-img-count {
        display: inline-flex;
        align-items: center;
        gap: 0.2rem;
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--wh-stone);
      }

      .pl-draft {
        display: inline-block;
        padding: 0.1rem 0.5rem;
        border-radius: 999px;
        background: rgba(217, 123, 63, 0.14);
        color: var(--wh-orange-deep);
        font-size: 0.75rem;
        font-weight: 800;
      }

      .pl-pages {
        display: flex;
        justify-content: center;
        gap: 0.35rem;
        margin-top: 1.75rem;
      }

      .pl-pages button {
        min-width: 36px;
        height: 36px;
        border: 1px solid var(--wh-line);
        border-radius: 8px;
        background: #fff;
        font-family: inherit;
        font-weight: 700;
        color: var(--wh-ink-soft);
        cursor: pointer;
      }

      .pl-pages button.active {
        background: var(--wh-ink);
        border-color: var(--wh-ink);
        color: #fff;
      }

      /* 본문 */
      .pl-back {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        margin-bottom: 1.25rem;
        color: var(--wh-ink-soft);
        font-size: 0.92rem;
        font-weight: 700;
        text-decoration: none;
      }

      .pl-back:hover {
        color: var(--wh-teal);
      }

      .pl-article-head {
        padding-bottom: 1.1rem;
        margin-bottom: 1.75rem;
        border-top: 2px solid var(--wh-ink);
        border-bottom: 1px solid var(--wh-line);
        padding-top: 1.4rem;
      }

      .pl-article-head h2 {
        margin: 0.3rem 0 0.75rem;
        color: var(--wh-ink);
        font-size: 1.6rem;
        font-weight: 800;
        line-height: 1.45;
      }

      .pl-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem 1.25rem;
        margin: 0;
        color: var(--wh-ink-soft);
        font-size: 0.92rem;
      }

      .pl-meta b {
        color: var(--wh-ink);
        margin-right: 0.35rem;
      }

      .pl-content {
        white-space: pre-wrap;
        color: var(--wh-ink);
        font-size: 1.03rem;
        line-height: 1.95;
        margin-bottom: 2.25rem;
      }

      /* 첨부 이미지 — 한 장(A4 한 페이지)씩 본문 폭 가득, 위에서 아래로 이어서 */
      .pl-images {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        margin-bottom: 2.25rem;
      }

      .pl-image {
        position: relative;
        display: block;
        width: 100%;
        min-height: 200px;
        padding: 0;
        border: 1px solid var(--wh-line);
        border-radius: 6px;
        background: var(--wh-bg-soft);
        overflow: hidden;
        cursor: zoom-in;
        box-shadow: 0 8px 24px rgba(28, 28, 22, 0.1);
      }

      .pl-image img {
        width: 100%;
        height: auto; /* 잘림 없이 원본 비율 그대로(A4면 A4 비율) */
        display: block;
      }

      .pl-image-page {
        position: absolute;
        left: 10px;
        top: 10px;
        padding: 0.25rem 0.65rem;
        border-radius: 999px;
        background: rgba(28, 28, 26, 0.75);
        color: #fff;
        font-size: 0.78rem;
        font-weight: 800;
      }

      .pl-image-zoom {
        position: absolute;
        right: 8px;
        bottom: 8px;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.3rem 0.6rem;
        border-radius: 999px;
        background: rgba(28, 28, 26, 0.75);
        color: #fff;
        font-size: 0.75rem;
        font-weight: 700;
      }

      .pl-article-admin {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        padding-top: 1.25rem;
        border-top: 1px solid var(--wh-line);
      }

      .pl-danger-btn {
        border: 1.5px solid #b3261e;
        color: #b3261e;
        background: #fff;
      }

      /* 확대 보기 */
      .pl-lightbox {
        position: fixed;
        inset: 0;
        z-index: 3000;
        display: flex;
        flex-direction: column;
        background: rgba(12, 12, 10, 0.94);
      }

      .pl-lightbox-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        flex-wrap: wrap;
        padding: 0.7rem 1rem;
        color: #fff;
        font-size: 0.9rem;
        font-weight: 700;
      }

      .pl-lightbox-actions {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
      }

      .pl-lightbox-actions button,
      .pl-lightbox-actions a {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.45rem 0.8rem;
        border: 1px solid rgba(255, 255, 255, 0.35);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
        font-family: inherit;
        font-size: 0.85rem;
        font-weight: 700;
        text-decoration: none;
        cursor: pointer;
      }

      .pl-lightbox-stage {
        flex: 1;
        overflow: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 1rem 1.5rem;
      }

      .pl-lightbox-stage img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        background: #fff;
        cursor: zoom-in;
      }

      .pl-lightbox-original {
        align-items: flex-start;
        justify-content: flex-start;
      }

      .pl-lightbox-original img {
        max-width: none;
        max-height: none;
        margin: 0 auto;
        cursor: zoom-out;
      }

      .pl-lightbox-nav {
        position: fixed;
        top: 50%;
        transform: translateY(-50%);
        width: 48px;
        height: 48px;
        border: none;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.15);
        color: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .pl-lightbox-prev {
        left: 12px;
      }

      .pl-lightbox-next {
        right: 12px;
      }

      /* 글쓰기 */
      .pl-editor {
        padding: 1.75rem;
        border: 1px solid var(--wh-line);
        border-radius: 14px;
        background: var(--wh-bg-soft);
      }

      .pl-field {
        display: block;
        margin-bottom: 1.25rem;
      }

      .pl-field > span {
        display: block;
        margin-bottom: 0.4rem;
        font-size: 0.9rem;
        font-weight: 800;
        color: var(--wh-ink);
      }

      .pl-field small {
        display: block;
        margin-top: 0.3rem;
        font-size: 0.8rem;
        color: var(--wh-stone);
      }

      .pl-field input,
      .pl-field textarea,
      .pl-field select {
        width: 100%;
        box-sizing: border-box;
        padding: 0.65rem 0.8rem;
        border: 1px solid #d9d5cc;
        border-radius: 8px;
        background: #fff;
        font-family: inherit;
        font-size: 0.98rem;
        color: var(--wh-ink);
      }

      .pl-field textarea {
        resize: vertical;
        line-height: 1.8;
      }

      .pl-field-row {
        display: grid;
        grid-template-columns: 1.4fr 1fr 1fr;
        gap: 1rem;
      }

      .pl-editor-images {
        list-style: none;
        margin: 0 0 0.75rem;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
        gap: 0.75rem;
      }

      .pl-editor-images li {
        position: relative;
        aspect-ratio: 210 / 297;
        border: 1px solid var(--wh-line);
        border-radius: 8px;
        background: #fff;
        overflow: hidden;
      }

      .pl-editor-images img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .pl-editor-img-no {
        position: absolute;
        top: 6px;
        left: 6px;
        min-width: 22px;
        height: 22px;
        padding: 0 6px;
        border-radius: 999px;
        background: var(--wh-ink);
        color: #fff;
        font-size: 0.75rem;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .pl-editor-img-actions {
        position: absolute;
        right: 6px;
        bottom: 6px;
        display: flex;
        gap: 0.25rem;
      }

      .pl-editor-img-actions button {
        width: 28px;
        height: 28px;
        border: 1px solid var(--wh-line);
        border-radius: 6px;
        background: #fff;
        color: var(--wh-ink-soft);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .pl-editor-img-actions .pl-danger {
        color: #b3261e;
      }

      .pl-upload {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.7rem 1.1rem;
        border: 1.5px dashed var(--wh-teal);
        border-radius: 10px;
        background: #fff;
        color: var(--wh-teal);
        font-weight: 800;
        font-size: 0.92rem;
        cursor: pointer;
      }

      .pl-upload input {
        display: none;
      }

      .pl-error {
        color: #b3261e;
        font-size: 0.92rem;
        margin: 0.5rem 0 0;
      }

      .pl-editor-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 1.5rem;
      }

      @media (max-width: 700px) {
        .pl-row-head {
          display: none;
        }

        .pl-row {
          grid-template-columns: 1fr auto;
          grid-template-areas:
            "title title"
            "author date";
          gap: 0.35rem 0.75rem;
          padding: 0.9rem 0.25rem;
        }

        .pl-row .pl-col-no {
          display: none;
        }

        .pl-row .pl-col-title {
          grid-area: title;
        }

        .pl-row .pl-col-author {
          grid-area: author;
          text-align: left;
          font-size: 0.85rem;
        }

        .pl-row .pl-col-date {
          grid-area: date;
          font-size: 0.85rem;
        }

        .pl-field-row {
          grid-template-columns: 1fr;
          gap: 0;
        }

        .pl-editor {
          padding: 1.25rem 1rem;
        }

        .pl-article-head h2 {
          font-size: 1.3rem;
        }

        .pl-lightbox-nav {
          width: 40px;
          height: 40px;
        }
      }
    `}</style>
  );
}
