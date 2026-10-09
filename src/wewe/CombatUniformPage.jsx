import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  HeartHandshake,
  Megaphone,
  Ruler,
  Scissors,
  Gift,
  MessageCircle,
  Pencil,
  Plus,
  Trash2,
  Save,
  X,
} from 'lucide-react';
import { supabase } from '../App';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import WevePageHero from './WevePageHero';
import Reveal from './Reveal';
import HERO_IMAGE_SETS from './heroImages';
import { useWeweAdmin } from './useWeweAdmin';
import lmodsGroupPhoto from '../assets/lmods-group.webp';
import lmodsLogo from '../assets/lmods-logo.png';
import './wewe-shared.css';

// "전투복 프로젝트" 상세 페이지 (/about/ministries/combat-uniform, 2026-10-03 신설).
// WEWE_2026_사업계획서 260930.pptx 슬라이드 16-20을 담았습니다. 기존 /about/ministries
// 페이지에는 "개별 지원" 프로그램의 한 줄짜리 카드로만 소개되어 있던 전투복 프로젝트를,
// PPT에 있는 만큼의 깊이(개요 · 왜 전투복인가 · 운영구조 · 진행프로세스 · 성과관리/확장
// 로드맵)로 다루기 위해 별도 페이지로 분리했습니다.
//
// (2026-10-07 개편)
// - 첫 섹션에 제목("프로젝트 개요")이 없던 문제 → 다른 섹션과 같은 eyebrow + 제목 + 리드 추가.
// - 소개 인용문이 사역 소개 페이지(MinistriesPage) 안에만 정의된 .wm-prologue 클래스를 쓰고
//   있어서, 이 페이지로 바로 들어오면 스타일 없이(브라우저 기본 기울임꼴) 흐리게 보이던 문제 →
//   이 페이지 전용 .wcu-intro-quote로 교체.
// - 글씨 크기·굵기·줄간격을 사역 소개 페이지 기준(본문 0.95~0.98rem / 1.8, 카드 제목 1.05rem
//   굵게)에 맞춰 키우고, 한국어 단어가 줄 끝에서 쪼개지지 않도록 word-break: keep-all 적용.
// - 섹션마다 사진 추가(운영 구조는 엘모즈 단체 사진, 인물이 잘리지 않게 3:2로 위아래 여백만
//   잘라 표시) + 엘모즈 로고.
// - "성과관리 & 확장 계획"은 관리자가 이 화면에서 바로 수정할 수 있습니다(site_content 테이블,
//   key = 'combat_uniform_growth'). 저장된 값이 없거나 불러오지 못하면 아래 기본값을 보여줍니다.
const unsplash = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;
const SECTION_PHOTOS = {
  overview: unsplash('1585412459212-8def26f7e84c'), // 작업대 위의 검은 정장 재킷
  why: unsplash('1594938298603-c8148c4dae35'), // 단정하게 갖춰 입은 맞춤 정장
  process: unsplash('1644530186995-27e46f340fb1'), // 줄자 · 가위 · 골무 — 채촌과 재단
  growth: unsplash('1671106642091-086838dc8ab2'), // 줄자를 두른 실패 — 한 땀씩 쌓이는 성과
};

const WHY_CARDS = [
  {
    tag: 'HONOR',
    ko: '존중',
    desc: '보이지 않는 수고를 공동체가 기억하며, 늘 주기만 하던 이들이 ‘받는’ 경험을 통해 위로를 받습니다.',
  },
  {
    tag: 'SUPPORT',
    ko: '지지',
    desc: '모세의 팔을 붙든 아론과 훌처럼, 성도와 후원자가 한 사람의 사역자를 곁에서 붙듭니다.',
  },
  {
    tag: 'MISSION',
    ko: '사명',
    desc: '하나님의 전신갑주를 입고 다시 강단과 현장에 서는 힘을 회복합니다. 레위인을 섬기는 것이 성도의 사명임을 기억하게 합니다.',
  },
];

