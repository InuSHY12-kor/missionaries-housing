import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, ImagePlus, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { supabase } from '../App';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import WevePageHero from './WevePageHero';
import AboutSubNav from './AboutSubNav';
import Reveal from './Reveal';
import HERO_IMAGE_SETS from './heroImages';
import { useWeweAdmin } from './useWeweAdmin';
import hyesungChurchLogo from '../assets/hyesung-church-logo.png';
import lmodsLogo from '../assets/lmods-logo.png';
import fouLogo from '../assets/fou-logo.png';
import hisLogoCream from '../assets/his-logo-cream.png';
import './wewe-shared.css';

// "소개" > "함께하는 사람들" 페이지 (/about/partners, 2026-10-09 신설).
// 감사 인사 + 협력기관·후원기관 + "위로자의 위로자 후원자 명단"을 한 페이지에 모았습니다
// (이전에는 협력·후원기관이 대표·이사회 페이지 하단에 있었습니다).
//
// 내용은 Supabase site_content(key = 'partners_page')에 저장되며, 승인된 관리자에게만 보이는
// "수정하기" 버튼으로 이 화면에서 바로 고칠 수 있습니다. 로고는 사이트 내장 파일("asset:이름") 또는
// 관리자가 올린 이미지(site-assets 버킷의 공개 URL)를 씁니다. 저장·업로드 권한은 서버(RLS)에서
// 관리자만 허용합니다. 수정 중 관리자 권한을 잃으면(로그아웃 등) 곧바로 페이지를 벗어납니다.
const CONTENT_KEY = 'partners_page';

const BUILTIN_LOGOS = {
  hyesung: { src: hyesungChurchLogo, label: '혜성교회 로고' },
  lmods: { src: lmodsLogo, label: '엘모즈 비스포크 로고' },
  fou: { src: fouLogo, label: 'Studio FoU 로고' },
  his: { src: hisLogoCream, label: 'HIS 로고 (크림색)' },
};

const DEFAULT_CONTENT = {
  intro: {
    title: 'WEWE와 함께해 주셔서 감사합니다.',
    body: '지친 목회자와 선교사님들이 다시 일어설 수 있도록, 위로자의 위로자가 되어 함께해 주셔서 감사합니다.',
  },
  partners: [
    { name: '혜성교회', url: 'https://www.hyesung.or.kr/', logo: 'asset:hyesung', bg: '#faf9f6' },
    { name: '엘모즈 비스포크', url: 'https://www.instagram.com/lmods.official/', logo: 'asset:lmods', bg: '#24302a' },
    { name: 'Studio FoU', url: 'https://www.foufilm.com/', logo: 'asset:fou', bg: '#faf9f6' },
  ],
  sponsors: [
    { name: 'History in Scent (HIS)', url: 'https://www.instagram.com/history_in_scent/', logo: 'asset:his', bg: '#3a3128' },
  ],
  supporters: [],
};

const resolveLogo = (logo) => {
  if (typeof logo === 'string' && logo.startsWith('asset:')) {
    return BUILTIN_LOGOS[logo.slice(6)]?.src || null;
  }
  return logo || null;
};

const isSafeUrl = (url) => typeof url === 'string' && /^https?:\/\//i.test(url.trim());
const isHexColor = (c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);

function normalizeOrgs(list) {
  if (!Array.isArray(list)) return [];
  return list.map((o) => ({
    name: String(o?.name ?? ''),
    url: String(o?.url ?? ''),
    logo: String(o?.logo ?? ''),
    bg: isHexColor(o?.bg) ? o.bg : '#faf9f6',
  }));
}

