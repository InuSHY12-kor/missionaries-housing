import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import WeweHeader from './WeweHeader';
import WeweFooter from './WeweFooter';
import WevePageHero from './WevePageHero';
import AboutSubNav from './AboutSubNav';
import Reveal from './Reveal';
import HERO_IMAGE_SETS from './heroImages';
import weweLogoColor from '../assets/wewe-logo-color.png';
import './wewe-shared.css';

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
          <Reveal>
            <blockquote className="wh-verse">
              &ldquo;너희 중에 분깃이나 기업이 없는 레위인과 네 성중에 거류하는 객과 및 고아와 과부들이 와서
              먹고 배부르게 하라 그리하면 네 하나님 여호와께서 네 손으로 하는 범사에 네게 복을 주시리라&rdquo;
              <cite>(신명기 14:29)</cite>
            </blockquote>

            <p>
              WEWE는 가장 깊은 상실의 자리에서 시작되었습니다. 누군가의 아픔을 돌보는 이들이 정작 자신의
              무너진 마음은 숨겨야만 하는 현실, 그리고 그들의 눈물을 기특함과 안타까움으로 바라보시는
              하나님의 시선을 마주했습니다.
            </p>
            <p>
              &ldquo;누가 그들의 눈물을 닦아주는가?&rdquo; 이 질문에 대한 답을 성경에서 찾았습니다. 고아와
              과부, 나그네를 향한 구제의 손길 이전에, 기업이 없어 공동체의 돌봄이 절실했던
              &lsquo;레위인&rsquo;이 있었습니다.
            </p>
            <p>
              WEWE는 현대판 레위인인 목회자와 선교사들이 다시 일어설 수 있도록, 그들의 &lsquo;위로자&rsquo;가
              되고자 합니다.
            </p>
          </Reveal>

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

      <section className="wa-target">
        <div className="wh-container wh-container-narrow">
          <Reveal>
            <span className="wh-eyebrow wh-eyebrow-center">FOR WHOM</span>
            <h2 className="wh-h2-center">우리가 위로하는 사람들</h2>
            <p className="wa-target-line">WEWE → 목회자 → 선교사</p>
            <p>
              지속 가능한 위로를 위해 WEWE는 여러 분야의 전문가들과 협업하며, 체계적이고 투명한 운영을
              지향합니다. 임의법인으로 시작해 사단법인으로 전환하며 법적 지위와 조직의 지속가능성을 갖추어
              가고, 구체적인 사례를 중심으로 모금 명분을 다져 갑니다. 평신도와 기업의 후원이 전문적인 돌봄으로,
              다시 교회와 선교현장의 회복으로 이어지는 선순환 구조를 만들어가고 있습니다.
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

      <WeweFooter />

      <style>{`
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

        .wa-cta {
          padding: 4rem 0;
          background: var(--wh-ink);
        }

        .wa-cta-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .wa-cta h2 {
          color: #fff;
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .wa-cta p {
          color: rgba(255, 255, 255, 0.72);
          margin: 0;
        }

        @media (max-width: 860px) {
          .wa-logo-block {
            grid-template-columns: 1fr;
          }

          .wa-logo-block-visual {
            height: 180px;
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
