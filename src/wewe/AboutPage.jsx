import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, HeartHandshake, Link2, Sparkles, ShieldCheck } from 'lucide-react';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import WevePageHero from './WevePageHero';
import AboutSubNav from './AboutSubNav';
import Reveal from './Reveal';
import HERO_IMAGE_SETS from './heroImages';
import weweLogoColor from '../assets/wewe-logo-color.png';
import './wewe-shared.css';

// (2026-10-03 추가) WEWE_2026_사업계획서 260930.pptx 슬라이드 7(Mission·Vision·Core
// Values)과 슬라이드 8(사업 구조)을 담았습니다. 네 가지 핵심가치는 PPT의 아이콘 없는
// 텍스트 카드를 lucide 아이콘으로 보강했습니다.
const CORE_VALUES = [
  {
    icon: HeartHandshake,
    en: 'Hospitality',
    ko: '환대',
    desc: '예수님의 사랑처럼 조건 없이, 사랑을 흘려보냅니다.',
  },
  {
    icon: Link2,
    en: 'Connection',
    ko: '연결',
    desc: '혼자(I)였던 사역자를 동료·교회·후원자와 이어 ‘우리’가 되게 합니다.',
  },
  {
    icon: Sparkles,
    en: 'Restoration',
    ko: '회복',
    desc: '소모품이 아닌 하나님의 걸작품(Poiema)으로 다시 세웁니다.',
  },
  {
    icon: ShieldCheck,
    en: 'Integrity',
    ko: '신뢰',
    desc: '체계적이고 투명한 운영으로 후원의 신뢰를 지킵니다.',
  },
];

// (2026-09-10 개편) "위위란?" 페이지 중간 사진들을 재구성했습니다 — 기존 3분할 갤러리(wa-gallery)는
// 위위 스테이 랜딩과 시각이 겹치고 "위로자의 위로자"라는 정체성과 어울리지 않는다는 의견으로
// 제거하고, 말씀 구절 섹션과 같은 너비의 16:9 사진 한 장(verseBanner)으로 교체했습니다.
// "WE + WE"/"The Hands of 'W'" 두 섹션도 각각 왼쪽 이미지 + 오른쪽 설명 형태로 확장하면서
// 기존 "WEWE 로고에 담긴 이야기" 섹션은 그 안으로 흡수해 제거했습니다.
const ABOUT_GALLERY = {
  verseBanner: 'https://images.unsplash.com/photo-1520187044487-b2efb58f0cba?auto=format&fit=crop&w=1600&q=80', // 흑백, 기도하는 손
  hands: 'https://images.unsplash.com/photo-1604881991575-dfb1003d8811?auto=format&fit=crop&w=900&q=80', // 맞잡은 손
  forWhom: 'https://images.unsplash.com/photo-1447619297994-b829cc1ab44a?auto=format&fit=crop&w=1200&q=80', // 마주 편 두 손바닥 — 나눔
};