function normalizeContent(data) {
  const src = data && typeof data === 'object' ? data : {};
  return {
    intro: {
      title: typeof src.intro?.title === 'string' ? src.intro.title : DEFAULT_CONTENT.intro.title,
      body: typeof src.intro?.body === 'string' ? src.intro.body : DEFAULT_CONTENT.intro.body,
    },
    partners: Array.isArray(src.partners) ? normalizeOrgs(src.partners) : DEFAULT_CONTENT.partners,
    sponsors: Array.isArray(src.sponsors) ? normalizeOrgs(src.sponsors) : DEFAULT_CONTENT.sponsors,
    supporters: Array.isArray(src.supporters) ? src.supporters.map((s) => String(s)).filter(Boolean) : [],
  };
}

const toDraft = (c) => ({
  introTitle: c.intro.title,
  introBody: c.intro.body,
  partners: c.partners.map((o) => ({ ...o })),
  sponsors: c.sponsors.map((o) => ({ ...o })),
  supportersText: c.supporters.join('\n'),
});

const fromDraft = (d) => ({
  intro: { title: d.introTitle.trim(), body: d.introBody.trim() },
  partners: d.partners.map((o) => ({ ...o, name: o.name.trim(), url: o.url.trim() })).filter((o) => o.name),
  sponsors: d.sponsors.map((o) => ({ ...o, name: o.name.trim(), url: o.url.trim() })).filter((o) => o.name),
  supporters: d.supportersText.split('\n').map((s) => s.trim()).filter(Boolean),
});

function OrgCard({ org }) {
  const logoSrc = resolveLogo(org.logo);
  const inner = logoSrc ? (
    <img src={logoSrc} alt={org.name} className="wpp-org-logo" />
  ) : (
    <span className="wpp-org-fallback">{org.name}</span>
  );

  return (
    <div className="wpp-org">
      {isSafeUrl(org.url) ? (
        <a
          href={org.url}
          target="_blank"
          rel="noopener noreferrer"
          className="wpp-org-card"
          style={{ background: org.bg }}
          aria-label={`${org.name} 바로가기`}
        >
          {inner}
        </a>
      ) : (
        <div className="wpp-org-card" style={{ background: org.bg }}>{inner}</div>
      )}
      <span className="wpp-org-name">{org.name}</span>
    </div>
  );
}

function OrgEditor({ title, list, onChange, uploading, onUpload }) {
  const update = (idx, field, value) => onChange(list.map((o, i) => (i === idx ? { ...o, [field]: value } : o)));
  const move = (idx, dir) => {
    const next = [...list];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="wpp-editor-group">
      <h4 className="wpp-editor-h">{title}</h4>
      {list.map((org, idx) => {
        const logoSrc = resolveLogo(org.logo);
        const isBuiltin = org.logo.startsWith('asset:');
        return (
          // eslint-disable-next-line react/no-array-index-key
          <div className="wpp-editor-org" key={idx}>
            <div className="wpp-editor-preview" style={{ background: org.bg }}>
              {logoSrc ? <img src={logoSrc} alt="" /> : <span>로고 없음</span>}
            </div>
            <div className="wpp-editor-fields">
              <input type="text" placeholder="기관 이름" value={org.name} onChange={(e) => update(idx, 'name', e.target.value)} />
              <input type="url" placeholder="연결할 주소 (https://...)" value={org.url} onChange={(e) => update(idx, 'url', e.target.value)} />
              <div className="wpp-editor-row">
                <select
                  value={isBuiltin ? org.logo : 'custom'}
                  onChange={(e) => { if (e.target.value !== 'custom') update(idx, 'logo', e.target.value); }}
                >
                  {Object.entries(BUILTIN_LOGOS).map(([key, v]) => (
                    <option key={key} value={`asset:${key}`}>{v.label}</option>
                  ))}
                  <option value="custom">{isBuiltin ? '새 이미지 업로드 →' : '업로드한 이미지'}</option>
                </select>
                <label className="wpp-editor-upload">
                  <ImagePlus size={15} /> {uploading === `${title}-${idx}` ? '올리는 중...' : '로고 올리기'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (file) onUpload(file, `${title}-${idx}`, (url) => update(idx, 'logo', url));
                    }}
                  />
                </label>
                <label className="wpp-editor-color">
                  배경색
                  <input type="color" value={org.bg} onChange={(e) => update(idx, 'bg', e.target.value)} />
                </label>
              </div>
            </div>
            <div className="wpp-editor-actions-col">
              <button type="button" aria-label="위로" onClick={() => move(idx, -1)}><ArrowUp size={15} /></button>
              <button type="button" aria-label="아래로" onClick={() => move(idx, 1)}><ArrowDown size={15} /></button>
              <button
                type="button"
                aria-label="삭제"
                className="wpp-danger"
                onClick={() => onChange(list.filter((_, i) => i !== idx))}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        );
      })}
      <button
        type="button"
        className="wpp-editor-add"
        onClick={() => onChange([...list, { name: '', url: '', logo: '', bg: '#faf9f6' }])}
      >
        <Plus size={15} /> 기관 추가
      </button>
    </div>
  );
}