const OPERATION_FLOW = [
  { no: '①', title: '후원 · 추천', by: '후원자 · 교회', desc: "'전투복 1벌' 후원 참여, 목회자 추천" },
  { no: '②', title: '제작 의뢰', by: 'WEWE', desc: '기획 · 모집 · 선정 · 모금' },
  { no: '③', title: '맞춤 제작', by: '엘모즈', desc: '치수 측정 · 가봉, 맞춤 정장 제작(재능 나눔)' },
  { no: '④', title: '감사 · 스토리', by: '목회자', desc: '맞춤 정장 수령, 세미나 · 소진관리 프로그램 연계' },
  { no: '⑤', title: '선순환', by: 'WEWE', desc: '전달식 운영 · 후속 케어 연계, 다음 기수 후원으로 선순환' },
];

const PROCESS_STEPS = [
  { icon: Megaphone, title: '모집', desc: '인스타그램 카드뉴스, 기독 콘텐츠 채널 협업 홍보' },
  { icon: MessageCircle, title: '선정', desc: '사연 검토 및 심사, 대상자 개별 연락' },
  { icon: Ruler, title: '만남 · 채촌', desc: '엘모즈 매장 방문, 체형과 사역 스타일 상담' },
  { icon: Scissors, title: '제작', desc: '비스포크 공정으로 한 벌씩 맞춤 제작' },
  { icon: Gift, title: '전달 · 축복', desc: '전달식과 함께 기도하고 축복하는 시간' },
  { icon: HeartHandshake, title: '스토리 · 연결', desc: '동의 하에 이야기 공유, 후원자 · 후속 프로그램 연결' },
];

const GROWTH_CONTENT_KEY = 'combat_uniform_growth';

// DB에 값이 없거나 불러오지 못했을 때 보여줄 기본값 (PPT 슬라이드 20 기준)
const DEFAULT_GROWTH = {
  lead: '1기 파일럿을 정례 캠페인으로',
  kpi: [
    { label: '지원 · 추천 수', value: '17' },
    { label: '수혜 목회자 수', value: '1' },
    { label: '수혜자 만족도', value: '– / 5.0' },
    { label: '후속 참여율', value: '–' },
  ],
  roadmap: [
    { stage: 'STAGE 1', title: '파일럿', when: '2026 하반기', items: ['1기 모집 · 선정 · 제작', '운영 매뉴얼 정리', '수혜 스토리 기록'] },
    { stage: 'STAGE 2', title: '정례화', when: '2027', items: ['2개월 1회 진행', "'전투복 1벌 후원' 정기 캠페인", '교회 단위 추천 파트너십'] },
    { stage: 'STAGE 3', title: '확장', when: '2028~', items: ['인원 확장', '선교사 대상으로 확대', '지역별 전달식 · 모임'] },
  ],
};

// DB에서 읽은 JSON을 화면에서 안전하게 쓸 수 있는 모양으로 정리합니다.
function normalizeGrowth(data) {
  const src = data && typeof data === 'object' ? data : {};
  return {
    lead: typeof src.lead === 'string' ? src.lead : DEFAULT_GROWTH.lead,
    kpi: Array.isArray(src.kpi)
      ? src.kpi.map((k) => ({ label: String(k?.label ?? ''), value: String(k?.value ?? '') }))
      : DEFAULT_GROWTH.kpi,
    roadmap: Array.isArray(src.roadmap)
      ? src.roadmap.map((r) => ({
        stage: String(r?.stage ?? ''),
        title: String(r?.title ?? ''),
        when: String(r?.when ?? ''),
        items: Array.isArray(r?.items) ? r.items.map((it) => String(it)) : [],
      }))
      : DEFAULT_GROWTH.roadmap,
  };
}

// 편집 폼에서는 로드맵 항목을 "한 줄에 하나" 텍스트로 다룹니다.
const toDraft = (growth) => ({
  lead: growth.lead,
  kpi: growth.kpi.map((k) => ({ ...k })),
  roadmap: growth.roadmap.map((r) => ({ ...r, itemsText: r.items.join('\n') })),
});

const fromDraft = (draft) => ({
  lead: draft.lead.trim(),
  kpi: draft.kpi
    .map((k) => ({ label: k.label.trim(), value: k.value.trim() }))
    .filter((k) => k.label || k.value),
  roadmap: draft.roadmap
    .map((r) => ({
      stage: r.stage.trim(),
      title: r.title.trim(),
      when: r.when.trim(),
      items: r.itemsText.split('\n').map((s) => s.trim()).filter(Boolean),
    }))
    .filter((r) => r.stage || r.title || r.when || r.items.length > 0),
});