// "소개" > "위위란?" 페이지 (/about).
// Phase 2에서는 홈페이지(WeweHome) 안의 #about 섹션으로 임시 구현했던 브랜드 스토리를
// Phase 3에서 실제 하위 페이지로 분리했습니다. 콘텐츠 원문은
// claude/wewe-brand-content-2026-09-05.md (Claude 프로젝트 문서)를 따릅니다.
function AboutPage() {
  return (
    <div className="wewe-page wewe-about-page">
      <WeweHeader />

      <WevePageHero
        eyebrow="ABOUT WEWE"
        title="위(WE)로자의 위(WE)로자"
        subtitle="레위인처럼 돌봄이 필요했던 이들, 그리고 그들의 위로자가 되기로 한 사람들의 이야기입니다."
        images={HERO_IMAGE_SETS.about}
      >
        <AboutSubNav active="/about" />
      </WevePageHero>

      <section className="wa-story">
        <div className="wh-container wh-container-narrow">
          {/* (2026-10-08 가독성 개편) 섹션 제목을 추가하고, 이어 붙어 있던 세 문단을 사업계획서
              Branding Story의 흐름(시작 → 질문 → 응답) 그대로 번호 붙은 세 단계로 나눠 핵심 문장이
              먼저 눈에 들어오도록 했습니다. 문장 내용은 기존과 같습니다. */}
          <Reveal>
            <span className="wh-eyebrow wh-eyebrow-center">BRANDING STORY</span>
            <h2 className="wh-h2-center">위로자를 바라보시는 하나님의 마음</h2>

            <blockquote className="wh-verse">
              &ldquo;너희 중에 분깃이나 기업이 없는 레위인과 네 성중에 거류하는 객과 및 고아와 과부들이 와서
              먹고 배부르게 하라 그리하면 네 하나님 여호와께서 네 손으로 하는 범사에 네게 복을 주시리라&rdquo;
              <cite>신명기 14:29</cite>
            </blockquote>
          </Reveal>

          <div className="wa-story-steps">
            <Reveal as="div" className="wa-story-step" delay={40}>
              <span className="wa-story-no">01</span>
              <div>
                <span className="wa-story-label">시작</span>
                <h3>돌보는 이들의 숨겨진 아픔</h3>
                <p>
                  WEWE는 가장 깊은 상실의 자리에서 시작되었습니다. 누군가의 아픔을 돌보는 이들이 정작 자신의
                  무너진 마음은 숨겨야만 하는 현실, 그리고 그들의 눈물을 기특함과 안타까움으로 바라보시는
                  하나님의 시선을 마주했습니다.
                </p>
              </div>
            </Reveal>
            <Reveal as="div" className="wa-story-step" delay={80}>
              <span className="wa-story-no">02</span>
              <div>
                <span className="wa-story-label">질문</span>
                <h3>&ldquo;누가 그들의 눈물을 닦아주는가?&rdquo;</h3>
                <p>
                  이 질문에 대한 답을 성경에서 찾았습니다. 고아와 과부, 나그네를 향한 구제의 손길 이전에,
                  기업이 없어 공동체의 돌봄이 절실했던 &lsquo;레위인&rsquo;이 있었습니다.
                </p>
              </div>
            </Reveal>
            <Reveal as="div" className="wa-story-step wa-story-step-answer" delay={120}>
              <span className="wa-story-no">03</span>
              <div>
                <span className="wa-story-label">응답</span>
                <h3>현대판 레위인의 위로자</h3>
                <p>
                  WEWE는 현대판 레위인인 <strong>목회자와 선교사들이 다시 일어설 수 있도록</strong>, 그들의
                  &lsquo;위로자&rsquo;가 되고자 합니다.
                </p>
              </div>
            </Reveal>
          </div>

          {/* 말씀 구절 섹션과 같은 너비의 16:9 사진 한 장 — 위로자·말씀의 분위기를 담은
              사진이며, 스크롤하며 떠오르는 Reveal 애니메이션이 적용됩니다. */}
          <Reveal as="div" className="wa-verse-banner" delay={80}>
            <div
              className="wa-verse-banner-img"
              style={{ backgroundImage: `url(${ABOUT_GALLERY.verseBanner})` }}
              role="img"
              aria-label="기도하는 손"
            />
          </Reveal>

          {/* "The Hands of 'W'"(위) / "WE + WE"(아래) — 각각 왼쪽 이미지, 오른쪽 설명으로
              배치하고 "WEWE 로고에 담긴 이야기" 섹션의 내용을 이 두 섹션 안으로 옮겼습니다. */}
          <div className="wa-logo-stack">
            <Reveal as="div" className="wa-logo-block" delay={100}>
              <div className="wa-logo-block-visual wa-logo-block-visual-mark">
                <img src={weweLogoColor} alt="WEWE 로고" />
              </div>
              <div className="wa-logo-block-text">
                <h3>
                  The Hands of &lsquo;W&rsquo;
                  <span className="wh-identity-sub">브랜드 심볼의 의미</span>
                </h3>
                <p>
                  &lsquo;W&rsquo;는 아래에서 위로 향하는 두 손의 모양입니다. 아말렉과의 전쟁에서 모세의 팔이
                  지치지 않도록 아론과 훌이 양옆에서 끝까지 붙잡아 주었던 출애굽기의 장면
                  (출애굽기 17:12)에서 그 의미를 가져왔습니다. 위로자의 팔이 꺾이지 않아야 공동체가
                  승리할 수 있습니다 — WEWE는 그들의 팔이 꺾이지 않도록 묵묵히 지지합니다.
                </p>
                <p>
                  로고를 이루는 두 개의 &lsquo;W&rsquo;는 각각 먼저 아파본 위로자(WE)와 지금 아픈 위로자(WE)를
                  상징합니다. 두 손이 서로 겹치며 만들어내는 하나의 형태는, 위로하는 사람도 결국 누군가의
                  위로가 필요하다는 WEWE의 정체성 &mdash; &lsquo;위로자의 위로자&rsquo; &mdash; 를 시각적으로
                  담아냅니다. 색상 또한 지친 이들을 감싸는 따뜻한 오렌지와, 신뢰와 안정을 뜻하는 짙은
                  틸(teal) 두 가지로 구성되어 있습니다.
                </p>
              </div>
            </Reveal>

            <Reveal as="div" className="wa-logo-block" delay={140}>
              <div
                className="wa-logo-block-visual"
                style={{ backgroundImage: `url(${ABOUT_GALLERY.hands})` }}
                role="img"
                aria-label="맞잡은 두 손"
              />
              <div className="wa-logo-block-text">
                <h3>
                  WE + WE
                  <span className="wh-identity-sub">나에서 우리로</span>
                </h3>
                <p>
                  혼자(I) 있던 위로자에게 다가가, 다시 &lsquo;우리(WE)&rsquo;가 되는 연결이 됩니다. 먼저 아파본
                  위로자(WE)가 지금 아픈 위로자(WE)의 손을 잡아 줍니다.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* MISSION / VISION / CORE VALUES — PPT 슬라이드 7 (2026-10-03 신규) */}
      <section className="wa-values">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <span className="wh-eyebrow wh-eyebrow-center">MISSION · VISION</span>
            <h2 className="wh-h2-center">하나님의 마음으로 위로자를 위로합니다</h2>
          </Reveal>

          <Reveal as="div" className="wa-mv-grid" delay={60}>
            <div className="wa-mv-card">
              <span className="wa-mv-label">MISSION</span>
              <p>하나님의 마음으로 위로자를 위로한다.</p>
            </div>
            <div className="wa-mv-card">
              <span className="wa-mv-label">VISION</span>
              <p>돌봄받은 위로자가 다시 위로자가 되는 &lsquo;우리(WE)&rsquo;의 선순환 공동체</p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <span className="wh-eyebrow wh-eyebrow-center wa-cv-eyebrow">CORE VALUES</span>
          </Reveal>

          <div className="wa-cv-grid">
            {CORE_VALUES.map((cv, idx) => (
              <Reveal as="div" key={cv.en} className="wa-cv-card" delay={120 + idx * 60}>
                <span className="wa-cv-icon"><cv.icon size={22} /></span>
                <h4>{cv.ko} <span>{cv.en}</span></h4>
                <p>{cv.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 사업 구조 — PPT 슬라이드 8 (2026-10-03 신규) */}
      <section className="wa-structure">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <span className="wh-eyebrow wh-eyebrow-center">사업 구조</span>
            <h2 className="wh-h2-center">위로자의 위로자, WEWE의 두 프로젝트</h2>
          </Reveal>

          <Reveal as="div" className="wa-org-chart" delay={80}>
            <div className="wa-org-root">WEWE<span>위로자의 위로자</span></div>
            <div className="wa-org-branches">
              <div className="wa-org-branch wa-org-branch-teal">
                <div className="wa-org-target">목회자</div>
                <div className="wa-org-project">
                  <strong>Project 1 · Refresh Pastor Academy</strong>
                  <ul>
                    <li>목회자 아카데미 심포지엄</li>
                    <li>목회자 세미나 · 소진관리</li>
                    <li>개별 지원 (심리상담 · 재정 · 장학)</li>
                    {/* (2026-10-07) 목회자(초록) 칸의 "진행 중" 표시는 초록, 선교사(주황) 칸은 주황으로 통일 */}
                    <li>전투복 프로젝트 <span className="wh-live-badge">진행 중</span></li>
                  </ul>
                </div>
              </div>
              <div className="wa-org-branch wa-org-branch-orange">
                <div className="wa-org-target">선교사</div>
                <div className="wa-org-project">
                  <strong>Project 2 · Missionary Care</strong>
                  <ul>
                    <li>WEWE 스테이 (주거) <span className="wh-progress-badge">진행 중</span></li>
                    <li>레위인의 모빌리티 (이동)</li>
                    <li>Poiema 돌봄</li>
                    <li>WE+WE 커넥트</li>
                  </ul>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="wa-target">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <span className="wh-eyebrow wh-eyebrow-center">FOR WHOM</span>
            <h2 className="wh-h2-center">우리가 위로하는 사람들</h2>
            <p className="wa-target-line">
              <span className="wa-flow-chip">WEWE</span>
              <ArrowRight size={18} />
              <span className="wa-flow-chip wa-flow-chip-teal">목회자</span>
              <ArrowRight size={18} />
              <span className="wa-flow-chip wa-flow-chip-orange">선교사</span>
            </p>
            <p>
              WEWE는 여러 분야의 전문가들과 협업하며, 체계적이고 투명한 운영을 지향합니다. 평신도와 기업의
              후원이 전문적인 돌봄으로, 다시 교회와 선교현장의 회복으로 이어지는 선순환 구조를 만들어가고
              있습니다. 법인 설립 방향과 재원 조성 계획, 추진 일정 등 WEWE의 지속가능성에 대한 더 자세한
              이야기는 아래에서 확인하실 수 있습니다.
            </p>
          </Reveal>

          <Reveal as="div" className="wa-target-photo" delay={100}>
            <div
              className="wa-target-photo-img"
              style={{ backgroundImage: `url(${ABOUT_GALLERY.forWhom})` }}
              role="img"
              aria-label="마주 편 두 손"
            />
          </Reveal>
        </div>
      </section>

      <section className="wa-cta">
        <div className="wh-container wa-cta-inner">
          <div>
            <h2>WEWE가 하는 일이 궁금하신가요?</h2>
            <p>레위인의 회복(목회자)과 선교사의 회복, 두 프로젝트를 자세히 소개합니다.</p>
          </div>
          <Link to="/about/ministries" className="wh-btn wh-btn-primary">
            사역 소개 보기 <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* (2026-10-07) 배경을 초록 → 바로 위 CTA·푸터의 어두운 회색보다 15% 정도 밝은 회색으로 변경.
          버튼은 기존에 보이던 초록 배경을 그대로 유지합니다. */}
      <section className="wa-cta wa-cta-soft">
        <div className="wh-container wa-cta-inner">
          <div>
            <h2>WEWE의 운영과 지속가능성이 궁금하신가요?</h2>
            <p>법인 설립 방향, 선순환 구조, 재원 조성 계획과 추진 일정을 소개합니다.</p>
          </div>
          <Link to="/about/sustainability" className="wh-btn wh-btn-outline wa-cta-soft-btn">
            운영 · 지속가능성 보기 <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <WeweFooter />

      <style>{`
        /* (2026-10-07) 운영·지속가능성 CTA — 위 CTA(#1c1c1a)보다 약 15% 밝은 회색. 흰 글씨 대비 약 10:1. */
        .wa-cta-soft {
          background: #3e3e3b;
        }

        .wa-cta-soft p {
          color: rgba(255, 255, 255, 0.85);
        }

        .wa-cta-soft-btn {
          background: var(--wh-teal);
          border-color: var(--wh-teal);
        }

        .wa-cta-soft-btn:hover {
          background: #0f5a5f;
          border-color: #0f5a5f;
        }

        .wa-story {
          padding: 5rem 0 1rem;
          background: var(--wh-bg);
        }

        .wa-story p {
          color: var(--wh-ink-soft);
          line-height: 1.9;
          font-size: 1.02rem;
          margin-bottom: 1.25rem;
        }

        .wh-verse {
          margin: 0 0 2rem;
          padding: 1.5rem 1.75rem;
          background: var(--wh-bg-soft);
          border-left: 3px solid var(--wh-orange);
          color: var(--wh-ink);
          font-weight: 600;
          line-height: 1.8;
          font-style: italic;
        }

        .wh-verse cite {
          display: block;
          margin-top: 0.75rem;
          color: var(--wh-orange);
          font-style: normal;
          font-weight: 700;
          font-size: 0.9rem;
        }

        /* 말씀 구절 섹션과 같은 폭의 16:9 사진 한 장 (2026-09-10, 기존 3분할 갤러리 대체) */
        .wa-verse-banner {
          margin: 1rem 0 2.5rem;
        }

        .wa-verse-banner-img {
          width: 100%;
          aspect-ratio: 16 / 9;
          border-radius: 10px;
          background-size: cover;
          background-position: center;
          background-color: var(--wh-bg-soft);
        }

        /* "The Hands of 'W'" / "WE + WE" — 위아래로 쌓인 왼쪽 이미지 + 오른쪽 설명 블록
           (2026-09-10 개편, 기존 wh-identity-grid + wa-logo-detail을 이 하나로 통합) */
        .wa-logo-stack {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin: 1rem 0;
        }

        .wa-logo-block {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 1.75rem;
          align-items: center;
          padding: 1.75rem;
          background: var(--wh-bg-soft);
          border: 1px solid var(--wh-line);
          border-radius: 10px;
        }

        .wa-logo-block-visual {
          width: 100%;
          height: 220px;
          border-radius: 10px;
          background-size: cover;
          background-position: center;
        }

        .wa-logo-block-visual-mark {
          background: var(--wh-bg);
          border: 1px solid var(--wh-line);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .wa-logo-block-visual-mark img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .wa-logo-block-text h3 {
          color: var(--wh-ink);
          margin-bottom: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .wh-identity-sub {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--wh-stone);
          letter-spacing: 0.02em;
        }

        .wa-logo-block-text p {
          margin: 0 0 0.9rem;
          color: var(--wh-ink-soft);
          font-size: 0.95rem;
          line-height: 1.85;
        }

        .wa-logo-block-text p:last-child {
          margin-bottom: 0;
        }

        /* MISSION / VISION / CORE VALUES (2026-10-03 신규) */
        .wa-values {
          padding: 1rem 0 4.5rem;
          background: var(--wh-bg);
        }

        .wa-mv-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin: 1.75rem 0 3rem;
        }

        .wa-mv-card {
          padding: 1.75rem;
          background: var(--wh-bg-soft);
          border: 1px solid var(--wh-line);
          border-radius: 12px;
          text-align: center;
        }

        .wa-mv-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--wh-orange-deep);
          margin-bottom: 0.75rem;
        }

        .wa-mv-card p {
          margin: 0;
          color: var(--wh-ink);
          font-weight: 700;
          font-size: 1.05rem;
          line-height: 1.6;
        }

        .wa-cv-eyebrow {
          display: block;
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .wa-cv-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }

        .wa-cv-card {
          padding: 1.5rem 1.25rem;
          background: var(--wh-bg-soft);
          border: 1px solid var(--wh-line);
          border-radius: 12px;
          text-align: center;
        }

        .wa-cv-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: rgba(217, 123, 63, 0.12);
          color: var(--wh-orange-deep);
          margin-bottom: 0.9rem;
        }

        .wa-cv-card h4 {
          color: var(--wh-ink);
          font-size: 1.02rem;
          margin-bottom: 0.6rem;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .wa-cv-card h4 span {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--wh-stone);
          letter-spacing: 0.04em;
        }

        .wa-cv-card p {
          margin: 0;
          color: var(--wh-ink-soft);
          font-size: 0.88rem;
          line-height: 1.6;
        }

        /* 사업 구조 (2026-10-03 신규) */
        .wa-structure {
          padding: 1rem 0 4.5rem;
          background: var(--wh-bg-soft);
        }

        .wa-org-chart {
          margin-top: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }

        .wa-org-root {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem 2rem;
          background: var(--wh-ink);
          color: #fff;
          font-weight: 800;
          font-size: 1.15rem;
          border-radius: 10px;
        }

        .wa-org-root span {
          font-size: 0.72rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.65);
          margin-top: 0.2rem;
        }

        .wa-org-branches {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          width: 100%;
          margin-top: 1.75rem;
          padding-top: 1.75rem;
          border-top: 2px dashed var(--wh-line);
          position: relative;
        }

        .wa-org-branch {
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }

        .wa-org-target {
          align-self: center;
          padding: 0.45rem 1.1rem;
          border-radius: 999px;
          font-weight: 800;
          font-size: 0.92rem;
          color: #fff;
        }

        .wa-org-branch-teal .wa-org-target {
          background: var(--wh-teal);
        }

        .wa-org-branch-orange .wa-org-target {
          background: var(--wh-orange);
        }

        .wa-org-project {
          padding: 1.5rem;
          background: var(--wh-bg);
          border: 1px solid var(--wh-line);
          border-radius: 10px;
        }

        .wa-org-branch-teal .wa-org-project {
          border-top: 3px solid var(--wh-teal);
        }

        .wa-org-branch-orange .wa-org-project {
          border-top: 3px solid var(--wh-orange);
        }

        .wa-org-project strong {
          display: block;
          color: var(--wh-ink);
          font-size: 0.95rem;
          margin-bottom: 0.75rem;
        }

        .wa-org-project ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .wa-org-project li {
          color: var(--wh-ink-soft);
          font-size: 0.88rem;
          line-height: 1.5;
        }

        .wa-target {
          padding: 4rem 0 5rem;
          background: var(--wh-bg-soft);
        }

        .wa-target p {
          color: var(--wh-ink-soft);
          line-height: 1.9;
          font-size: 1rem;
          text-align: center;
        }

        .wa-target-photo {
          margin-top: 2.5rem;
        }

        .wa-target-photo-img {
          width: 100%;
          aspect-ratio: 16 / 9;
          border-radius: 10px;
          background-size: cover;
          background-position: center;
          background-color: var(--wh-bg);
        }

        .wa-target-line {
          font-weight: 700;
          color: var(--wh-ink);
          font-size: 1.05rem;
          letter-spacing: 0.02em;
          margin-bottom: 1rem !important;
        }

        /* ───────────────────────────────────────────────
           (2026-10-08) 가독성 개편 — 본문 글씨를 진하고 크게(0.98~1.05rem, 진한 잉크색),
           카드 제목은 1.1rem 이상 굵게, 영문 라벨은 브랜드 색으로 또렷하게. 한국어 단어가
           줄 끝에서 쪼개지지 않도록 keep-all. 기울임꼴(한글 가독성 저하)은 쓰지 않습니다.
           ─────────────────────────────────────────────── */
        .wewe-about-page {
          word-break: keep-all;
        }

        .wewe-about-page .wa-story {
          padding: 4.5rem 0 1rem;
        }

        .wewe-about-page .wh-verse {
          margin: 0 0 2.25rem;
          padding: 1.75rem 2rem;
          background: rgba(217, 123, 63, 0.07);
          border-left: 4px solid var(--wh-orange);
          border-radius: 0 12px 12px 0;
          font-style: normal;
          font-size: 1.08rem;
          line-height: 1.9;
          color: var(--wh-ink);
        }

        .wewe-about-page .wh-verse cite {
          color: var(--wh-orange-deep);
          font-weight: 800;
          font-size: 0.9rem;
        }

        .wa-story-steps {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2.5rem;
        }

        .wa-story-step {
          display: grid;
          grid-template-columns: 56px 1fr;
          gap: 1.1rem;
          padding: 1.5rem 1.6rem;
          background: var(--wh-bg-soft);
          border: 1px solid var(--wh-line);
          border-radius: 12px;
        }

        .wa-story-step-answer {
          background: rgba(20, 107, 113, 0.06);
          border-color: rgba(20, 107, 113, 0.25);
        }

        .wa-story-no {
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--wh-orange);
          line-height: 1.2;
        }

        .wa-story-step-answer .wa-story-no {
          color: var(--wh-teal);
        }

        .wa-story-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--wh-orange-deep);
          margin-bottom: 0.25rem;
        }

        .wa-story-step-answer .wa-story-label {
          color: var(--wh-teal);
        }

        .wa-story-step h3 {
          color: var(--wh-ink);
          font-size: 1.22rem;
          font-weight: 800;
          margin: 0 0 0.5rem;
        }

        .wewe-about-page .wa-story-step p {
          margin: 0;
          color: var(--wh-ink);
          font-size: 1rem;
          line-height: 1.85;
        }

        .wa-story-step p strong {
          color: var(--wh-teal);
        }

        .wewe-about-page .wa-logo-block {
          padding: 2rem;
          border-radius: 12px;
        }

        .wewe-about-page .wa-logo-block-text h3 {
          font-size: 1.4rem;
          font-weight: 800;
        }

        .wewe-about-page .wh-identity-sub {
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--wh-orange-deep);
          letter-spacing: 0.04em;
        }

        .wewe-about-page .wa-logo-block-text p {
          color: var(--wh-ink);
          font-size: 0.99rem;
          line-height: 1.85;
        }

        .wewe-about-page .wa-values {
          padding: 3rem 0 4.5rem;
        }

        .wewe-about-page .wa-mv-card {
          padding: 2rem 1.75rem;
          background: var(--wh-bg);
          border-top: 4px solid var(--wh-orange);
          box-shadow: 0 8px 22px rgba(28, 28, 22, 0.05);
        }

        .wewe-about-page .wa-mv-card:last-child {
          border-top-color: var(--wh-teal);
        }

        .wewe-about-page .wa-mv-label {
          font-size: 0.85rem;
          letter-spacing: 0.14em;
        }

        .wewe-about-page .wa-mv-card:last-child .wa-mv-label {
          color: var(--wh-teal);
        }

        .wewe-about-page .wa-mv-card p {
          font-size: 1.2rem;
          font-weight: 800;
          line-height: 1.6;
        }

        .wewe-about-page .wa-cv-card {
          padding: 1.75rem 1.25rem;
          background: var(--wh-bg);
        }

        .wewe-about-page .wa-cv-card h4 {
          font-size: 1.18rem;
          font-weight: 800;
        }

        .wewe-about-page .wa-cv-card h4 span {
          font-size: 0.78rem;
          font-weight: 800;
          color: var(--wh-orange-deep);
        }

        .wewe-about-page .wa-cv-card p {
          color: var(--wh-ink);
          font-size: 0.95rem;
          line-height: 1.7;
        }

        .wewe-about-page .wa-org-root {
          font-size: 1.3rem;
          padding: 1.1rem 2.4rem;
        }

        .wewe-about-page .wa-org-root span {
          font-size: 0.82rem;
        }

        .wewe-about-page .wa-org-target {
          font-size: 1rem;
          padding: 0.5rem 1.4rem;
        }

        .wewe-about-page .wa-org-project {
          padding: 1.6rem 1.75rem;
          border-radius: 12px;
        }

        .wewe-about-page .wa-org-project strong {
          font-size: 1.05rem;
          font-weight: 800;
          margin-bottom: 0.9rem;
        }

        .wewe-about-page .wa-org-project li {
          color: var(--wh-ink);
          font-size: 0.97rem;
          line-height: 1.6;
          padding-left: 0.95rem;
          position: relative;
        }

        .wewe-about-page .wa-org-project li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.62rem;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--wh-stone);
        }

        .wewe-about-page .wa-org-branch-teal .wa-org-project li::before {
          background: var(--wh-teal);
        }

        .wewe-about-page .wa-org-branch-orange .wa-org-project li::before {
          background: var(--wh-orange);
        }

        .wewe-about-page .wa-target p {
          color: var(--wh-ink);
          font-size: 1.02rem;
        }

        .wewe-about-page .wa-target-line {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.6rem;
          flex-wrap: wrap;
          color: var(--wh-stone);
          margin-bottom: 1.5rem !important;
        }

        .wa-flow-chip {
          display: inline-block;
          padding: 0.4rem 1rem;
          border-radius: 999px;
          background: var(--wh-ink);
          color: #fff;
          font-size: 0.95rem;
          font-weight: 800;
        }

        .wa-flow-chip-teal {
          background: var(--wh-teal);
        }

        .wa-flow-chip-orange {
          background: var(--wh-orange);
        }

        @media (max-width: 860px) {
          .wa-story-step {
            grid-template-columns: 1fr;
            gap: 0.4rem;
            padding: 1.3rem;
          }

          .wa-logo-block {
            grid-template-columns: 1fr;
          }

          .wa-logo-block-visual {
            height: 180px;
          }

          .wa-mv-grid,
          .wa-cv-grid,
          .wa-org-branches {
            grid-template-columns: 1fr;
          }

          .wa-org-branches {
            gap: 2rem;
          }

          .wa-cta-inner {
            flex-direction: column;
            align-items: flex-start;
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}

export default AboutPage;