function PartnersPage() {
  const navigate = useNavigate();
  const { isAdmin, userId, checked: adminChecked } = useWeweAdmin();
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase
      .from('site_content')
      .select('data')
      .eq('key', CONTENT_KEY)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!mounted || error || !data) return;
        setContent(normalizeContent(data.data));
      });
    return () => {
      mounted = false;
    };
  }, []);

  // 수정 중에 관리자 권한을 잃으면(로그아웃 포함) 수정 화면을 닫고 곧바로 페이지를 벗어납니다.
  useEffect(() => {
    if (editing && adminChecked && !isAdmin) {
      setEditing(false);
      setDraft(null);
      navigate('/', { replace: true });
    }
  }, [editing, adminChecked, isAdmin, navigate]);

  const startEditing = () => {
    setDraft(toDraft(content));
    setSaveError('');
    setSavedNotice(false);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setDraft(null);
    setSaveError('');
  };

  const handleUpload = async (file, slot, onDone) => {
    if (file.size > 3 * 1024 * 1024) {
      setSaveError('로고 이미지는 3MB 이하로 올려주세요.');
      return;
    }
    setUploading(slot);
    setSaveError('');
    try {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
      const path = `partners/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('site-assets').upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from('site-assets').getPublicUrl(path);
      onDone(data.publicUrl);
    } catch (err) {
      setSaveError('로고를 올리지 못했습니다: ' + (err?.message || err));
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    const next = fromDraft(draft);
    const badUrl = [...next.partners, ...next.sponsors].find((o) => o.url && !isSafeUrl(o.url));
    if (badUrl) {
      setSaveError(`"${badUrl.name}"의 주소는 http:// 또는 https:// 로 시작해야 합니다.`);
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const { error } = await supabase.from('site_content').upsert({
        key: CONTENT_KEY,
        data: next,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      });
      if (error) throw error;
      setContent(normalizeContent(next));
      setEditing(false);
      setDraft(null);
      setSavedNotice(true);
    } catch (err) {
      setSaveError('저장하지 못했습니다: ' + (err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="wewe-page wewe-partners-page">
      <WeweHeader />

      <WevePageHero
        eyebrow="WITH US"
        title="함께하는 사람들"
        subtitle="위로자의 위로자가 되어 주신 교회와 기관, 그리고 후원자 여러분"
        images={HERO_IMAGE_SETS.partners}
      >
        <AboutSubNav active="/about/partners" />
      </WevePageHero>

      <section className="wpp-section">
        <div className="wh-container wh-container-narrow">
          {isAdmin && !editing && (
            <div className="wpp-admin-bar">
              <span>관리자 전용 — 감사 인사, 협력기관·후원기관, 후원자 명단을 수정할 수 있습니다.</span>
              <button type="button" className="wpp-admin-btn" onClick={startEditing}>
                <Pencil size={15} /> 수정하기
              </button>
            </div>
          )}
          {savedNotice && !editing && <p className="wpp-admin-saved">저장되었습니다.</p>}

          {editing && draft ? (
            <div className="wpp-editor">
              <h4 className="wpp-editor-h">감사 인사</h4>
              <input
                type="text"
                value={draft.introTitle}
                placeholder="제목"
                onChange={(e) => setDraft((p) => ({ ...p, introTitle: e.target.value }))}
              />
              <textarea
                rows={3}
                value={draft.introBody}
                placeholder="본문"
                onChange={(e) => setDraft((p) => ({ ...p, introBody: e.target.value }))}
              />

              <OrgEditor
                title="협력기관"
                list={draft.partners}
                onChange={(list) => setDraft((p) => ({ ...p, partners: list }))}
                uploading={uploading}
                onUpload={handleUpload}
              />
              <OrgEditor
                title="후원기관"
                list={draft.sponsors}
                onChange={(list) => setDraft((p) => ({ ...p, sponsors: list }))}
                uploading={uploading}
                onUpload={handleUpload}
              />

              <h4 className="wpp-editor-h">위로자의 위로자 후원자 명단</h4>
              <textarea
                rows={8}
                value={draft.supportersText}
                placeholder={'한 줄에 한 분(또는 한 단체)씩 입력해 주세요.\n예) 홍길동\n예) ○○교회 청년부'}
                onChange={(e) => setDraft((p) => ({ ...p, supportersText: e.target.value }))}
              />

              {saveError && <p className="wpp-editor-error">{saveError}</p>}

              <div className="wpp-editor-actions">
                <button type="button" className="wpp-admin-btn wpp-admin-btn-ghost" onClick={cancelEditing} disabled={saving}>
                  <X size={15} /> 취소
                </button>
                <button type="button" className="wpp-admin-btn" onClick={handleSave} disabled={saving || !!uploading}>
                  <Save size={15} /> {saving ? '저장 중...' : '저장하기'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 감사 인사 */}
              <Reveal as="div" className="wpp-thanks">
                <div className="wpp-thanks-mark">
                  <img src={`${process.env.PUBLIC_URL}/logo512.png`} alt="WEWE 로고" />
                </div>
                <div className="wpp-thanks-text">
                  <h2>{content.intro.title}</h2>
                  <p>{content.intro.body}</p>
                </div>
              </Reveal>

              {/* 협력기관 · 후원기관 */}
              <div className="wpp-block">
                <Reveal>
                  <span className="wh-eyebrow wh-eyebrow-center">PARTNERS &amp; SPONSORS</span>
                  <h2 className="wh-h2-center">협력기관 · 후원기관</h2>
                </Reveal>

                {content.partners.length > 0 && (
                  <Reveal as="div" className="wpp-org-group" delay={40}>
                    <h3 className="wpp-group-title">협력기관</h3>
                    <div className="wpp-org-grid">
                      {content.partners.map((org) => <OrgCard key={`p-${org.name}`} org={org} />)}
                    </div>
                  </Reveal>
                )}

                {content.sponsors.length > 0 && (
                  <Reveal as="div" className="wpp-org-group" delay={80}>
                    <h3 className="wpp-group-title">후원기관</h3>
                    <div className="wpp-org-grid">
                      {content.sponsors.map((org) => <OrgCard key={`s-${org.name}`} org={org} />)}
                    </div>
                  </Reveal>
                )}
              </div>

              {/* 후원자 명단 */}
              <div className="wpp-block">
                <Reveal>
                  <span className="wh-eyebrow wh-eyebrow-center">SUPPORTERS</span>
                  <h2 className="wh-h2-center">위로자의 위로자 후원자 명단</h2>
                </Reveal>

                {content.supporters.length > 0 ? (
                  <Reveal as="ul" className="wpp-supporter-grid" delay={40}>
                    {content.supporters.map((name, idx) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <li key={`${name}-${idx}`}>{name}</li>
                    ))}
                  </Reveal>
                ) : (
                  <p className="wpp-supporter-empty">후원자 명단은 준비 중입니다.</p>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      <WeweFooter />

      <style>{`
        .wewe-partners-page {
          word-break: keep-all;
        }

        .wpp-section {
          padding: 4rem 0 5rem;
          background: var(--wh-bg);
        }

        /* 감사 인사 — 점선 테두리 상자 + 왼쪽 정사각형 WEWE 로고 */
        .wpp-thanks {
          display: grid;
          grid-template-columns: 150px 1fr;
          gap: 2rem;
          align-items: center;
          padding: 2.25rem 2.5rem;
          border: 2px dashed var(--wh-line);
          border-radius: 14px;
          background: var(--wh-bg-soft);
        }

        .wpp-thanks-mark {
          width: 150px;
          aspect-ratio: 1 / 1;
          border-radius: 14px;
          background: #fff;
          border: 1px solid var(--wh-line);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.25rem;
          box-sizing: border-box;
        }

        .wpp-thanks-mark img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .wpp-thanks-text h2 {
          color: var(--wh-ink);
          font-size: 1.55rem;
          font-weight: 800;
          margin: 0 0 0.75rem;
          line-height: 1.45;
        }

        .wpp-thanks-text p {
          margin: 0;
          color: var(--wh-ink);
          font-size: 1.02rem;
          line-height: 1.85;
        }

        .wpp-block {
          margin-top: 4.5rem;
        }

        .wpp-org-group {
          margin-top: 1.5rem;
        }

        .wpp-group-title {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--wh-ink);
          margin: 0 0 1rem;
        }

        .wpp-group-title::before {
          content: '';
          width: 4px;
          height: 1.1em;
          border-radius: 2px;
          background: var(--wh-orange);
        }

        .wpp-org-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1.25rem;
        }

        .wpp-org {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.6rem;
        }

        .wpp-org-card {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 120px;
          padding: 1rem 1.25rem;
          border: 1px solid var(--wh-line);
          border-radius: 12px;
          box-sizing: border-box;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        a.wpp-org-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(28, 28, 22, 0.12);
        }

        .wpp-org-logo {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          display: block;
        }

        .wpp-org-fallback {
          font-weight: 800;
          color: var(--wh-ink);
          text-align: center;
        }

        .wpp-org-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--wh-ink);
          text-align: center;
        }

        /* 후원자 명단 — 한 분씩 칸으로 */
        .wpp-supporter-grid {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 0.75rem;
        }

        .wpp-supporter-grid li {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 64px;
          padding: 0.75rem 1rem;
          border: 1px solid var(--wh-line);
          border-radius: 8px;
          background: #fff;
          color: var(--wh-ink);
          font-size: 1rem;
          font-weight: 600;
          text-align: center;
          line-height: 1.45;
        }

        .wpp-supporter-empty {
          text-align: center;
          color: var(--wh-stone);
          font-size: 0.98rem;
          padding: 2rem 1rem;
          border: 1px dashed var(--wh-line);
          border-radius: 10px;
          margin: 0;
        }

        /* 관리자 편집 */
        .wpp-admin-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          padding: 0.85rem 1.1rem;
          margin-bottom: 1.75rem;
          border: 1px dashed rgba(20, 107, 113, 0.45);
          border-radius: 10px;
          background: rgba(20, 107, 113, 0.05);
          color: var(--wh-teal);
          font-size: 0.88rem;
          font-weight: 600;
        }

        .wpp-admin-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.55rem 1rem;
          border: 1.5px solid var(--wh-teal);
          border-radius: 8px;
          background: var(--wh-teal);
          color: #fff;
          font-family: inherit;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
        }

        .wpp-admin-btn:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .wpp-admin-btn-ghost {
          background: transparent;
          color: var(--wh-teal);
        }

        .wpp-admin-saved {
          text-align: center;
          color: var(--wh-teal);
          font-weight: 700;
          font-size: 0.9rem;
          margin: -0.75rem 0 1.5rem;
        }

        .wpp-editor {
          padding: 1.75rem;
          border: 1px solid var(--wh-line);
          border-radius: 12px;
          background: var(--wh-bg-soft);
        }

        .wpp-editor input[type='text'],
        .wpp-editor input[type='url'],
        .wpp-editor textarea,
        .wpp-editor select {
          width: 100%;
          padding: 0.6rem 0.75rem;
          border: 1px solid var(--wh-line);
          border-radius: 8px;
          background: #fff;
          font-family: inherit;
          font-size: 0.92rem;
          color: var(--wh-ink);
          box-sizing: border-box;
        }

        .wpp-editor textarea {
          margin-top: 0.5rem;
          resize: vertical;
          line-height: 1.6;
        }

        .wpp-editor-h {
          margin: 1.6rem 0 0.75rem;
          color: var(--wh-ink);
          font-size: 1rem;
          font-weight: 800;
        }

        .wpp-editor > .wpp-editor-h:first-child {
          margin-top: 0;
        }

        .wpp-editor-org {
          display: grid;
          grid-template-columns: 120px 1fr auto;
          gap: 0.9rem;
          align-items: start;
          padding: 0.9rem;
          margin-bottom: 0.7rem;
          border: 1px solid var(--wh-line);
          border-radius: 10px;
          background: #fff;
        }

        .wpp-editor-preview {
          height: 80px;
          border-radius: 8px;
          border: 1px solid var(--wh-line);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          box-sizing: border-box;
          font-size: 0.75rem;
          color: var(--wh-stone);
        }

        .wpp-editor-preview img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .wpp-editor-fields {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .wpp-editor-row {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .wpp-editor-row select {
          flex: 1;
          min-width: 160px;
        }

        .wpp-editor-upload,
        .wpp-editor-color {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.45rem 0.7rem;
          border: 1px solid var(--wh-line);
          border-radius: 8px;
          background: #fff;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--wh-ink-soft);
          cursor: pointer;
          white-space: nowrap;
        }

        .wpp-editor-upload input {
          display: none;
        }

        .wpp-editor-color input {
          width: 28px;
          height: 22px;
          padding: 0;
          border: none;
          background: none;
          cursor: pointer;
        }

        .wpp-editor-actions-col {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .wpp-editor-actions-col button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 30px;
          border: 1px solid var(--wh-line);
          border-radius: 6px;
          background: #fff;
          color: var(--wh-ink-soft);
          cursor: pointer;
        }

        .wpp-editor-actions-col .wpp-danger {
          color: #b3261e;
        }

        .wpp-editor-add {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.45rem 0.85rem;
          border: 1px dashed var(--wh-stone);
          border-radius: 8px;
          background: transparent;
          color: var(--wh-ink-soft);
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }

        .wpp-editor-error {
          color: #b3261e;
          font-size: 0.88rem;
          margin: 1rem 0 0;
        }

        .wpp-editor-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.6rem;
          margin-top: 1.5rem;
        }

        @media (max-width: 700px) {
          .wpp-thanks {
            grid-template-columns: 1fr;
            justify-items: center;
            text-align: center;
            padding: 1.75rem 1.4rem;
            gap: 1.25rem;
          }

          .wpp-thanks-mark {
            width: 110px;
          }

          .wpp-thanks-text h2 {
            font-size: 1.3rem;
          }

          .wpp-thanks-text p {
            text-wrap: balance;
          }

          .wpp-org-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.9rem;
          }

          .wpp-org-card {
            height: 96px;
          }

          .wpp-supporter-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .wpp-editor-org {
            grid-template-columns: 1fr;
          }

          .wpp-editor-actions-col {
            flex-direction: row;
          }
        }
      `}</style>
    </div>
  );
}

export default PartnersPage;