function CombatUniformPage() {
  const navigate = useNavigate();
  const [growth, setGrowth] = useState(DEFAULT_GROWTH);
  // (2026-10-09) 관리자 확인을 공용 훅으로 — 서버 검증 + 로그인 상태 변화·창 포커스마다 재확인.
  const { isAdmin, userId, checked: adminChecked } = useWeweAdmin();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase
      .from('site_content')
      .select('data')
      .eq('key', GROWTH_CONTENT_KEY)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!mounted || error || !data) return;
        setGrowth(normalizeGrowth(data.data));
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
    setDraft(toDraft(growth));
    setSaveError('');
    setSavedNotice(false);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setDraft(null);
    setSaveError('');
  };

  const updateKpi = (idx, field, value) => {
    setDraft((prev) => ({
      ...prev,
      kpi: prev.kpi.map((k, i) => (i === idx ? { ...k, [field]: value } : k)),
    }));
  };

  const updateStage = (idx, field, value) => {
    setDraft((prev) => ({
      ...prev,
      roadmap: prev.roadmap.map((r, i) => (i === idx ? { ...r, [field]: value } : r)),
    }));
  };

  const handleSave = async () => {
    const next = fromDraft(draft);
    setSaving(true);
    setSaveError('');
    try {
      const { error } = await supabase.from('site_content').upsert({
        key: GROWTH_CONTENT_KEY,
        data: next,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      });
      if (error) throw error;
      setGrowth(normalizeGrowth(next));
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
    <div className="wewe-page wewe-combat-uniform-page">
      <WeweHeader />

      <WevePageHero
        eyebrow="04 · 전투복 프로젝트 (진행 중)"
        title="전투복 프로젝트"
        subtitle="비스포크 테일러링 브랜드 엘모즈와 함께하는 목회자 존중, 회복 캠페인"
        images={HERO_IMAGE_SETS.combatUniform}
      />

      <div className="wh-container wh-container-narrow wcu-breadcrumb">
        <Link to="/about/ministries"><ArrowLeft size={14} /> 사역 소개로 돌아가기</Link>
      </div>

      {/* 개요 */}
      <section className="wcu-section">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <span className="wh-eyebrow wh-eyebrow-center">OVERVIEW</span>
            <h2 className="wh-h2-center">프로젝트 개요</h2>
            <p className="wcu-lead">한 벌의 맞춤 정장으로 전하는 존중과 회복</p>
          </Reveal>

          <Reveal as="blockquote" className="wcu-intro-quote" delay={40}>
            <p>
              목회자에게 정장은 매 주일 강단에 서는 &lsquo;전투복&rsquo;입니다. 그 옷을 지어 드림으로 아론과 훌이
              모세의 팔을 붙들어 올렸듯, 우리는 지친 목회자의 팔을 곁에서 받쳐 드리고자 합니다.
            </p>
            <cite>연결 사업 — Refresh Pastor Academy · 개별 지원</cite>
          </Reveal>

          <Reveal
            as="div"
            className="wh-section-banner"
            style={{ backgroundImage: `url(${SECTION_PHOTOS.overview})` }}
            role="img"
            aria-label="작업대 위의 맞춤 정장 재킷"
            delay={60}
          />

          <div className="wcu-overview-grid wcu-overview-grid-lg">
            <Reveal as="div" className="wcu-overview-card" delay={60}>
              <span className="wcu-overview-tag">WHAT</span>
              <p>목회자의 체형과 사역에 맞춘 맞춤 정장(전투복)을 제작 · 전달합니다.</p>
            </Reveal>
            <Reveal as="div" className="wcu-overview-card" delay={100}>
              <span className="wcu-overview-tag">WHY</span>
              <p>평생 주기만 해온 목회자가 &lsquo;받는 자리&rsquo;에 서는 경험 — 존중, 회복, 그리고 다시 현장으로의
                파송.</p>
            </Reveal>
            <Reveal as="div" className="wcu-overview-card wcu-overview-card-with" delay={140}>
              <div>
                <span className="wcu-overview-tag">WITH</span>
                <p>국내 1위 비스포크 테일러링 브랜드 엘모즈와 채촌부터 제작까지 전문 협업합니다.</p>
              </div>
              <span className="wcu-with-logo">
                <img src={lmodsLogo} alt="엘모즈 비스포크(L'MODS BESPOKE) 로고" />
              </span>
            </Reveal>
            <Reveal as="div" className="wcu-overview-card" delay={180}>
              <span className="wcu-overview-tag">STATUS</span>
              <p>1~2개월에 1회, 기수별로 진행 중입니다. <span className="wh-live-badge">진행 중</span></p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 왜 전투복인가 */}
      <section className="wcu-section wcu-section-soft">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <span className="wh-eyebrow wh-eyebrow-center">WHY &lsquo;COMBAT UNIFORM&rsquo;</span>
            <h2 className="wh-h2-center">왜 &lsquo;전투복&rsquo;인가</h2>
            <p className="wcu-lead">한 벌의 옷에 담긴 세 가지 의미</p>
          </Reveal>

          <Reveal
            as="div"
            className="wh-section-banner"
            style={{ backgroundImage: `url(${SECTION_PHOTOS.why})`, backgroundPosition: 'center 35%' }}
            role="img"
            aria-label="단정하게 갖춰 입은 맞춤 정장"
            delay={40}
          />

          <div className="wcu-why-grid">
            {WHY_CARDS.map((card, idx) => (
              <Reveal as="div" key={card.tag} className="wcu-why-card" delay={idx * 80}>
                <span className="wcu-why-tag">{card.tag}</span>
                <h4>{card.ko}</h4>
                <p>{card.desc}</p>
              </Reveal>
            ))}
          </div>

          <Reveal as="p" className="wcu-quote" delay={100}>
            <strong>&ldquo;목사님, 뒤에는 저희가 있습니다.&rdquo;</strong>
            전투복은 선물이기 이전에, 공동체가 건네는 응원이자 사명의 길입니다.
          </Reveal>
        </div>
      </section>

      {/* 운영 구조 */}
      <section className="wcu-section">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <span className="wh-eyebrow wh-eyebrow-center">HOW IT WORKS</span>
            <h2 className="wh-h2-center">운영 구조</h2>
            <p className="wcu-lead">후원자 · WEWE · 엘모즈 · 목회자가 함께 만드는 한 벌</p>
          </Reveal>

          {/* 엘모즈 단체 사진 — 원본(정사각형)에서 인물이 잘리지 않도록 3:2 비율로 위(천장)·아래(바닥)
              여백만 잘라 보여줍니다(object-position으로 인물 영역에 맞춤). */}
          <Reveal as="figure" className="wcu-partner" delay={40}>
            <img src={lmodsGroupPhoto} alt="엘모즈 비스포크 팀 단체 사진" className="wcu-partner-photo" />
            <figcaption className="wcu-partner-caption">
              <img src={lmodsLogo} alt="엘모즈 비스포크(L'MODS BESPOKE) 로고" className="wcu-partner-logo" />
              <span>
                <strong>함께하는 파트너, 엘모즈 비스포크</strong>
                치수 측정과 가봉부터 맞춤 정장 제작까지, 엘모즈가 재능 나눔으로 한 벌 한 벌을 지어 드립니다.
              </span>
            </figcaption>
          </Reveal>

          <div className="wcu-flow">
            {OPERATION_FLOW.map((step, idx) => (
              <Reveal as="div" key={step.no} className="wcu-flow-card" delay={idx * 70}>
                <span className="wcu-flow-no">{step.no}</span>
                <span className="wcu-flow-by">{step.by}</span>
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 진행 프로세스 */}
      <section className="wcu-section wcu-section-soft">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <span className="wh-eyebrow wh-eyebrow-center">PROCESS</span>
            <h2 className="wh-h2-center">진행 프로세스</h2>
            <p className="wcu-lead">모집부터 후속 케어까지 6단계</p>
          </Reveal>

          <div className="wcu-process-grid">
            {PROCESS_STEPS.map((step, idx) => (
              <Reveal as="div" key={step.title} className="wcu-process-card" delay={idx * 60}>
                <span className="wcu-process-icon"><step.icon size={20} /></span>
                <div>
                  <span className="wcu-process-step">STEP {idx + 1}</span>
                  <h4>{step.title}</h4>
                  <p>{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal
            as="div"
            className="wh-section-banner"
            style={{ backgroundImage: `url(${SECTION_PHOTOS.process})` }}
            role="img"
            aria-label="줄자와 가위, 골무"
            delay={40}
          />

          <Reveal as="div" className="wcu-note-box" delay={100}>
            <strong>운영 포인트</strong>
            <ul>
              <li>수혜 목회자의 개인정보와 사연은 사전 동의 범위 내에서만 공개합니다.</li>
              <li>전달식은 &lsquo;선물 전달&rsquo;이 아닌 &lsquo;축복과 파송&rsquo;의 예배로 기획하여 프로젝트의
                의미를 완성합니다.</li>
            </ul>
          </Reveal>
        </div>
      </section>

      {/* 성과관리 & 확장 계획 — 관리자 수정 가능 */}
      <section className="wcu-section">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <span className="wh-eyebrow wh-eyebrow-center">GROWTH ROADMAP</span>
            <h2 className="wh-h2-center">성과관리 &amp; 확장 계획</h2>
            {!editing && growth.lead && <p className="wcu-lead">{growth.lead}</p>}
          </Reveal>

          {isAdmin && !editing && (
            <div className="wcu-admin-bar">
              <span>관리자 전용 — 이 섹션의 숫자와 계획을 직접 수정할 수 있습니다.</span>
              <button type="button" className="wcu-admin-btn" onClick={startEditing}>
                <Pencil size={15} /> 수정하기
              </button>
            </div>
          )}
          {savedNotice && !editing && <p className="wcu-admin-saved">저장되었습니다.</p>}

          {editing && draft ? (
            <div className="wcu-editor">
              <label className="wcu-editor-field">
                <span>섹션 소개 문구</span>
                <input
                  type="text"
                  value={draft.lead}
                  onChange={(e) => setDraft((prev) => ({ ...prev, lead: e.target.value }))}
                />
              </label>

              <h4 className="wcu-editor-h">성과 지표 (KPI)</h4>
              {draft.kpi.map((k, idx) => (
                <div className="wcu-editor-row" key={idx}>
                  <input
                    type="text"
                    placeholder="지표 이름 (예: 수혜 목회자 수)"
                    value={k.label}
                    onChange={(e) => updateKpi(idx, 'label', e.target.value)}
                  />
                  <input
                    type="text"
                    className="wcu-editor-value"
                    placeholder="값 (예: 3)"
                    value={k.value}
                    onChange={(e) => updateKpi(idx, 'value', e.target.value)}
                  />
                  <button
                    type="button"
                    className="wcu-editor-icon-btn"
                    aria-label="지표 삭제"
                    onClick={() => setDraft((prev) => ({ ...prev, kpi: prev.kpi.filter((_, i) => i !== idx) }))}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="wcu-editor-add"
                onClick={() => setDraft((prev) => ({ ...prev, kpi: [...prev.kpi, { label: '', value: '' }] }))}
              >
                <Plus size={15} /> 지표 추가
              </button>

              <h4 className="wcu-editor-h">확장 로드맵</h4>
              <div className="wcu-editor-stages">
                {draft.roadmap.map((r, idx) => (
                  <div className="wcu-editor-stage" key={idx}>
                    <div className="wcu-editor-row">
                      <input type="text" placeholder="단계 (예: STAGE 1)" value={r.stage} onChange={(e) => updateStage(idx, 'stage', e.target.value)} />
                      <input type="text" placeholder="이름 (예: 파일럿)" value={r.title} onChange={(e) => updateStage(idx, 'title', e.target.value)} />
                      <input type="text" placeholder="시기 (예: 2026 하반기)" value={r.when} onChange={(e) => updateStage(idx, 'when', e.target.value)} />
                      <button
                        type="button"
                        className="wcu-editor-icon-btn"
                        aria-label="단계 삭제"
                        onClick={() => setDraft((prev) => ({ ...prev, roadmap: prev.roadmap.filter((_, i) => i !== idx) }))}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      placeholder="세부 항목 — 한 줄에 하나씩 입력"
                      value={r.itemsText}
                      onChange={(e) => updateStage(idx, 'itemsText', e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="wcu-editor-add"
                onClick={() => setDraft((prev) => ({
                  ...prev,
                  roadmap: [...prev.roadmap, { stage: `STAGE ${prev.roadmap.length + 1}`, title: '', when: '', itemsText: '' }],
                }))}
              >
                <Plus size={15} /> 단계 추가
              </button>

              {saveError && <p className="wcu-editor-error">{saveError}</p>}

              <div className="wcu-editor-actions">
                <button type="button" className="wcu-admin-btn wcu-admin-btn-ghost" onClick={cancelEditing} disabled={saving}>
                  <X size={15} /> 취소
                </button>
                <button type="button" className="wcu-admin-btn" onClick={handleSave} disabled={saving}>
                  <Save size={15} /> {saving ? '저장 중...' : '저장하기'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {growth.kpi.length > 0 && (
                <Reveal as="div" className="wcu-kpi-grid" delay={60}>
                  {growth.kpi.map((k) => (
                    <div className="wcu-kpi-card" key={`${k.label}-${k.value}`}>
                      <span className="wcu-kpi-value">{k.value || '–'}</span>
                      <span className="wcu-kpi-label">{k.label}</span>
                    </div>
                  ))}
                </Reveal>
              )}

              <Reveal
                as="div"
                className="wh-section-banner"
                style={{ backgroundImage: `url(${SECTION_PHOTOS.growth})` }}
                role="img"
                aria-label="줄자를 두른 실패"
                delay={40}
              />

              <div className="wcu-roadmap">
                {growth.roadmap.map((stage, idx) => (
                  <Reveal as="div" key={`${stage.stage}-${stage.title}`} className="wcu-roadmap-card" delay={idx * 80}>
                    <span className="wcu-roadmap-stage">{stage.stage}</span>
                    <h4>{stage.title}</h4>
                    {stage.when && <span className="wcu-roadmap-when">{stage.when}</span>}
                    <ul>
                      {stage.items.map((it) => <li key={it}>{it}</li>)}
                    </ul>
                  </Reveal>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="wa-cta">
        <div className="wh-container wa-cta-inner">
          <div>
            <h2>목회자 돌봄 사역이 더 궁금하신가요?</h2>
            <p>Refresh Pastor Academy의 전체 프로그램을 소개합니다.</p>
          </div>
          <Link to="/about/ministries" className="wh-btn wh-btn-primary">
            사역 소개로 돌아가기 <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <WeweFooter />

      <style>{`
        /* 글씨 기준 — 사역 소개 페이지(MinistriesPage)와 동일한 크기·줄간격. 한국어 단어가 줄 끝에서
           쪼개지지 않도록 keep-all. */
        .wewe-combat-uniform-page {
          word-break: keep-all;
        }

        .wewe-combat-uniform-page .wcu-section {
          padding: 4.5rem 0;
        }

        .wewe-combat-uniform-page .wcu-lead {
          font-size: 1.02rem;
          line-height: 1.7;
        }

        .wcu-intro-quote {
          margin: 0 0 2.25rem;
          padding: 1.75rem 2rem;
          background: rgba(20, 107, 113, 0.06);
          border-left: 4px solid var(--wh-teal);
          border-radius: 0 12px 12px 0;
        }

        .wcu-intro-quote p {
          margin: 0 0 0.85rem;
          color: var(--wh-ink);
          font-size: 1.12rem;
          font-weight: 600;
          line-height: 1.9;
          letter-spacing: -0.005em;
        }

        .wcu-intro-quote cite {
          display: block;
          font-style: normal;
          color: var(--wh-teal);
          font-size: 0.88rem;
          font-weight: 700;
        }

        .wewe-combat-uniform-page .wcu-overview-card {
          padding: 1.6rem 1.7rem;
        }

        .wewe-combat-uniform-page .wcu-overview-tag {
          font-size: 0.78rem;
          margin-bottom: 0.55rem;
        }

        .wewe-combat-uniform-page .wcu-overview-card p {
          color: var(--wh-ink);
          font-size: 0.98rem;
          line-height: 1.8;
        }

        .wcu-overview-card-with {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .wcu-with-logo {
          flex-shrink: 0;
          width: 64px;
          height: 84px;
          border-radius: 8px;
          background: #24302a;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
        }

        .wcu-with-logo img {
          max-width: 100%;
          max-height: 100%;
          display: block;
        }

        .wcu-why-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 2.25rem;
        }

        .wcu-why-card {
          padding: 1.75rem 1.5rem;
          background: var(--wh-bg);
          border: 1px solid var(--wh-line);
          border-radius: 12px;
          text-align: center;
        }

        .wcu-why-tag {
          display: block;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: var(--wh-teal);
          margin-bottom: 0.5rem;
        }

        .wcu-why-card h4 {
          color: var(--wh-ink);
          font-size: 1.3rem;
          font-weight: 800;
          margin-bottom: 0.7rem;
        }

        .wcu-why-card p {
          margin: 0;
          color: var(--wh-ink-soft);
          font-size: 0.95rem;
          line-height: 1.75;
        }

        .wcu-quote {
          text-align: center;
          color: var(--wh-ink-soft);
          font-size: 1rem;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.85;
        }

        .wcu-quote strong {
          display: block;
          color: var(--wh-ink);
          font-size: 1.2rem;
          font-weight: 800;
          margin-bottom: 0.35rem;
        }

        .wcu-partner {
          margin: 0 0 2.25rem;
          border-radius: 12px;
          overflow: hidden;
          background: #24302a;
        }

        .wcu-partner-photo {
          display: block;
          width: 100%;
          aspect-ratio: 3 / 2;
          object-fit: cover;
          object-position: 50% 79%;
        }

        .wcu-partner-caption {
          display: flex;
          align-items: center;
          gap: 1.1rem;
          padding: 1.1rem 1.4rem;
          color: rgba(255, 255, 255, 0.82);
          font-size: 0.92rem;
          line-height: 1.7;
        }

        .wcu-partner-caption strong {
          display: block;
          color: #fff;
          font-size: 1.02rem;
          margin-bottom: 0.15rem;
        }

        .wcu-partner-logo {
          flex-shrink: 0;
          width: 52px;
          height: auto;
        }

        .wcu-flow {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.85rem;
        }

        .wcu-flow-card {
          padding: 1.4rem 1rem;
          background: var(--wh-bg-soft);
          border: 1px solid var(--wh-line);
          border-radius: 12px;
          text-align: center;
        }

        .wcu-flow-no {
          display: block;
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--wh-orange);
          margin-bottom: 0.3rem;
        }

        .wcu-flow-by {
          display: block;
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--wh-teal);
          margin-bottom: 0.45rem;
        }

        .wcu-flow-card h4 {
          color: var(--wh-ink);
          font-size: 1.02rem;
          font-weight: 800;
          margin-bottom: 0.45rem;
        }

        .wcu-flow-card p {
          margin: 0;
          color: var(--wh-ink-soft);
          font-size: 0.88rem;
          line-height: 1.6;
        }

        .wcu-process-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 2.25rem;
        }

        .wcu-process-card {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          padding: 1.4rem 1.5rem;
          background: var(--wh-bg);
          border: 1px solid var(--wh-line);
          border-radius: 12px;
        }

        .wcu-process-icon {
          flex-shrink: 0;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgba(217, 123, 63, 0.12);
          color: var(--wh-orange-deep);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wcu-process-step {
          display: block;
          font-size: 0.74rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--wh-orange-deep);
          margin-bottom: 0.15rem;
        }

        .wcu-process-card h4 {
          color: var(--wh-ink);
          font-size: 1.05rem;
          font-weight: 800;
          margin-bottom: 0.3rem;
        }

        .wcu-process-card p {
          margin: 0;
          color: var(--wh-ink-soft);
          font-size: 0.95rem;
          line-height: 1.7;
        }

        .wewe-combat-uniform-page .wcu-note-box strong {
          font-size: 1rem;
        }

        .wewe-combat-uniform-page .wcu-note-box li {
          font-size: 0.95rem;
          line-height: 1.75;
        }

        .wcu-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 2.25rem;
        }

        .wcu-kpi-card {
          padding: 1.6rem 1rem;
          background: var(--wh-bg-soft);
          border: 1px solid var(--wh-line);
          border-radius: 12px;
          text-align: center;
        }

        .wcu-kpi-value {
          display: block;
          font-size: 1.9rem;
          font-weight: 800;
          color: var(--wh-orange-deep);
          font-variant-numeric: tabular-nums;
          margin-bottom: 0.35rem;
        }

        .wcu-kpi-label {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--wh-ink-soft);
        }

        .wcu-roadmap {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .wcu-roadmap-card {
          padding: 1.6rem 1.5rem;
          background: var(--wh-bg);
          border: 1px solid var(--wh-line);
          border-top: 4px solid var(--wh-teal);
          border-radius: 12px;
        }

        .wcu-roadmap-stage {
          display: block;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--wh-teal);
          margin-bottom: 0.4rem;
        }

        .wcu-roadmap-card h4 {
          color: var(--wh-ink);
          font-size: 1.15rem;
          font-weight: 800;
          margin-bottom: 0.2rem;
        }

        .wcu-roadmap-when {
          display: block;
          font-size: 0.88rem;
          color: var(--wh-stone);
          margin-bottom: 0.9rem;
        }

        .wcu-roadmap-card ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .wcu-roadmap-card li {
          color: var(--wh-ink-soft);
          font-size: 0.95rem;
          line-height: 1.65;
          padding-left: 0.95rem;
          position: relative;
        }

        .wcu-roadmap-card li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.62rem;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--wh-orange);
        }

        /* 관리자 편집 (2026-10-07) */
        .wcu-admin-bar {
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

        .wcu-admin-btn {
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

        .wcu-admin-btn:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .wcu-admin-btn-ghost {
          background: transparent;
          color: var(--wh-teal);
        }

        .wcu-admin-saved {
          text-align: center;
          color: var(--wh-teal);
          font-weight: 700;
          font-size: 0.9rem;
          margin: -0.75rem 0 1.5rem;
        }

        .wcu-editor {
          padding: 1.75rem;
          border: 1px solid var(--wh-line);
          border-radius: 12px;
          background: var(--wh-bg-soft);
        }

        .wcu-editor input,
        .wcu-editor textarea {
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

        .wcu-editor textarea {
          resize: vertical;
          margin-top: 0.5rem;
          line-height: 1.6;
        }

        .wcu-editor-field span {
          display: block;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--wh-ink);
          margin-bottom: 0.4rem;
        }

        .wcu-editor-h {
          margin: 1.6rem 0 0.75rem;
          color: var(--wh-ink);
          font-size: 1rem;
          font-weight: 800;
        }

        .wcu-editor-row {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .wcu-editor-row .wcu-editor-value {
          max-width: 160px;
        }

        .wcu-editor-icon-btn {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: 1px solid var(--wh-line);
          border-radius: 8px;
          background: #fff;
          color: #b3261e;
          cursor: pointer;
        }

        .wcu-editor-stages {
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }

        .wcu-editor-stage {
          padding: 0.9rem;
          border: 1px solid var(--wh-line);
          border-radius: 10px;
          background: #fff;
        }

        .wcu-editor-stage .wcu-editor-row {
          margin-bottom: 0;
        }

        .wcu-editor-add {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          margin-top: 0.4rem;
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

        .wcu-editor-error {
          color: #b3261e;
          font-size: 0.88rem;
          margin: 1rem 0 0;
        }

        .wcu-editor-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.6rem;
          margin-top: 1.5rem;
        }

        @media (max-width: 860px) {
          .wewe-combat-uniform-page .wcu-section {
            padding: 3.25rem 0;
          }

          .wcu-why-grid,
          .wcu-process-grid,
          .wcu-roadmap {
            grid-template-columns: 1fr;
          }

          .wcu-flow {
            grid-template-columns: 1fr 1fr;
          }

          .wcu-kpi-grid {
            grid-template-columns: 1fr 1fr;
          }

          .wcu-intro-quote {
            padding: 1.4rem 1.4rem;
          }

          .wcu-intro-quote p {
            font-size: 1.02rem;
          }

          .wcu-editor-row {
            flex-wrap: wrap;
          }

          .wcu-editor-row .wcu-editor-value {
            max-width: none;
          }
        }

        @media (max-width: 560px) {
          .wcu-partner-caption {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

export default CombatUniformPage;
